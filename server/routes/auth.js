const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/schema');
const { JWT_SECRET } = require('../middleware/auth');

function fetchUserProfile(db, userId, role) {
  if (role === 'teacher' || role === 'staff' || role === 'accountant') {
    return db.prepare(`
      SELECT s.id, s.staff_id, s.designation, s.staff_type, s.qualification, s.joining_date,
             s.gender, s.blood_group, s.phone, d.name as department_name
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.user_id = ?
    `).get(userId);
  } else if (role === 'student') {
    return db.prepare(`
      SELECT s.id, s.student_id, s.admission_date, s.gender, s.blood_group, s.date_of_birth as dob,
             c.name as class_name, c.numeric_value, sec.name as section_name, se.roll_number,
             ('Class ' || c.numeric_value || ' - ' || sec.name || ' Student') as designation
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'Active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.user_id = ?
    `).get(userId);
  } else if (role === 'parent') {
    const parentRec = db.prepare('SELECT p.id, p.father_name, p.mother_name, p.guardian_name, p.occupation FROM parents p WHERE p.user_id = ?').get(userId);
    const children = parentRec ? db.prepare(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, c.name as class_name, sec.name as section_name, se.roll_number, sp.relation
      FROM student_parents sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'Active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE sp.parent_id = ?
    `).all(parentRec.id) : [];
    return {
      id: parentRec?.id,
      designation: 'Parent & Legal Guardian',
      relation: children[0]?.relation || 'Father / Guardian',
      occupation: parentRec?.occupation,
      children
    };
  } else if (role === 'superadmin') {
    return {
      designation: 'Platform Super Administrator',
      department_name: 'Central Institutional Governance & Multi-Wing Directorate',
      staff_id: 'SUP-001',
      qualification: 'Executive Directorate & Educational Systems Architecture',
      joining_date: '2022-01-01'
    };
  } else if (role === 'admin') {
    const adminRec = db.prepare('SELECT campus_name, managed_classes, branch_code, designation FROM school_admins WHERE user_id = ?').get(userId);
    return {
      designation: adminRec?.designation || 'Principal & School Director',
      campus_name: adminRec?.campus_name || 'Main Campus',
      managed_classes: adminRec?.managed_classes || 'Classes 1 to 12',
      branch_code: adminRec?.branch_code || 'DIR-001',
      department_name: 'Academic Directorate & Institutional Governance',
      staff_id: adminRec?.branch_code || 'DIR-001',
      qualification: 'Educational Leadership & Administration',
      joining_date: '2015-06-01'
    };
  }
  return null;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const login = req.body.login || req.body.username || req.body.email;
    const { password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ success: false, message: 'Login and password are required' });
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE (u.username = ? OR u.email = ? OR u.phone = ?) AND u.is_active = 1
    `).get(login, login, login);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const profileInfo = fetchUserProfile(db, user.id, user.role_name);

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role_name,
      firstName: user.first_name,
      lastName: user.last_name,
      profileId: profileInfo?.id || null
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePhoto: user.profile_photo,
        profileInfo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/change-password
const { authenticate } = require('../middleware/auth');
router.post('/change-password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user.id);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.phone, u.first_name, u.last_name, u.profile_photo, u.last_login,
             r.name as role
      FROM users u JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profileInfo = fetchUserProfile(db, user.id, user.role);

    res.json({ success: true, user: { ...user, profileInfo } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
