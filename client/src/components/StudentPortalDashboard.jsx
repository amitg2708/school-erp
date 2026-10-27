import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI, feesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  User, Calendar, Clock, BookOpen, CreditCard, Award,
  CheckCircle2, AlertCircle, FileText, Download, ArrowRight,
  ChevronRight, MapPin, Printer, Check
} from 'lucide-react';

export default function StudentPortalDashboard({ user }) {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick pay simulation
  const [payingFee, setPayingFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    portalAPI.getChildren().then(res => {
      const kids = res.data.children || [];
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedStudentId(kids[0].id);
        fetchStudentData(kids[0].id);
      } else {
        fetchStudentData();
      }
    }).catch(() => {
      fetchStudentData();
    });
  }, []);

  const fetchStudentData = async (studentId) => {
    setLoading(true);
    try {
      const res = await portalAPI.getMyStudent(studentId ? { student_id: studentId } : undefined);
      setPortalData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (sId) => {
    setSelectedStudentId(sId);
    fetchStudentData(sId);
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!payingFee || !payAmount) return;
    setSavingPayment(true);
    try {
      const res = await feesAPI.recordPayment({
        studentFeeId: payingFee.id,
        studentId: portalData.student.id,
        amount: Number(payAmount),
        paymentMode: payMode,
        remarks: 'Online portal payment'
      });
      toast.success(`Payment recorded! Receipt: ${res.data.receiptNumber}`);
      setPayingFee(null);
      fetchStudentData(portalData.student.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--gray-500)' }}>Loading student portal dashboard...</p>
      </div>
    );
  }

  if (!portalData || !portalData.student) {
    return (
      <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
        <User size={48} style={{ margin: '0 auto 12px' }} />
        <h3>No Student Profile Linked</h3>
        <p>Please contact the school administrative office to link your student account.</p>
      </div>
    );
  }

  const { student, parent, attendance, fees, timetable, assignments, marks } = portalData;

  const totalDays = attendance?.summary?.total || 0;
  const presentDays = attendance?.summary?.present || 0;
  const attRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysSchedule = (timetable || []).filter(t => t.day_of_week === todayDayName || t.day_of_week === 'Monday');

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Parent Child Switcher (If Parent has multiple children) */}
      {user?.role === 'parent' && children.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ margin: 0, fontWeight: '700' }}>Viewing Child:</label>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedStudentId}
            onChange={e => handleChildChange(e.target.value)}
          >
            {children.map(k => (
              <option key={k.id} value={k.id}>{k.first_name} {k.last_name} ({k.class_name} - {k.section_name})</option>
            ))}
          </select>
        </div>
      )}

      {/* Hero Student Identity Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1a56db 0%, #0284c7 100%)',
        color: '#ffffff',
        padding: '24px',
        marginBottom: '20px',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: '#ffffff',
              color: 'var(--primary)',
              fontSize: '1.8rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {student.first_name[0]}{student.last_name ? student.last_name[0] : ''}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
                  {student.first_name} {student.last_name}
                </h1>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                  Roll #{student.roll_number || '1'}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                {student.class_name} - Section {student.section_name} &bull; ID: <strong>{student.student_id}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                Academic Session: {student.academic_year || '2025-2026'} &bull; Guardian: {parent?.father_name || parent?.mother_name || 'Registered'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`/students/${student.id}`)}
              className="btn btn-outline"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}
            >
              Full Profile & Report Cards &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Attendance */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--present-light)', color: 'var(--present)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>ATTENDANCE RATE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: attRate >= 75 ? 'var(--present)' : 'var(--danger)' }}>
              {attRate}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              {presentDays} / {totalDays} days present
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: fees?.summary?.pending > 0 ? 'var(--danger-light)' : 'var(--success-light)', color: fees?.summary?.pending > 0 ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>OUTSTANDING DUES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: fees?.summary?.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
              ₹{(fees?.summary?.pending || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              ₹{(fees?.summary?.paid || 0).toLocaleString()} paid
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>ACTIVE HOMEWORK</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
              {assignments?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              Class assignments
            </div>
          </div>
        </div>

        {/* Exam Score */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-light)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>EXAM EVALUATION</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--orange)' }}>
              {marks?.length > 0 ? `${marks.length} Subjects` : 'Published'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              Report card ready
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Today's Timetable */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" /> Class Schedule ({todayDayName})
            </h3>
            <button onClick={() => navigate('/timetable')} className="btn btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
              Full Week &rarr;
            </button>
          </div>

          {todaysSchedule.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No periods scheduled for today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todaysSchedule.map(slot => (
                <div
                  key={slot.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--gray-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: '3px solid var(--primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-100)', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      P{slot.period_number}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{slot.subject_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{slot.start_time} - {slot.end_time} &bull; {slot.teacher_name || 'Faculty'}</div>
                    </div>
                  </div>
                  {slot.room && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                      {slot.room}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Homework */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--primary)" /> Homework & Assignments
            </h3>
            <button onClick={() => navigate('/assignments')} className="btn btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
              View All &rarr;
            </button>
          </div>

          {assignments?.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Great job! No pending homework assignments.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.map(asg => (
                <div key={asg.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{asg.subject_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600' }}>
                      Due: {asg.due_date || 'Upcoming'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--gray-900)' }}>{asg.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    {asg.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee Statement */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--primary)" /> Fees & Payments
            </h3>
            <button onClick={() => navigate('/fees')} className="btn btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
              Fee Details &rarr;
            </button>
          </div>

          {fees?.list?.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No fee heads assigned.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fees?.list?.map(fee => {
                const pendingAmt = fee.net_amount - fee.paid_amount;
                return (
                  <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', background: 'var(--gray-50)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{fee.category_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Total: ₹{fee.net_amount.toLocaleString()} &bull; {fee.frequency}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {pendingAmt > 0 ? (
                        <div>
                          <div style={{ color: 'var(--danger)', fontWeight: '800', fontSize: '0.9rem' }}>₹{pendingAmt.toLocaleString()} Due</div>
                          <button
                            onClick={() => {
                              setPayingFee(fee);
                              setPayAmount(String(pendingAmt));
                            }}
                            className="btn btn-primary"
                            style={{ fontSize: '0.7rem', padding: '3px 8px', marginTop: '4px' }}
                          >
                            Pay Online
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-success">Fully Paid</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Exam Marks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--primary)" /> Academic Results
            </h3>
            <button onClick={() => navigate('/examinations')} className="btn btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
              Report Cards &rarr;
            </button>
          </div>

          {marks?.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No exam marks published yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.slice(0, 5).map((m, i) => (
                    <tr key={i}>
                      <td><strong>{m.subject_name}</strong></td>
                      <td>{m.exam_name}</td>
                      <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                        {m.obtained_marks} / {m.max_marks}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {m.obtained_marks >= m.passing_marks ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Online Pay Modal */}
      {payingFee && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pay School Fee</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setPayingFee(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSimulatePayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>FEE CATEGORY</div>
                  <strong style={{ fontSize: '1rem' }}>{payingFee.category_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                    Student: {student.first_name} {student.last_name} ({student.student_id})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontSize: '1.2rem', fontWeight: '800' }}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Payment Method</label>
                  <select className="form-control" value={payMode} onChange={e => setPayMode(e.target.value)}>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Debit Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setPayingFee(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingPayment}>
                  {savingPayment ? 'Processing...' : `Pay ₹${Number(payAmount || 0).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
