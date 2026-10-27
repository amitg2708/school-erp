const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'school_erp.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();
  database.exec('PRAGMA foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      profile_photo TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      numeric_value INTEGER NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      class_teacher_id INTEGER,
      max_strength INTEGER DEFAULT 40,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      UNIQUE(class_id, name)
    );
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS class_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(class_id, subject_id, academic_year_id)
    );
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT NOT NULL UNIQUE,
      user_id INTEGER UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      gender TEXT,
      date_of_birth TEXT,
      blood_group TEXT,
      address TEXT,
      department_id INTEGER,
      designation TEXT,
      staff_type TEXT DEFAULT 'Teaching',
      qualification TEXT,
      joining_date TEXT,
      employment_status TEXT DEFAULT 'Permanent',
      profile_photo TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(staff_id, class_id, section_id, subject_id, academic_year_id)
    );
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      admission_number TEXT NOT NULL UNIQUE,
      user_id INTEGER UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT,
      date_of_birth TEXT,
      gender TEXT,
      blood_group TEXT,
      address TEXT,
      profile_photo TEXT,
      admission_date TEXT,
      emergency_contact TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      father_name TEXT,
      mother_name TEXT,
      guardian_name TEXT,
      father_phone TEXT,
      mother_phone TEXT,
      guardian_phone TEXT,
      primary_contact TEXT,
      email TEXT,
      address TEXT,
      occupation TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS student_parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      relation TEXT DEFAULT 'Parent',
      is_primary INTEGER DEFAULT 1,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (parent_id) REFERENCES parents(id),
      UNIQUE(student_id, parent_id)
    );
    CREATE TABLE IF NOT EXISTS student_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      roll_number INTEGER,
      enrollment_date TEXT DEFAULT (date('now')),
      status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(student_id, academic_year_id)
    );
    CREATE TABLE IF NOT EXISTS student_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      marked_by INTEGER,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(student_id, attendance_date, academic_year_id)
    );
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      marked_by INTEGER,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      UNIQUE(staff_id, attendance_date)
    );
    CREATE TABLE IF NOT EXISTS examination_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS examinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      exam_type_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (exam_type_id) REFERENCES examination_types(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );
    CREATE TABLE IF NOT EXISTS examination_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      exam_date TEXT,
      max_marks INTEGER NOT NULL DEFAULT 100,
      passing_marks INTEGER NOT NULL DEFAULT 33,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (examination_id) REFERENCES examinations(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      UNIQUE(examination_id, subject_id)
    );
    CREATE TABLE IF NOT EXISTS examination_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER NOT NULL,
      exam_subject_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      obtained_marks REAL,
      is_absent INTEGER DEFAULT 0,
      remarks TEXT,
      entered_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (examination_id) REFERENCES examinations(id),
      FOREIGN KEY (exam_subject_id) REFERENCES examination_subjects(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(examination_id, exam_subject_id, student_id)
    );
    CREATE TABLE IF NOT EXISTS grading_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      min_percentage REAL NOT NULL,
      max_percentage REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS fee_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS fee_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      fee_category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      frequency TEXT DEFAULT 'Annually',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id),
      UNIQUE(academic_year_id, class_id, fee_category_id)
    );
    CREATE TABLE IF NOT EXISTS student_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      fee_structure_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      due_date TEXT,
      status TEXT DEFAULT 'Pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
    );
    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_fee_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      receipt_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      payment_date TEXT DEFAULT (date('now')),
      payment_mode TEXT DEFAULT 'Cash',
      transaction_reference TEXT,
      collected_by INTEGER,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_fee_id) REFERENCES student_fees(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );
    CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id INTEGER,
      staff_id INTEGER,
      room TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      UNIQUE(class_id, section_id, academic_year_id, day_of_week, period_number)
    );
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      class_id INTEGER NOT NULL,
      section_id INTEGER,
      subject_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      due_date TEXT,
      attachment_path TEXT,
      max_marks INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      FOREIGN KEY (assigned_by) REFERENCES staff(id)
    );
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      submission_date TEXT DEFAULT (datetime('now')),
      file_path TEXT,
      remarks TEXT,
      marks_obtained REAL,
      status TEXT DEFAULT 'Submitted',
      FOREIGN KEY (assignment_id) REFERENCES assignments(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(assignment_id, student_id)
    );
    CREATE TABLE IF NOT EXISTS leave_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      max_days INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS leave_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      leave_type_id INTEGER NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      total_days INTEGER,
      reason TEXT,
      status TEXT DEFAULT 'Pending',
      approved_by INTEGER,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
    );
    CREATE TABLE IF NOT EXISTS study_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      uploaded_by INTEGER,
      file_url TEXT,
      file_name TEXT,
      file_type TEXT DEFAULT 'PDF',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (uploaded_by) REFERENCES staff(id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      created_by INTEGER,
      target_role TEXT,
      target_class_id INTEGER,
      target_section_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      FOREIGN KEY (notification_id) REFERENCES notifications(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(notification_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seedDefaultData(database);
  console.log('✅ Database initialized successfully');
  return database;
}

function prepare(db, sql) {
  return db.prepare(sql);
}

function seedDefaultData(database) {
  // Roles
  const insertRole = database.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`);
  [['admin','School Administrator'],['teacher','Teaching Staff'],['student','Student'],['parent','Parent/Guardian'],['accountant','Fee Accountant'],['staff','Non-Teaching Staff']].forEach(r => insertRole.run(...r));

  // Academic year
  database.prepare(`INSERT OR IGNORE INTO academic_years (name, start_date, end_date, is_current, is_active) VALUES ('2025-2026', '2025-04-01', '2026-03-31', 1, 1)`).run();

  // Classes 1-12
  const insertClass = database.prepare(`INSERT OR IGNORE INTO classes (name, numeric_value) VALUES (?, ?)`);
  for (let i = 1; i <= 12; i++) insertClass.run(`Class ${i}`, i);

  // Sections A, B, C for each class
  const classes = database.prepare('SELECT id FROM classes ORDER BY numeric_value').all();
  const insertSection = database.prepare(`INSERT OR IGNORE INTO sections (class_id, name, max_strength) VALUES (?, ?, 40)`);
  classes.forEach(cls => ['A','B','C'].forEach(sec => insertSection.run(cls.id, sec)));

  // Subjects
  const insertSubject = database.prepare(`INSERT OR IGNORE INTO subjects (name, code) VALUES (?, ?)`);
  [['English','ENG'],['Mathematics','MATH'],['Science','SCI'],['Social Science','SST'],['Hindi','HIN'],['Computer Science','CS'],['Physics','PHY'],['Chemistry','CHEM'],['Biology','BIO'],['History','HIST'],['Geography','GEO'],['Civics','CIV'],['Economics','ECO'],['Accountancy','ACC'],['Business Studies','BS'],['Physical Education','PE'],['Art','ART'],['Music','MUS']].forEach(s => insertSubject.run(...s));

  // Departments
  const insertDept = database.prepare(`INSERT OR IGNORE INTO departments (name) VALUES (?)`);
  ['Science','Mathematics','English','Social Studies','Computer Science','Physical Education','Arts','Administration','Accounts','Library'].forEach(d => insertDept.run(d));

  // Fee categories
  const insertFeeCategory = database.prepare(`INSERT OR IGNORE INTO fee_categories (name) VALUES (?)`);
  ['Tuition Fee','Admission Fee','Examination Fee','Transport Fee','Activity Fee','Library Fee','Sports Fee','Lab Fee','Other Fee'].forEach(f => insertFeeCategory.run(f));

  // Exam types
  const insertExamType = database.prepare(`INSERT OR IGNORE INTO examination_types (name) VALUES (?)`);
  ['Unit Test','Periodic Test','Midterm Examination','Final Examination','Practical Examination'].forEach(e => insertExamType.run(e));

  // Grading rules
  const insertGrade = database.prepare(`INSERT OR IGNORE INTO grading_rules (grade, min_percentage, max_percentage, description) VALUES (?, ?, ?, ?)`);
  [['A+',90,100,'Outstanding'],['A',80,89.99,'Excellent'],['B+',70,79.99,'Very Good'],['B',60,69.99,'Good'],['C',50,59.99,'Average'],['D',33,49.99,'Below Average'],['F',0,32.99,'Fail']].forEach(g => insertGrade.run(...g));

  // Leave types
  const insertLeaveType = database.prepare(`INSERT OR IGNORE INTO leave_types (name, max_days) VALUES (?, ?)`);
  [['Casual Leave',12],['Medical Leave',15],['Earned Leave',30],['Maternity Leave',90],['Study Leave',30]].forEach(l => insertLeaveType.run(...l));

  // Clean Root Administrator (if no administrator exists)
  const superAdminRole = database.prepare("SELECT id FROM roles WHERE name = 'superadmin'").get() || { id: 1 };
  const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Secure2026';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@institution.edu';

  const existingAdmin = database.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    const adminUser = database.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active) 
      VALUES (?, ?, '9800000000', ?, ?, 'System', 'Director', 1)
    `).run(adminUsername, adminEmail, hash, superAdminRole.id);

    database.prepare(`
      INSERT OR REPLACE INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
      VALUES (?, 'Main Institutional Campus', 'Classes 1 to 12', 'DIR-001', 'Director of Institutional Governance', 'Root administrator account.')
    `).run(adminUser.lastInsertRowid);
  }

  console.log('✅ Institutional foundation initialized');
}

module.exports = { getDb, initializeDatabase };
