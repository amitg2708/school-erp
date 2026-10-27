import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Award, Calendar, BookOpen, User, CheckCircle,
  XCircle, Printer, X, FileText, ChevronRight
} from 'lucide-react';
import ReportCardDocument from '../ReportCardDocument';

function ReportCardModal({ reportData, onClose }) {
  if (!reportData) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          maxWidth: '880px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          <ReportCardDocument
            reportData={reportData}
            onClose={onClose}
            showCloseButton={true}
          />
        </div>
      </div>
    </div>
  );
}

export default function StudentExamsView() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'schedule'
  const [selectedReportCard, setSelectedReportCard] = useState(null);

  useEffect(() => {
    if (user?.role === 'parent') {
      api.get('/portal/children').then(res => {
        const list = res.data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedStudentId(String(list[0].id));
      }).catch(() => {});
    } else {
      loadExamData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId || user?.role === 'student') {
      loadExamData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadExamData = async (studId) => {
    setLoading(true);
    try {
      const url = studId ? `/exams/my-results?student_id=${studId}` : '/exams/my-results';
      const res = await api.get(url);
      setExamData(res.data);
    } catch (err) {
      toast.error('Failed to load examinations and results');
    } finally {
      setLoading(false);
    }
  };

  const openReportCard = async (examId) => {
    try {
      const targetStudentId = selectedStudentId || examData?.student?.id;
      const res = await api.get(`/exams/${examId}/report-card/${targetStudentId}`);
      setSelectedReportCard(res.data.reportCard);
    } catch (err) {
      toast.error('Failed to load official report card');
    }
  };

  const student = examData?.student;
  const exams = examData?.exams || [];
  const marks = examData?.marks || [];
  const examSchedule = examData?.examSchedule || [];

  if (loading && !examData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '120px', borderRadius: '12px', marginBottom: '16px' }} />
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
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Viewing Academic Records For:</span>
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

      {/* Header */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#e0e7ff', marginBottom: '8px' }}>
              <Award size={13} /> Official Academic Examinations
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {student ? `${student.first_name} ${student.last_name || ''} - Results & Exams` : 'Examinations & Marks'}
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: '0.85rem', margin: 0 }}>
              {student?.class_name ? `${student.class_name} · Section ${student.section_name || 'A'}` : 'Student'} · CBSE Assessment Framework
            </p>
          </div>

          {exams.length > 0 && (
            <button
              onClick={() => openReportCard(exams[0].id)}
              className="btn btn-sm"
              style={{ background: '#fff', color: '#4f46e5', border: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={15} /> Official Report Card
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('results')}
          className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Award size={16} /> Exam Results & Grades ({marks.length})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Calendar size={16} /> Examination Timetable ({examSchedule.length})
        </button>
      </div>

      {activeTab === 'results' ? (
        /* Results View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {exams.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Award size={48} style={{ color: 'var(--gray-400)' }} />
                <h3>No exam results published yet</h3>
                <p>Results will be displayed here once teachers enter and publish examination marks</p>
              </div>
            </div>
          ) : (
            exams.map(exam => {
              const examMarks = marks.filter(m => m.exam_id === exam.id);
              const totalMax = examMarks.reduce((acc, m) => acc + (m.max_marks || 0), 0);
              const totalObt = examMarks.reduce((acc, m) => acc + (m.obtained_marks || 0), 0);
              const pct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : 0;

              return (
                <div key={exam.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div style={{ minWidth: '180px' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--gray-900)' }}>{exam.name}</h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{exam.exam_type}</span>
                        <span>{exam.start_date ? `Held: ${exam.start_date}` : 'Term Exam'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', minWidth: '0' }}>
                      <div style={{ textAlign: 'right', background: 'var(--gray-50)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>Aggregate Score</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)' }}>
                          {totalObt} / {totalMax} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-600)' }}>({pct}%)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => openReportCard(exam.id)}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontWeight: 600 }}
                      >
                        <Printer size={15} /> View Report Card
                      </button>
                    </div>
                  </div>

                  {examMarks.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Marks entry is currently in progress for this exam.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Max Marks</th>
                            <th>Passing Marks</th>
                            <th>Marks Scored</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examMarks.map(m => {
                            const isPass = (m.obtained_marks || 0) >= (m.passing_marks || 33);
                            return (
                              <tr key={m.id}>
                                <td style={{ fontWeight: 600 }}>{m.subject_name}</td>
                                <td>{m.max_marks}</td>
                                <td>{m.passing_marks}</td>
                                <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                  {m.is_absent ? (
                                    <span style={{ color: 'var(--danger)' }}>Absent</span>
                                  ) : (
                                    <span style={{ color: isPass ? 'var(--gray-900)' : 'var(--danger)' }}>{m.obtained_marks}</span>
                                  )}
                                </td>
                                <td>
                                  {m.is_absent ? (
                                    <span className="badge badge-danger">Absent</span>
                                  ) : isPass ? (
                                    <span className="badge badge-success">Passed</span>
                                  ) : (
                                    <span className="badge badge-danger">Needs Review</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Upcoming Exam Schedule */
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Upcoming Assessment Schedule</h2>
          {examSchedule.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Calendar size={40} style={{ color: 'var(--gray-400)' }} />
              <h3>No scheduled exam papers</h3>
              <p>Exam dates and subject schedules will appear here once finalized by the academic office</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Passing Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {examSchedule.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.exam_date || 'TBD'}</td>
                      <td>{item.exam_name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.subject_name}</td>
                      <td>{item.max_marks}</td>
                      <td>{item.passing_marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Official Report Card Modal */}
      {selectedReportCard && (
        <ReportCardModal
          reportData={selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
    </div>
  );
}
