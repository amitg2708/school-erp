import { useState, useEffect } from 'react';
import { api, assignmentsAPI, academicAPI, staffAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Search, Calendar, CheckCircle2,
  Clock, BookOpen, AlertCircle, Users, X, Eye
} from 'lucide-react';

function CreateAssignmentModal({ onClose, onSuccess, classes, subjects, years, teachers }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: classes[0]?.id || '',
    sectionId: '',
    subjectId: subjects[0]?.id || '',
    academicYearId: years.find(y => y.is_current)?.id || years[0]?.id || '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    maxMarks: 20,
    staffId: teachers[0]?.id || ''
  });
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form.classId) {
      academicAPI.getSections({ class_id: form.classId }).then(r => {
        setSections(r.data.sections || []);
      });
    }
  }, [form.classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      await assignmentsAPI.create(form);
      toast.success('Assignment created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Create Homework / Assignment</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Assignment Title *</label>
              <input
                className="form-control"
                placeholder="e.g. Chapter 4 Trigonometry Exercises"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select
                  className="form-control"
                  value={form.classId}
                  onChange={e => setForm(f => ({ ...f, classId: e.target.value, sectionId: '' }))}
                  required
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Section (Optional)</label>
                <select
                  className="form-control"
                  value={form.sectionId}
                  onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                >
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select
                  className="form-control"
                  value={form.subjectId}
                  onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  required
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Marks</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.maxMarks}
                  onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))}
                  min="5"
                  max="100"
                />
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Submission Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigning Faculty</label>
                <select
                  className="form-control"
                  value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Description</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Provide detailed homework problems, reference book pages, or submission guidelines..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmissionsModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingSub, setGradingSub] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchSubs = () => {
    setLoading(true);
    assignmentsAPI.getSubmissions(assignment.id)
      .then(res => setSubmissions(res.data.submissions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubs();
  }, [assignment.id]);

  const handleStartGrade = (sub) => {
    setGradingSub(sub);
    setMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? String(sub.marks_obtained) : '');
    setFeedback(sub.remarks || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (marks === '') {
      toast.error('Enter marks');
      return;
    }
    setSavingGrade(true);
    try {
      await assignmentsAPI.gradeSubmission(assignment.id, gradingSub.id, {
        marksObtained: parseFloat(marks),
        feedback
      });
      toast.success('Grade recorded successfully!');
      setGradingSub(null);
      fetchSubs();
    } catch (err) {
      toast.error('Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Student Submissions & Evaluation</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: 0 }}>
              {assignment.title} (Max Marks: {assignment.max_marks || 20})
            </p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>
              <Users size={40} style={{ margin: '0 auto 8px' }} />
              <p>No student submissions received yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th>Submitted Work</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr key={i}>
                      <td><strong>{sub.roll_number || '-'}</strong></td>
                      <td style={{ fontWeight: 600 }}>{sub.first_name} {sub.last_name}</td>
                      <td>
                        <span className={`badge ${sub.status === 'Evaluated' ? 'badge-success' : 'badge-primary'}`}>
                          {sub.status || 'Submitted'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: sub.marks_obtained !== null ? 'var(--success)' : 'var(--gray-400)' }}>
                        {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? `${sub.marks_obtained} / ${assignment.max_marks || 20}` : '—'}
                      </td>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.remarks || 'No notes'}>
                        {sub.remarks || '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleStartGrade(sub)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          {sub.status === 'Evaluated' ? 'Edit Grade' : 'Grade'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Inline Grading Form */}
          {gradingSub && (
            <form onSubmit={handleSaveGrade} style={{ marginTop: '16px', padding: '14px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
                Evaluate: {gradingSub.first_name} {gradingSub.last_name} (Roll #{gradingSub.roll_number})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Marks (Max: {assignment.max_marks || 20}) *</label>
                  <input
                    type="number"
                    step="0.5"
                    max={assignment.max_marks || 20}
                    min="0"
                    className="form-control form-control-sm"
                    value={marks}
                    onChange={e => setMarks(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Feedback / Teacher Comments</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Excellent solution, good working steps"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGradingSub(null)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm" disabled={savingGrade}>
                  {savingGrade ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

import StudentAssignmentsView from '../components/student/StudentAssignmentsView';

export default function Assignments() {
  const { user } = useAuth();

  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentAssignmentsView />;
  }

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewSubmissionsAssignment, setViewSubmissionsAssignment] = useState(null);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [classFilter, subjectFilter]);

  const loadMeta = async () => {
    try {
      const [clRes, subRes, yrRes, tchRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSubjects(),
        academicAPI.getYears(),
        staffAPI.getAll({ staff_type: 'Teaching' }),
      ]);
      setClasses(clRes.data.classes || []);
      setSubjects(subRes.data.subjects || []);
      setYears(yrRes.data.years || []);
      setTeachers(tchRes.data.staff || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentsAPI.getAll({
        class_id: classFilter || undefined,
        subject_id: subjectFilter || undefined
      });
      setAssignments(res.data.assignments || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Homework & Assignments</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Post academic assignments, assign tasks by class, and monitor submissions
          </p>
        </div>

        {['admin', 'teacher'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> New Assignment
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '180px' }}>
            <label className="form-label">Filter by Class</label>
            <select className="form-control" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes (1 to 12)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label className="form-label">Filter by Subject</label>
            <select className="form-control" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : assignments.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <FileText size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Assignments Posted</h3>
          <p>Create a new homework assignment to distribute to students.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {assignments.map(asg => {
            const isOverdue = asg.due_date && asg.due_date < todayStr;
            return (
              <div key={asg.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: isOverdue ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge badge-primary">{asg.subject_name}</span>
                    <span className="badge badge-info">{asg.class_name} {asg.section_name ? `- Sec ${asg.section_name}` : ''}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>{asg.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: '1.5', marginBottom: '14px' }}>
                    {asg.description || 'No detailed instructions provided.'}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color={isOverdue ? 'var(--danger)' : 'var(--gray-500)'} />
                      <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? '700' : 'normal' }}>
                        Due: {asg.due_date || 'No deadline'} {isOverdue ? '(Past Due)' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} />
                      <span>Max Marks: <strong>{asg.max_marks || 'Ungraded'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={13} />
                      <span>By: {asg.teacher_name || 'Faculty'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setViewSubmissionsAssignment(asg)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={14} /> View Submissions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          classes={classes}
          subjects={subjects}
          years={years}
          teachers={teachers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchAssignments()}
        />
      )}

      {/* Submissions Modal */}
      {viewSubmissionsAssignment && (
        <SubmissionsModal
          assignment={viewSubmissionsAssignment}
          onClose={() => setViewSubmissionsAssignment(null)}
        />
      )}
    </div>
  );
}
