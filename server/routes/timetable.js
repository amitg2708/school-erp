const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/timetable?class_id=&section_id=&academic_year_id=
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { class_id, section_id, academic_year_id, staff_id } = req.query;

    let query = `
      SELECT t.*, c.name as class_name, sec.name as section_name, 
             sub.name as subject_name, sub.code as subject_code,
             s.first_name || ' ' || COALESCE(s.last_name,'') as teacher_name
      FROM timetables t
      JOIN classes c ON t.class_id = c.id
      JOIN sections sec ON t.section_id = sec.id
      LEFT JOIN subjects sub ON t.subject_id = sub.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.is_active = 1
    `;
    const params = [];
    if (class_id) { query += ' AND t.class_id = ?'; params.push(class_id); }
    if (section_id) { query += ' AND t.section_id = ?'; params.push(section_id); }
    if (academic_year_id) { query += ' AND t.academic_year_id = ?'; params.push(academic_year_id); }
    if (staff_id) { query += ' AND t.staff_id = ?'; params.push(staff_id); }
    query += ' ORDER BY t.day_of_week, t.period_number';

    const timetable = db.prepare(query).all(...params);
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/timetable
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { classId, sectionId, academicYearId, dayOfWeek, periodNumber, startTime, endTime, subjectId, staffId, room } = req.body;

    // Check teacher conflict
    if (staffId) {
      const conflict = db.prepare(`
        SELECT t.id FROM timetables t
        WHERE t.staff_id = ? AND t.academic_year_id = ? AND t.day_of_week = ? 
          AND t.period_number = ? AND t.is_active = 1
          AND NOT (t.class_id = ? AND t.section_id = ?)
      `).get(staffId, academicYearId, dayOfWeek, periodNumber, classId, sectionId);
      if (conflict) {
        return res.status(400).json({ success: false, message: 'Teacher has a scheduling conflict at this period' });
      }
    }

    db.prepare(`
      INSERT OR REPLACE INTO timetables (class_id, section_id, academic_year_id, day_of_week, period_number, start_time, end_time, subject_id, staff_id, room)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(classId, sectionId, academicYearId, dayOfWeek, periodNumber, startTime, endTime, subjectId || null, staffId || null, room || null);

    res.json({ success: true, message: 'Timetable entry saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  db.prepare('UPDATE timetables SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Timetable entry removed' });
});

module.exports = router;
