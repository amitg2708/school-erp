import { useState, useEffect } from 'react';
import { materialsAPI, academicAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Search, Download, Trash2,
  FileText, ExternalLink, Calendar, User, X, Filter
} from 'lucide-react';

function UploadMaterialModal({ onClose, onSuccess, classes, subjects }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: classes[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    fileType: 'PDF',
    fileUrl: '',
    fileName: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      await materialsAPI.create({
        ...form,
        fileName: form.fileName || `${form.title.replace(/\s+/g, '_')}.${form.fileType.toLowerCase()}`,
        fileUrl: form.fileUrl || `https://example.com/materials/${form.title.replace(/\s+/g, '-').toLowerCase()}`
      });
      toast.success('Study material uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to upload material');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Upload Study Material / Notes</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Material Title *</label>
              <input
                className="form-control"
                placeholder="e.g. Chapter 5 Organic Chemistry Formula Sheet"
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
                  onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                  required
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

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
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select
                  className="form-control"
                  value={form.fileType}
                  onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Syllabus">Curriculum Syllabus</option>
                  <option value="Presentation">Slide Deck / PPT</option>
                  <option value="Notes">Revision Notes</option>
                  <option value="Worksheet">Practice Worksheet</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">File Name (Optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g. Chem_Notes_Ch5.pdf"
                  value={form.fileName}
                  onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Resource Web Link or Drive URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://drive.google.com/file/d/..."
                value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Summary</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Important concepts covered, chapter breakdown, or instructions..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Uploading...' : 'Publish Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudyMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [classFilter, subjectFilter]);

  const loadMeta = async () => {
    try {
      const [clRes, subRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSubjects()
      ]);
      setClasses(clRes.data.classes || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialsAPI.getAll({
        class_id: classFilter || undefined,
        subject_id: subjectFilter || undefined,
        search: search || undefined
      });
      setMaterials(res.data.materials || []);
    } catch (err) {
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study resource?')) return;
    try {
      await materialsAPI.delete(id);
      toast.success('Material removed');
      fetchMaterials();
    } catch (err) {
      toast.error('Failed to delete material');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Study Materials & Syllabus</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Curriculum guides, lecture notes, textbook references, and chapter worksheets
          </p>
        </div>

        {['admin', 'teacher'].includes(user?.role) && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Upload Study Material
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '220px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search notes, chapters, topics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-outline">Search</button>
          </form>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '150px' }}
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
            >
              <option value="">All Classes (1 - 12)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '150px' }}
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : materials.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Study Materials Found</h3>
          <p>No documents uploaded yet for this selection.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-primary">{m.subject_name}</span>
                  <span className="badge badge-info">{m.class_name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--primary-50)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', lineHeight: '1.3' }}>
                      {m.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>
                      {m.file_name} ({m.file_type || 'PDF'})
                    </span>
                  </div>
                </div>

                {m.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: '1.5', marginBottom: '14px' }}>
                    {m.description}
                  </p>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} />
                    <span>Uploaded by: <strong>{m.uploader_name || 'Faculty'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>Date: {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={m.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={e => {
                    if (!m.file_url || m.file_url === '#') {
                      e.preventDefault();
                      toast.success(`Downloading ${m.file_name || 'document'}...`);
                    }
                  }}
                >
                  <Download size={14} /> Download Document
                </a>

                {['admin', 'teacher'].includes(user?.role) && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="btn btn-icon btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    title="Remove resource"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMaterialModal
          classes={classes}
          subjects={subjects}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => fetchMaterials()}
        />
      )}
    </div>
  );
}
