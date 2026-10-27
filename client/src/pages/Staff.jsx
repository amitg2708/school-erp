import { useState, useEffect } from 'react';
import { staffAPI, academicAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, Filter, BookOpen, Mail, Phone,
  Calendar, CheckCircle, XCircle, Trash2, Edit, X, Award, Briefcase
} from 'lucide-react';

function AddStaffModal({ onClose, onSuccess, departments }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', gender: 'Male',
    dateOfBirth: '', bloodGroup: 'O+', address: '', departmentId: '',
    designation: '', staffType: 'Teaching', qualification: '',
    joiningDate: new Date().toISOString().split('T')[0], employmentStatus: 'Permanent'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.staffType) {
      toast.error('First Name and Staff Type are required');
      return;
    }
    setSaving(true);
    try {
      const res = await staffAPI.create(form);
      toast.success(`Staff added! ID: ${res.data.staffId}. Login: ${res.data.loginCredentials?.username}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Staff / Teacher</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Rahul"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  className="form-control"
                  placeholder="e.g. Sharma"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Staff Type *</label>
                <select
                  className="form-control"
                  value={form.staffType}
                  onChange={e => setForm(f => ({ ...f, staffType: e.target.value }))}
                  required
                >
                  <option value="Teaching">Teaching Staff (Teacher)</option>
                  <option value="Non-Teaching">Non-Teaching</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Librarian">Librarian</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-control"
                  value={form.departmentId}
                  onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  className="form-control"
                  placeholder="e.g. Senior Math Teacher"
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input
                  className="form-control"
                  placeholder="e.g. M.Sc, B.Ed"
                  value={form.qualification}
                  onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="staff@school.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-control"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.joiningDate}
                  onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Employment</label>
                <select
                  className="form-control"
                  value={form.employmentStatus}
                  onChange={e => setForm(f => ({ ...f, employmentStatus: e.target.value }))}
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Residential address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignTeacherModal({ staffMember, onClose, onSuccess, classes, subjects, years }) {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

  const currentYear = years.find(y => y.is_current)?.id || years[0]?.id;

  const handleClassChange = async (cid) => {
    setClassId(cid);
    setSectionId('');
    if (cid) {
      const res = await academicAPI.getSections({ class_id: cid });
      setSections(res.data.sections);
    } else {
      setSections([]);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!classId || !sectionId || !subjectId) {
      toast.error('Please select class, section, and subject');
      return;
    }
    setSaving(true);
    try {
      await staffAPI.assignTeacher({
        staffId: staffMember.id,
        classId,
        sectionId,
        subjectId,
        academicYearId: currentYear
      });
      toast.success(`Assigned ${staffMember.first_name} successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to assign teacher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Assign Subject & Class</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleAssign}>
          <div className="modal-body">
            <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <strong>{staffMember.first_name} {staffMember.last_name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{staffMember.designation || 'Teacher'} &bull; {staffMember.staff_id}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-control" value={classId} onChange={e => handleClassChange(e.target.value)} required>
                <option value="">-- Select Class (1 to 12) --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section *</label>
              <select className="form-control" value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId} required>
                <option value="">-- Select Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select className="form-control" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                <option value="">-- Select Subject --</option>
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>)}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [staffTypeFilter, deptFilter]);

  const loadInitialData = async () => {
    try {
      const [deptRes, classRes, subRes, yearRes] = await Promise.all([
        staffAPI.getDepartments(),
        academicAPI.getClasses(),
        academicAPI.getSubjects(),
        academicAPI.getYears(),
      ]);
      setDepartments(deptRes.data.departments || []);
      setClasses(classRes.data.classes || []);
      setSubjects(subRes.data.subjects || []);
      setYears(yearRes.data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffAPI.getAll({
        staff_type: staffTypeFilter || undefined,
        department_id: deptFilter || undefined,
        search: search || undefined
      });
      setStaffList(res.data.staff || []);
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await staffAPI.deactivate(id);
      toast.success(`${name} deactivated`);
      fetchStaff();
    } catch (err) {
      toast.error('Failed to deactivate staff');
    }
  };

  // Stats calculation
  const totalStaff = staffList.length;
  const teachingStaff = staffList.filter(s => s.staff_type === 'Teaching').length;
  const nonTeaching = totalStaff - teachingStaff;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Staff & Teachers</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Manage teaching faculty, departments, and class allocations
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add New Staff
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-100)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>TOTAL STAFF</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{totalStaff}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>TEACHING FACULTY</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{teachingStaff}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-light)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>NON-TEACHING</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{nonTeaching}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search staff by name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-outline">Search</button>
          </form>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '150px' }}
              value={staffTypeFilter}
              onChange={e => setStaffTypeFilter(e.target.value)}
            >
              <option value="">All Staff Types</option>
              <option value="Teaching">Teaching Faculty</option>
              <option value="Non-Teaching">Non-Teaching</option>
              <option value="Administrative">Administrative</option>
              <option value="Accountant">Accountant</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid / Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : staffList.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <Users size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Staff Members Found</h3>
          <p>Try adjusting your search criteria or add new staff.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {staffList.map(member => (
            <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: member.staff_type === 'Teaching' ? 'var(--primary-100)' : 'var(--orange-light)',
                      color: member.staff_type === 'Teaching' ? 'var(--primary)' : 'var(--orange)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}>
                      {member.first_name[0]}{member.last_name ? member.last_name[0] : ''}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
                        {member.first_name} {member.last_name}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {member.designation || member.staff_type}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${member.staff_type === 'Teaching' ? 'badge-primary' : 'badge-info'}`}>
                    {member.staff_type}
                  </span>
                </div>

                <div style={{ fontSize: '0.825rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={14} color="var(--gray-400)" />
                    <span>ID: <strong style={{ color: 'var(--gray-800)' }}>{member.staff_id}</strong> &bull; Dept: {member.department_name || 'General'}</span>
                  </div>
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--gray-400)" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} color="var(--gray-400)" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {member.qualification && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={14} color="var(--gray-400)" />
                      <span>{member.qualification}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {user?.role === 'admin' && (
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}>
                  {member.staff_type === 'Teaching' && (
                    <button
                      onClick={() => setAssigningStaff(member)}
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <BookOpen size={14} /> Assign Class
                    </button>
                  )}
                  <button
                    onClick={() => handleDeactivate(member.id, member.first_name)}
                    className="btn btn-outline"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '6px 10px' }}
                    title="Deactivate staff"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          departments={departments}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => fetchStaff()}
        />
      )}

      {/* Assign Teacher Modal */}
      {assigningStaff && (
        <AssignTeacherModal
          staffMember={assigningStaff}
          classes={classes}
          subjects={subjects}
          years={years}
          onClose={() => setAssigningStaff(null)}
          onSuccess={() => fetchStaff()}
        />
      )}
    </div>
  );
}
