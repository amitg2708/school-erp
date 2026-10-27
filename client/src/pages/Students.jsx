import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI, academicAPI, studentsCSVAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Search, Plus, Eye, Edit, UserX, Filter, X, ChevronDown, Download, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';

function ImportStudentsModal({ onClose, onSuccess, classes, years }) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [uploading, setUploading] = useState(false);

  const curYear = years.find(y => y.is_current)?.id || years[0]?.id;

  const downloadSampleTemplate = () => {
    const header = 'firstName,lastName,gender,dateOfBirth,bloodGroup,classNumeric,sectionName,fatherName,motherName,phone,emergencyContact,address\n';
    const sample = 'Ravi,Kumar,Male,2010-05-15,O+,10,A,Manoj Kumar,Seema Kumar,9876500001,9876500001,"12 Model Town, City"\nPooja,Sharma,Female,2010-08-20,B+,10,B,Rakesh Sharma,Anita Sharma,9876500002,9876500002,"45 Park Road, City"';
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setParsedRows([]);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] || '';
        });

        // Find class
        const targetClass = classes.find(c => String(c.numeric_value) === String(row.classNumeric) || c.name.toLowerCase() === `class ${row.classNumeric}`.toLowerCase());
        
        rows.push({
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          gender: row.gender || 'Male',
          dateOfBirth: row.dateOfBirth || '',
          bloodGroup: row.bloodGroup || 'O+',
          classId: targetClass ? targetClass.id : classes[0]?.id,
          className: targetClass ? targetClass.name : `Class ${row.classNumeric}`,
          sectionName: row.sectionName || 'A',
          academicYearId: curYear,
          fatherName: row.fatherName || '',
          motherName: row.motherName || '',
          phone: row.phone || '',
          emergencyContact: row.emergencyContact || row.phone || '',
          address: row.address || ''
        });
      }
      setParsedRows(rows);
    } catch (err) {
      toast.error('Failed to parse CSV');
    }
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      toast.error('No students parsed to import');
      return;
    }
    setUploading(true);
    try {
      const res = await studentsCSVAPI.importCsv({ students: parsedRows });
      toast.success(res.data.message || `Successfully imported ${res.data.count} students!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} color="var(--primary)" />
            <h3 className="modal-title">Bulk Student Import (CSV)</h3>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--primary-50)', padding: '14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ color: 'var(--primary-dark)', fontSize: '0.9rem' }}>Download CSV Template</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Use this standardized format with pre-configured headers</div>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff' }}
            >
              <Download size={14} /> Download Sample CSV
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="form-control"
              onChange={handleFileUpload}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Or Paste CSV Content</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="firstName,lastName,gender,dateOfBirth,bloodGroup,classNumeric,sectionName,fatherName,motherName,phone,emergencyContact,address&#10;Ravi,Kumar,Male,2010-05-15,O+,10,A,Manoj Kumar,Seema Kumar,9876500001,9876500001,City"
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value);
                parseCSV(e.target.value);
              }}
            />
          </div>

          {parsedRows.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                  Parsed Student Preview ({parsedRows.length} Rows)
                </span>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Valid Format
                </span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px' }}>
                <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      <th>#</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Class</th>
                      <th>Parent</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td><strong>{r.firstName} {r.lastName}</strong></td>
                        <td>{r.gender}</td>
                        <td>{r.className} ({r.sectionName})</td>
                        <td>{r.fatherName || '-'}</td>
                        <td>{r.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImportSubmit}
            disabled={uploading || parsedRows.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={16} /> {uploading ? 'Importing...' : `Import ${parsedRows.length} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onSuccess, years, classes, sections, setSectionsForClass }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', address: '',
    emergencyContact: '', admissionDate: new Date().toISOString().split('T')[0],
    classId: '', sectionId: '', academicYearId: '',
    fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', parentEmail: ''
  });
  const [localSections, setLocalSections] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleClassChange = async (classId) => {
    setForm(f => ({ ...f, classId, sectionId: '' }));
    if (classId) {
      const res = await academicAPI.getSections({ class_id: classId });
      setLocalSections(res.data.sections);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.classId || !form.sectionId || !form.academicYearId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const res = await studentsAPI.create(form);
      toast.success(`Student added! ID: ${res.data.studentId}, Login: ${res.data.loginCredentials?.username}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Student</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: '12px' }}>
              Personal Information
            </p>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-control" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admission Date *</label>
                <input type="date" className="form-control" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} placeholder="Full address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input className="form-control" placeholder="Emergency contact number" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
            </div>

            <hr className="divider" />
            <p style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: '12px' }}>
              Academic Enrollment
            </p>
            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label">Academic Year *</label>
                <select className="form-control" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))} required>
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select className="form-control" value={form.classId} onChange={e => handleClassChange(e.target.value)} required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <select className="form-control" value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))} required disabled={!form.classId}>
                  <option value="">Select Section</option>
                  {localSections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                </select>
              </div>
            </div>

            <hr className="divider" />
            <p style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: '12px' }}>
              Parent Information
            </p>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Father's Name</label>
                <input className="form-control" placeholder="Father's full name" value={form.fatherName} onChange={e => setForm(f => ({ ...f, fatherName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mother's Name</label>
                <input className="form-control" placeholder="Mother's full name" value={form.motherName} onChange={e => setForm(f => ({ ...f, motherName: e.target.value }))} />
              </div>
            </div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Father's Phone</label>
                <input className="form-control" placeholder="Father's phone" value={form.fatherPhone} onChange={e => setForm(f => ({ ...f, fatherPhone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mother's Phone</label>
                <input className="form-control" placeholder="Mother's phone" value={form.motherPhone} onChange={e => setForm(f => ({ ...f, motherPhone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Parent Email</label>
              <input type="email" className="form-control" placeholder="Parent's email address" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({ academicYearId: '', classId: '', sectionId: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(null);

  useEffect(() => {
    Promise.all([
      academicAPI.getYears(),
      academicAPI.getClasses(),
    ]).then(([yearsRes, classesRes]) => {
      setYears(yearsRes.data.years);
      setClasses(classesRes.data.classes);
      const cur = yearsRes.data.years.find(y => y.is_current);
      if (cur) {
        setCurrentYear(cur);
        setFilters(f => ({ ...f, academicYearId: String(cur.id) }));
      }
    });
  }, []);

  useEffect(() => {
    if (filters.classId) {
      academicAPI.getSections({ class_id: filters.classId }).then(r => {
        setSections(r.data.sections);
        setFilters(f => ({ ...f, sectionId: '' }));
      });
    } else {
      setSections([]);
    }
  }, [filters.classId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.academicYearId) params.academic_year_id = filters.academicYearId;
      if (filters.classId) params.class_id = filters.classId;
      if (filters.sectionId) params.section_id = filters.sectionId;
      if (filters.search) params.search = filters.search;
      const res = await studentsAPI.getAll(params);
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters.academicYearId, filters.classId, filters.sectionId]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchStudents();
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate student ${name}?`)) return;
    try {
      await studentsAPI.deactivate(id);
      toast.success('Student deactivated');
      fetchStudents();
    } catch {
      toast.error('Failed to deactivate student');
    }
  };

  const getGenderBadge = (gender) => {
    if (gender === 'Male') return <span className="badge badge-info">Male</span>;
    if (gender === 'Female') return <span className="badge badge-orange">Female</span>;
    return gender ? <span className="badge badge-gray">{gender}</span> : null;
  };

  const filteredStudents = filters.search
    ? students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : students;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{filteredStudents.length} students found</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const header = 'Student ID,Admission No,First Name,Last Name,Gender,Class,Section,Roll No,Admission Date\n';
              const rows = filteredStudents.map(s => 
                `"${s.student_id || ''}","${s.admission_number || ''}","${s.first_name || ''}","${s.last_name || ''}","${s.gender || ''}","${s.class_name || ''}","${s.section_name || ''}","${s.roll_number || ''}","${s.admission_date || ''}"`
              ).join('\n');
              const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success(`Exported ${filteredStudents.length} students to CSV`);
            }}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={15} /> Export CSV
          </button>

          {user?.role === 'admin' && (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setShowImportModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Upload size={15} /> Import CSV
              </button>
              <button id="add-student-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name, ID..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={handleSearch}
            />
          </div>
          <select
            className="form-control"
            style={{ minWidth: '130px' }}
            value={filters.academicYearId}
            onChange={e => setFilters(f => ({ ...f, academicYearId: e.target.value }))}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select
            className="form-control"
            style={{ minWidth: '130px' }}
            value={filters.classId}
            onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {sections.length > 0 && (
            <select
              className="form-control"
              style={{ minWidth: '120px' }}
              value={filters.sectionId}
              onChange={e => setFilters(f => ({ ...f, sectionId: e.target.value }))}
            >
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchStudents}>
            Search
          </button>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Search size={48} />
            <h3>No students found</h3>
            <p>Try adjusting your filters or add a new student</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card desktop-table">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Class</th>
                    <th>Roll No.</th>
                    <th>Gender</th>
                    <th>Parent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                          <div>
                            <div className="student-name">{s.first_name} {s.last_name}</div>
                            <div className="student-id">{s.admission_number}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.student_id}</span></td>
                      <td>{s.class_name ? `${s.class_name} - ${s.section_name}` : <span className="text-muted">Not enrolled</span>}</td>
                      <td>{s.roll_number || '—'}</td>
                      <td>{getGenderBadge(s.gender)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{s.father_name || s.mother_name || '—'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-sm btn-secondary btn-icon" onClick={() => navigate(`/students/${s.id}`)} title="View Profile">
                            <Eye size={15} />
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeactivate(s.id, `${s.first_name} ${s.last_name}`)} title="Deactivate">
                              <UserX size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredStudents.map(s => (
              <div
                key={s.id}
                className="card"
                style={{ padding: '12px', cursor: 'pointer' }}
                onClick={() => navigate(`/students/${s.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="student-avatar" style={{ width: '44px', height: '44px', fontSize: '1rem', background: 'var(--primary-100)', color: 'var(--primary)' }}>
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                        {s.first_name} {s.last_name}
                      </span>
                      {getGenderBadge(s.gender)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-500)' }}>{s.student_id}</span>
                      {s.class_name && (
                        <>
                          <span style={{ color: 'var(--gray-300)' }}>·</span>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {s.class_name} - {s.section_name}
                          </span>
                        </>
                      )}
                      {s.roll_number && (
                        <>
                          <span style={{ color: 'var(--gray-300)' }}>·</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Roll #{s.roll_number}</span>
                        </>
                      )}
                    </div>
                    {(s.father_name || s.mother_name) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '2px' }}>
                        Parent: {s.father_name || s.mother_name} · {s.father_phone || s.mother_phone || ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <AddStudentModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchStudents}
          years={years}
          classes={classes}
          sections={sections}
        />
      )}

      {showImportModal && (
        <ImportStudentsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchStudents}
          classes={classes}
          years={years}
        />
      )}
    </div>
  );
}
