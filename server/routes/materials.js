const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/materials
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { class_id, subject_id, search } = req.query;

    let query = `
      SELECT m.*, c.name as class_name, sub.name as subject_name, sub.code as subject_code,
             s.first_name || ' ' || COALESCE(s.last_name,'') as uploader_name
      FROM study_materials m
      JOIN classes c ON m.class_id = c.id
      JOIN subjects sub ON m.subject_id = sub.id
      LEFT JOIN staff s ON m.uploaded_by = s.id
      WHERE m.is_active = 1
    `;
    const params = [];

    if (class_id) { query += ' AND m.class_id = ?'; params.push(class_id); }
    if (subject_id) { query += ' AND m.subject_id = ?'; params.push(subject_id); }
    if (search) {
      query += ' AND (m.title LIKE ? OR m.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY m.created_at DESC';

    const materials = db.prepare(query).all(...params);
    res.json({ success: true, materials });
  } catch (err) {
    console.error('Materials fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/materials - upload/create study material
router.post('/', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { title, description, classId, subjectId, fileUrl, fileName, fileType } = req.body;

    if (!title || !classId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Title, class, and subject are required' });
    }

    let staffId = null;
    if (req.user.role === 'teacher') {
      const staff = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(req.user.id);
      staffId = staff?.id;
    }

    const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();

    const result = db.prepare(`
      INSERT INTO study_materials (title, description, class_id, subject_id, academic_year_id, uploaded_by, file_url, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      classId,
      subjectId,
      curYear?.id || null,
      staffId,
      fileUrl || null,
      fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileType || 'PDF'
    );

    res.json({ success: true, message: 'Study material uploaded successfully', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Add material error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', authenticate, authorize('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE study_materials SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Study material deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
