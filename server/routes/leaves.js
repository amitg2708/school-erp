const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/leaves/types
router.get('/types', authenticate, (req, res) => {
  const db = getDb();
  const types = db.prepare('SELECT * FROM leave_types WHERE is_active = 1').all();
  res.json({ success: true, types });
});

// GET /api/leaves
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT la.*, lt.name as leave_type_name,
             s.first_name || ' ' || COALESCE(s.last_name,'') as staff_name,
             s.staff_id, s.designation, d.name as department_name,
             u.first_name || ' ' || COALESCE(u.last_name,'') as approver_name
      FROM leave_applications la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN staff s ON la.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN users u ON la.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // If teacher/staff, only show their own leaves
    if (req.user.role !== 'admin') {
      query += ' AND s.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY la.created_at DESC';

    const leaves = db.prepare(query).all(...params);
    res.json({ success: true, leaves });
  } catch (err) {
    console.error('Leaves list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/leaves - apply for leave
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { leaveTypeId, fromDate, toDate, totalDays, reason } = req.body;

    if (!leaveTypeId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'Leave type, from date, and to date are required' });
    }

    const staff = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(req.user.id);
    if (!staff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Staff profile not associated with this account' });
    }

    const staffId = staff?.id || (req.body.staffId || 1);

    const result = db.prepare(`
      INSERT INTO leave_applications (staff_id, leave_type_id, from_date, to_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `).run(staffId, leaveTypeId, fromDate, toDate, totalDays || 1, reason || null);

    res.json({ success: true, message: 'Leave application submitted successfully', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Apply leave error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/leaves/:id/status - approve or reject leave
router.put('/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    db.prepare(`
      UPDATE leave_applications
      SET status = ?, remarks = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, remarks || null, req.user.id, req.params.id);

    res.json({ success: true, message: `Leave application marked as ${status}` });
  } catch (err) {
    console.error('Update leave status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
