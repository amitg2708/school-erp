import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, UserCheck, GraduationCap, School, ClipboardList,
  DollarSign, AlertCircle, UserPlus, BookOpen, Calendar,
  BarChart3, FileText, Bell, User, Clock, CheckCircle2, ArrowRight
} from 'lucide-react';
import StudentPortalDashboard from '../components/StudentPortalDashboard';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';

function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const quickActions = {
    admin: [
      { label: 'Add Student', icon: UserPlus, color: '#1a56db', bg: '#dbeafe', path: '/students' },
      { label: 'Mark Attendance', icon: ClipboardList, color: '#059669', bg: '#dcfce7', path: '/attendance/students' },
      { label: 'Add Staff', icon: UserCheck, color: '#7c3aed', bg: '#f3e8ff', path: '/staff' },
      { label: 'Add Exam', icon: GraduationCap, color: '#d97706', bg: '#fef3c7', path: '/examinations' },
      { label: 'Collect Fee', icon: DollarSign, color: '#dc2626', bg: '#fee2e2', path: '/fees' },
      { label: 'Timetable', icon: Calendar, color: '#0891b2', bg: '#e0f2fe', path: '/timetable' },
    ],
    teacher: [
      { label: 'Mark Attendance', icon: ClipboardList, color: '#059669', bg: '#dcfce7', path: '/attendance/students' },
      { label: 'Students Roster', icon: Users, color: '#1a56db', bg: '#dbeafe', path: '/students' },
      { label: 'Homework & Grading', icon: BookOpen, color: '#7c3aed', bg: '#f3e8ff', path: '/assignments' },
      { label: 'Marks Entry', icon: GraduationCap, color: '#d97706', bg: '#fef3c7', path: '/examinations' },
      { label: 'Weekly Timetable', icon: Calendar, color: '#0891b2', bg: '#e0f2fe', path: '/timetable' },
      { label: 'Study Materials', icon: FileText, color: '#059669', bg: '#dcfce7', path: '/materials' },
    ],
    accountant: [
      { label: 'Collect Student Fee', icon: DollarSign, color: '#dc2626', bg: '#fee2e2', path: '/fees' },
      { label: 'Financial Reports', icon: BarChart3, color: '#1a56db', bg: '#dbeafe', path: '/reports' },
      { label: 'Notice Board', icon: Bell, color: '#7c3aed', bg: '#f3e8ff', path: '/notifications' },
      { label: 'Bursar Profile', icon: User, color: '#059669', bg: '#dcfce7', path: '/profile' },
    ],
    staff: [
      { label: 'Leave Requests', icon: FileText, color: '#d97706', bg: '#fef3c7', path: '/leaves' },
      { label: 'School Notices', icon: Bell, color: '#7c3aed', bg: '#f3e8ff', path: '/notifications' },
      { label: 'Staff Profile', icon: User, color: '#1a56db', bg: '#dbeafe', path: '/profile' },
    ],
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <div className="skeleton" style={{ height: '28px', width: '250px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '18px', width: '320px' }} />
        </div>
        <div className="stat-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      </div>
    );
  }

  const designation = user?.profileInfo?.designation || (
    user?.role === 'admin' ? 'Principal & School Director' :
    user?.role === 'teacher' ? 'Faculty Member' :
    user?.role === 'accountant' ? 'Chief School Accountant & Bursar' :
    user?.role === 'staff' ? 'Senior Staff Member' : 'Authorized User'
  );

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gray-900)' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.firstName}! 👋
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '2px' }}>{today}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-50)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '700', marginTop: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          {designation}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 1. TEACHER DASHBOARD */}
      {/* ================================================================ */}
      {user?.role === 'teacher' && (
        <>
          {/* Teacher Stat Grid */}
          <div className="stat-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <School size={20} color="#1a56db" />
              </div>
              <div className="stat-value">{stats?.teacherData?.assignedClasses?.length || 0}</div>
              <div className="stat-label">Teaching Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <Calendar size={20} color="#059669" />
              </div>
              <div className="stat-value">{stats?.teacherData?.todayLectures?.length || 0}</div>
              <div className="stat-label">Today's Lectures</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: stats?.teacherData?.pendingGrading > 0 ? '#fee2e2' : '#fef3c7' }}>
                <Clock size={20} color={stats?.teacherData?.pendingGrading > 0 ? '#dc2626' : '#d97706'} />
              </div>
              <div className="stat-value">{stats?.teacherData?.pendingGrading || 0}</div>
              <div className="stat-label">Pending Grading</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f3e8ff' }}>
                <BookOpen size={20} color="#7c3aed" />
              </div>
              <div className="stat-value">{stats?.teacherData?.activeAssignments || 0}</div>
              <div className="stat-label">Active Homework</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 className="card-title" style={{ marginBottom: '14px' }}>Teacher Quick Actions</h3>
            <div className="quick-actions">
              {(quickActions.teacher || []).map(({ label, icon: Icon, color, bg, path }) => (
                <button key={label} className="quick-action-btn" onClick={() => navigate(path)}>
                  <div className="qa-icon" style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ color: 'var(--gray-700)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Teaching Schedule */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3 className="card-title">Today's Teaching Schedule</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/timetable')}>
                Full Timetable
              </button>
            </div>
            {(!stats?.teacherData?.todayLectures || stats.teacherData.todayLectures.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)' }}>
                <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No lectures scheduled for today or it is a holiday/weekend.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.teacherData.todayLectures.map(lec => (
                  <div key={lec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                        Period {lec.period_number}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                          {lec.subject_name} ({lec.class_name} - {lec.section_name})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {lec.start_time} - {lec.end_time} {lec.room_number ? `· Room ${lec.room_number}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate('/attendance/students')}
                      title="Mark Attendance for this class"
                    >
                      Attendance
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Classes Roster */}
          {stats?.teacherData?.assignedClasses && stats.teacherData.assignedClasses.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">My Assigned Classes & Subjects</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/students')}>
                  Students Roster
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {stats.teacherData.assignedClasses.map((ac, idx) => (
                  <div key={idx} style={{ padding: '12px', border: '1px solid var(--gray-200)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                        {ac.class_name} · Section {ac.section_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {ac.subject_name}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate('/attendance/students')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Attendance
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* 2. ACCOUNTANT / BURSAR DASHBOARD */}
      {/* ================================================================ */}
      {user?.role === 'accountant' && (
        <>
          <div className="stat-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <DollarSign size={20} color="#059669" />
              </div>
              <div className="stat-value">₹{((stats?.accountantData?.totalCollected || 0) / 1000).toFixed(0)}K</div>
              <div className="stat-label">Total Fee Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2' }}>
                <AlertCircle size={20} color="#dc2626" />
              </div>
              <div className="stat-value">₹{((stats?.accountantData?.pendingAmount || 0) / 1000).toFixed(0)}K</div>
              <div className="stat-label">Total Dues Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <Users size={20} color="#d97706" />
              </div>
              <div className="stat-value">{stats?.accountantData?.defaultersCount || 0}</div>
              <div className="stat-label">Fee Defaulters</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <CheckCircle2 size={20} color="#1a56db" />
              </div>
              <div className="stat-value">₹{(stats?.accountantData?.todayCollection || 0).toLocaleString('en-IN')}</div>
              <div className="stat-label">Collected Today</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 className="card-title" style={{ marginBottom: '14px' }}>Bursar Quick Actions</h3>
            <div className="quick-actions">
              {(quickActions.accountant || []).map(({ label, icon: Icon, color, bg, path }) => (
                <button key={label} className="quick-action-btn" onClick={() => navigate(path)}>
                  <div className="qa-icon" style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ color: 'var(--gray-700)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Payments & Receipts */}
          {stats?.accountantData?.recentPayments && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Recent Fee Receipts & Transactions</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/fees')}>
                  Manage Fees
                </button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Date</th>
                      <th>Mode</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.accountantData.recentPayments.map((p, idx) => (
                      <tr key={idx}>
                        <td><strong>{p.receipt_number}</strong></td>
                        <td>{p.student_name}</td>
                        <td>{p.class_name ? `${p.class_name} - ${p.section_name}` : '—'}</td>
                        <td>{p.payment_date}</td>
                        <td><span className="badge badge-secondary">{p.payment_mode}</span></td>
                        <td><strong style={{ color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* 3. STAFF / LIBRARIAN DASHBOARD */}
      {/* ================================================================ */}
      {user?.role === 'staff' && (
        <>
          <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, var(--primary), #2563eb)', color: '#ffffff' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              Staff Portal: {designation}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
              Department: {stats?.staffData?.department || 'Library & Learning Resources'} · Employee ID: {user?.profileInfo?.staff_id || 'LIB001'}
            </p>
          </div>

          {/* Staff Quick Actions */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 className="card-title" style={{ marginBottom: '14px' }}>Staff Actions</h3>
            <div className="quick-actions">
              {(quickActions.staff || []).map(({ label, icon: Icon, color, bg, path }) => (
                <button key={label} className="quick-action-btn" onClick={() => navigate(path)}>
                  <div className="qa-icon" style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ color: 'var(--gray-700)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Leave Status */}
          <div className="stat-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <CheckCircle2 size={20} color="#059669" />
              </div>
              <div className="stat-value">{stats?.staffData?.leaveStats?.approved || 0}</div>
              <div className="stat-label">Approved Leaves</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <Clock size={20} color="#d97706" />
              </div>
              <div className="stat-value">{stats?.staffData?.leaveStats?.pending || 0}</div>
              <div className="stat-label">Pending Requests</div>
            </div>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* 4. ADMIN / PRINCIPAL DASHBOARD */}
      {/* ================================================================ */}
      {user?.role === 'admin' && (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#dbeafe' }}>
                  <Users size={20} color="#1a56db" />
                </div>
                <div className="stat-value">{stats.totalStudents || 0}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#dcfce7' }}>
                  <UserCheck size={20} color="#059669" />
                </div>
                <div className="stat-value">{stats.totalTeachers || 0}</div>
                <div className="stat-label">Teachers</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7' }}>
                  <School size={20} color="#d97706" />
                </div>
                <div className="stat-value">{stats.totalClasses || 0}</div>
                <div className="stat-label">Classes (1 to 12)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f3e8ff' }}>
                  <DollarSign size={20} color="#7c3aed" />
                </div>
                <div className="stat-value">₹{((stats.totalFeeCollected || 0) / 1000).toFixed(0)}K</div>
                <div className="stat-label">Fee Collected</div>
              </div>
            </div>
          )}

          {/* Today's Attendance (Admin) */}
          {stats && stats.studentAttendance && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Today's Student Attendance</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/attendance/students')}>
                  Mark Attendance
                </button>
              </div>
              <div className="att-summary">
                <div className="att-summary-item">
                  <span className="att-count" style={{ color: 'var(--gray-800)' }}>{stats.studentAttendance.total || 0}</span>
                  <span className="att-label" style={{ color: 'var(--gray-500)' }}>Total</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-count" style={{ color: 'var(--present)' }}>{stats.studentAttendance.present || 0}</span>
                  <span className="att-label" style={{ color: 'var(--present)' }}>Present</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-count" style={{ color: 'var(--absent)' }}>{stats.studentAttendance.absent || 0}</span>
                  <span className="att-label" style={{ color: 'var(--absent)' }}>Absent</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-count" style={{ color: 'var(--late)' }}>{stats.studentAttendance.late || 0}</span>
                  <span className="att-label" style={{ color: 'var(--late)' }}>Late</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-count" style={{ color: 'var(--halfday)' }}>{stats.studentAttendance.halfDay || 0}</span>
                  <span className="att-label" style={{ color: 'var(--halfday)' }}>Half Day</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {(quickActions.admin || []).length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: '14px' }}>Administrative Quick Actions</h3>
              <div className="quick-actions">
                {(quickActions.admin || []).map(({ label, icon: Icon, color, bg, path }) => (
                  <button key={label} className="quick-action-btn" onClick={() => navigate(path)}>
                    <div className="qa-icon" style={{ background: bg }}>
                      <Icon size={20} color={color} />
                    </div>
                    <span style={{ color: 'var(--gray-700)' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Class-wise Strength Chart */}
          {stats && stats.classWiseStrength && stats.classWiseStrength.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Class-wise Student Strength</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.classWiseStrength} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <XAxis dataKey="class_name" tick={{ fontSize: 11 }} tickFormatter={v => v.replace('Class ', 'C')} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [value, 'Students']}
                      labelFormatter={label => label}
                      contentStyle={{ fontSize: '13px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="student_count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Admissions */}
          {stats && stats.recentAdmissions && stats.recentAdmissions.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Recent Admissions</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/students')}>View All</button>
              </div>
              <div>
                {stats.recentAdmissions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < stats.recentAdmissions.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div className="student-info">
                      <div className="student-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <div>
                        <div className="student-name">{s.first_name} {s.last_name}</div>
                        <div className="student-id">{s.student_id} · {s.class_name} {s.section_name}</div>
                      </div>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {s.admission_date ? new Date(s.admission_date).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {stats && stats.recentPayments && stats.recentPayments.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Recent Fee Payments</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/fees')}>View All</button>
              </div>
              <div>
                {stats.recentPayments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < stats.recentPayments.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--gray-800)' }}>{p.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {p.payment_date} · {p.payment_mode}
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }
  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentPortalDashboard user={user} />;
  }
  return <StaffDashboard user={user} />;
}
