import { useState, useEffect } from 'react';
import { notificationsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Bell, Plus, CheckCheck, Clock, AlertTriangle,
  Info, Calendar, Megaphone, Check, X, Tag
} from 'lucide-react';

function CreateNotificationModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'General',
    targetRole: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }
    setSaving(true);
    try {
      await notificationsAPI.create({
        ...form,
        targetRole: form.targetRole || null
      });
      toast.success('Announcement broadcasted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to broadcast notice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Broadcast Notice / Announcement</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Notice Headline *</label>
              <input
                className="form-control"
                placeholder="e.g. Annual Sports Day Postponement"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="General">General Notice</option>
                  <option value="Academic">Academic / Exam</option>
                  <option value="Holiday">Holiday & Leaves</option>
                  <option value="Fee Notice">Fee Reminder</option>
                  <option value="Event">Sports & Events</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audience</label>
                <select className="form-control" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
                  <option value="">Everyone (All Users)</option>
                  <option value="teacher">Teachers & Faculty</option>
                  <option value="student">Students & Parents</option>
                  <option value="staff">Staff Members</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message Details *</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Type the full announcement content here..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifs = filterCategory
    ? notifications.filter(n => n.category === filterCategory)
    : notifications;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>Notice Board</h1>
            {unreadCount > 0 && (
              <span className="badge badge-danger">{unreadCount} New</span>
            )}
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '4px' }}>
            School circulars, administrative alerts, and event announcements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Broadcast Notice
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: '', label: 'All Notices' },
          { key: 'General', label: 'General' },
          { key: 'Academic', label: 'Academic' },
          { key: 'Holiday', label: 'Holidays' },
          { key: 'Fee Notice', label: 'Fees' },
          { key: 'Event', label: 'Events' },
        ].map(cat => {
          const active = filterCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',
                border: active ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                background: active ? 'var(--primary)' : '#ffffff',
                color: active ? '#ffffff' : 'var(--gray-700)',
                fontWeight: active ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filteredNotifs.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <Bell size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Announcements Found</h3>
          <p>You are all caught up with the latest school notifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredNotifs.map(notif => {
            const isUnread = !notif.is_read;
            const categoryBadge =
              notif.category === 'Holiday' ? 'badge-success' :
              notif.category === 'Fee Notice' ? 'badge-danger' :
              notif.category === 'Academic' ? 'badge-primary' : 'badge-info';

            return (
              <div
                key={notif.id}
                className="card"
                style={{
                  padding: '20px',
                  borderLeft: isUnread ? '4px solid var(--primary)' : '4px solid transparent',
                  background: isUnread ? '#ffffff' : 'var(--gray-50)',
                  boxShadow: isUnread ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${categoryBadge}`}>{notif.category || 'General'}</span>
                    {notif.target_role && (
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                        For: {notif.target_role}
                      </span>
                    )}
                    {isUnread && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                    )}
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--primary)' }}
                    >
                      <Check size={14} /> Mark Read
                    </button>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px', color: 'var(--gray-900)' }}>
                  {notif.title}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                  {notif.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recent'}</span>
                  </div>
                  {notif.created_by_name && (
                    <div>By: <strong>{notif.created_by_name}</strong></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchNotifications()}
        />
      )}
    </div>
  );
}
