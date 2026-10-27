import { useState, useEffect } from 'react';
import { academicAPI, staffAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  GraduationCap, BookOpen, Layers, Calendar, Plus,
  CheckCircle, Users, Award, X, ChevronRight, UserCheck
} from 'lucide-react';

function AddSectionModal({ classes, teachers, onClose, onSuccess }) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [name, setName] = useState('');
  const [maxStrength, setMaxStrength] = useState(40);
  const [classTeacherId, setClassTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || !name) {
      toast.error('Class and Section name are required');
      return;
    }
    setSaving(true);
    try {
      await academicAPI.createSection({
        classId,
        name: name.toUpperCase().trim(),
        maxStrength: Number(maxStrength),
        classTeacherId: classTeacherId || null
      });
      toast.success(`Section ${name} created successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Section</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-control" value={classId} onChange={e => setClassId(e.target.value)} required>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Section Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. A, B, C"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Student Capacity</label>
                <input
                  type="number"
                  className="form-control"
                  value={maxStrength}
                  onChange={e => setMaxStrength(e.target.value)}
                  min="10"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Class Teacher</label>
              <select className="form-control" value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)}>
                <option value="">-- Assign Class Teacher (Optional) --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.staff_id})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSubjectModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Subject name and code are required');
      return;
    }
    setSaving(true);
    try {
      await academicAPI.createSubject(form);
      toast.success('Subject created!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Subject</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input
                className="form-control"
                placeholder="e.g. Mathematics"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Code *</label>
              <input
                className="form-control"
                placeholder="e.g. MATH01"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Optional subject description or syllabus details"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddYearModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await academicAPI.createYear(form);
      toast.success('Academic Year created!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create academic year');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add Academic Session</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Session Name *</label>
              <input
                className="form-control"
                placeholder="e.g. 2026-2027"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
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
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={e => setForm(f => ({ ...f, isCurrent: e.target.checked }))}
                />
                <span>Set as Active / Current Academic Year</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Academic() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'subjects' | 'teachers' | 'years'

  // Data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [clRes, secRes, subRes, yrRes, tchRes, asgRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSections(),
        academicAPI.getSubjects(),
        academicAPI.getYears(),
        staffAPI.getAll({ staff_type: 'Teaching' }),
        academicAPI.getTeacherAssignments(),
      ]);
      setClasses(clRes.data.classes || []);
      setSections(secRes.data.sections || []);
      setSubjects(subRes.data.subjects || []);
      setYears(yrRes.data.years || []);
      setTeachers(tchRes.data.staff || []);
      setTeacherAssignments(asgRes.data.assignments || []);
    } catch (err) {
      toast.error('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Academic Management</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Classes 1 to 12 structure, sections, curriculum subjects, and academic sessions
          </p>
        </div>

        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'classes' && (
              <button onClick={() => setShowSectionModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Section
              </button>
            )}
            {activeTab === 'subjects' && (
              <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Subject
              </button>
            )}
            {activeTab === 'years' && (
              <button onClick={() => setShowYearModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Academic Year
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {[
            { id: 'classes', label: 'Classes 1 - 12 & Sections', icon: Layers },
            { id: 'subjects', label: 'Subjects Curriculum', icon: BookOpen },
            { id: 'teachers', label: 'Teacher Allocations', icon: UserCheck },
            { id: 'years', label: 'Academic Sessions', icon: Calendar },
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

      {/* TAB 1: CLASSES & SECTIONS */}
      {activeTab === 'classes' && (
        <div>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {classes.map(cls => {
                const classSections = sections.filter(s => s.class_id === cls.id);
                const totalStudents = classSections.reduce((sum, s) => sum + (s.student_count || 0), 0);
                return (
                  <div key={cls.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{cls.name}</h3>
                      <span className="badge badge-primary">{totalStudents} Students</span>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '6px' }}>SECTIONS</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {classSections.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>No sections yet</span>
                        ) : (
                          classSections.map(sec => (
                            <div
                              key={sec.id}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--primary-50)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <strong>Section {sec.name}</strong>
                              <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>({sec.student_count || 0}/{sec.max_strength || 40})</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '10px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Numeric Grade: {cls.numeric_value} &bull; Status: Active
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Curriculum Subjects Directory</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Name</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{s.code}</span></td>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ color: 'var(--gray-500)' }}>{s.description || 'Core curriculum'}</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER ALLOCATIONS */}
      {activeTab === 'teachers' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Faculty Subject Allocations</h3>
          {teacherAssignments.length === 0 ? (
            <p style={{ color: 'var(--gray-400)' }}>No teacher allocations found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Staff ID</th>
                    <th>Class & Section</th>
                    <th>Subject Assigned</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherAssignments.map((ta, i) => (
                    <tr key={i}>
                      <td><strong>{ta.teacher_name}</strong></td>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--gray-500)' }}>{ta.staff_id}</span></td>
                      <td>{ta.class_name} - Section {ta.section_name}</td>
                      <td><span className="badge badge-primary">{ta.subject_name}</span></td>
                      <td style={{ color: 'var(--gray-500)' }}>{ta.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACADEMIC SESSIONS */}
      {activeTab === 'years' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Academic Years & Sessions</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Academic Session</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Current Active</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.id}>
                    <td><strong>{y.name}</strong></td>
                    <td>{y.start_date}</td>
                    <td>{y.end_date}</td>
                    <td>
                      {y.is_current ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Active Current Session
                        </span>
                      ) : (
                        <span className="badge badge-secondary">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSectionModal && (
        <AddSectionModal
          classes={classes}
          teachers={teachers}
          onClose={() => setShowSectionModal(false)}
          onSuccess={() => loadAll()}
        />
      )}

      {showSubjectModal && (
        <AddSubjectModal
          onClose={() => setShowSubjectModal(false)}
          onSuccess={() => loadAll()}
        />
      )}

      {showYearModal && (
        <AddYearModal
          onClose={() => setShowYearModal(false)}
          onSuccess={() => loadAll()}
        />
      )}
    </div>
  );
}
