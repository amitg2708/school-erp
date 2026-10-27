const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/assignments
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { class_id, section_id, subject_id, academic_year_id } = req.query;

    let studentId = null;
    if (req.user.role === 'student') {
      const st = db.prepare(`
        SELECT s.id, se.class_id, se.section_id 
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'Active'
        WHERE s.user_id = ?
      `).get(req.user.id);
      if (st) {
        studentId = st.id;
      }
    } else if (req.user.role === 'parent') {
      let targetStudId = req.query.student_id;
      if (!targetStudId) {
        const parent = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(req.user.id);
        if (parent) {
          const sp = db.prepare('SELECT student_id FROM student_parents WHERE parent_id = ? LIMIT 1').get(parent.id);
          targetStudId = sp?.student_id;
        }
      }
      if (targetStudId) studentId = targetStudId;
    }

    let query = `
      SELECT a.*, c.name as class_name, sec.name as section_name, sub.name as subject_name,
             s.first_name || ' ' || COALESCE(s.last_name,'') as teacher_name
             ${studentId ? ', sub_rec.status as submission_status, sub_rec.marks_obtained, sub_rec.remarks as feedback, sub_rec.submission_date, sub_rec.remarks as student_remarks' : ''}
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN sections sec ON a.section_id = sec.id
      JOIN subjects sub ON a.subject_id = sub.id
      JOIN staff s ON a.assigned_by = s.id
      ${studentId ? `LEFT JOIN assignment_submissions sub_rec ON a.id = sub_rec.assignment_id AND sub_rec.student_id = ${parseInt(studentId)}` : ''}
      WHERE a.is_active = 1
    `;
    const params = [];
    if (studentId) {
      const st = db.prepare('SELECT se.class_id, se.section_id FROM student_enrollments se WHERE se.student_id = ? AND se.status = ?').get(studentId, 'Active');
      if (st) {
        query += ' AND a.class_id = ? AND (a.section_id = ? OR a.section_id IS NULL)';
        params.push(st.class_id, st.section_id);
      }
    } else {
      if (class_id) { query += ' AND a.class_id = ?'; params.push(class_id); }
      if (section_id) { query += ' AND (a.section_id = ? OR a.section_id IS NULL)'; params.push(section_id); }
    }

    if (subject_id) { query += ' AND a.subject_id = ?'; params.push(subject_id); }
    if (academic_year_id) { query += ' AND a.academic_year_id = ?'; params.push(academic_year_id); }

    // For teachers, only show their own assignments
    if (req.user.role === 'teacher') {
      query += ' AND a.assigned_by = (SELECT id FROM staff WHERE user_id = ?)';
      params.push(req.user.id);
    }
    query += ' ORDER BY a.due_date ASC';

    const assignments = db.prepare(query).all(...params);
    res.json({ success: true, assignments });
  } catch (err) {
    console.error('Assignments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/assignments
router.post('/', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { title, description, classId, sectionId, subjectId, academicYearId, dueDate, maxMarks } = req.body;
    if (!title || !classId || !subjectId || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    let staffId;
    if (req.user.role === 'teacher') {
      const staff = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(req.user.id);
      staffId = staff?.id;
    } else {
      staffId = req.body.staffId;
    }

    db.prepare(`
      INSERT INTO assignments (title, description, class_id, section_id, subject_id, academic_year_id, assigned_by, due_date, max_marks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || null, classId, sectionId || null, subjectId, academicYearId, staffId, dueDate || null, maxMarks || null);

    res.json({ success: true, message: 'Assignment created' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/assignments/:id/submit - student submit assignment
router.post('/:id/submit', authenticate, authorize('student'), (req, res) => {
  try {
    const db = getDb();
    const { remarks } = req.body;
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    db.prepare(`
      INSERT OR REPLACE INTO assignment_submissions (assignment_id, student_id, remarks, status)
      VALUES (?, ?, ?, 'Submitted')
    `).run(req.params.id, student.id, remarks || null);

    res.json({ success: true, message: 'Assignment submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const submissions = db.prepare(`
      SELECT asub.*, s.first_name, s.last_name, s.student_id as std_id, se.roll_number
      FROM assignment_submissions asub
      JOIN students s ON asub.student_id = s.id
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE asub.assignment_id = ?
      ORDER BY se.roll_number
    `).all(req.params.id);
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/assignments/:id/grade/:submissionId - teacher evaluate submission
router.put('/:id/grade/:submissionId', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { marksObtained, feedback } = req.body;
    db.prepare(`
      UPDATE assignment_submissions
      SET marks_obtained = ?, remarks = ?, status = 'Evaluated'
      WHERE id = ? AND assignment_id = ?
    `).run(marksObtained, feedback || null, req.params.submissionId, req.params.id);
    res.json({ success: true, message: 'Submission evaluated successfully' });
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
