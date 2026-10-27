const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/academic/years
router.get('/years', authenticate, (req, res) => {
  const db = getDb();
  const years = db.prepare('SELECT * FROM academic_years ORDER BY start_date DESC').all();
  res.json({ success: true, years });
});

// POST /api/academic/years
router.post('/years', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { name, startDate, endDate, isCurrent } = req.body;
    if (isCurrent) db.prepare('UPDATE academic_years SET is_current = 0').run();
    db.prepare('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)').run(name, startDate, endDate, isCurrent ? 1 : 0);
    res.json({ success: true, message: 'Academic year created' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/academic/classes
router.get('/classes', authenticate, (req, res) => {
  const db = getDb();
  const classes = db.prepare('SELECT * FROM classes WHERE is_active = 1 ORDER BY numeric_value').all();
  res.json({ success: true, classes });
});

// GET /api/academic/sections?class_id=
router.get('/sections', authenticate, (req, res) => {
  const db = getDb();
  const { class_id } = req.query;
  let query = `
    SELECT sec.*, c.name as class_name,
      (SELECT COUNT(*) FROM student_enrollments se 
       WHERE se.section_id = sec.id AND se.status = 'Active') as student_count,
      s.first_name || ' ' || COALESCE(s.last_name,'') as class_teacher_name
    FROM sections sec
    JOIN classes c ON sec.class_id = c.id
    LEFT JOIN staff s ON sec.class_teacher_id = s.id
    WHERE sec.is_active = 1
  `;
  const params = [];
  if (class_id) { query += ' AND sec.class_id = ?'; params.push(class_id); }
  query += ' ORDER BY c.numeric_value, sec.name';
  const sections = db.prepare(query).all(...params);
  res.json({ success: true, sections });
});

// POST /api/academic/sections
router.post('/sections', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { classId, name, maxStrength, classTeacherId } = req.body;
    db.prepare('INSERT INTO sections (class_id, name, max_strength, class_teacher_id) VALUES (?, ?, ?, ?)').run(classId, name, maxStrength || 40, classTeacherId || null);
    res.json({ success: true, message: 'Section created' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ success: false, message: 'Section already exists for this class' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/academic/subjects
router.get('/subjects', authenticate, (req, res) => {
  const db = getDb();
  const subjects = db.prepare('SELECT * FROM subjects WHERE is_active = 1 ORDER BY name').all();
  res.json({ success: true, subjects });
});

// POST /api/academic/subjects
router.post('/subjects', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code required' });
    db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(name, code.toUpperCase(), description || null);
    res.json({ success: true, message: 'Subject added' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ success: false, message: 'Subject code already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/academic/class-subjects?class_id=&academic_year_id=
router.get('/class-subjects', authenticate, (req, res) => {
  try {
    const db = getDb();
    let { class_id, academic_year_id } = req.query;

    if (!academic_year_id) {
      const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
      academic_year_id = curYear?.id || 1;
    }

    let query = `
      SELECT cs.*, s.name as subject_name, s.code
      FROM class_subjects cs JOIN subjects s ON cs.subject_id = s.id
      WHERE cs.academic_year_id = ? AND cs.is_active = 1
    `;
    const params = [academic_year_id];

    if (class_id) {
      query += ' AND cs.class_id = ?';
      params.push(class_id);
    }

    const subjects = db.prepare(query).all(...params);
    res.json({ success: true, subjects });
  } catch (err) {
    console.error('Class subjects error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/academic/class-subjects
router.post('/class-subjects', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { classId, subjectIds, academicYearId } = req.body;
    const insert = db.prepare('INSERT OR IGNORE INTO class_subjects (class_id, subject_id, academic_year_id) VALUES (?, ?, ?)');
    subjectIds.forEach(sid => insert.run(classId, sid, academicYearId));
    res.json({ success: true, message: 'Subjects assigned to class' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/academic/teacher-assignments
router.get('/teacher-assignments', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { staff_id, class_id, academic_year_id } = req.query;
    let query = `
      SELECT ta.*, s.first_name || ' ' || COALESCE(s.last_name,'') as teacher_name, s.staff_id,
             c.name as class_name, sec.name as section_name, sub.name as subject_name, ay.name as academic_year
      FROM teacher_assignments ta
      JOIN staff s ON ta.staff_id = s.id
      JOIN classes c ON ta.class_id = c.id
      JOIN sections sec ON ta.section_id = sec.id
      JOIN subjects sub ON ta.subject_id = sub.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.is_active = 1
    `;
    const params = [];
    if (staff_id) { query += ' AND ta.staff_id = ?'; params.push(staff_id); }
    if (class_id) { query += ' AND ta.class_id = ?'; params.push(class_id); }
    if (academic_year_id) { query += ' AND ta.academic_year_id = ?'; params.push(academic_year_id); }

    const assignments = db.prepare(query).all(...params);
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
