const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// =============================================
// STUDENT ATTENDANCE
// =============================================

// GET /api/attendance/students - get students for attendance marking
router.get('/students', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { class_id, section_id, academic_year_id, date } = req.query;

    if (!class_id || !section_id || !academic_year_id || !date) {
      return res.status(400).json({ success: false, message: 'Class, section, academic year, and date are required' });
    }

    // Check teacher access (teachers can only access assigned classes)
    if (req.user.role === 'teacher') {
      const hasAccess = db.prepare(`
        SELECT id FROM teacher_assignments 
        WHERE staff_id = (SELECT id FROM staff WHERE user_id = ?)
        AND class_id = ? AND section_id = ? AND academic_year_id = ? AND is_active = 1
      `).get(req.user.id, class_id, section_id, academic_year_id);
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
      }
    }

    // Get all active students in class/section
    const students = db.prepare(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.profile_photo,
             se.roll_number,
             sa.status as attendance_status, sa.id as attendance_id, sa.remarks
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_attendance sa ON s.id = sa.student_id 
        AND sa.attendance_date = ? AND sa.academic_year_id = ?
      WHERE se.class_id = ? AND se.section_id = ? AND se.academic_year_id = ?
        AND se.status = 'Active' AND s.is_active = 1
      ORDER BY se.roll_number, s.first_name
    `).all(date, academic_year_id, class_id, section_id, academic_year_id);

    const summary = {
      total: students.length,
      present: students.filter(s => s.attendance_status === 'Present').length,
      absent: students.filter(s => s.attendance_status === 'Absent').length,
      late: students.filter(s => s.attendance_status === 'Late').length,
      halfDay: students.filter(s => s.attendance_status === 'Half Day').length,
      notMarked: students.filter(s => !s.attendance_status).length
    };

    res.json({ success: true, students, summary, isExisting: students.some(s => s.attendance_status) });
  } catch (err) {
    console.error('Get attendance students error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/attendance/students/save - save student attendance
router.post('/students/save', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { classId, sectionId, academicYearId, date, attendance } = req.body;
    // attendance = [{ studentId, status, remarks }]

    if (!classId || !sectionId || !academicYearId || !date || !attendance || !attendance.length) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check teacher access
    if (req.user.role === 'teacher') {
      const hasAccess = db.prepare(`
        SELECT id FROM teacher_assignments 
        WHERE staff_id = (SELECT id FROM staff WHERE user_id = ?)
        AND class_id = ? AND section_id = ? AND academic_year_id = ? AND is_active = 1
      `).get(req.user.id, classId, sectionId, academicYearId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const upsert = db.prepare(`
      INSERT INTO student_attendance (student_id, class_id, section_id, academic_year_id, attendance_date, status, marked_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, attendance_date, academic_year_id) DO UPDATE SET
        status = excluded.status, marked_by = excluded.marked_by, 
        remarks = excluded.remarks, updated_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      attendance.forEach(({ studentId, status, remarks }) => {
        if (status) {
          upsert.run(studentId, classId, sectionId, academicYearId, date, status, req.user.id, remarks || null);
        }
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: 'Attendance saved successfully', count: attendance.length });
  } catch (err) {
    console.error('Save attendance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/attendance/my-attendance - personal attendance for student / parent
router.get('/my-attendance', authenticate, (req, res) => {
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
    if (!studentId && req.user.role === 'admin') {
      const firstSt = db.prepare('SELECT id FROM students WHERE is_active = 1 LIMIT 1').get();
      studentId = firstSt?.id;
    }
    if (!studentId) return res.status(404).json({ success: false, message: 'Student not found' });

    const student = db.prepare(`
      SELECT s.*, c.name as class_name, sec.name as section_name, se.roll_number
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.id = ?
    `).get(studentId);

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status='Half Day' THEN 1 ELSE 0 END) as halfDay
      FROM student_attendance WHERE student_id = ?
    `).get(studentId);

    const pct = summary.total > 0 ? Math.round(((summary.present + summary.late * 0.5) / summary.total) * 100) : 0;
    summary.percentage = pct;

    const history = db.prepare(`
      SELECT sa.attendance_date, sa.status, sa.remarks, c.name as class_name, sec.name as section_name
      FROM student_attendance sa
      JOIN classes c ON sa.class_id = c.id
      JOIN sections sec ON sa.section_id = sec.id
      WHERE sa.student_id = ?
      ORDER BY sa.attendance_date DESC
    `).all(studentId);

    res.json({ success: true, student, summary, history });
  } catch (err) {
    console.error('My-attendance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/attendance/student/:studentId/history
router.get('/student/:studentId/history', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { month, year, academic_year_id } = req.query;

    let query = `
      SELECT sa.attendance_date, sa.status, sa.remarks, c.name as class_name, sec.name as section_name
      FROM student_attendance sa
      JOIN classes c ON sa.class_id = c.id
      JOIN sections sec ON sa.section_id = sec.id
      WHERE sa.student_id = ?
    `;
    const params = [req.params.studentId];

    if (academic_year_id) { query += ' AND sa.academic_year_id = ?'; params.push(academic_year_id); }
    if (month && year) {
      query += ' AND strftime("%m", sa.attendance_date) = ? AND strftime("%Y", sa.attendance_date) = ?';
      params.push(String(month).padStart(2, '0'), year);
    }
    query += ' ORDER BY sa.attendance_date DESC';

    const history = db.prepare(query).all(...params);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/attendance/report/daily - daily attendance report
router.get('/report/daily', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    let { date, class_id, academic_year_id } = req.query;

    if (!academic_year_id) {
      const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
      academic_year_id = curYear?.id || 1;
    }
    const reportDate = date || new Date().toISOString().split('T')[0];

    const data = db.prepare(`
      SELECT c.name as class_name, sec.name as section_name,
             COUNT(DISTINCT se.student_id) as total_enrolled,
             SUM(CASE WHEN sa.status='Present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN sa.status='Absent' THEN 1 ELSE 0 END) as absent,
             SUM(CASE WHEN sa.status='Late' THEN 1 ELSE 0 END) as late,
             SUM(CASE WHEN sa.status='Half Day' THEN 1 ELSE 0 END) as half_day
      FROM classes c
      JOIN sections sec ON c.id = sec.class_id
      JOIN student_enrollments se ON se.class_id = c.id AND se.section_id = sec.id AND se.academic_year_id = ?
      LEFT JOIN student_attendance sa ON se.student_id = sa.student_id AND sa.attendance_date = ? AND sa.academic_year_id = ?
      WHERE c.is_active = 1 AND se.status = 'Active'
      ${class_id ? 'AND c.id = ?' : ''}
      GROUP BY c.id, sec.id ORDER BY c.numeric_value, sec.name
    `).all(...[academic_year_id, reportDate, academic_year_id, ...(class_id ? [class_id] : [])]);

    res.json({ success: true, report: data, date: reportDate });
  } catch (err) {
    console.error('Daily attendance report error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =============================================
// STAFF ATTENDANCE
// =============================================

// GET /api/attendance/staff - get staff for attendance
router.get('/staff', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const staff = db.prepare(`
      SELECT s.id, s.staff_id, s.first_name, s.last_name, s.designation, s.staff_type,
             d.name as department_name, s.profile_photo,
             sa.status as attendance_status, sa.id as attendance_id, sa.remarks
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN staff_attendance sa ON s.id = sa.staff_id AND sa.attendance_date = ?
      WHERE s.is_active = 1
      ORDER BY s.first_name
    `).all(date);

    const summary = {
      total: staff.length,
      present: staff.filter(s => s.attendance_status === 'Present').length,
      absent: staff.filter(s => s.attendance_status === 'Absent').length,
      late: staff.filter(s => s.attendance_status === 'Late').length,
      halfDay: staff.filter(s => s.attendance_status === 'Half Day').length,
      notMarked: staff.filter(s => !s.attendance_status).length
    };

    res.json({ success: true, staff, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/attendance/staff/save
router.post('/staff/save', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { date, attendance } = req.body;

    const upsert = db.prepare(`
      INSERT INTO staff_attendance (staff_id, attendance_date, status, marked_by, remarks)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
        status = excluded.status, marked_by = excluded.marked_by,
        remarks = excluded.remarks, updated_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      attendance.forEach(({ staffId, status, remarks }) => {
        if (status) upsert.run(staffId, date, status, req.user.id, remarks || null);
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: 'Staff attendance saved', count: attendance.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
