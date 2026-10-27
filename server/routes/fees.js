const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/fees/categories
router.get('/categories', authenticate, (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM fee_categories WHERE is_active = 1').all();
  res.json({ success: true, categories: cats });
});

// GET /api/fees/structures?academic_year_id=&class_id=
router.get('/structures', authenticate, (req, res) => {
  const db = getDb();
  const { academic_year_id, class_id } = req.query;
  let query = `
    SELECT fs.*, fc.name as category_name, c.name as class_name, ay.name as academic_year
    FROM fee_structures fs
    JOIN fee_categories fc ON fs.fee_category_id = fc.id
    JOIN classes c ON fs.class_id = c.id
    JOIN academic_years ay ON fs.academic_year_id = ay.id
    WHERE fs.is_active = 1
  `;
  const params = [];
  if (academic_year_id) { query += ' AND fs.academic_year_id = ?'; params.push(academic_year_id); }
  if (class_id) { query += ' AND fs.class_id = ?'; params.push(class_id); }
  const structures = db.prepare(query).all(...params);
  res.json({ success: true, structures });
});

// POST /api/fees/structures
router.post('/structures', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const db = getDb();
    const { academicYearId, classId, feeCategoryId, amount, dueDate, frequency } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO fee_structures (academic_year_id, class_id, fee_category_id, amount, due_date, frequency)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(academicYearId, classId, feeCategoryId, amount, dueDate || null, frequency || 'Annually');
    res.json({ success: true, message: 'Fee structure saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/student/:studentId - get student fee records
router.get('/student/:studentId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const fees = db.prepare(`
      SELECT sf.*, fc.name as category_name, fs.frequency, fs.due_date as structure_due_date,
             c.name as class_name, ay.name as academic_year
      FROM student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      JOIN fee_categories fc ON fs.fee_category_id = fc.id
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON sf.academic_year_id = ay.id
      WHERE sf.student_id = ?
      ORDER BY sf.created_at DESC
    `).all(req.params.studentId);

    const payments = db.prepare(`
      SELECT fp.*, fc.name as category_name
      FROM fee_payments fp
      JOIN student_fees sf ON fp.student_fee_id = sf.id
      JOIN fee_structures fstr ON sf.fee_structure_id = fstr.id
      JOIN fee_categories fc ON fstr.fee_category_id = fc.id
      WHERE fp.student_id = ?
      ORDER BY fp.payment_date DESC
    `).all(req.params.studentId);

    const summary = {
      totalFees: fees.reduce((s, f) => s + f.net_amount, 0),
      paidAmount: fees.reduce((s, f) => s + f.paid_amount, 0),
      pendingAmount: fees.reduce((s, f) => s + (f.net_amount - f.paid_amount), 0)
    };

    res.json({ success: true, fees, payments, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/assign - assign fees to student
router.post('/assign', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const db = getDb();
    const { studentId, feeStructureIds, academicYearId } = req.body;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO student_fees (student_id, fee_structure_id, academic_year_id, total_amount, net_amount, status)
      SELECT ?, fs.id, ?, fs.amount, fs.amount, 'Pending'
      FROM fee_structures fs WHERE fs.id = ?
    `);

    feeStructureIds.forEach(fsId => insert.run(studentId, academicYearId, fsId));
    res.json({ success: true, message: 'Fees assigned to student' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/my-fees - personal fee statement for student / parent
router.get('/my-fees', authenticate, (req, res) => {
  try {
    const db = getDb();
    let studentId = req.query.student_id;
    if (!studentId) {
      if (req.user.role === 'student') {
        const st = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
        studentId = st?.id;
      } else if (req.user.role === 'parent') {
        const parent = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(req.user.id);
        if (parent) {
          const sp = db.prepare('SELECT student_id FROM student_parents WHERE parent_id = ? LIMIT 1').get(parent.id);
          studentId = sp?.student_id;
        }
      }
    }
    if (!studentId && req.user.role === 'admin') {
      const firstSt = db.prepare('SELECT id FROM students WHERE is_active = 1 LIMIT 1').get();
      studentId = firstSt?.id;
    }
    if (!studentId) return res.status(404).json({ success: false, message: 'Student not found' });

    const fees = db.prepare(`
      SELECT sf.*, fc.name as category_name, fs.frequency, fs.due_date as structure_due_date
      FROM student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      JOIN fee_categories fc ON fs.fee_category_id = fc.id
      WHERE sf.student_id = ?
    `).all(studentId);

    const payments = db.prepare(`
      SELECT fp.*, fc.name as category_name, s.first_name, s.last_name, s.student_id as std_id
      FROM fee_payments fp
      JOIN student_fees sf ON fp.student_fee_id = sf.id
      JOIN fee_structures fstr ON sf.fee_structure_id = fstr.id
      JOIN fee_categories fc ON fstr.fee_category_id = fc.id
      JOIN students s ON fp.student_id = s.id
      WHERE fp.student_id = ?
      ORDER BY fp.payment_date DESC
    `).all(studentId);

    const student = db.prepare(`
      SELECT s.*, c.name as class_name, sec.name as section_name, se.roll_number
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.id = ?
    `).get(studentId);

    const summary = {
      total: fees.reduce((s, f) => s + f.net_amount, 0),
      paid: fees.reduce((s, f) => s + f.paid_amount, 0),
      pending: fees.reduce((s, f) => s + (f.net_amount - f.paid_amount), 0),
    };

    res.json({ success: true, student, summary, fees, payments });
  } catch (err) {
    console.error('My-fees error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/payment - record fee payment (by accountant/admin OR online student/parent)
router.post('/payment', authenticate, authorize('admin', 'accountant', 'student', 'parent'), (req, res) => {
  try {
    const db = getDb();
    const { studentFeeId, studentId, amount, paymentMode, transactionReference, remarks } = req.body;

    if (!studentFeeId || !studentId || !amount) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Role check for students and parents
    if (req.user.role === 'student') {
      const st = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
      if (!st || Number(st.id) !== Number(studentId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized fee payment' });
      }
    } else if (req.user.role === 'parent') {
      const parent = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(req.user.id);
      const isChild = parent && db.prepare('SELECT 1 FROM student_parents WHERE parent_id = ? AND student_id = ?').get(parent.id, studentId);
      if (!isChild) {
        return res.status(403).json({ success: false, message: 'Unauthorized fee payment for this student' });
      }
    }

    const studentFee = db.prepare('SELECT * FROM student_fees WHERE id = ?').get(studentFeeId);
    if (!studentFee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const remaining = studentFee.net_amount - studentFee.paid_amount;
    if (amount > remaining + 0.01) {
      return res.status(400).json({ success: false, message: `Payment exceeds remaining amount of ₹${remaining.toFixed(2)}` });
    }

    const receiptNumber = `RCPT${Date.now().toString().slice(-10)}`;
    
    db.prepare(`
      INSERT INTO fee_payments (student_fee_id, student_id, receipt_number, amount, payment_mode, 
        transaction_reference, collected_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(studentFeeId, studentId, receiptNumber, amount, paymentMode || 'Cash', transactionReference || null, req.user.id, remarks || null);

    // Update student_fees
    const newPaid = studentFee.paid_amount + parseFloat(amount);
    const newStatus = newPaid >= studentFee.net_amount ? 'Paid' : 'Partial';
    db.prepare(`
      UPDATE student_fees SET paid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newPaid, newStatus, studentFeeId);

    res.json({ success: true, message: 'Payment recorded', receiptNumber });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/report/collection?date=&month=&year=
router.get('/report/collection', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const db = getDb();
    const { date, month, year, class_id } = req.query;

    let query = `
      SELECT fp.receipt_number, fp.amount, fp.payment_date, fp.payment_mode,
             s.first_name || ' ' || COALESCE(s.last_name,'') as student_name,
             s.student_id as std_id, c.name as class_name, fc.name as category
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      JOIN student_fees sf ON fp.student_fee_id = sf.id
      JOIN fee_structures fstr ON sf.fee_structure_id = fstr.id
      JOIN fee_categories fc ON fstr.fee_category_id = fc.id
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (date) { query += ' AND fp.payment_date = ?'; params.push(date); }
    if (month && year) {
      query += " AND strftime('%m', fp.payment_date) = ? AND strftime('%Y', fp.payment_date) = ?";
      params.push(String(month).padStart(2, '0'), year);
    }
    if (class_id) { query += ' AND se.class_id = ?'; params.push(class_id); }
    query += ' ORDER BY fp.payment_date DESC';

    const payments = db.prepare(query).all(...params);
    const total = payments.reduce((s, p) => s + p.amount, 0);
    res.json({ success: true, payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/report/pending
router.get('/report/pending', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const db = getDb();
    const { academic_year_id, class_id } = req.query;
    let query = `
      SELECT s.student_id as std_id, s.first_name || ' ' || COALESCE(s.last_name,'') as student_name,
             c.name as class_name, sec.name as section_name,
             sf.net_amount, sf.paid_amount, (sf.net_amount - sf.paid_amount) as pending_amount,
             sf.status, sf.due_date, fc.name as fee_category
      FROM student_fees sf
      JOIN students s ON sf.student_id = s.id
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      JOIN fee_categories fc ON fs.fee_category_id = fc.id
      JOIN student_enrollments se ON s.id = se.student_id AND se.academic_year_id = sf.academic_year_id
      JOIN classes c ON se.class_id = c.id
      JOIN sections sec ON se.section_id = sec.id
      WHERE sf.status IN ('Pending', 'Partial', 'Overdue')
    `;
    const params = [];
    if (academic_year_id) { query += ' AND sf.academic_year_id = ?'; params.push(academic_year_id); }
    if (class_id) { query += ' AND se.class_id = ?'; params.push(class_id); }
    query += ' ORDER BY pending_amount DESC';

    const pending = db.prepare(query).all(...params);
    const totalPending = pending.reduce((s, p) => s + p.pending_amount, 0);
    res.json({ success: true, pending, totalPending });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
