const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// All routes here strictly require superadmin role
router.use(authenticate, authorize('superadmin'));

// GET /api/superadmin/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();

    const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get();
    const adminRoleId = adminRole?.id || 1;

    const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(adminRoleId)?.count || 0;
    const activeAdmins = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ? AND is_active = 1').get(adminRoleId)?.count || 0;
    const inactiveAdmins = totalAdmins - activeAdmins;

    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes WHERE is_active = 1').get()?.count || 12;
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students WHERE is_active = 1').get()?.count || 0;
    const totalStaff = db.prepare('SELECT COUNT(*) as count FROM staff WHERE is_active = 1').get()?.count || 0;

    const wings = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.username, u.is_active,
             sa.campus_name, sa.managed_classes, sa.branch_code, sa.designation
      FROM users u
      LEFT JOIN school_admins sa ON u.id = sa.user_id
      WHERE u.role_id = ?
      ORDER BY u.created_at ASC
    `).all(adminRoleId);

    res.json({
      success: true,
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        totalClasses,
        totalStudents,
        totalStaff,
        wings
      }
    });
  } catch (err) {
    console.error('Superadmin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/superadmin/admins
router.get('/admins', (req, res) => {
  try {
    const db = getDb();
    const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get();
    const adminRoleId = adminRole?.id || 1;

    const admins = db.prepare(`
      SELECT u.id, u.username, u.email, u.phone, u.first_name, u.last_name, u.is_active,
             u.last_login, u.created_at,
             sa.campus_name, sa.managed_classes, sa.branch_code, sa.designation, sa.notes
      FROM users u
      LEFT JOIN school_admins sa ON u.id = sa.user_id
      WHERE u.role_id = ?
      ORDER BY u.created_at ASC
    `).all(adminRoleId);

    res.json({ success: true, admins });
  } catch (err) {
    console.error('Superadmin get admins error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/superadmin/admins
router.post('/admins', (req, res) => {
  try {
    const db = getDb();
    const {
      username, password, email, phone,
      firstName, lastName, campusName,
      managedClasses, branchCode, designation, notes
    } = req.body;

    if (!username || !password || !firstName) {
      return res.status(400).json({ success: false, message: 'Username, password and first name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check duplicate username or email
    let existing = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already in use' });
    }
    if (email) {
      existing = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email address already in use' });
      }
    }

    const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get();
    if (!adminRole) {
      return res.status(500).json({ success: false, message: 'Admin role definition not found' });
    }

    const hash = bcrypt.hashSync(password, 10);

    const userRes = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      username.trim().toLowerCase(),
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      hash,
      adminRole.id,
      firstName.trim(),
      lastName ? lastName.trim() : ''
    );

    const newUserId = userRes.lastInsertRowid;

    db.prepare(`
      INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newUserId,
      campusName || 'Main Campus',
      managedClasses || 'Classes 1 to 12',
      branchCode || `ADM-${String(newUserId).padStart(3, '0')}`,
      designation || 'School Administrator',
      notes || ''
    );

    const createdAdmin = db.prepare(`
      SELECT u.id, u.username, u.email, u.phone, u.first_name, u.last_name, u.is_active,
             u.last_login, u.created_at,
             sa.campus_name, sa.managed_classes, sa.branch_code, sa.designation, sa.notes
      FROM users u
      LEFT JOIN school_admins sa ON u.id = sa.user_id
      WHERE u.id = ?
    `).get(newUserId);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: createdAdmin
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, message: 'Server error creating admin' });
  }
});

// PUT /api/superadmin/admins/:id
router.put('/admins/:id', (req, res) => {
  try {
    const db = getDb();
    const adminId = parseInt(req.params.id);
    const {
      firstName, lastName, email, phone,
      campusName, managedClasses, branchCode, designation, notes, isActive
    } = req.body;

    const user = db.prepare("SELECT u.* FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'admin'").get(adminId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Check email collision
    if (email && email !== user.email) {
      const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, adminId);
      if (emailTaken) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another user' });
      }
    }

    db.prepare(`
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      firstName || user.first_name,
      lastName !== undefined ? lastName : user.last_name,
      email || user.email,
      phone || user.phone,
      isActive !== undefined ? (isActive ? 1 : 0) : user.is_active,
      adminId
    );

    // Update school_admins
    const hasAdminProfile = db.prepare('SELECT id FROM school_admins WHERE user_id = ?').get(adminId);
    if (hasAdminProfile) {
      db.prepare(`
        UPDATE school_admins
        SET campus_name = ?, managed_classes = ?, branch_code = ?, designation = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        campusName || 'Main Campus',
        managedClasses || 'Classes 1 to 12',
        branchCode || 'ADM-001',
        designation || 'School Administrator',
        notes || '',
        adminId
      );
    } else {
      db.prepare(`
        INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        campusName || 'Main Campus',
        managedClasses || 'Classes 1 to 12',
        branchCode || 'ADM-001',
        designation || 'School Administrator',
        notes || ''
      );
    }

    const updated = db.prepare(`
      SELECT u.id, u.username, u.email, u.phone, u.first_name, u.last_name, u.is_active,
             u.last_login, u.created_at,
             sa.campus_name, sa.managed_classes, sa.branch_code, sa.designation, sa.notes
      FROM users u
      LEFT JOIN school_admins sa ON u.id = sa.user_id
      WHERE u.id = ?
    `).get(adminId);

    res.json({
      success: true,
      message: 'Admin account updated successfully',
      admin: updated
    });
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ success: false, message: 'Server error updating admin' });
  }
});

// PATCH /api/superadmin/admins/:id/toggle-status
router.patch('/admins/:id/toggle-status', (req, res) => {
  try {
    const db = getDb();
    const adminId = parseInt(req.params.id);

    const user = db.prepare("SELECT u.* FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'admin'").get(adminId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const newStatus = user.is_active ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, adminId);

    res.json({
      success: true,
      message: `Admin ${user.username} is now ${newStatus ? 'Active' : 'Suspended'}`,
      isActive: newStatus === 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error toggling admin status' });
  }
});

// POST /api/superadmin/admins/:id/reset-password
router.post('/admins/:id/reset-password', (req, res) => {
  try {
    const db = getDb();
    const adminId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = db.prepare("SELECT u.* FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'admin'").get(adminId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, adminId);

    res.json({
      success: true,
      message: `Password reset successfully for admin @${user.username}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
});

// GET /api/superadmin/wings-overview
router.get('/wings-overview', (req, res) => {
  try {
    const db = getDb();
    const currentYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
    const yearId = currentYear?.id || 1;

    // Groups:
    // 1. Foundational / Primary: Class 1 to 5
    // 2. Middle Wing: Class 6 to 8
    // 3. Secondary Wing: Class 9 to 10
    // 4. Senior Secondary Wing: Class 11 to 12
    const classes = db.prepare(`
      SELECT c.id, c.name, c.numeric_value,
             COUNT(DISTINCT s.id) as section_count,
             COUNT(DISTINCT se.student_id) as student_count
      FROM classes c
      LEFT JOIN sections s ON c.id = s.class_id AND s.is_active = 1
      LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.academic_year_id = ? AND se.status = 'Active'
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.numeric_value
    `).all(yearId);

    const admins = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.username, u.is_active,
             sa.campus_name, sa.managed_classes, sa.branch_code, sa.designation
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN school_admins sa ON u.id = sa.user_id
      WHERE r.name = 'admin'
    `).all();

    const wings = [
      {
        id: 'primary',
        name: 'Foundational & Primary Wing',
        classRange: 'Classes 1 to 5',
        minClass: 1,
        maxClass: 5,
        classes: classes.filter(c => c.numeric_value >= 1 && c.numeric_value <= 5),
        assignedAdmin: admins.find(a => a.managed_classes?.includes('1 to 5') || a.managed_classes?.includes('Primary')) || admins[0]
      },
      {
        id: 'middle',
        name: 'Middle School Wing',
        classRange: 'Classes 6 to 8',
        minClass: 6,
        maxClass: 8,
        classes: classes.filter(c => c.numeric_value >= 6 && c.numeric_value <= 8),
        assignedAdmin: admins.find(a => a.managed_classes?.includes('6 to 8') || a.managed_classes?.includes('6 to 12')) || admins[0]
      },
      {
        id: 'secondary',
        name: 'Secondary High School Wing',
        classRange: 'Classes 9 to 10',
        minClass: 9,
        maxClass: 10,
        classes: classes.filter(c => c.numeric_value >= 9 && c.numeric_value <= 10),
        assignedAdmin: admins.find(a => a.managed_classes?.includes('9 to 10') || a.managed_classes?.includes('6 to 12')) || admins[0]
      },
      {
        id: 'senior',
        name: 'Senior Secondary Wing',
        classRange: 'Classes 11 to 12',
        minClass: 11,
        maxClass: 12,
        classes: classes.filter(c => c.numeric_value >= 11 && c.numeric_value <= 12),
        assignedAdmin: admins.find(a => a.managed_classes?.includes('11 to 12') || a.managed_classes?.includes('6 to 12')) || admins[0]
      }
    ];

    res.json({ success: true, wings, totalClasses: classes.length });
  } catch (err) {
    console.error('Wings overview error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
