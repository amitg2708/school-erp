import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { superAdminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Users, School, Layers, UserPlus,
  ArrowRight, CheckCircle2, XCircle, Search, Key,
  Edit, Bell, ExternalLink, Activity
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick provision modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    designation: 'School Principal & Director',
    managedClasses: 'Classes 1 to 12',
    campusName: 'Main Campus',
    branchCode: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getStats();
      setStats(res.data.stats);
    } catch (err) {
      toast.error('Failed to load Super Admin dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.firstName) {
      toast.error('Username, password, and first name are required');
      return;
    }
    setSaving(true);
    try {
      await superAdminAPI.createAdmin(formData);
      toast.success(`Admin @${formData.username} created successfully!`);
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        designation: 'School Principal & Director',
        managedClasses: 'Classes 1 to 12',
        campusName: 'Main Campus',
        branchCode: '',
        notes: ''
      });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: '36px', width: '300px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '20px', width: '450px', marginBottom: '24px' }} />
        <div className="stat-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '110px' }} />)}
        </div>
      </div>
    );
  }

  const wings = stats?.wings || [];

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        color: 'white',
        borderRadius: '16px',
        padding: '28px 24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '10px' }}>
              <ShieldCheck size={16} /> Central Platform Directorate
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff' }}>
              Welcome, Super Admin {user?.firstName}! 👑
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', maxWidth: '650px', lineHeight: 1.5 }}>
              Central administrative control plane. You manage the School Administrators who operate different classes, wings, and campuses in this web application.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{
              background: '#ffffff',
              color: '#312e81',
              fontWeight: '700',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <UserPlus size={18} /> Provision New Admin
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #4338ca' }}>
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Users size={22} color="#4338ca" />
          </div>
          <div className="stat-value">{stats?.totalAdmins || 0}</div>
          <div className="stat-label">Total School Admins</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <CheckCircle2 size={22} color="var(--success)" />
          </div>
          <div className="stat-value">{stats?.activeAdmins || 0}</div>
          <div className="stat-label">Active Administrators</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <School size={22} color="#d97706" />
          </div>
          <div className="stat-value">{stats?.totalClasses || 12}</div>
          <div className="stat-label">Classes (1 to 12)</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-icon" style={{ background: '#e0f2fe' }}>
            <Layers size={22} color="var(--info)" />
          </div>
          <div className="stat-value">{stats?.totalStudents || 0}</div>
          <div className="stat-label">Total Enrolled Students</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          onClick={() => navigate('/superadmin/admins')}
          className="card"
          style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#4338ca" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Manage School Admins</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>Create, edit, suspend, or reset admin credentials</p>
          </div>
          <ArrowRight size={18} color="var(--gray-400)" />
        </div>

        <div
          onClick={() => navigate('/superadmin/overview')}
          className="card"
          style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <School size={24} color="#d97706" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Class Wings & Branches</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>Classes 1-12 division between school admins</p>
          </div>
          <ArrowRight size={18} color="var(--gray-400)" />
        </div>
      </div>

      {/* Multi-Class Admins Distribution */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">School Administrators & Managed Wings</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Each administrator governs their assigned classes or wing independently within the app.
            </p>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/superadmin/admins')}>
            View All Admins
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Admin Name & Code</th>
                <th>Designation</th>
                <th>Assigned Campus / Branch</th>
                <th>Managed Classes</th>
                <th>Status</th>
                <th>Login Username</th>
              </tr>
            </thead>
            <tbody>
              {wings.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                      {admin.first_name} {admin.last_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {admin.branch_code || `ADM-${admin.id}`}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {admin.designation || 'School Administrator'}
                    </span>
                  </td>
                  <td>{admin.campus_name || 'Main Campus'}</td>
                  <td>
                    <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                      {admin.managed_classes || 'Classes 1 to 12'}
                    </span>
                  </td>
                  <td>
                    {admin.is_active ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> Suspended
                      </span>
                    )}
                  </td>
                  <td>
                    <code style={{ background: 'var(--gray-100)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      @{admin.username}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Boundary Notice */}
      <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
              Super Admin Architectural Boundary
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              As Super Administrator, you provision and manage the School Admins who oversee different class ranges (e.g. Primary Wing Classes 1–5, Senior Wing Classes 6–12). You do not take daily student attendance, enter exam scores, or collect student fees—those operational tasks are handled strictly by the respective School Admins and faculty.
            </p>
          </div>
        </div>
      </div>

      {/* Provision New Admin Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Provision New School Administrator</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateAdmin}>
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
    </div>
  );
}
