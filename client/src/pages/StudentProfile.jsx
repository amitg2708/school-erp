import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentsAPI, attendanceAPI, feesAPI, examsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Award,
  CreditCard, CheckCircle2, XCircle, Clock, AlertCircle, FileText,
  Printer, TrendingUp, Download, Eye
} from 'lucide-react';
import ReportCardDocument from '../components/ReportCardDocument';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [parent, setParent] = useState(null);
  const [attSummary, setAttSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Attendance history
  const [attHistory, setAttHistory] = useState([]);
  const [attLoading, setAttLoading] = useState(false);

  // Fees state
  const [feeData, setFeeData] = useState({ fees: [], payments: [], summary: {} });
  const [feesLoading, setFeesLoading] = useState(false);

  // Exams & Report card state
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getById(id);
      setStudent(res.data.student);
      setParent(res.data.parent);
      setAttSummary(res.data.attendanceSummary);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    setAttLoading(true);
    try {
      const res = await attendanceAPI.getStudentHistory(id);
      setAttHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAttLoading(false);
    }
  };

  const fetchFees = async () => {
    setFeesLoading(true);
    try {
      const res = await feesAPI.getStudentFees(id);
      setFeeData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFeesLoading(false);
    }
  };

  const loadReportCard = async (examId) => {
    setSelectedExamId(examId);
    setReportLoading(true);
    try {
      const res = await examsAPI.getReportCard(examId, id);
      setReportCard(res.data.reportCard);
    } catch (err) {
      setReportCard(null);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await examsAPI.getAll();
      setExams(res.data.exams || []);
      if (res.data.exams?.length > 0) {
        loadReportCard(res.data.exams[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'attendance' && id) fetchAttendanceHistory();
    if (activeTab === 'fees' && id) fetchFees();
    if (activeTab === 'academic' && id) fetchExams();
  }, [activeTab, id]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--gray-500)' }}>Loading student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="card text-center" style={{ padding: '48px' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h3>Student Not Found</h3>
        <p style={{ color: 'var(--gray-500)', marginBottom: '20px' }}>The requested student could not be found or has been deactivated.</p>
        <Link to="/students" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Students
        </Link>
      </div>
    );
  }

  const attRate = attSummary?.total > 0
    ? Math.round(((attSummary.present + (attSummary.halfDay * 0.5)) / attSummary.total) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/students')}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Students
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Profile
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a56db 0%, #0891b2 100%)',
          height: '90px',
          margin: '-24px -24px 0 -24px',
          position: 'relative'
        }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '20px', marginTop: '-45px', marginBottom: '16px' }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '4px solid #ffffff',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--primary)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}>
            {student.profile_photo ? (
              <img src={student.profile_photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
            )}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>
                {student.first_name} {student.last_name}
              </h2>
              <span className="badge badge-success">Active</span>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '4px' }}>
              Student ID: <strong style={{ color: 'var(--gray-800)' }}>{student.student_id}</strong> &bull; Roll No: <strong style={{ color: 'var(--gray-800)' }}>{student.roll_number || 'N/A'}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 16px', background: 'var(--primary-50)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>CLASS & SEC</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
                {student.class_name || 'Class'} {student.section_name ? `- ${student.section_name}` : ''}
              </div>
            </div>

            <div style={{ padding: '8px 16px', background: 'var(--present-light)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--present)' }}>ATTENDANCE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--present)' }}>
                {attRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--gray-200)',
          margin: '20px -24px -24px -24px',
          padding: '0 24px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview & Details', icon: User },
            { id: 'attendance', label: 'Attendance Log', icon: Calendar },
            { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
            { id: 'academic', label: 'Exam Results', icon: Award },
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
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--gray-500)',
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

      {/* TAB CONTENT */}

      {/* Tab 1: Overview & Details */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Personal Information */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" /> Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Full Name</span>
                <strong>{student.first_name} {student.last_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Gender</span>
                <strong>{student.gender || 'Not specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Date of Birth</span>
                <strong>{student.date_of_birth || 'Not recorded'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Blood Group</span>
                <strong>{student.blood_group || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Admission Date</span>
                <strong>{student.admission_date || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Emergency Contact</span>
                <strong>{student.emergency_contact || 'N/A'}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Residential Address</span>
                <strong>{student.address || 'No address provided'}</strong>
              </div>
            </div>
          </div>

          {/* Parent / Guardian Information */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="var(--primary)" /> Parent / Guardian Details
            </h3>
            {parent ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Father's Name</span>
                  <strong>{parent.father_name || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Mother's Name</span>
                  <strong>{parent.mother_name || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Father Phone</span>
                  <strong>{parent.father_phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Mother Phone</span>
                  <strong>{parent.mother_phone || 'N/A'}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Parent Email</span>
                  <strong>{parent.email || 'N/A'}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Occupation</span>
                  <strong>{parent.occupation || 'N/A'}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>No guardian details linked to this profile.</p>
            )}
          </div>

          {/* Academic & Enrollment Info */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--primary)" /> Enrollment Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Academic Year</span>
                <strong>{student.academic_year || '2025-2026'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Class Enrolled</span>
                <strong>{student.class_name} ({student.section_name})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Enrollment Status</span>
                <span className="badge badge-success">{student.enrollment_status || 'Active'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--gray-500)', display: 'block', fontSize: '0.75rem' }}>Enrollment Date</span>
                <strong>{student.enrollment_date || student.admission_date}</strong>
              </div>
            </div>
          </div>

          {/* Attendance Snapshot */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary)" /> Attendance Snapshot
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'var(--present-light)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--present)' }}>{attSummary?.present || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Present</div>
              </div>
              <div style={{ background: 'var(--absent-light)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--absent)' }}>{attSummary?.absent || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Absent</div>
              </div>
              <div style={{ background: 'var(--late-light)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--late)' }}>{attSummary?.late || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Late</div>
              </div>
              <div style={{ background: 'var(--halfday-light)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--halfday)' }}>{attSummary?.halfDay || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Half Day</div>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', textAlign: 'center' }}>
              Total Recorded Working Days: <strong>{attSummary?.total || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Attendance History</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Showing recent attendance records</span>
          </div>

          {attLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : attHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>
              <Calendar size={36} style={{ margin: '0 auto 8px' }} />
              <p>No attendance records found for this student.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attHistory.map((rec, i) => {
                    const badgeClass =
                      rec.status === 'Present' ? 'badge-success' :
                      rec.status === 'Absent' ? 'badge-danger' :
                      rec.status === 'Late' ? 'badge-warning' : 'badge-info';
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>{rec.attendance_date}</td>
                        <td>{rec.class_name} - {rec.section_name}</td>
                        <td><span className={`badge ${badgeClass}`}>{rec.status}</span></td>
                        <td style={{ color: 'var(--gray-500)' }}>{rec.remarks || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fees & Payments */}
      {activeTab === 'fees' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>TOTAL APPLICABLE FEES</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gray-800)' }}>
                ₹{(feeData.summary?.totalFees || 0).toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>PAID AMOUNT</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--success)' }}>
                ₹{(feeData.summary?.paidAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>OUTSTANDING DUES</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--danger)' }}>
                ₹{(feeData.summary?.pendingAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Assigned Fees */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Assigned Fee Heads</h3>
            {feeData.fees?.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No fee heads assigned.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fee Category</th>
                      <th>Frequency</th>
                      <th>Total Amount</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.fees.map(f => {
                      const due = f.net_amount - f.paid_amount;
                      const badge = f.status === 'Paid' ? 'badge-success' : f.status === 'Partial' ? 'badge-warning' : 'badge-danger';
                      return (
                        <tr key={f.id}>
                          <td><strong>{f.category_name}</strong></td>
                          <td>{f.frequency}</td>
                          <td>₹{f.net_amount.toLocaleString()}</td>
                          <td style={{ color: 'var(--success)' }}>₹{f.paid_amount.toLocaleString()}</td>
                          <td style={{ color: due > 0 ? 'var(--danger)' : 'inherit', fontWeight: '600' }}>₹{due.toLocaleString()}</td>
                          <td><span className={`badge ${badge}`}>{f.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Payment Receipts</h3>
            {feeData.payments?.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No payment transactions recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Fee Category</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Reference #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.payments.map(p => (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary)' }}>{p.receipt_number}</span></td>
                        <td>{p.payment_date}</td>
                        <td>{p.category_name}</td>
                        <td style={{ fontWeight: '700', color: 'var(--success)' }}>₹{p.amount.toLocaleString()}</td>
                        <td><span className="badge badge-info">{p.payment_mode}</span></td>
                        <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{p.transaction_reference || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Exam Results & Report Card */}
      {activeTab === 'academic' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '220px' }}>
                <label className="form-label">Select Examination</label>
                <select
                  className="form-control"
                  value={selectedExamId}
                  onChange={e => loadReportCard(e.target.value)}
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.class_name})</option>
                  ))}
                </select>
              </div>
              {reportCard && (
                <div style={{ marginTop: '22px' }}>
                  <button onClick={() => window.print()} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={16} /> Print Report Card
                  </button>
                </div>
              )}
            </div>
          </div>

          {reportLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : reportCard ? (
            <ReportCardDocument reportData={reportCard} />
          ) : (
            <div className="card text-center" style={{ padding: '40px', color: 'var(--gray-400)' }}>
              <Award size={40} style={{ margin: '0 auto 8px' }} />
              <p>Select an examination to view report card.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
