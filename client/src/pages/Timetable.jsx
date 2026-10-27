import { useState, useEffect } from 'react';
import { timetableAPI, academicAPI, staffAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, BookOpen, Plus, Trash2,
  Printer, User, MapPin, X
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_PERIODS = [
  { num: 1, start: '08:00', end: '08:45' },
  { num: 2, start: '08:45', end: '09:30' },
  { num: 3, start: '09:30', end: '10:15' },
  { num: 4, start: '10:30', end: '11:15' },
  { num: 5, start: '11:15', end: '12:00' },
  { num: 6, start: '12:45', end: '01:30' },
  { num: 7, start: '01:30', end: '02:15' },
  { num: 8, start: '02:15', end: '03:00' },
];

function AddPeriodModal({ classId, sectionId, academicYearId, defaultDay, defaultPeriod, subjects, teachers, onClose, onSuccess }) {
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay || 'Monday');
  const [periodNumber, setPeriodNumber] = useState(defaultPeriod?.num || 1);
  const [startTime, setStartTime] = useState(defaultPeriod?.start || '08:00');
  const [endTime, setEndTime] = useState(defaultPeriod?.end || '08:45');
  const [subjectId, setSubjectId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error('Select a subject');
      return;
    }
    setSaving(true);
    try {
      await timetableAPI.create({
        classId,
        sectionId,
        academicYearId,
        dayOfWeek,
        periodNumber: Number(periodNumber),
        startTime,
        endTime,
        subjectId,
        staffId: staffId || null,
        room: room || null
      });
      toast.success('Period saved to timetable!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save timetable slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Schedule Period Slot</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Day of Week *</label>
                <select className="form-control" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Period Number *</label>
                <input
                  type="number"
                  className="form-control"
                  value={periodNumber}
                  onChange={e => setPeriodNumber(e.target.value)}
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select className="form-control" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                <option value="">-- Choose Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Teacher</label>
              <select className="form-control" value={staffId} onChange={e => setStaffId(e.target.value)}>
                <option value="">-- Assign Teacher (Optional) --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.designation || 'Faculty'})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Classroom / Room Number</label>
              <input
                className="form-control"
                placeholder="e.g. Room 102 or Science Lab"
                value={room}
                onChange={e => setRoom(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import StudentTimetableView from '../components/student/StudentTimetableView';

export default function Timetable() {
  const { user } = useAuth();

  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentTimetableView />;
  }

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState('Monday');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSlot, setModalSlot] = useState({ day: 'Monday', period: DEFAULT_PERIODS[0] });

  useEffect(() => {
    loadBase();
  }, []);

  const loadBase = async () => {
    try {
      const [clRes, yrRes, subRes, tchRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getYears(),
        academicAPI.getSubjects(),
        staffAPI.getAll({ staff_type: 'Teaching' }),
      ]);
      setClasses(clRes.data.classes || []);
      setYears(yrRes.data.years || []);
      setSubjects(subRes.data.subjects || []);
      setTeachers(tchRes.data.staff || []);

      const curYear = yrRes.data.years.find(y => y.is_current)?.id || yrRes.data.years[0]?.id;
      if (curYear) setAcademicYearId(curYear);

      if (clRes.data.classes?.length > 0) {
        const firstClass = clRes.data.classes[0].id;
        setSelectedClassId(firstClass);
        loadSectionsForClass(firstClass, curYear);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSectionsForClass = async (cId, yId) => {
    try {
      const secRes = await academicAPI.getSections({ class_id: cId });
      setSections(secRes.data.sections || []);
      if (secRes.data.sections?.length > 0) {
        const firstSec = secRes.data.sections[0].id;
        setSelectedSectionId(firstSec);
        fetchTimetable(cId, firstSec, yId || academicYearId);
      } else {
        setSelectedSectionId('');
        setTimetable([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = (cId) => {
    setSelectedClassId(cId);
    loadSectionsForClass(cId, academicYearId);
  };

  const handleSectionChange = (sId) => {
    setSelectedSectionId(sId);
    fetchTimetable(selectedClassId, sId, academicYearId);
  };

  const fetchTimetable = async (cId, sId, yId) => {
    if (!cId || !sId) return;
    setLoading(true);
    try {
      const res = await timetableAPI.get({
        class_id: cId,
        section_id: sId,
        academic_year_id: yId
      });
      setTimetable(res.data.timetable || []);
    } catch (err) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await timetableAPI.delete(slotId);
      toast.success('Period removed');
      fetchTimetable(selectedClassId, selectedSectionId, academicYearId);
    } catch (err) {
      toast.error('Failed to delete slot');
    }
  };

  const openSlotCreator = (day, p) => {
    setModalSlot({ day, period: p });
    setShowAddModal(true);
  };

  const daySlots = timetable.filter(t => t.day_of_week === activeDay);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Class Timetable</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Weekly period schedule, subject timings, and teacher assignments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Timetable
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => openSlotCreator(activeDay, DEFAULT_PERIODS[0])} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Period
            </button>
          )}
        </div>
      </div>

      {/* Class & Section Selector Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '180px' }}>
            <label className="form-label">Select Class (1 - 12)</label>
            <select className="form-control" value={selectedClassId} onChange={e => handleClassChange(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <label className="form-label">Select Section</label>
            <select className="form-control" value={selectedSectionId} onChange={e => handleSectionChange(e.target.value)}>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {DAYS.map(day => {
          const active = activeDay === day;
          const count = timetable.filter(t => t.day_of_week === day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                padding: '10px 18px',
                borderRadius: '50px',
                border: active ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                background: active ? 'var(--primary)' : '#ffffff',
                color: active ? '#ffffff' : 'var(--gray-700)',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{day}</span>
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--gray-100)',
                color: active ? '#ffffff' : 'var(--gray-600)',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timetable Period List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : daySlots.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
          <Calendar size={48} style={{ margin: '0 auto 12px' }} />
          <h3>No Periods Scheduled for {activeDay}</h3>
          <p>Click "Add Period" to schedule classes for this day.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {daySlots.map(slot => (
            <div
              key={slot.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: '4px solid var(--primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1rem'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--gray-500)', lineHeight: '1' }}>PERIOD</span>
                  {slot.period_number}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                    {slot.subject_name || 'Subject'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                    <Clock size={12} />
                    <span>{slot.start_time} - {slot.end_time}</span>
                    {slot.subject_code && <span className="badge badge-info">{slot.subject_code}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Teacher</div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--primary)" /> {slot.teacher_name || 'Not assigned'}
                  </strong>
                </div>

                {slot.room && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Room / Lab</div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--orange)" /> {slot.room}
                    </strong>
                  </div>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="btn btn-icon btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    title="Remove period"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Period Modal */}
      {showAddModal && (
        <AddPeriodModal
          classId={selectedClassId}
          sectionId={selectedSectionId}
          academicYearId={academicYearId}
          defaultDay={modalSlot.day}
          defaultPeriod={modalSlot.period}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => fetchTimetable(selectedClassId, selectedSectionId, academicYearId)}
        />
      )}
    </div>
  );
}
