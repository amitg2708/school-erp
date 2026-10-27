import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  Save, RefreshCw, CheckCheck, Users, Search
} from 'lucide-react';

const STATUSES = [
  { key: 'Present', label: 'P', color: 'var(--present)', bg: 'var(--present-light)' },
  { key: 'Absent', label: 'A', color: 'var(--absent)', bg: 'var(--absent-light)' },
  { key: 'Late', label: 'L', color: 'var(--late)', bg: 'var(--late-light)' },
  { key: 'Half Day', label: 'H', color: 'var(--halfday)', bg: 'var(--halfday-light)' },
];

export default function StaffAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState({}); // { staffId: status }
  const [remarks, setRemarks] = useState({}); // { staffId: remark }
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, halfDay: 0, notMarked: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStaffAttendance = async (selectedDate) => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getStaff({ date: selectedDate });
      const staffList = res.data.staff || [];
      setStaff(staffList);

      const attMap = {};
      const remMap = {};
      staffList.forEach(s => {
        if (s.attendance_status) attMap[s.id] = s.attendance_status;
        if (s.remarks) remMap[s.id] = s.remarks;
      });
      setAttendance(attMap);
      setRemarks(remMap);
      updateSummary(attMap, staffList);
    } catch (err) {
      toast.error('Failed to load staff attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAttendance(date);
  }, [date]);

  const updateSummary = (attMap, list) => {
    const s = { total: list.length, present: 0, absent: 0, late: 0, halfDay: 0, notMarked: 0 };
    list.forEach(item => {
      const st = attMap[item.id];
      if (st === 'Present') s.present++;
      else if (st === 'Absent') s.absent++;
      else if (st === 'Late') s.late++;
      else if (st === 'Half Day') s.halfDay++;
      else s.notMarked++;
    });
    setSummary(s);
  };

  const handleStatusChange = (staffId, status) => {
    const next = { ...attendance, [staffId]: status };
    setAttendance(next);
    updateSummary(next, staff);
  };

  const markAllPresent = () => {
    const next = {};
    staff.forEach(s => { next[s.id] = 'Present'; });
    setAttendance(next);
    updateSummary(next, staff);
    toast.success('Marked all staff as Present');
  };

  const clearAll = () => {
    setAttendance({});
    updateSummary({}, staff);
  };

  const handleSave = async () => {
    const payload = staff
      .filter(s => attendance[s.id])
      .map(s => ({
        staffId: s.id,
        status: attendance[s.id],
        remarks: remarks[s.id] || null
      }));

    if (payload.length === 0) {
      toast.error('Please mark attendance before saving');
      return;
    }

    setSaving(true);
    try {
      await attendanceAPI.saveStaffAttendance({ date, attendance: payload });
      toast.success('Staff attendance saved successfully!');
      fetchStaffAttendance(date);
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(s =>
    `${s.first_name} ${s.last_name} ${s.staff_id} ${s.designation}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Staff Attendance</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Daily attendance register for teaching and non-teaching staff
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>TOTAL STAFF</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gray-800)' }}>{summary.total}</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--present-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--present)' }}>PRESENT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--present)' }}>{summary.present}</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--absent-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--absent)' }}>ABSENT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--absent)' }}>{summary.absent}</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--late-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--late)' }}>LATE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--late)' }}>{summary.late}</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--halfday-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--halfday)' }}>HALF DAY</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--halfday)' }}>{summary.halfDay}</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-400)' }}>UNMARKED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gray-400)' }}>{summary.notMarked}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: '32px' }}
            placeholder="Search staff in list..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={markAllPresent}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <CheckCheck size={16} /> Mark All Present
          </button>
          <button
            onClick={clearAll}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Staff Attendance List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filteredStaff.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px', color: 'var(--gray-400)' }}>
          <Users size={40} style={{ margin: '0 auto 8px' }} />
          <p>No staff records found for {date}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredStaff.map(member => {
            const currentStatus = attendance[member.id];
            return (
              <div
                key={member.id}
                className="card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderLeft: currentStatus
                    ? `4px solid ${STATUSES.find(s => s.key === currentStatus)?.color}`
                    : '4px solid var(--gray-200)'
                }}
              >
                {/* Staff Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: member.staff_type === 'Teaching' ? 'var(--primary-100)' : 'var(--orange-light)',
                    color: member.staff_type === 'Teaching' ? 'var(--primary)' : 'var(--orange)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                  }}>
                    {member.first_name[0]}{member.last_name ? member.last_name[0] : ''}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{member.first_name} {member.last_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {member.staff_id} &bull; {member.designation || member.staff_type} {member.department_name ? `(${member.department_name})` : ''}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {STATUSES.map(s => {
                    const active = currentStatus === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => handleStatusChange(member.id, s.key)}
                        style={{
                          width: '42px',
                          height: '38px',
                          borderRadius: '8px',
                          border: active ? `2px solid ${s.color}` : '1px solid var(--gray-200)',
                          background: active ? s.bg : '#ffffff',
                          color: active ? s.color : 'var(--gray-600)',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        title={s.key}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating / Sticky Save Bar */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: '#ffffff',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
          Marked: <strong style={{ color: 'var(--primary)' }}>{Object.keys(attendance).length}</strong> / {staff.length}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || staff.length === 0}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '50px', padding: '8px 20px' }}
        >
          <Save size={16} /> {saving ? 'Saving Attendance...' : 'Save Staff Attendance'}
        </button>
      </div>
    </div>
  );
}
