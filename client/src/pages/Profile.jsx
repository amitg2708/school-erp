import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  User, Shield, Lock, Key, LogOut, CheckCircle,
  Mail, Phone, Clock, Award, Briefcase, Building,
  Calendar, Droplets, Users, BookOpen, Palette, Check
} from 'lucide-react';
import { useTheme } from '../utils/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const profile = user?.profileInfo || {};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const designation = profile.designation || (
    user?.role === 'superadmin' ? 'Platform Super Administrator' :
    user?.role === 'admin' ? 'Principal & School Director' :
    user?.role === 'teacher' ? 'Faculty Member' :
    user?.role === 'accountant' ? 'Chief School Accountant & Bursar' :
    user?.role === 'staff' ? 'Senior School Staff' :
    user?.role === 'parent' ? 'Parent & Legal Guardian' : 'Enrolled Student'
  );

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>My Institutional Profile</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          Official institutional designation, verified academic credentials, and security management
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '16px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: '800',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0
            }}>
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>

            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--gray-900)' }}>
                {user?.firstName} {user?.lastName}
              </h2>
              <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>
                {designation}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {user?.role}
                </span>
                {(profile.staff_id || profile.student_id) && (
                  <span className="badge badge-secondary">
                    ID: {profile.staff_id || profile.student_id}
                  </span>
                )}
                {profile.roll_number && (
                  <span className="badge badge-secondary">
                    Roll #{profile.roll_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={16} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Login Username</div>
                <strong style={{ color: 'var(--gray-900)' }}>@{user?.username}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={16} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</div>
                <strong style={{ color: 'var(--gray-900)' }}>{user?.email || 'office@school.edu'}</strong>
              </div>
            </div>

            {user?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Contact Phone</div>
                  <strong style={{ color: 'var(--gray-900)' }}>{user.phone}</strong>
                </div>
              </div>
            )}

            {profile.department_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Department / Faculty</div>
                  <strong style={{ color: 'var(--gray-900)' }}>{profile.department_name}</strong>
                </div>
              </div>
            )}

            {profile.qualification && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Award size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Academic Qualification</div>
                  <strong style={{ color: 'var(--gray-900)' }}>{profile.qualification}</strong>
                </div>
              </div>
            )}

            {(profile.joining_date || profile.admission_date) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {profile.joining_date ? 'Date of Appointment' : 'Admission Date'}
                  </div>
                  <strong style={{ color: 'var(--gray-900)' }}>
                    {profile.joining_date || profile.admission_date}
                  </strong>
                </div>
              </div>
            )}

            {profile.blood_group && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Droplets size={16} color="var(--danger)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Blood Group</div>
                  <strong style={{ color: 'var(--gray-900)' }}>{profile.blood_group}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={16} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Security Authorization</div>
                <strong style={{ textTransform: 'capitalize', color: 'var(--gray-900)' }}>{user?.role} Role Authorization</strong>
              </div>
            </div>
          </div>

          {/* Children section if parent */}
          {user?.role === 'parent' && profile.children && profile.children.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--gray-100)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Linked Children in School
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.children.map(ch => (
                  <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                        {ch.first_name} {ch.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {ch.class_name} - {ch.section_name} · Roll #{ch.roll_number}
                      </div>
                    </div>
                    <span className="badge badge-primary">{ch.student_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '16px', marginTop: '20px' }}>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut size={16} /> Sign Out of System
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--primary)" /> Change Security Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Key size={16} /> {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Visual Appearance & Theme Card */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} color="var(--primary)" /> Workspace Appearance & Visual Theme
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
              Choose your personal institutional aesthetic. Your theme preference is saved and applied across all modules.
            </p>
          </div>
          <span className="badge badge-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            Active: {themes.find(t => t.id === theme)?.name || 'Executive Indigo'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {themes.map(t => (
            <div
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                toast.success(`Theme switched to ${t.name}`);
              }}
              className={`theme-preview-card ${theme === t.id ? 'selected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="theme-dot" style={{ backgroundColor: t.primaryColor, width: '16px', height: '16px' }} />
                  <span className="theme-dot" style={{ backgroundColor: t.secondaryColor, width: '12px', height: '12px' }} />
                </div>
                {theme === t.id && (
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, gap: '2px' }}>
                    <Check size={14} /> Active
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
