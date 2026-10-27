const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/notifications - get user notifications
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT n.*, un.is_read, un.read_at,
             u.first_name || ' ' || COALESCE(u.last_name,'') as created_by_name
      FROM notifications n
      LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.is_active = 1 AND (
        n.target_role IS NULL OR n.target_role = ? OR
        EXISTS (SELECT 1 FROM users WHERE id = ? AND role_id = (SELECT id FROM roles WHERE name = n.target_role))
      )
      ORDER BY n.created_at DESC LIMIT 50
    `).all(req.user.id, req.user.role, req.user.id);

    const unreadCount = notifications.filter(n => !n.is_read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notifications - create notification (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { title, message, category, targetRole, targetClassId, targetSectionId } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' });

    const result = db.prepare(`
      INSERT INTO notifications (title, message, category, created_by, target_role, target_class_id, target_section_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, message, category || 'General', req.user.id, targetRole || null, targetClassId || null, targetSectionId || null);

    // Create user_notifications for targeted users
    let userQuery = 'SELECT id FROM users WHERE is_active = 1';
    const params = [];
    if (targetRole) { userQuery += ' AND role_id = (SELECT id FROM roles WHERE name = ?)'; params.push(targetRole); }

    const users = db.prepare(userQuery).all(...params);
    const insertNotif = db.prepare('INSERT OR IGNORE INTO user_notifications (notification_id, user_id) VALUES (?, ?)');
    users.forEach(u => insertNotif.run(result.lastInsertRowid, u.id));

    res.json({ success: true, message: 'Notification sent', count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO user_notifications (notification_id, user_id, is_read, read_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    `).run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authenticate, (req, res) => {
  try {
    const db = getDb();
    const notifs = db.prepare('SELECT id FROM notifications WHERE is_active = 1').all();
    const upsert = db.prepare('INSERT OR REPLACE INTO user_notifications (notification_id, user_id, is_read, read_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)');
    notifs.forEach(n => upsert.run(n.id, req.user.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
