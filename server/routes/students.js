const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/students - list all students
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { class_id, section_id, academic_year_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.id, s.student_id, s.admission_number, s.first_name, s.last_name,
             s.gender, s.date_of_birth, s.blood_group, s.profile_photo, s.is_active,
             s.admission_date, s.address, s.emergency_contact,
             se.roll_number, c.name as class_name, c.id as class_id,
             sec.name as section_name, sec.id as section_id,
             ay.name as academic_year, ay.id as academic_year_id,
             p.father_name, p.mother_name, p.father_phone, p.mother_phone, p.email as parent_email
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
      LEFT JOIN student_parents sp ON s.id = sp.student_id AND sp.is_primary = 1
      LEFT JOIN parents p ON sp.parent_id = p.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (academic_year_id) {
      query += ' AND se.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (class_id) {
      query += ' AND se.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND se.section_id = ?';
      params.push(section_id);
    }
    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.admission_number LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY se.roll_number, s.first_name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const students = db.prepare(query).all(...params);
    const totalQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
    
    res.json({ success: true, students, total: students.length });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/export-csv - export all students data
router.get('/export-csv', authenticate, (req, res) => {
  try {
    const db = getDb();
    const students = db.prepare(`
      SELECT s.student_id, s.admission_number, s.first_name, s.last_name, s.gender, s.date_of_birth,
             s.blood_group, s.emergency_contact, s.admission_date,
             c.name as class_name, sec.name as section_name, se.roll_number,
             p.father_name, p.mother_name, p.father_phone, p.email as parent_email
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'Active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN student_parents sp ON s.id = sp.student_id AND sp.is_primary = 1
      LEFT JOIN parents p ON sp.parent_id = p.id
      WHERE s.is_active = 1
      ORDER BY c.numeric_value, sec.name, se.roll_number
    `).all();

    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id - get single student
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const student = db.prepare(`
      SELECT s.*, se.roll_number, se.enrollment_date, se.status as enrollment_status,
             c.name as class_name, c.id as class_id, c.numeric_value as class_num,
             sec.name as section_name, sec.id as section_id,
             ay.name as academic_year, ay.id as academic_year_id
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN academic_years ay ON se.academic_year_id = ay.id AND ay.is_current = 1
      WHERE s.id = ?
    `).get(req.params.id);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const parent = db.prepare(`
      SELECT p.* FROM parents p
      JOIN student_parents sp ON p.id = sp.parent_id
      WHERE sp.student_id = ? AND sp.is_primary = 1
    `).get(req.params.id);

    // Attendance summary
    const attSummary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status='Half Day' THEN 1 ELSE 0 END) as halfDay
      FROM student_attendance WHERE student_id = ? AND academic_year_id = ?
    `).get(req.params.id, student.academic_year_id || 1);

    res.json({ success: true, student, parent, attendanceSummary: attSummary });
  } catch (err) {
    console.error('Student detail error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students - add student
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const {
      firstName, lastName, dateOfBirth, gender, bloodGroup, address, emergencyContact,
      admissionDate, classId, sectionId, academicYearId, rollNumber,
      fatherName, motherName, fatherPhone, motherPhone, parentEmail
    } = req.body;

    if (!firstName || !classId || !sectionId || !academicYearId) {
      return res.status(400).json({ success: false, message: 'First name, class, section, and academic year are required' });
    }

    // Generate student ID
    const count = db.prepare('SELECT COUNT(*) as count FROM students').get();
    const studentId = `STU${String(count.count + 1001).padStart(4, '0')}`;
    const admissionNumber = `ADM${Date.now().toString().slice(-8)}`;

    // Create user account for student
    const studentRole = db.prepare("SELECT id FROM roles WHERE name = 'student'").get();
    const username = studentId.toLowerCase();
    const passwordHash = bcrypt.hashSync('student123', 10);
    
    const userResult = db.prepare(`
      INSERT INTO users (username, password_hash, role_id, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(username, passwordHash, studentRole.id, firstName, lastName || '');

    // Insert student
    const studentResult = db.prepare(`
      INSERT INTO students (student_id, admission_number, user_id, first_name, last_name, 
        date_of_birth, gender, blood_group, address, emergency_contact, admission_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(studentId, admissionNumber, userResult.lastInsertRowid, firstName, lastName || '',
       dateOfBirth || null, gender || null, bloodGroup || null, address || null, 
       emergencyContact || null, admissionDate || new Date().toISOString().split('T')[0]);

    // Enrollment
    const nextRoll = db.prepare(`
      SELECT COALESCE(MAX(roll_number), 0) + 1 as next_roll 
      FROM student_enrollments 
      WHERE class_id = ? AND section_id = ? AND academic_year_id = ?
    `).get(classId, sectionId, academicYearId);

    db.prepare(`
      INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_number, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `).run(studentResult.lastInsertRowid, classId, sectionId, academicYearId, rollNumber || nextRoll.next_roll);

    // Create parent record
    if (fatherName || motherName) {
      const parentRole = db.prepare("SELECT id FROM roles WHERE name = 'parent'").get();
      const parentUsername = `parent_${studentId.toLowerCase()}`;
      const parentHash = bcrypt.hashSync('parent123', 10);
      const parentUserResult = db.prepare(`
        INSERT INTO users (username, password_hash, role_id, first_name, last_name, email, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(parentUsername, parentHash, parentRole.id, fatherName || motherName || 'Parent', '', parentEmail || null);

      const parentResult = db.prepare(`
        INSERT INTO parents (user_id, father_name, mother_name, father_phone, mother_phone, email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(parentUserResult.lastInsertRowid, fatherName || null, motherName || null, 
             fatherPhone || null, motherPhone || null, parentEmail || null);

      db.prepare(`
        INSERT INTO student_parents (student_id, parent_id, is_primary)
        VALUES (?, ?, 1)
      `).run(studentResult.lastInsertRowid, parentResult.lastInsertRowid);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Student added successfully',
      studentId,
      admissionNumber,
      loginCredentials: { username, password: 'student123' }
    });
  } catch (err) {
    console.error('Add student error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: 'Student already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/students/:id - edit student
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const {
      firstName, lastName, dateOfBirth, gender, bloodGroup, address, emergencyContact,
      fatherName, motherName, fatherPhone, motherPhone, parentEmail
    } = req.body;

    db.prepare(`
      UPDATE students SET first_name=?, last_name=?, date_of_birth=?, gender=?, 
        blood_group=?, address=?, emergency_contact=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(firstName, lastName || '', dateOfBirth, gender, bloodGroup, address, emergencyContact, req.params.id);

    // Update parent if exists
    const sp = db.prepare('SELECT parent_id FROM student_parents WHERE student_id = ? AND is_primary = 1').get(req.params.id);
    if (sp) {
      db.prepare(`
        UPDATE parents SET father_name=?, mother_name=?, father_phone=?, mother_phone=?, email=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(fatherName, motherName, fatherPhone, motherPhone, parentEmail, sp.parent_id);
    }

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/students/:id - deactivate student
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE students SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students/promote - promote students to next class
router.post('/promote', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { classId, sectionId, newClassId, newSectionId, newAcademicYearId } = req.body;

    const currentYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
    if (!currentYear) return res.status(400).json({ success: false, message: 'No current academic year set' });

    const students = db.prepare(`
      SELECT student_id FROM student_enrollments 
      WHERE class_id = ? AND section_id = ? AND academic_year_id = ? AND status = 'Active'
    `).all(classId, sectionId, currentYear.id);

    const promoteStmt = db.prepare(`
      INSERT OR IGNORE INTO student_enrollments (student_id, class_id, section_id, academic_year_id, status)
      VALUES (?, ?, ?, ?, 'Active')
    `);
    const updateOldStmt = db.prepare(`
      UPDATE student_enrollments SET status = 'Promoted' WHERE student_id = ? AND academic_year_id = ?
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      students.forEach(({ student_id }) => {
        updateOldStmt.run(student_id, currentYear.id);
        promoteStmt.run(student_id, newClassId, newSectionId, newAcademicYearId);
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: `${students.length} students promoted successfully` });
  } catch (err) {
    console.error('Promote error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students/import-csv - bulk student import
router.post('/import-csv', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { students: importList } = req.body;

    if (!Array.isArray(importList) || importList.length === 0) {
      return res.status(400).json({ success: false, message: 'No student records provided for import' });
    }

    const studentRole = db.prepare("SELECT id FROM roles WHERE name = 'student'").get();
    const parentRole = db.prepare("SELECT id FROM roles WHERE name = 'parent'").get();
    const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get() || { id: 1 };
    const defaultHash = bcrypt.hashSync('student123', 10);

    let importedCount = 0;

    db.exec('BEGIN TRANSACTION');
    try {
      importList.forEach((st, idx) => {
        if (!st.firstName || !st.classId) return;

        const countRow = db.prepare('SELECT COUNT(*) as count FROM students').get();
        const stdId = `STU${String(countRow.count + 1).padStart(4, '0')}`;
        const admNum = `ADM${String(countRow.count + 1).padStart(4, '0')}`;
        const username = stdId.toLowerCase();

        // User
        const userRes = db.prepare(`
          INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).run(username, st.email || `${username}@school.edu`, st.phone || null, defaultHash, studentRole.id, st.firstName, st.lastName || '');

        // Student
        const sRes = db.prepare(`
          INSERT INTO students (student_id, admission_number, user_id, first_name, last_name, gender, date_of_birth, blood_group, admission_date, emergency_contact, address, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          stdId,
          admNum,
          userRes.lastInsertRowid,
          st.firstName,
          st.lastName || '',
          st.gender || 'Male',
          st.dateOfBirth || null,
          st.bloodGroup || 'O+',
          st.admissionDate || new Date().toISOString().split('T')[0],
          st.emergencyContact || st.phone || null,
          st.address || null
        );

        // Parent
        if (st.fatherName || st.motherName || st.phone) {
          const pRes = db.prepare(`
            INSERT INTO parents (father_name, mother_name, father_phone, mother_phone, email)
            VALUES (?, ?, ?, ?, ?)
          `).run(st.fatherName || null, st.motherName || null, st.phone || null, st.phone || null, st.parentEmail || null);

          db.prepare(`
            INSERT INTO student_parents (student_id, parent_id, is_primary)
            VALUES (?, ?, 1)
          `).run(sRes.lastInsertRowid, pRes.lastInsertRowid);
        }

        // Enrollment
        const sectionId = st.sectionId || db.prepare('SELECT id FROM sections WHERE class_id = ? ORDER BY name LIMIT 1').get(st.classId)?.id;
        const yearId = st.academicYearId || curYear.id;

        if (st.classId && sectionId) {
          db.prepare(`
            INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_number, enrollment_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Active')
          `).run(sRes.lastInsertRowid, st.classId, sectionId, yearId, st.rollNumber || (idx + 1), st.admissionDate || new Date().toISOString().split('T')[0]);
        }

        importedCount++;
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: `Successfully imported ${importedCount} students!`, count: importedCount });
  } catch (err) {
    console.error('Import CSV error:', err);
    res.status(500).json({ success: false, message: 'Server error during import' });
  }
});

module.exports = router;

