import { useState, useEffect } from 'react';
import { dashboardAPI, feesAPI, attendanceAPI, academicAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3, Calendar, DollarSign, Users, Printer,
  FileSpreadsheet, TrendingUp, CheckCircle, AlertCircle
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'fees' | 'strength'

  // Data
  const [stats, setStats] = useState(null);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [pendingFees, setPendingFees] = useState({ pending: [], totalPending: 0 });
  const [collectionData, setCollectionData] = useState({ payments: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && years.length > 0) {
      fetchAttendanceReport(attendanceDate);
    }
    if (activeTab === 'fees') {
      fetchFeeReports();
    }
  }, [activeTab, attendanceDate, years]);

  const loadBase = async () => {
    setLoading(true);
    try {
      const [dashRes, yrRes, clRes] = await Promise.all([
        dashboardAPI.getStats(),
        academicAPI.getYears(),
        academicAPI.getClasses()
      ]);
      const loadedYears = yrRes.data.years || [];
      setStats(dashRes.data.stats);
      setYears(loadedYears);
      setClasses(clRes.data.classes || []);

      const curYear = loadedYears.find(y => y.is_current)?.id || loadedYears[0]?.id;
      if (curYear) {
        const attRes = await attendanceAPI.getDailyReport({ date: attendanceDate, academic_year_id: curYear });
        setAttendanceReport(attRes.data.report || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async (date) => {
    try {
      const curYear = years.find(y => y.is_current)?.id || years[0]?.id;
      const res = await attendanceAPI.getDailyReport({ date, academic_year_id: curYear });
      setAttendanceReport(res.data.report || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeReports = async () => {
    try {
      const [pendRes, collRes] = await Promise.all([
        feesAPI.getPendingReport(),
        feesAPI.getCollectionReport({})
      ]);
      setPendingFees(pendRes.data);
      setCollectionData(collRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Official institutional summaries, attendance rates, financial audits, and class demographics
          </p>
        </div>

        <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Report Tabs */}
      <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {[
            { id: 'attendance', label: 'Attendance Analysis', icon: Calendar },
            { id: 'fees', label: 'Financial & Fee Audit', icon: DollarSign },
            { id: 'strength', label: 'Student Strength & Enrollment', icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  background: active ? 'var(--primary-50)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--gray-600)',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ATTENDANCE ANALYSIS */}
      {activeTab === 'attendance' && (
        <div>
          <div className="card" style={{ marginBottom: '20px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="form-label" style={{ margin: 0 }}>Report Date:</label>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto' }}
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              Showing Class 1 to 12 daily attendance breakdown
            </span>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
              Class-wise Attendance Register ({attendanceDate})
            </h3>
            {attendanceReport.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', padding: '20px 0', textAlign: 'center' }}>
                No attendance recorded for this date.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class & Section</th>
                      <th>Total Enrolled</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late / Half Day</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.map((row, i) => {
                      const totalMarked = (row.present || 0) + (row.absent || 0) + (row.late || 0) + (row.half_day || 0);
                      const perc = totalMarked > 0 ? Math.round(((row.present + (row.half_day * 0.5)) / totalMarked) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td><strong>{row.class_name} - {row.section_name}</strong></td>
                          <td>{row.total_enrolled}</td>
                          <td style={{ color: 'var(--present)', fontWeight: '700' }}>{row.present || 0}</td>
                          <td style={{ color: 'var(--absent)', fontWeight: '700' }}>{row.absent || 0}</td>
                          <td>{(row.late || 0) + (row.half_day || 0)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${perc}%`, height: '100%', background: perc >= 75 ? 'var(--present)' : perc >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                              </div>
                              <span style={{ fontWeight: '700', minWidth: '40px', fontSize: '0.85rem' }}>{perc}%</span>
                            </div>
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
      )}

      {/* TAB 2: FINANCIAL AUDIT */}
      {activeTab === 'fees' && (
        <div>
          {/* Financial Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>TOTAL REVENUE COLLECTED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--success)' }}>
                ₹{(collectionData.total || 0).toLocaleString()}
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>OUTSTANDING RECEIVABLES</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--danger)' }}>
                ₹{(pendingFees.totalPending || 0).toLocaleString()}
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>REGISTERED DEFAULTER ACCOUNTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gray-800)' }}>
                {pendingFees.pending?.length || 0}
              </div>
            </div>
          </div>

          {/* Collection Transactions */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>Latest Financial Receipts Audit</h3>
            {collectionData.payments?.length === 0 ? (
              <p style={{ color: 'var(--gray-400)' }}>No payment transactions recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Fee Head</th>
                      <th>Payment Mode</th>
                      <th>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionData.payments?.slice(0, 20).map((p, i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{p.receipt_number}</span></td>
                        <td>{p.payment_date}</td>
                        <td><strong>{p.student_name}</strong></td>
                        <td>{p.class_name}</td>
                        <td>{p.category}</td>
                        <td><span className="badge badge-info">{p.payment_mode}</span></td>
                        <td style={{ fontWeight: '800', color: 'var(--success)' }}>₹{p.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT STRENGTH & ENROLLMENT */}
      {activeTab === 'strength' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Class 1 to 12 Enrollment Breakdown</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Grade Level</th>
                    <th>Enrolled Students</th>
                    <th>Capacity Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.classWiseStrength?.map((cw, i) => {
                    const maxCap = 80;
                    const fillPerc = Math.min(100, Math.round(((cw.student_count || 0) / maxCap) * 100));
                    return (
                      <tr key={i}>
                        <td><strong>{cw.class_name}</strong></td>
                        <td>Class {cw.numeric_value}</td>
                        <td><strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{cw.student_count || 0}</strong> Students</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '10px', background: 'var(--gray-200)', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ width: `${fillPerc}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--info))' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', minWidth: '40px' }}>{cw.student_count || 0} / {maxCap}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
