import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Search, Edit2, Key, CheckCircle,
  XCircle, Shield, Building, Layers, Eye, RefreshCw
} from 'lucide-react';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [resettingAdmin, setResettingAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State for Create & Edit
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    designation: 'School Principal & Director',
    managedClasses: 'Classes 1 to 12 (All Classes)',
    campusName: 'Main Campus',
    branchCode: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getAdmins();
      setAdmins(res.data.admins || []);
    } catch (err) {
      toast.error('Failed to load school administrators');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      designation: 'School Principal & Director',
      managedClasses: 'Classes 1 to 12 (All Classes)',
      campusName: 'Main Campus',
      branchCode: '',
      notes: '',
      isActive: true
    });
    setShowCreateModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.first_name,
      lastName: admin.last_name || '',
      username: admin.username,
      password: '',
      email: admin.email || '',
      phone: admin.phone || '',
      designation: admin.designation || 'School Administrator',
      managedClasses: admin.managed_classes || 'Classes 1 to 12 (All Classes)',
      campusName: admin.campus_name || 'Main Campus',
      branchCode: admin.branch_code || '',
      notes: admin.notes || '',
      isActive: admin.is_active === 1
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.firstName) {
      toast.error('Username, password and first name are required');
      return;
    }
    setSaving(true);
    try {
      await superAdminAPI.createAdmin(formData);
      toast.success(`Admin @${formData.username} created successfully!`);
      setShowCreateModal(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSaving(true);
    try {
      await superAdminAPI.updateAdmin(editingAdmin.id, formData);
      toast.success(`Admin @${editingAdmin.username} updated!`);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const action = admin.is_active ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} administrator @${admin.username}?`)) {
      return;
    }
    try {
      const res = await superAdminAPI.toggleStatus(admin.id);
      toast.success(res.data.message);
      fetchAdmins();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingAdmin || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await superAdminAPI.resetPassword(resettingAdmin.id, { newPassword });
      toast.success(`Password reset for @${resettingAdmin.username}`);
      setResettingAdmin(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const filteredAdmins = admins.filter(a => {
    const matchSearch =
      a.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase()) ||
      a.campus_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.managed_classes?.toLowerCase().includes(search.toLowerCase()) ||
      a.designation?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && a.is_active === 1) ||
      (filterStatus === 'inactive' && a.is_active === 0);

    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--gray-900)' }}>
            Manage School Administrators
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            Provision, oversee, and configure admins responsible for different class wings and campuses
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} /> Provision New Admin
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by Admin name, username, classes, or campus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses ({admins.length})</option>
              <option value="active">Active Only ({admins.filter(a => a.is_active === 1).length})</option>
              <option value="inactive">Suspended Only ({admins.filter(a => a.is_active === 0).length})</option>
            </select>

            <button className="btn btn-secondary" onClick={fetchAdmins} title="Refresh Roster">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--gray-500)' }}>Loading administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
            <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No Administrators Found</h3>
            <p>Try adjusting your search criteria or provision a new administrator.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Designation</th>
                  <th>Governed Classes</th>
                  <th>Campus / Branch</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                        {admin.first_name} {admin.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>@{admin.username}</span>
                        {admin.email && <span>· {admin.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {admin.designation || 'School Administrator'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                        {admin.managed_classes || 'Classes 1 to 12'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>{admin.campus_name || 'Main Campus'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>Code: {admin.branch_code || `ADM-${admin.id}`}</div>
                    </td>
                    <td>
                      {admin.is_active ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> Suspended
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-IN') : 'Never'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEditModal(admin)}
                          title="Edit Admin Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setResettingAdmin(admin); setNewPassword(''); }}
                          title="Reset Password"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${admin.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(admin)}
                          title={admin.is_active ? 'Suspend Admin' : 'Activate Admin'}
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          {admin.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision New Admin Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Provision New School Administrator</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Anita"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Deshmukh"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Login Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. admin.primary"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@school.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Official Designation *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Primary Wing Headmistress & Administrator"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Managed Classes / Wing *</label>
                  <select
                    className="form-control"
                    value={formData.managedClasses}
                    onChange={e => setFormData({ ...formData, managedClasses: e.target.value })}
                  >
                    <option value="Classes 1 to 5 (Primary Wing)">Classes 1 to 5 (Primary Wing)</option>
                    <option value="Classes 6 to 8 (Middle Wing)">Classes 6 to 8 (Middle Wing)</option>
                    <option value="Classes 9 to 10 (Secondary Wing)">Classes 9 to 10 (Secondary Wing)</option>
                    <option value="Classes 11 to 12 (Senior Wing)">Classes 11 to 12 (Senior Wing)</option>
                    <option value="Classes 6 to 12 (Secondary & Senior)">Classes 6 to 12 (Secondary & Senior)</option>
                    <option value="Classes 1 to 12 (All Classes)">Classes 1 to 12 (All Classes)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Campus / Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. North Campus - Junior Wing"
                    value={formData.campusName}
                    onChange={e => setFormData({ ...formData, campusName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Branch / Admin ID Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ADM-002"
                  value={formData.branchCode}
                  onChange={e => setFormData({ ...formData, branchCode: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Provisioning...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Administrator: @{editingAdmin.username}</h3>
              <button className="modal-close" onClick={() => setEditingAdmin(null)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Official Designation *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Managed Classes / Wing *</label>
                  <select
                    className="form-control"
                    value={formData.managedClasses}
                    onChange={e => setFormData({ ...formData, managedClasses: e.target.value })}
                  >
                    <option value="Classes 1 to 5 (Primary Wing)">Classes 1 to 5 (Primary Wing)</option>
                    <option value="Classes 6 to 8 (Middle Wing)">Classes 6 to 8 (Middle Wing)</option>
                    <option value="Classes 9 to 10 (Secondary Wing)">Classes 9 to 10 (Secondary Wing)</option>
                    <option value="Classes 11 to 12 (Senior Wing)">Classes 11 to 12 (Senior Wing)</option>
                    <option value="Classes 6 to 12 (Secondary & Senior)">Classes 6 to 12 (Secondary & Senior)</option>
                    <option value="Classes 1 to 12 (All Classes)">Classes 1 to 12 (All Classes)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Campus / Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.campusName}
                    onChange={e => setFormData({ ...formData, campusName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Branch / Admin ID Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.branchCode}
                  onChange={e => setFormData({ ...formData, branchCode: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingAdmin && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Admin Password</h3>
              <button className="modal-close" onClick={() => setResettingAdmin(null)}>×</button>
            </div>

            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '16px' }}>
                Set a new password for administrator <strong>{resettingAdmin.first_name} {resettingAdmin.last_name}</strong> (<code>@{resettingAdmin.username}</code>).
              </p>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResettingAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
