import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BookMarked, Calendar, Clock, CheckCircle2,
  AlertCircle, Award, User, Send, X, FileText
} from 'lucide-react';

function SubmitAssignmentModal({ assignment, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Please enter your submission details or answer notes');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/assignments/${assignment.id}/submit`, { remarks });
      toast.success('Assignment submitted successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Submit Homework</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{assignment.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                Subject: {assignment.subject_name} · Due Date: {assignment.due_date || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Submission Notes / Solution / Work Link *</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Write your answer notes, summary, or paste link to your completed document/drive file..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentAssignmentsView() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'Pending', 'Submitted', 'Evaluated'
  const [submittingAssignment, setSubmittingAssignment] = useState(null);

  useEffect(() => {
    if (user?.role === 'parent') {
      api.get('/portal/children').then(res => {
        const list = res.data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedStudentId(String(list[0].id));
      }).catch(() => {});
    } else {
      loadAssignments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId || user?.role === 'student') {
      loadAssignments(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadAssignments = async (studId) => {
    setLoading(true);
    try {
      const url = studId ? `/assignments?student_id=${studId}` : '/assignments';
      const res = await api.get(url);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveStatus = (a) => {
    if (a.submission_status === 'Evaluated' || a.marks_obtained !== null && a.marks_obtained !== undefined) {
      return 'Evaluated';
    }
    if (a.submission_status === 'Submitted') {
      return 'Submitted';
    }
    return 'Pending';
  };

  const filtered = assignments.filter(a => {
    if (activeFilter === 'ALL') return true;
    return getEffectiveStatus(a) === activeFilter;
  });

  const getDueStatus = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      return <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Overdue</span>;
    }
    if (dueDate === today) {
      return <span style={{ color: '#d97706', fontWeight: 600 }}>Due Today</span>;
    }
    return <span>Due: {dueDate}</span>;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Parent Child Switcher */}
      {user?.role === 'parent' && children.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Viewing Assignments For:</span>
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
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#d1fae5', marginBottom: '8px' }}>
              <BookMarked size={13} /> Class Homework & Tasks
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              My Homework & Assignments
            </h1>
            <p style={{ color: '#a7f3d0', fontSize: '0.85rem', margin: 0 }}>
              Track daily homework, submit solutions, and review teacher feedback & grades
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#d1fae5' }}>Active Tasks</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
              {assignments.length}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
        {[
          { key: 'ALL', label: 'All Homework', count: assignments.length },
          { key: 'Pending', label: 'Pending', count: assignments.filter(a => getEffectiveStatus(a) === 'Pending').length },
          { key: 'Submitted', label: 'Submitted', count: assignments.filter(a => getEffectiveStatus(a) === 'Submitted').length },
          { key: 'Evaluated', label: 'Evaluated & Graded', count: assignments.filter(a => getEffectiveStatus(a) === 'Evaluated').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`btn ${activeFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BookMarked size={48} style={{ color: 'var(--gray-400)' }} />
            <h3>No assignments in this category</h3>
            <p>You're all caught up with your school homework!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(a => {
            const status = getEffectiveStatus(a);
            return (
              <div key={a.id} className="card" style={{ padding: '18px', borderLeft: status === 'Evaluated' ? '4px solid var(--success)' : status === 'Submitted' ? '4px solid #0284c7' : '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{a.subject_name}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>{a.title}</h3>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                      Assigned by: {a.teacher_name} · Max Marks: {a.max_marks || 20}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {status === 'Evaluated' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Graded ({a.marks_obtained}/{a.max_marks || 20})
                      </span>
                    ) : status === 'Submitted' ? (
                      <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> Submitted
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={13} /> Pending
                      </span>
                    )}
                  </div>
                </div>

                {a.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', margin: '8px 0', lineHeight: 1.5 }}>
                    {a.description}
                  </p>
                )}

                {/* Submission or Teacher Evaluation Details */}
                {status === 'Evaluated' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={15} /> Teacher Feedback:
                    </div>
                    <div style={{ color: 'var(--gray-800)', marginTop: '2px' }}>
                      {a.feedback || 'Good work! Evaluated and recorded.'}
                    </div>
                  </div>
                )}

                {status === 'Submitted' && a.student_remarks && (
                  <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '8px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    <strong>Your submission note:</strong> {a.student_remarks}
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--gray-100)', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {getDueStatus(a.due_date)}
                  </div>

                  {user?.role === 'student' && status === 'Pending' && (
                    <button
                      onClick={() => setSubmittingAssignment(a)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Send size={13} /> Submit Homework
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submittingAssignment && (
        <SubmitAssignmentModal
          assignment={submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSuccess={() => loadAssignments(selectedStudentId)}
        />
      )}
    </div>
  );
}
