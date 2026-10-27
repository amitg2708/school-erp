const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/portal/children - for parent accounts
router.get('/children', authenticate, (req, res) => {
  try {
    const db = getDb();
    let children = [];

    if (req.user.role === 'parent') {
      const parent = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(req.user.id);
      if (parent) {
        children = db.prepare(`
          SELECT s.*, c.name as class_name, sec.name as section_name, se.roll_number
          FROM students s
          JOIN student_parents sp ON s.id = sp.student_id
          LEFT JOIN student_enrollments se ON s.id = se.student_id
          LEFT JOIN classes c ON se.class_id = c.id
          LEFT JOIN sections sec ON se.section_id = sec.id
          WHERE sp.parent_id = ? AND s.is_active = 1
        `).all(parent.id);
      }
    } else if (req.user.role === 'student') {
      const student = db.prepare(`
        SELECT s.*, c.name as class_name, sec.name as section_name, se.roll_number
        FROM students s
        LEFT JOIN student_enrollments se ON s.id = se.student_id
        LEFT JOIN classes c ON se.class_id = c.id
        LEFT JOIN sections sec ON se.section_id = sec.id
        WHERE s.user_id = ? AND s.is_active = 1
      `).get(req.user.id);
      if (student) children = [student];
    }

    res.json({ success: true, children });
  } catch (err) {
    console.error('Portal children error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/portal/my-student - complete bundle for student / parent view
router.get('/my-student', authenticate, (req, res) => {
  try {
    const db = getDb();
    let studentId = req.query.student_id;

    if (!studentId) {
      if (req.user.role === 'student') {
        const st = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
        studentId = st?.id;
      } else if (req.user.role === 'parent') {
        const parent = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(req.user.id);
        if (parent) {
          const sp = db.prepare('SELECT student_id FROM student_parents WHERE parent_id = ? LIMIT 1').get(parent.id);
          studentId = sp?.student_id;
        }
      }
    }

    // Default fallback to first active student if admin is testing student portal
    if (!studentId && req.user.role === 'admin') {
      const firstSt = db.prepare('SELECT id FROM students WHERE is_active = 1 LIMIT 1').get();
      studentId = firstSt?.id;
    }

    if (!studentId) {
      return res.status(404).json({ success: false, message: 'No associated student found' });
    }

    // 1. Student detail
    const student = db.prepare(`
      SELECT s.*, se.roll_number, se.enrollment_date,
             c.name as class_name, c.id as class_id, c.numeric_value,
             sec.name as section_name, sec.id as section_id,
             ay.name as academic_year, ay.id as academic_year_id
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
      WHERE s.id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // 2. Parent detail
    const parent = db.prepare(`
      SELECT p.* FROM parents p
      JOIN student_parents sp ON p.id = sp.parent_id
      WHERE sp.student_id = ? AND sp.is_primary = 1
    `).get(studentId);

    // 3. Attendance summary & recent
    const attSummary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status='Half Day' THEN 1 ELSE 0 END) as halfDay
      FROM student_attendance WHERE student_id = ?
    `).get(studentId);

    const recentAttendance = db.prepare(`
      SELECT attendance_date, status, remarks
      FROM student_attendance WHERE student_id = ?
      ORDER BY attendance_date DESC LIMIT 10
    `).all(studentId);

    // 4. Fees
    const fees = db.prepare(`
      SELECT sf.*, fc.name as category_name, fs.frequency, fs.due_date as structure_due_date
      FROM student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      JOIN fee_categories fc ON fs.fee_category_id = fc.id
      WHERE sf.student_id = ?
    `).all(studentId);

    const payments = db.prepare(`
      SELECT fp.*, fc.name as category_name
      FROM fee_payments fp
      JOIN student_fees sf ON fp.student_fee_id = sf.id
      JOIN fee_structures fstr ON sf.fee_structure_id = fstr.id
      JOIN fee_categories fc ON fstr.fee_category_id = fc.id
      WHERE fp.student_id = ?
      ORDER BY fp.payment_date DESC
    `).all(studentId);

    const feeSummary = {
      total: fees.reduce((s, f) => s + f.net_amount, 0),
      paid: fees.reduce((s, f) => s + f.paid_amount, 0),
      pending: fees.reduce((s, f) => s + (f.net_amount - f.paid_amount), 0),
    };

    // 5. Timetable for their class & section
    let timetable = [];
    if (student.class_id && student.section_id) {
      timetable = db.prepare(`
        SELECT t.*, sub.name as subject_name, sub.code as subject_code,
               s.first_name || ' ' || COALESCE(s.last_name,'') as teacher_name
        FROM timetables t
        LEFT JOIN subjects sub ON t.subject_id = sub.id
        LEFT JOIN staff s ON t.staff_id = s.id
        WHERE t.class_id = ? AND t.section_id = ? AND t.is_active = 1
        ORDER BY t.day_of_week, t.period_number
      `).all(student.class_id, student.section_id);
    }

    // 6. Assignments for class
    let assignments = [];
    if (student.class_id) {
      assignments = db.prepare(`
        SELECT a.*, sub.name as subject_name, s.first_name || ' ' || COALESCE(s.last_name,'') as teacher_name
        FROM assignments a
        JOIN subjects sub ON a.subject_id = sub.id
        JOIN staff s ON a.assigned_by = s.id
        WHERE a.class_id = ? AND a.is_active = 1
        ORDER BY a.due_date ASC LIMIT 5
      `).all(student.class_id);
    }

    // 7. Exam results / marks
    const marks = db.prepare(`
      SELECT em.*, e.name as exam_name, es.max_marks, es.passing_marks, sub.name as subject_name, sub.code
      FROM examination_marks em
      JOIN examinations e ON em.examination_id = e.id
      JOIN examination_subjects es ON em.exam_subject_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE em.student_id = ?
      ORDER BY e.start_date DESC, sub.name
    `).all(studentId);

    res.json({
      success: true,
      student,
      parent,
      attendance: { summary: attSummary, recent: recentAttendance },
      fees: { summary: feeSummary, list: fees, payments },
      timetable,
      assignments,
      marks
    });
  } catch (err) {
    console.error('Portal student error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
