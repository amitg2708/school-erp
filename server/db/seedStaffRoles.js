const { getDb } = require('./schema');
const bcrypt = require('bcryptjs');

function seedStaffRoles() {
  const db = getDb();
  console.log('🌱 Seeding designated staff & users...');

  const hash = bcrypt.hashSync('teacher123', 10);

  // 1. Update admin
  db.prepare("UPDATE users SET first_name = 'Dr. Ramesh', last_name = 'Gupta' WHERE username = 'admin'").run();

  // 2. Update teacher1 designation
  db.prepare("UPDATE staff SET designation = 'Senior PGT Mathematics Teacher', department_id = 2 WHERE staff_id = 'TCH001'").run();

  // 3. Create accountant1 if not exists
  const accRole = db.prepare("SELECT id FROM roles WHERE name = 'accountant'").get();
  let accUser = db.prepare("SELECT id FROM users WHERE username = 'accountant1'").get();
  if (!accUser) {
    const res = db.prepare("INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
      .run('accountant1', 'accountant@school.edu', '9100000001', hash, accRole.id, 'Suresh', 'Patel');
    accUser = { id: res.lastInsertRowid };
  }
  db.prepare("INSERT OR REPLACE INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, department_id, designation, staff_type, joining_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)")
    .run('ACC001', accUser.id, 'Suresh', 'Patel', 'accountant@school.edu', '9100000001', 'Male', 9, 'Chief School Accountant & Bursar', 'Non-Teaching', '2019-04-01');

  // 4. Create staff1 (Librarian) if not exists
  const staffRole = db.prepare("SELECT id FROM roles WHERE name = 'staff'").get();
  let stfUser = db.prepare("SELECT id FROM users WHERE username = 'staff1'").get();
  if (!stfUser) {
    const res = db.prepare("INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
      .run('staff1', 'librarian@school.edu', '9100000002', hash, staffRole.id, 'Sunita', 'Rao');
    stfUser = { id: res.lastInsertRowid };
  }
  db.prepare("INSERT OR REPLACE INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, department_id, designation, staff_type, joining_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)")
    .run('LIB001', stfUser.id, 'Sunita', 'Rao', 'librarian@school.edu', '9100000002', 'Female', 10, 'Senior School Librarian & Media Incharge', 'Non-Teaching', '2021-07-15');

  // 5. Create teacher2 (Priya Sharma)
  const teaRole = db.prepare("SELECT id FROM roles WHERE name = 'teacher'").get();
  let tea2User = db.prepare("SELECT id FROM users WHERE username = 'teacher2'").get();
  if (!tea2User) {
    const res = db.prepare("INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
      .run('teacher2', 'teacher2@school.edu', '9100000003', hash, teaRole.id, 'Priya', 'Sharma');
    tea2User = { id: res.lastInsertRowid };
  }
  db.prepare("INSERT OR REPLACE INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, department_id, designation, staff_type, joining_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)")
    .run('TCH002', tea2User.id, 'Priya', 'Sharma', 'teacher2@school.edu', '9100000003', 'Female', 1, 'TGT Science & Biology Teacher', 'Teaching', '2021-08-01');

  // Assign teacher2 to Class 10 Section A for Science
  const class10 = db.prepare("SELECT id FROM classes WHERE numeric_value = 10").get();
  const secA = db.prepare("SELECT id FROM sections WHERE class_id = ? AND name = 'A'").get(class10.id);
  const sciSubj = db.prepare("SELECT id FROM subjects WHERE code = 'SCI'").get();
  const curYear = db.prepare("SELECT id FROM academic_years WHERE is_current = 1").get();
  const teacher2Staff = db.prepare("SELECT id FROM staff WHERE user_id = ?").get(tea2User.id);
  if (class10 && secA && sciSubj && curYear && teacher2Staff) {
    db.prepare("INSERT OR REPLACE INTO teacher_assignments (staff_id, class_id, section_id, subject_id, academic_year_id, is_active) VALUES (?, ?, ?, ?, ?, 1)")
      .run(teacher2Staff.id, class10.id, secA.id, sciSubj.id, curYear.id);
  }

  console.log('✅ Staff & Users seeded with real designations successfully!');
}

seedStaffRoles();
