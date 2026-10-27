const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/staff - list all staff
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { staff_type, department_id, search } = req.query;

    let query = `
      SELECT s.*, d.name as department_name,
             u.username, u.email as user_email, u.is_active as user_active
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (staff_type) { query += ' AND s.staff_type = ?'; params.push(staff_type); }
    if (department_id) { query += ' AND s.department_id = ?'; params.push(department_id); }
    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.staff_id LIKE ?)';
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }
    query += ' ORDER BY s.first_name';

    const staff = db.prepare(query).all(...params);
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/staff/departments
router.get('/departments', authenticate, (req, res) => {
  const db = getDb();
  const depts = db.prepare('SELECT * FROM departments WHERE is_active = 1').all();
  res.json({ success: true, departments: depts });
});

// GET /api/staff/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const staff = db.prepare(`
      SELECT s.*, d.name as department_name
      FROM staff s LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const assignments = db.prepare(`
      SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, ay.name as academic_year
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      JOIN sections sec ON ta.section_id = sec.id
      JOIN subjects sub ON ta.subject_id = sub.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.staff_id = ? AND ta.is_active = 1
    `).all(req.params.id);

    res.json({ success: true, staff, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/staff - add staff
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const {
      firstName, lastName, email, phone, gender, dateOfBirth, bloodGroup,
      address, departmentId, designation, staffType, qualification, joiningDate, employmentStatus
    } = req.body;

    if (!firstName || !staffType) {
      return res.status(400).json({ success: false, message: 'First name and staff type are required' });
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM staff').get();
    const prefix = staffType === 'Teaching' ? 'TCH' : 'STF';
    const staffId = `${prefix}${String(count.count + 1).padStart(3, '0')}`;

    const roleMap = { 'Teaching': 'teacher', 'Accountant': 'accountant', 'Non-Teaching': 'staff', 'Administrative': 'staff', 'Librarian': 'staff', 'Other': 'staff' };
    const roleName = roleMap[staffType] || 'staff';
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);

    const username = staffId.toLowerCase();
    const passwordHash = bcrypt.hashSync('staff123', 10);
    const userResult = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(username, email || null, phone || null, passwordHash, role.id, firstName, lastName || '');

    const staffResult = db.prepare(`
      INSERT INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, date_of_birth,
        blood_group, address, department_id, designation, staff_type, qualification, joining_date, employment_status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(staffId, userResult.lastInsertRowid, firstName, lastName || '', email || null, phone || null,
       gender || null, dateOfBirth || null, bloodGroup || null, address || null,
       departmentId || null, designation || null, staffType, qualification || null,
       joiningDate || null, employmentStatus || 'Permanent');

    res.status(201).json({
      success: true,
      message: 'Staff added successfully',
      staffId,
      loginCredentials: { username, password: 'staff123' }
    });
  } catch (err) {
    console.error('Add staff error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: 'Email or phone already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/staff/:id
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { firstName, lastName, email, phone, gender, dateOfBirth, bloodGroup, address, departmentId, designation, qualification, joiningDate, employmentStatus } = req.body;
    db.prepare(`
      UPDATE staff SET first_name=?, last_name=?, email=?, phone=?, gender=?, date_of_birth=?,
        blood_group=?, address=?, department_id=?, designation=?, qualification=?, joining_date=?,
        employment_status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(firstName, lastName, email, phone, gender, dateOfBirth, bloodGroup, address, departmentId, designation, qualification, joiningDate, employmentStatus, req.params.id);
    res.json({ success: true, message: 'Staff updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE staff SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/staff/assign-teacher - assign teacher to class/subject
router.post('/assign-teacher', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { staffId, classId, sectionId, subjectId, academicYearId } = req.body;
    
    // Check for conflicts
    db.prepare(`
      INSERT OR REPLACE INTO teacher_assignments (staff_id, class_id, section_id, subject_id, academic_year_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(staffId, classId, sectionId, subjectId, academicYearId);

    res.json({ success: true, message: 'Teacher assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
