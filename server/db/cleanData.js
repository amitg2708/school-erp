const { getDb } = require('./schema');
const bcrypt = require('bcryptjs');

function cleanDemoData() {
  const db = getDb();
  console.log('🧹 Purging all demo data and demo credentials for production deployment...');

  // Disable FKs during wipe
  db.exec("PRAGMA foreign_keys = OFF;");

  db.prepare("DELETE FROM student_attendance").run();
  db.prepare("DELETE FROM staff_attendance").run();
  db.prepare("DELETE FROM fee_payments").run();
  db.prepare("DELETE FROM student_fees").run();
  db.prepare("DELETE FROM fee_structures").run();
  db.prepare("DELETE FROM examination_marks").run();
  db.prepare("DELETE FROM examination_subjects").run();
  db.prepare("DELETE FROM examinations").run();
  db.prepare("DELETE FROM student_enrollments").run();
  db.prepare("DELETE FROM student_parents").run();
  db.prepare("DELETE FROM parents").run();
  db.prepare("DELETE FROM assignment_submissions").run();
  db.prepare("DELETE FROM assignments").run();
  db.prepare("DELETE FROM students").run();
  db.prepare("DELETE FROM teacher_assignments").run();
  db.prepare("DELETE FROM study_materials").run();
  db.prepare("DELETE FROM leave_applications").run();
  db.prepare("DELETE FROM timetables").run();
  db.prepare("DELETE FROM user_notifications").run();
  db.prepare("DELETE FROM notifications").run();
  db.prepare("DELETE FROM audit_logs").run();
  db.prepare("DELETE FROM staff").run();
  db.prepare("DELETE FROM school_admins").run();

  db.exec("PRAGMA foreign_keys = ON;");

  // 2. Wipe all demo users (stu*, parent*, teacher*, staff*, accountant*, admin.primary)
  db.prepare(`
    DELETE FROM users 
    WHERE username LIKE 'stu%' 
       OR username LIKE 'parent%' 
       OR username LIKE 'teacher%' 
       OR username LIKE 'staff%' 
       OR username LIKE 'accountant%' 
       OR username = 'admin.primary'
  `).run();

  // 3. Ensure clean Super Administrator account from environment or production defaults
  const superAdminRole = db.prepare("SELECT id FROM roles WHERE name = 'superadmin'").get() || { id: 1 };
  const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get() || { id: 2 };

  const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Secure2026';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@institution.edu';

  // Remove any legacy admin users with demo credentials
  db.prepare("DELETE FROM users WHERE username IN ('admin', 'superadmin')").run();

  // Create clean initial superadmin
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const adminUser = db.prepare(`
    INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
    VALUES (?, ?, '9800000000', ?, ?, 'System', 'Director', 1)
  `).run(adminUsername, adminEmail, passwordHash, superAdminRole.id);

  // Link to school_admins
  db.prepare(`
    INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
    VALUES (?, 'Main Institutional Campus', 'Classes 1 to 12', 'DIR-001', 'Director of Institutional Governance', 'Primary administrator account.')
  `).run(adminUser.lastInsertRowid);

  console.log('✅ Demo records, mock students, mock staff, and demo credentials successfully purged!');
  console.log(`🔐 Clean Root Administrator: username="${adminUsername}" | password="${adminPassword}"`);
}

module.exports = { cleanDemoData };

if (require.main === module) {
  cleanDemoData();
}
