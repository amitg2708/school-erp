import { useState, useEffect } from 'react';
import { leavesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, CheckCircle2, XCircle, Clock,
  FileText, Check, X, AlertCircle, Filter, User
} from 'lucide-react';

function ApplyLeaveModal({ onClose, onSuccess, types }) {
  const [form, setForm] = useState({
    leaveTypeId: types[0]?.id || '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  const handleDateChange = (from, to) => {
    const d1 = new Date(from);
    const d2 = new Date(to);
    const diffTime = Math.max(0, d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setForm(f => ({ ...f, fromDate: from, toDate: to, totalDays: diffDays > 0 ? diffDays : 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await leavesAPI.apply(form);
      toast.success('Leave application submitted successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Apply for Staff Leave</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Leave Category *</label>
              <select
                className="form-control"
                value={form.leaveTypeId}
                onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                required
              >
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Max {t.max_days || 15} days/year)</option>
                ))}
              </select>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.fromDate}
                  onChange={e => handleDateChange(e.target.value, form.toDate)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.toDate}
                  onChange={e => handleDateChange(form.fromDate, e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Calculated Working Days</label>
              <div style={{ padding: '8px 12px', background: 'var(--primary-50)', borderRadius: '8px', fontWeight: '700', color: 'var(--primary)' }}>
                {form.totalDays} Day{form.totalDays > 1 ? 's' : ''} Leave
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Absence *</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Brief reason for your leave request..."
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [typeRes, leaveRes] = await Promise.all([
        leavesAPI.getTypes(),
        leavesAPI.getAll(),
      ]);
      setTypes(typeRes.data.types || []);
      setLeaves(leaveRes.data.leaves || []);
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const remarks = window.prompt(`Enter optional remarks for ${status}:`, '');
    if (remarks === null) return;
    try {
      await leavesAPI.updateStatus(id, { status, remarks: remarks || null });
      toast.success(`Leave application marked as ${status}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const filteredLeaves = statusFilter
    ? leaves.filter(l => l.status === statusFilter)
    : leaves;

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Leave Management</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Faculty & staff leave applications, approval workflows, and leave quotas
          </p>
        </div>

        {['admin', 'teacher', 'staff'].includes(user?.role) && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Apply for Leave
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>PENDING APPROVAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--warning)' }}>{pendingCount}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>APPROVED LEAVES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>{approvedCount}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>LEAVE CATEGORIES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>{types.length}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['', 'Pending', 'Approved', 'Rejected'].map(st => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '50px',
                  border: active ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                  background: active ? 'var(--primary)' : '#ffffff',
                  color: active ? '#ffffff' : 'var(--gray-700)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {st || 'All Applications'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leave Applications List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filteredLeaves.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <Calendar size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Leave Applications</h3>
          <p>There are no leave records matching this filter.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {user?.role === 'admin' && <th>Applicant</th>}
                  <th>Leave Type</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {user?.role === 'admin' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(l => {
                  const badge =
                    l.status === 'Approved' ? 'badge-success' :
                    l.status === 'Rejected' ? 'badge-danger' : 'badge-warning';

                  return (
                    <tr key={l.id}>
                      {user?.role === 'admin' && (
                        <td>
                          <strong>{l.staff_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {l.staff_id} &bull; {l.designation || 'Staff'}
                          </div>
                        </td>
                      )}
                      <td>
                        <span className="badge badge-info">{l.leave_type_name}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{l.from_date} to {l.to_date}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{l.total_days} Day{l.total_days > 1 ? 's' : ''}</span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>{l.reason}</div>
                        {l.remarks && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '4px', fontStyle: 'italic' }}>
                            Remark: "{l.remarks}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badge}`}>{l.status}</span>
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          {l.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleUpdateStatus(l.id, 'Approved')}
                                className="btn btn-outline"
                                style={{ color: 'var(--success)', borderColor: 'var(--success-light)', padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(l.id, 'Rejected')}
                                className="btn btn-outline"
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          types={types}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
