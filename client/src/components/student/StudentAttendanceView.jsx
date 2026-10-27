import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle2, XCircle, Clock, AlertTriangle,
  User, Award, ChevronDown, RefreshCw
} from 'lucide-react';

export default function StudentAttendanceView() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Load children for parent or current student
  useEffect(() => {
    if (user?.role === 'parent') {
      api.get('/portal/children').then(res => {
        const list = res.data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedStudentId(String(list[0].id));
      }).catch(() => {});
    } else {
      loadAttendance();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId || user?.role === 'student') {
      loadAttendance(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadAttendance = async (studId) => {
    setLoading(true);
    try {
      const url = studId ? `/attendance/my-attendance?student_id=${studId}` : '/attendance/my-attendance';
      const res = await api.get(url);
      setAttendanceData(res.data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const student = attendanceData?.student;
  const summary = attendanceData?.summary || { total: 0, present: 0, absent: 0, late: 0, halfDay: 0, percentage: 0 };
  const history = attendanceData?.history || [];

  // Filter history by month if selected
  const filteredHistory = history.filter(item => {
    if (selectedMonth === 'ALL') return true;
    const itemMonth = new Date(item.attendance_date).getMonth() + 1;
    return String(itemMonth) === String(selectedMonth);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Present</span>;
      case 'Absent':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Absent</span>;
      case 'Late':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Late</span>;
      case 'Half Day':
        return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Half Day</span>;
      default:
        return <span className="badge">{status || 'N/A'}</span>;
    }
  };

  const getPercentageColor = (pct) => {
    if (pct >= 85) return 'var(--success)';
    if (pct >= 75) return 'var(--primary)';
    if (pct >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading && !attendanceData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '12px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Parent Child Switcher */}
      {user?.role === 'parent' && children.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Viewing Attendance For:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(String(child.id))}
                className={`btn btn-sm ${selectedStudentId === String(child.id) ? 'btn-primary' : 'btn-outline'}`}
              >
                {child.first_name} ({child.class_name || 'Class'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student Overview Header */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd', marginBottom: '8px' }}>
              <Calendar size={13} /> Academic Attendance Register
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {student ? `${student.first_name} ${student.last_name || ''}` : 'My Attendance'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              {student?.class_name ? `${student.class_name} · Section ${student.section_name || 'A'}` : 'Enrolled Student'}
              {student?.roll_number && ` · Roll No: ${student.roll_number}`}
              {student?.student_id && ` · ID: ${student.student_id}`}
            </p>
          </div>

          <div style={{ textAlign: 'right', minWidth: '130px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Rate</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: getPercentageColor(summary.percentage), lineHeight: 1 }}>
              {summary.percentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: summary.percentage >= 75 ? '#86efac' : '#fca5a5', marginTop: '4px' }}>
              {summary.percentage >= 75 ? '✓ Satisfies CBSE 75% Rule' : '⚠ Below 75% Requirement'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, summary.percentage))}%`,
              height: '100%',
              background: getPercentageColor(summary.percentage),
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Total Working Days</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '2px' }}>{summary.total}</div>
        </div>

        <div className="card" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Days Present</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '2px' }}>{summary.present}</div>
        </div>

        <div className="card" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>Days Absent</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '2px' }}>{summary.absent}</div>
        </div>

        <div className="card" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>Days Late</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '2px' }}>{summary.late}</div>
        </div>

        <div className="card" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid #b45309' }}>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Half Days</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '2px' }}>{summary.halfDay}</div>
        </div>
      </div>

      {/* Daily Records Log */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Attendance Log & Daily History</h2>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ fontSize: '0.85rem', minWidth: '150px' }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            <button onClick={() => loadAttendance(selectedStudentId)} className="btn btn-icon btn-outline btn-sm" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 16px' }}>
            <Calendar size={40} style={{ color: 'var(--gray-400)' }} />
            <h3 style={{ fontSize: '1rem', marginTop: '12px' }}>No attendance records found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              No entries logged for the selected period
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Class / Section</th>
                  <th>Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  const dateObj = new Date(item.attendance_date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.attendance_date}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{dayName}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{item.class_name} - {item.section_name}</td>
                      <td style={{ color: 'var(--gray-600)', fontStyle: item.remarks ? 'normal' : 'italic' }}>
                        {item.remarks || 'Regular class attendance'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
