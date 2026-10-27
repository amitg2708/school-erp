import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, BookOpen, User, MapPin,
  Printer, ChevronRight, Grid, List
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SLOTS = [
  { num: 1, start: '08:00 AM', end: '08:45 AM' },
  { num: 2, start: '08:45 AM', end: '09:30 AM' },
  { num: 3, start: '09:30 AM', end: '10:15 AM' },
  { num: 4, start: '10:30 AM', end: '11:15 AM' },
  { num: 5, start: '11:15 AM', end: '12:00 PM' },
  { num: 6, start: '12:45 PM', end: '01:30 PM' },
  { num: 7, start: '01:30 PM', end: '02:15 PM' },
  { num: 8, start: '02:15 PM', end: '03:00 PM' },
];

export default function StudentTimetableView() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active day of week
  const todayDayIndex = new Date().getDay(); // 0 is Sunday
  const defaultDay = todayDayIndex >= 1 && todayDayIndex <= 6 ? DAYS[todayDayIndex - 1] : 'Monday';
  const [activeDay, setActiveDay] = useState(defaultDay);
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'weekly'

  useEffect(() => {
    if (user?.role === 'parent') {
      api.get('/portal/children').then(res => {
        const list = res.data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedStudentId(String(list[0].id));
      }).catch(() => {});
    } else {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId || user?.role === 'student') {
      loadData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadData = async (studId) => {
    setLoading(true);
    try {
      const url = studId ? `/portal/my-student?student_id=${studId}` : '/portal/my-student';
      const res = await api.get(url);
      setStudentInfo(res.data.student);
      setTimetable(res.data.timetable || []);
    } catch (err) {
      toast.error('Failed to load class timetable');
    } finally {
      setLoading(false);
    }
  };

  const daySlots = timetable.filter(t => t.day_of_week === activeDay);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !studentInfo) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '120px', borderRadius: '12px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '350px', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Parent Child Switcher */}
      {user?.role === 'parent' && children.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Viewing Timetable For:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(String(child.id))}
                className={`btn btn-sm ${selectedStudentId === String(child.id) ? 'btn-primary' : 'btn-outline'}`}
              >
                {child.first_name} ({child.class_name || 'Class'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#e0f2fe', marginBottom: '8px' }}>
              <Clock size={13} /> Class Schedule (Mon–Sat)
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {studentInfo?.class_name ? `${studentInfo.class_name} · Section ${studentInfo.section_name || 'A'} Timetable` : 'Class Timetable'}
            </h1>
            <p style={{ color: '#bae6fd', fontSize: '0.85rem', margin: 0 }}>
              Academic Session 2025–2026 · Standard 8-Period Daily Curriculum
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode(v => v === 'day' ? 'weekly' : 'day')}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {viewMode === 'day' ? <Grid size={15} /> : <List size={15} />}
              {viewMode === 'day' ? 'Full Week Grid' : 'Daily Cards'}
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-sm"
              style={{ background: '#fff', color: '#0369a1', border: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Day of Week Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
            {DAYS.map(day => {
              const count = timetable.filter(t => t.day_of_week === day).length;
              const isToday = day === defaultDay;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`btn ${activeDay === day ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '24px',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {day}
                  {isToday && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeDay === day ? '#fff' : 'var(--primary)' }} />}
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Periods for active day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEFAULT_SLOTS.map((slot) => {
              const periodData = daySlots.find(t => t.period_number === slot.num);
              const isRecessBefore = slot.num === 4;
              const isLunchBefore = slot.num === 6;

              return (
                <div key={slot.num}>
                  {/* Break Dividers */}
                  {isRecessBefore && (
                    <div style={{ padding: '8px 16px', background: 'var(--gray-100)', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', margin: '4px 0 10px' }}>
                      ☕ Morning Recess & Snack Break (10:15 AM – 10:30 AM)
                    </div>
                  )}
                  {isLunchBefore && (
                    <div style={{ padding: '8px 16px', background: 'var(--gray-100)', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', margin: '4px 0 10px' }}>
                      🥪 Lunch Break (12:00 PM – 12:45 PM)
                    </div>
                  )}

                  <div
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderLeft: periodData ? '4px solid var(--primary)' : '4px solid var(--gray-300)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: periodData ? 'rgba(79, 70, 229, 0.1)' : 'var(--gray-100)',
                          color: periodData ? 'var(--primary)' : 'var(--gray-400)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.1rem'
                        }}
                      >
                        P{slot.num}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: periodData ? 'var(--gray-900)' : 'var(--gray-400)' }}>
                            {periodData ? periodData.subject_name : 'Free / Self Study Period'}
                          </span>
                          {periodData?.subject_code && (
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                              {periodData.subject_code}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '3px', flexWrap: 'wrap' }}>
                          {periodData?.teacher_name && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <User size={13} /> {periodData.teacher_name}
                            </span>
                          )}
                          {periodData?.room && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} /> Room: {periodData.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Clock size={15} style={{ color: 'var(--primary)' }} />
                      {periodData?.start_time && periodData?.end_time ? `${periodData.start_time} - ${periodData.end_time}` : `${slot.start} - ${slot.end}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Full Weekly Grid */
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Complete Weekly Timetable Matrix</h2>
          <div className="table-wrapper">
            <table className="table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Period</th>
                  {DAYS.map(d => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {DEFAULT_SLOTS.map(slot => (
                  <tr key={slot.num}>
                    <td style={{ fontWeight: 700, background: 'var(--gray-50)' }}>
                      <div>P{slot.num}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 400 }}>{slot.start}</div>
                    </td>
                    {DAYS.map(day => {
                      const item = timetable.find(t => t.day_of_week === day && t.period_number === slot.num);
                      return (
                        <td key={day} style={{ verticalAlign: 'top', minWidth: '110px' }}>
                          {item ? (
                            <div style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.subject_name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>{item.teacher_name}</div>
                              {item.room && <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>Rm: {item.room}</div>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-300)' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
