const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/exams - list exams
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { academic_year_id, class_id } = req.query;
    let query = `
      SELECT e.*, et.name as exam_type, ay.name as academic_year, c.name as class_name, sec.name as section_name
      FROM examinations e
      JOIN examination_types et ON e.exam_type_id = et.id
      JOIN academic_years ay ON e.academic_year_id = ay.id
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN sections sec ON e.section_id = sec.id
      WHERE e.is_active = 1
    `;
    const params = [];
    if (academic_year_id) { query += ' AND e.academic_year_id = ?'; params.push(academic_year_id); }
    if (class_id) { query += ' AND e.class_id = ?'; params.push(class_id); }
    query += ' ORDER BY e.start_date DESC';
    const exams = db.prepare(query).all(...params);
    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/exams/types
router.get('/types', authenticate, (req, res) => {
  const db = getDb();
  const types = db.prepare('SELECT * FROM examination_types WHERE is_active = 1').all();
  res.json({ success: true, types });
});

// GET /api/exams/grading-rules
router.get('/grading-rules', authenticate, (req, res) => {
  const db = getDb();
  const rules = db.prepare('SELECT * FROM grading_rules WHERE is_active = 1 ORDER BY min_percentage DESC').all();
  res.json({ success: true, rules });
});

// POST /api/exams - create exam
router.post('/', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { name, examTypeId, academicYearId, classId, sectionId, startDate, endDate } = req.body;
    if (!name || !examTypeId || !academicYearId || !classId) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const result = db.prepare(`
      INSERT INTO examinations (name, exam_type_id, academic_year_id, class_id, section_id, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, examTypeId, academicYearId, classId, sectionId || null, startDate || null, endDate || null);
    res.json({ success: true, message: 'Examination created', examId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/exams/:id/subjects - add subject to exam
router.post('/:id/subjects', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { subjectId, examDate, maxMarks, passingMarks } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO examination_subjects (examination_id, subject_id, exam_date, max_marks, passing_marks)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, subjectId, examDate || null, maxMarks || 100, passingMarks || 33);
    res.json({ success: true, message: 'Subject added to exam' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/exams/:id/subjects
router.get('/:id/subjects', authenticate, (req, res) => {
  const db = getDb();
  const subjects = db.prepare(`
    SELECT es.*, s.name as subject_name, s.code
    FROM examination_subjects es JOIN subjects s ON es.subject_id = s.id
    WHERE es.examination_id = ?
  `).all(req.params.id);
  res.json({ success: true, subjects });
});

// GET /api/exams/:id/marks?exam_subject_id=
router.get('/:id/marks', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { exam_subject_id, section_id } = req.query;
    const exam = db.prepare('SELECT * FROM examinations WHERE id = ?').get(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    let query = `
      SELECT s.id as student_id, s.student_id as std_id, s.first_name, s.last_name,
             se.roll_number, sec.name as section_name,
             em.id as mark_id, em.obtained_marks, em.is_absent, em.remarks,
             es.max_marks, es.passing_marks
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN examination_marks em ON s.id = em.student_id AND em.examination_id = ? AND em.exam_subject_id = ?
      LEFT JOIN examination_subjects es ON es.id = ?
      WHERE se.class_id = ? AND se.academic_year_id = ? AND se.status = 'Active' AND s.is_active = 1
    `;
    const params = [req.params.id, exam_subject_id || null, exam_subject_id || null, exam.class_id, exam.academic_year_id];

    const targetSection = section_id || exam.section_id;
    if (targetSection) {
      query += ' AND se.section_id = ?';
      params.push(targetSection);
    }
    query += ' ORDER BY se.roll_number, s.first_name';

    const students = db.prepare(query).all(...params);
    res.json({ success: true, students });
  } catch (err) {
    console.error('Exam marks query error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/exams/:id/marks - save marks
router.post('/:id/marks', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { examSubjectId, marks } = req.body;
    // marks = [{ studentId, obtainedMarks, isAbsent, remarks }]

    const upsert = db.prepare(`
      INSERT INTO examination_marks (examination_id, exam_subject_id, student_id, obtained_marks, is_absent, remarks, entered_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(examination_id, exam_subject_id, student_id) DO UPDATE SET
        obtained_marks = excluded.obtained_marks, is_absent = excluded.is_absent,
        remarks = excluded.remarks, entered_by = excluded.entered_by, updated_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      marks.forEach(({ studentId, obtainedMarks, isAbsent, remarks }) => {
        upsert.run(req.params.id, examSubjectId, studentId, isAbsent ? null : (obtainedMarks || 0), isAbsent ? 1 : 0, remarks || null, req.user.id);
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: 'Marks saved successfully' });
  } catch (err) {
    console.error('Save marks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/exams/:id/report-card/:studentId
router.get('/:id/report-card/:studentId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const exam = db.prepare(`
      SELECT e.*, et.name as exam_type, ay.name as academic_year, c.name as class_name, c.numeric_value
      FROM examinations e
      JOIN examination_types et ON e.exam_type_id = et.id
      JOIN academic_years ay ON e.academic_year_id = ay.id
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const student = db.prepare(`
      SELECT s.*, se.roll_number, sec.name as section_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.academic_year_id = ?
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.id = ?
    `).get(exam.academic_year_id, req.params.studentId);

    if (!student) return res.status(404).json({ success: false, message: 'Student enrollment not found' });

    const marks = db.prepare(`
      SELECT em.*, es.max_marks, es.passing_marks, sub.name as subject_name, sub.code
      FROM examination_marks em
      JOIN examination_subjects es ON em.exam_subject_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE em.examination_id = ? AND em.student_id = ?
      ORDER BY sub.name
    `).all(req.params.id, req.params.studentId);

    // Calculate totals
    const totalMax = marks.reduce((sum, m) => sum + (m.max_marks || 0), 0);
    const totalObtained = marks.reduce((sum, m) => sum + (m.obtained_marks || 0), 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    // Get grade
    const grade = db.prepare(`
      SELECT grade, description FROM grading_rules 
      WHERE ? >= min_percentage AND ? <= max_percentage AND is_active = 1
    `).get(percentage, percentage);

    // Attendance
    const attSummary = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present
      FROM student_attendance WHERE student_id = ? AND academic_year_id = ?
    `).get(req.params.studentId, exam.academic_year_id);

    res.json({
      success: true,
      reportCard: {
        exam, student, marks,
        totalMax, totalObtained, percentage: percentage.toFixed(2),
        grade: grade?.grade || 'N/A', gradeDescription: grade?.description || '',
        result: percentage >= 33 ? 'PASS' : 'FAIL',
        attendanceSummary: attSummary
      }
    });
  } catch (err) {
    console.error('Report card error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/exams/my-results - student & parent exam schedules and results
router.get('/my-results', authenticate, (req, res) => {
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
      SELECT s.*, c.name as class_name, c.id as class_id, sec.name as section_name, se.roll_number
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.id = ?
    `).get(studentId);

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    // List of exams for student's class
    const exams = db.prepare(`
      SELECT e.*, et.name as exam_type, ay.name as academic_year
      FROM examinations e
      JOIN examination_types et ON e.exam_type_id = et.id
      JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE (e.class_id = ? OR e.class_id IS NULL) AND e.is_active = 1
      ORDER BY e.start_date DESC
    `).all(student.class_id);

    // All marks for this student
    const marks = db.prepare(`
      SELECT em.*, e.id as exam_id, e.name as exam_name, e.start_date as exam_date, es.max_marks, es.passing_marks, sub.name as subject_name, sub.code as subject_code
      FROM examination_marks em
      JOIN examinations e ON em.examination_id = e.id
      JOIN examination_subjects es ON em.exam_subject_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE em.student_id = ?
      ORDER BY e.start_date DESC, sub.name
    `).all(studentId);

    // Examination subjects timetable for upcoming
    const examSchedule = db.prepare(`
      SELECT es.*, e.name as exam_name, e.start_date, e.end_date, sub.name as subject_name, sub.code as subject_code
      FROM examination_subjects es
      JOIN examinations e ON es.examination_id = e.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE e.class_id = ? AND e.is_active = 1
      ORDER BY es.exam_date ASC, sub.name
    `).all(student.class_id);

    res.json({ success: true, student, exams, marks, examSchedule });
  } catch (err) {
    console.error('My-results error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
