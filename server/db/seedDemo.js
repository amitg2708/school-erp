const { getDb } = require('./schema');
const bcrypt = require('bcryptjs');

function seedDemo() {
  const db = getDb();
  console.log('🌱 Seeding rich demo data...');

  // Clean partial data in foreign key order
  db.prepare("DELETE FROM student_attendance").run();
  db.prepare("DELETE FROM fee_payments").run();
  db.prepare("DELETE FROM student_fees").run();
  db.prepare("DELETE FROM examination_marks").run();
  db.prepare("DELETE FROM examination_subjects").run();
  db.prepare("DELETE FROM examinations").run();
  db.prepare("DELETE FROM student_enrollments").run();
  db.prepare("DELETE FROM student_parents").run();
  db.prepare("DELETE FROM parents").run();
  db.prepare("DELETE FROM students").run();
  db.prepare("DELETE FROM users WHERE username LIKE 'stu%' OR username LIKE 'parent%'").run();

  const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get() || { id: 1 };
  const studentRole = db.prepare("SELECT id FROM roles WHERE name = 'student'").get();
  const parentRole = db.prepare("SELECT id FROM roles WHERE name = 'parent'").get();

  const demoStudents = [
    { first: 'Aarav', last: 'Sharma', gender: 'Male', classNum: 10, sec: 'A', roll: 1, blood: 'O+', fName: 'Vikas Sharma', mName: 'Sunita Sharma', phone: '9876543210' },
    { first: 'Ananya', last: 'Patel', gender: 'Female', classNum: 10, sec: 'A', roll: 2, blood: 'B+', fName: 'Sanjay Patel', mName: 'Meena Patel', phone: '9876543211' },
    { first: 'Rohan', last: 'Verma', gender: 'Male', classNum: 10, sec: 'A', roll: 3, blood: 'A+', fName: 'Ajay Verma', mName: 'Kavita Verma', phone: '9876543212' },
    { first: 'Ishita', last: 'Gupta', gender: 'Female', classNum: 10, sec: 'B', roll: 1, blood: 'AB+', fName: 'Manish Gupta', mName: 'Pooja Gupta', phone: '9876543213' },
    { first: 'Kabir', last: 'Singh', gender: 'Male', classNum: 9, sec: 'A', roll: 1, blood: 'O-', fName: 'Harpreet Singh', mName: 'Simran Singh', phone: '9876543214' },
    { first: 'Diya', last: 'Menon', gender: 'Female', classNum: 9, sec: 'A', roll: 2, blood: 'B-', fName: 'Ramesh Menon', mName: 'Lakshmi Menon', phone: '9876543215' },
    { first: 'Vihaan', last: 'Reddy', gender: 'Male', classNum: 8, sec: 'A', roll: 1, blood: 'A-', fName: 'Kiran Reddy', mName: 'Shanti Reddy', phone: '9876543216' },
    { first: 'Sara', last: 'Khan', gender: 'Female', classNum: 5, sec: 'A', roll: 1, blood: 'O+', fName: 'Tariq Khan', mName: 'Zoya Khan', phone: '9876543217' },
    { first: 'Reyansh', last: 'Joshi', gender: 'Male', classNum: 1, sec: 'A', roll: 1, blood: 'B+', fName: 'Prakash Joshi', mName: 'Geeta Joshi', phone: '9876543218' },
    { first: 'Aditi', last: 'Nair', gender: 'Female', classNum: 11, sec: 'A', roll: 1, blood: 'O+', fName: 'Gopal Nair', mName: 'Radha Nair', phone: '9876543219' },
    { first: 'Arjun', last: 'Mehta', gender: 'Male', classNum: 12, sec: 'A', roll: 1, blood: 'AB-', fName: 'Nitin Mehta', mName: 'Anita Mehta', phone: '9876543220' }
  ];

  const hash = bcrypt.hashSync('student123', 10);
  const today = new Date().toISOString().split('T')[0];

  demoStudents.forEach((st, idx) => {
    const stdId = `STU${String(idx + 1).padStart(4, '0')}`;
    const username = stdId.toLowerCase();

    // User
    const uRes = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(username, `${username}@school.edu`, st.phone, hash, studentRole.id, st.first, st.last);

    // Student
    const admNum = `ADM${String(idx + 1).padStart(4, '0')}`;
    const sRes = db.prepare(`
      INSERT INTO students (student_id, admission_number, user_id, first_name, last_name, gender, blood_group, admission_date, emergency_contact, address, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, '2025-04-01', ?, '123 School Lane, City', 1)
    `).run(stdId, admNum, uRes.lastInsertRowid, st.first, st.last, st.gender, st.blood, st.phone);

    // Parent User
    const pUName = `parent.${username}`;
    const pEmail = `parent.${username}@school.edu`;
    const pPhone = `8800${String(idx + 1).padStart(6, '0')}`;
    const pFirstName = st.fName.split(' ')[0] || 'Parent';
    const pLastName = st.fName.split(' ').slice(1).join(' ') || '';

    const pUserRes = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(pUName, pEmail, pPhone, hash, parentRole.id, pFirstName, pLastName);

    const pRes = db.prepare(`
      INSERT INTO parents (user_id, father_name, mother_name, father_phone, mother_phone, email, occupation)
      VALUES (?, ?, ?, ?, ?, ?, 'Professional')
    `).run(pUserRes.lastInsertRowid, st.fName, st.mName, st.phone, st.phone, pEmail);

    db.prepare(`
      INSERT INTO student_parents (student_id, parent_id, is_primary) VALUES (?, ?, 1)
    `).run(sRes.lastInsertRowid, pRes.lastInsertRowid);

    // Enrollment
    const cls = db.prepare('SELECT id FROM classes WHERE numeric_value = ?').get(st.classNum);
    const sec = db.prepare('SELECT id FROM sections WHERE class_id = ? AND name = ?').get(cls.id, st.sec);
    if (cls && sec) {
      db.prepare(`
        INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_number, enrollment_date, status)
        VALUES (?, ?, ?, ?, ?, '2025-04-01', 'Active')
      `).run(sRes.lastInsertRowid, cls.id, sec.id, curYear.id, st.roll);

      // Attendance records
      const statuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Present'];
      const stStatus = statuses[idx % statuses.length];
      db.prepare(`
        INSERT OR IGNORE INTO student_attendance (student_id, class_id, section_id, academic_year_id, attendance_date, status, marked_by)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(sRes.lastInsertRowid, cls.id, sec.id, curYear.id, today, stStatus);
    }
  });

  // Seed Fee Structures
  const class10 = db.prepare('SELECT id FROM classes WHERE numeric_value = 10').get();
  const tuitionCat = db.prepare("SELECT id FROM fee_categories WHERE name = 'Tuition Fee'").get();
  const examCat = db.prepare("SELECT id FROM fee_categories WHERE name = 'Examination Fee'").get();

  if (class10 && tuitionCat && examCat) {
    const fs1 = db.prepare(`
      INSERT OR REPLACE INTO fee_structures (academic_year_id, class_id, fee_category_id, amount, frequency, due_date)
      VALUES (?, ?, ?, 12000, 'Annually', '2025-10-31')
    `).run(curYear.id, class10.id, tuitionCat.id);

    const fs2 = db.prepare(`
      INSERT OR REPLACE INTO fee_structures (academic_year_id, class_id, fee_category_id, amount, frequency, due_date)
      VALUES (?, ?, ?, 2500, 'Annually', '2025-11-15')
    `).run(curYear.id, class10.id, examCat.id);

    // Assign to Aarav & Ananya
    const s1 = db.prepare("SELECT id FROM students WHERE student_id = 'STU0001'").get();
    const s2 = db.prepare("SELECT id FROM students WHERE student_id = 'STU0002'").get();

    if (s1 && s2) {
      const sf1 = db.prepare(`
        INSERT INTO student_fees (student_id, fee_structure_id, academic_year_id, total_amount, net_amount, paid_amount, status)
        VALUES (?, ?, ?, 12000, 12000, 12000, 'Paid')
      `).run(s1.id, fs1.lastInsertRowid, curYear.id);

      db.prepare(`
        INSERT INTO fee_payments (student_fee_id, student_id, receipt_number, amount, payment_mode, transaction_reference, collected_by)
        VALUES (?, ?, 'RCPT10000001', 12000, 'UPI', 'UPI-REF-99238', 1)
      `).run(sf1.lastInsertRowid, s1.id);

      db.prepare(`
        INSERT INTO student_fees (student_id, fee_structure_id, academic_year_id, total_amount, net_amount, paid_amount, status)
        VALUES (?, ?, ?, 12000, 12000, 4000, 'Partial')
      `).run(s2.id, fs1.lastInsertRowid, curYear.id);
    }
  }

  // Seed Examination & Marks
  const examType = db.prepare("SELECT id FROM examination_types WHERE name = 'Midterm Examination'").get() || { id: 1 };
  if (class10) {
    const exRes = db.prepare(`
      INSERT INTO examinations (name, exam_type_id, academic_year_id, class_id, start_date, end_date)
      VALUES ('Mid-Term Examination 2025', ?, ?, ?, '2025-09-15', '2025-09-25')
    `).run(examType.id, curYear.id, class10.id);

    const math = db.prepare("SELECT id FROM subjects WHERE code = 'MATH'").get();
    const eng = db.prepare("SELECT id FROM subjects WHERE code = 'ENG'").get();
    const sci = db.prepare("SELECT id FROM subjects WHERE code = 'SCI'").get();

    if (math && eng && sci) {
      const es1 = db.prepare(`INSERT INTO examination_subjects (examination_id, subject_id, max_marks, passing_marks, exam_date) VALUES (?, ?, 100, 33, '2025-09-16')`).run(exRes.lastInsertRowid, math.id);
      const es2 = db.prepare(`INSERT INTO examination_subjects (examination_id, subject_id, max_marks, passing_marks, exam_date) VALUES (?, ?, 100, 33, '2025-09-18')`).run(exRes.lastInsertRowid, eng.id);
      const es3 = db.prepare(`INSERT INTO examination_subjects (examination_id, subject_id, max_marks, passing_marks, exam_date) VALUES (?, ?, 100, 33, '2025-09-20')`).run(exRes.lastInsertRowid, sci.id);

      const s1 = db.prepare("SELECT id FROM students WHERE student_id = 'STU0001'").get();
      if (s1) {
        db.prepare(`INSERT OR REPLACE INTO examination_marks (examination_id, exam_subject_id, student_id, obtained_marks, is_absent, remarks, entered_by) VALUES (?, ?, ?, 92, 0, 'Excellent', 1)`).run(exRes.lastInsertRowid, es1.lastInsertRowid, s1.id);
        db.prepare(`INSERT OR REPLACE INTO examination_marks (examination_id, exam_subject_id, student_id, obtained_marks, is_absent, remarks, entered_by) VALUES (?, ?, ?, 88, 0, 'Very Good', 1)`).run(exRes.lastInsertRowid, es2.lastInsertRowid, s1.id);
        db.prepare(`INSERT OR REPLACE INTO examination_marks (examination_id, exam_subject_id, student_id, obtained_marks, is_absent, remarks, entered_by) VALUES (?, ?, ?, 95, 0, 'Outstanding', 1)`).run(exRes.lastInsertRowid, es3.lastInsertRowid, s1.id);
      }
    }
  }

  // Seed Timetable for Class 10 Section A
  const secA = db.prepare("SELECT id FROM sections WHERE class_id = ? AND name = 'A'").get(class10.id);
  const mathSubj = db.prepare("SELECT id FROM subjects WHERE code = 'MATH'").get();
  const engSubj = db.prepare("SELECT id FROM subjects WHERE code = 'ENG'").get();
  const sciSubj = db.prepare("SELECT id FROM subjects WHERE code = 'SCI'").get();
  const teacher = db.prepare("SELECT id FROM staff WHERE staff_id = 'TCH001'").get();

  if (class10 && secA && teacher) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    days.forEach(day => {
      if (mathSubj) {
        db.prepare(`
          INSERT OR REPLACE INTO timetables (class_id, section_id, academic_year_id, day_of_week, period_number, start_time, end_time, subject_id, staff_id, room)
          VALUES (?, ?, ?, ?, 1, '08:00', '08:45', ?, ?, 'Room 101')
        `).run(class10.id, secA.id, curYear.id, day, mathSubj.id, teacher.id);
      }
      if (engSubj) {
        db.prepare(`
          INSERT OR REPLACE INTO timetables (class_id, section_id, academic_year_id, day_of_week, period_number, start_time, end_time, subject_id, staff_id, room)
          VALUES (?, ?, ?, ?, 2, '08:45', '09:30', ?, ?, 'Room 101')
        `).run(class10.id, secA.id, curYear.id, day, engSubj.id, teacher.id);
      }
      if (sciSubj) {
        db.prepare(`
          INSERT OR REPLACE INTO timetables (class_id, section_id, academic_year_id, day_of_week, period_number, start_time, end_time, subject_id, staff_id, room)
          VALUES (?, ?, ?, ?, 3, '09:30', '10:15', ?, ?, 'Science Lab')
        `).run(class10.id, secA.id, curYear.id, day, sciSubj.id, teacher.id);
      }
    });
  }

  // Seed Homework / Assignment
  if (class10 && secA && mathSubj && teacher) {
    db.prepare(`
      INSERT INTO assignments (title, description, class_id, section_id, subject_id, academic_year_id, assigned_by, due_date, max_marks)
      VALUES ('Trigonometric Identities & Heights Exercise 4.2', 'Complete problems 1 to 15 from Chapter 4 in the homework notebook. Show all derivation steps.', ?, ?, ?, ?, ?, '2025-10-30', 25)
    `).run(class10.id, secA.id, mathSubj.id, curYear.id, teacher.id);
  }

  console.log('✅ Demo data seeding completed successfully!');
}

seedDemo();
