import { useState, useEffect } from 'react';
import { examsAPI, academicAPI, studentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Award, Plus, Search, Calendar, FileText, CheckCircle,
  AlertCircle, Printer, X, BookOpen, User, ChevronRight
} from 'lucide-react';
import ReportCardDocument from '../components/ReportCardDocument';

function CreateExamModal({ onClose, onSuccess, types, years, classes }) {
  const [form, setForm] = useState({
    name: '',
    examTypeId: types[0]?.id || '',
    academicYearId: years.find(y => y.is_current)?.id || years[0]?.id || '',
    classId: classes[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.examTypeId || !form.academicYearId || !form.classId) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      await examsAPI.create(form);
      toast.success('Examination created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create examination');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Create Examination</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Exam Title *</label>
              <input
                className="form-control"
                placeholder="e.g. Mid-Term Examination 2025"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Exam Type *</label>
                <select
                  className="form-control"
                  value={form.examTypeId}
                  onChange={e => setForm(f => ({ ...f, examTypeId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Type --</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class *</label>
                <select
                  className="form-control"
                  value={form.classId}
                  onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Examination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSubjectToExamModal({ exam, onClose, onSuccess, subjects }) {
  const [subjectId, setSubjectId] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(33);
  const [examDate, setExamDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error('Select a subject');
      return;
    }
    setSaving(true);
    try {
      await examsAPI.addSubject(exam.id, {
        subjectId,
        maxMarks: Number(maxMarks),
        passingMarks: Number(passingMarks),
        examDate: examDate || null
      });
      toast.success('Subject added to exam!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add Subject to {exam.name}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select className="form-control" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                <option value="">-- Choose Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Max Marks</label>
                <input
                  type="number"
                  className="form-control"
                  value={maxMarks}
                  onChange={e => setMaxMarks(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Passing Marks</label>
                <input
                  type="number"
                  className="form-control"
                  value={passingMarks}
                  onChange={e => setPassingMarks(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Date</label>
              <input
                type="date"
                className="form-control"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import StudentExamsView from '../components/student/StudentExamsView';

function StaffExaminations() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'marks' | 'report'

  // Reference data
  const [exams, setExams] = useState([]);
  const [types, setTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjectExamModal, setSubjectExamModal] = useState(null);

  // Marks Entry State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSubjects, setExamSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [studentMarksList, setStudentMarksList] = useState([]);
  const [marksInputs, setMarksInputs] = useState({}); // { studentId: { obtainedMarks, isAbsent, remarks } }
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaving, setMarksSaving] = useState(false);

  // Report Card State
  const [reportExamId, setReportExamId] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [exRes, tyRes, clRes, yrRes, subRes] = await Promise.all([
        examsAPI.getAll(),
        examsAPI.getTypes(),
        academicAPI.getClasses(),
        academicAPI.getYears(),
        academicAPI.getSubjects()
      ]);
      setExams(exRes.data.exams || []);
      setTypes(tyRes.data.types || []);
      setClasses(clRes.data.classes || []);
      setYears(yrRes.data.years || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      toast.error('Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  // When selected exam changes in Marks Entry tab
  const handleExamChangeForMarks = async (examId) => {
    setSelectedExamId(examId);
    setSelectedSubjectId('');
    setStudentMarksList([]);
    setMarksInputs({});
    if (examId) {
      const res = await examsAPI.getSubjects(examId);
      setExamSubjects(res.data.subjects || []);
    } else {
      setExamSubjects([]);
    }
  };

  // Load students and marks for selected subject
  const loadMarksForSubject = async (examSubId) => {
    setSelectedSubjectId(examSubId);
    if (!examSubId || !selectedExamId) return;
    setMarksLoading(true);
    try {
      const res = await examsAPI.getMarks(selectedExamId, { exam_subject_id: examSubId });
      const students = res.data.students || [];
      setStudentMarksList(students);

      const initialInputs = {};
      students.forEach(s => {
        initialInputs[s.student_id] = {
          obtainedMarks: s.obtained_marks !== null && s.obtained_marks !== undefined ? s.obtained_marks : '',
          isAbsent: !!s.is_absent,
          remarks: s.remarks || ''
        };
      });
      setMarksInputs(initialInputs);
    } catch (err) {
      toast.error('Failed to load student roster for marks');
    } finally {
      setMarksLoading(false);
    }
  };

  const handleMarksInputChange = (studentId, field, val) => {
    setMarksInputs(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    setMarksSaving(true);
    try {
      const payload = studentMarksList.map(s => {
        const inp = marksInputs[s.student_id] || {};
        return {
          studentId: s.student_id,
          obtainedMarks: inp.isAbsent ? 0 : Number(inp.obtainedMarks || 0),
          isAbsent: inp.isAbsent ? 1 : 0,
          remarks: inp.remarks || null
        };
      });

      await examsAPI.saveMarks(selectedExamId, {
        examSubjectId: selectedSubjectId,
        marks: payload
      });
      toast.success('Marks saved successfully!');
    } catch (err) {
      toast.error('Failed to save marks');
    } finally {
      setMarksSaving(false);
    }
  };

  // Report Card Handlers
  const handleReportExamChange = async (examId) => {
    setReportExamId(examId);
    setSelectedStudentId('');
    setReportCard(null);
    if (!examId) return;
    const exam = exams.find(e => String(e.id) === String(examId));
    if (exam) {
      try {
        const res = await studentsAPI.getAll({ class_id: exam.class_id, limit: 100 });
        setClassStudents(res.data.students || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadStudentReportCard = async (studentId) => {
    setSelectedStudentId(studentId);
    if (!reportExamId || !studentId) return;
    setReportLoading(true);
    try {
      const res = await examsAPI.getReportCard(reportExamId, studentId);
      setReportCard(res.data.reportCard);
    } catch (err) {
      toast.error('Failed to load report card');
      setReportCard(null);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Examinations & Results</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Manage exam schedules, subject marks entry, and printable student report cards
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Create Examination
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {[
            { id: 'list', label: 'Examinations List', icon: Award },
            { id: 'marks', label: 'Marks Entry', icon: BookOpen },
            { id: 'report', label: 'Report Card Generator', icon: FileText },
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

      {/* TAB 1: EXAMINATIONS LIST */}
      {activeTab === 'list' && (
        <div>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : exams.length === 0 ? (
            <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
              <Award size={48} style={{ margin: '0 auto 12px' }} />
              <h3>No Examinations Configured</h3>
              <p>Create your first examination schedule to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {exams.map(ex => (
                <div key={ex.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="badge badge-primary">{ex.exam_type}</span>
                      <span className="badge badge-info">{ex.class_name}</span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>{ex.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '16px' }}>
                      Academic Session: <strong>{ex.academic_year}</strong>
                    </p>

                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="var(--gray-400)" />
                        <span>Start: <strong>{ex.start_date || 'TBD'}</strong></span>
                      </div>
                      {ex.end_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} color="var(--gray-400)" />
                          <span>End: <strong>{ex.end_date}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px', borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}>
                    <button
                      onClick={() => setSubjectExamModal(ex)}
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      + Add Subject
                    </button>
                    <button
                      onClick={() => {
                        handleExamChangeForMarks(ex.id);
                        setActiveTab('marks');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      Enter Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div>
          {/* Controls */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">1. Choose Examination</label>
                <select
                  className="form-control"
                  value={selectedExamId}
                  onChange={e => handleExamChangeForMarks(e.target.value)}
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.class_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">2. Select Subject</label>
                <select
                  className="form-control"
                  value={selectedSubjectId}
                  onChange={e => loadMarksForSubject(e.target.value)}
                  disabled={!selectedExamId || examSubjects.length === 0}
                >
                  <option value="">-- Select Subject --</option>
                  {examSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} (Max: {s.max_marks})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          {marksLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : !selectedSubjectId ? (
            <div className="card text-center" style={{ padding: '40px', color: 'var(--gray-400)' }}>
              <BookOpen size={40} style={{ margin: '0 auto 8px' }} />
              <p>Select an examination and subject to enter or view student marks.</p>
            </div>
          ) : studentMarksList.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px', color: 'var(--gray-400)' }}>
              <User size={40} style={{ margin: '0 auto 8px' }} />
              <p>No active students enrolled in this class.</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  Student Score Entry ({studentMarksList.length} Students)
                </h3>
                <button
                  onClick={handleSaveMarks}
                  disabled={marksSaving}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={16} /> {marksSaving ? 'Saving Marks...' : 'Save All Marks'}
                </button>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Roll No</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th style={{ width: '150px' }}>Marks Obtained</th>
                      <th style={{ width: '100px' }}>Absent?</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarksList.map(st => {
                      const inp = marksInputs[st.student_id] || { obtainedMarks: '', isAbsent: false, remarks: '' };
                      const max = st.max_marks || 100;
                      const pass = st.passing_marks || 33;
                      const isPassing = Number(inp.obtainedMarks) >= pass;

                      return (
                        <tr key={st.student_id}>
                          <td style={{ fontWeight: '700' }}>{st.roll_number || '-'}</td>
                          <td>
                            <strong>{st.first_name} {st.last_name}</strong>
                          </td>
                          <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{st.std_id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ width: '85px', textAlign: 'center', fontWeight: '700' }}
                                min="0"
                                max={max}
                                disabled={inp.isAbsent}
                                placeholder={`0-${max}`}
                                value={inp.obtainedMarks}
                                onChange={e => handleMarksInputChange(st.student_id, 'obtainedMarks', e.target.value)}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>/ {max}</span>
                            </div>
                          </td>
                          <td>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                              <input
                                type="checkbox"
                                checked={inp.isAbsent}
                                onChange={e => handleMarksInputChange(st.student_id, 'isAbsent', e.target.checked)}
                              />
                              <span style={{ color: inp.isAbsent ? 'var(--danger)' : 'inherit' }}>Absent</span>
                            </label>
                          </td>
                          <td>
                            <input
                              className="form-control"
                              style={{ fontSize: '0.85rem' }}
                              placeholder="e.g. Good performance"
                              value={inp.remarks}
                              onChange={e => handleMarksInputChange(st.student_id, 'remarks', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORT CARD GENERATOR */}
      {activeTab === 'report' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Examination</label>
                <select
                  className="form-control"
                  value={reportExamId}
                  onChange={e => handleReportExamChange(e.target.value)}
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.class_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Student</label>
                <select
                  className="form-control"
                  value={selectedStudentId}
                  onChange={e => loadStudentReportCard(e.target.value)}
                  disabled={!reportExamId || classStudents.length === 0}
                >
                  <option value="">-- Choose Student --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (Roll: {s.roll_number || 'N/A'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {reportLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : reportCard ? (
            <ReportCardDocument reportData={reportCard} />
          ) : (
            <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
              <FileText size={48} style={{ margin: '0 auto 12px' }} />
              <p>Select an exam and student to generate their academic report card.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <CreateExamModal
          types={types}
          years={years}
          classes={classes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => loadInitial()}
        />
      )}

      {/* Add Subject to Exam Modal */}
      {subjectExamModal && (
        <AddSubjectToExamModal
          exam={subjectExamModal}
          subjects={subjects}
          onClose={() => setSubjectExamModal(null)}
          onSuccess={() => loadInitial()}
        />
      )}
    </div>
  );
}

export default function Examinations() {
  const { user } = useAuth();
  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentExamsView />;
  }
  return <StaffExaminations />;
}
