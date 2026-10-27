const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const currentYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
    const yearId = currentYear?.id;

    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students WHERE is_active = 1').get();
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM staff WHERE is_active = 1 AND staff_type = 'Teaching'").get();
    const totalStaff = db.prepare('SELECT COUNT(*) as count FROM staff WHERE is_active = 1').get();
    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes WHERE is_active = 1').get();

    // Today's student attendance
    let studentAttendance = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
    if (yearId) {
      const att = db.prepare(`
        SELECT 
          SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN status='Half Day' THEN 1 ELSE 0 END) as halfDay,
          COUNT(*) as total
        FROM student_attendance WHERE attendance_date = ? AND academic_year_id = ?
      `).get(today, yearId);
      studentAttendance = att;
    }

    // Staff attendance today
    const staffAtt = db.prepare(`
      SELECT 
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
        COUNT(*) as total
      FROM staff_attendance WHERE attendance_date = ?
    `).get(today);

    // Fee stats
    const feeStats = db.prepare(`
      SELECT 
        SUM(paid_amount) as totalCollected,
        SUM(net_amount - paid_amount) as pendingAmount
      FROM student_fees
    `).get();

    // Recent admissions (last 5)
    const recentAdmissions = db.prepare(`
      SELECT s.student_id, s.first_name, s.last_name, s.admission_date,
             c.name as class_name, sec.name as section_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      JOIN sections sec ON se.section_id = sec.id
      WHERE se.academic_year_id = ?
      ORDER BY s.created_at DESC LIMIT 5
    `).all(yearId || 1);

    // Recent fee payments (last 5)
    const recentPayments = db.prepare(`
      SELECT fp.receipt_number, fp.amount, fp.payment_date, fp.payment_mode,
             s.first_name || ' ' || COALESCE(s.last_name,'') as student_name
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      ORDER BY fp.created_at DESC LIMIT 5
    `).all();

    // Class-wise student count
    const classWise = db.prepare(`
      SELECT c.name as class_name, c.numeric_value, COUNT(se.id) as student_count
      FROM classes c
      LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.academic_year_id = ? AND se.status = 'Active'
      WHERE c.is_active = 1
      GROUP BY c.id ORDER BY c.numeric_value
    `).all(yearId || 0);

    // Role specific metrics
    let teacherData = null;
    let accountantData = null;
    let staffData = null;

    if (req.user.role === 'teacher') {
      const staffRecord = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(req.user.id);
      if (staffRecord) {
        const teacherId = staffRecord.id;
        const assignedClasses = db.prepare(`
          SELECT DISTINCT c.id as class_id, c.name as class_name, sec.id as section_id, sec.name as section_name, s.name as subject_name
          FROM teacher_assignments ta
          JOIN classes c ON ta.class_id = c.id
          JOIN sections sec ON ta.section_id = sec.id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE ta.staff_id = ?
        `).all(teacherId);

        const mentorClasses = db.prepare(`
          SELECT c.id as class_id, c.name as class_name, sec.id as section_id, sec.name as section_name
          FROM sections sec
          JOIN classes c ON sec.class_id = c.id
          WHERE sec.class_teacher_id = ?
        `).all(teacherId);

        const pendingGrading = db.prepare(`
          SELECT COUNT(*) as count
          FROM assignment_submissions sub
          JOIN assignments a ON sub.assignment_id = a.id
          WHERE a.assigned_by = ? AND sub.marks_obtained IS NULL
        `).get(teacherId)?.count || 0;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = dayNames[new Date().getDay()] === 'Sunday' ? 'Monday' : dayNames[new Date().getDay()];

        const todayLectures = db.prepare(`
          SELECT t.id, t.period_number, t.start_time, t.end_time, t.room,
                 c.name as class_name, sec.name as section_name, s.name as subject_name
          FROM timetables t
          JOIN classes c ON t.class_id = c.id
          JOIN sections sec ON t.section_id = sec.id
          JOIN subjects s ON t.subject_id = s.id
          WHERE t.staff_id = ? AND t.day_of_week = ?
          ORDER BY t.start_time
        `).all(teacherId, currentDay);

        teacherData = {
          designation: staffRecord.designation,
          assignedClasses,
          mentorClasses,
          pendingGrading,
          todayLectures,
          activeAssignments: db.prepare('SELECT COUNT(*) as count FROM assignments WHERE assigned_by = ? AND is_active = 1').get(teacherId)?.count || 0
        };
      }
    } else if (req.user.role === 'accountant') {
      const todayCollection = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as amount
        FROM fee_payments
        WHERE payment_date = ?
      `).get(today)?.amount || 0;

      const defaultersCount = db.prepare(`
        SELECT COUNT(DISTINCT student_id) as count
        FROM student_fees
        WHERE (net_amount - paid_amount) > 0
      `).get()?.count || 0;

      accountantData = {
        todayCollection,
        defaultersCount,
        totalCollected: feeStats.totalCollected || 0,
        pendingAmount: feeStats.pendingAmount || 0,
        recentPayments: db.prepare(`
          SELECT fp.receipt_number, fp.amount, fp.payment_date, fp.payment_mode,
                 s.first_name || ' ' || COALESCE(s.last_name,'') as student_name,
                 c.name as class_name, sec.name as section_name
          FROM fee_payments fp
          JOIN students s ON fp.student_id = s.id
          LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'Active'
          LEFT JOIN classes c ON se.class_id = c.id
          LEFT JOIN sections sec ON se.section_id = sec.id
          ORDER BY fp.created_at DESC LIMIT 10
        `).all()
      };
    } else if (req.user.role === 'staff') {
      const staffRecord = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(req.user.id);
      let staffLeaveStats = { pending: 0, approved: 0 };
      if (staffRecord) {
        const leaves = db.prepare(`
          SELECT status, COUNT(*) as count
          FROM leave_applications
          WHERE staff_id = ?
          GROUP BY status
        `).all(staffRecord.id);
        leaves.forEach(l => {
          if (l.status === 'Pending') staffLeaveStats.pending = l.count;
          if (l.status === 'Approved') staffLeaveStats.approved = l.count;
        });
      }
      staffData = {
        designation: staffRecord?.designation,
        department: staffRecord ? db.prepare('SELECT name FROM departments WHERE id = ?').get(staffRecord.department_id)?.name : 'Administration',
        leaveStats: staffLeaveStats
      };
    }

    res.json({
      success: true,
      stats: {
        totalStudents: totalStudents.count,
        totalTeachers: totalTeachers.count,
        totalStaff: totalStaff.count,
        totalClasses: totalClasses.count,
        studentAttendance,
        staffAttendance: staffAtt,
        totalFeeCollected: feeStats.totalCollected || 0,
        pendingFees: feeStats.pendingAmount || 0,
        recentAdmissions,
        recentPayments,
        classWiseStrength: classWise,
        teacherData,
        accountantData,
        staffData
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
