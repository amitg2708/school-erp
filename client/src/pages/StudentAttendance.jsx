import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceAPI, academicAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Save, CheckSquare, X, Users, RefreshCw, AlertCircle,
  Calendar, Bus, Armchair, LayoutGrid, List, Search,
  CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles,
  Compass
} from 'lucide-react';
import StudentAttendanceView from '../components/student/StudentAttendanceView';

const STATUS_OPTIONS = [
  { key: 'Present', color: 'present', label: 'P', name: 'Present', desc: 'Present / Booked' },
  { key: 'Absent', color: 'absent', label: 'A', name: 'Absent', desc: 'Absent / Vacant' },
  { key: 'Late', color: 'late', label: 'L', name: 'Late', desc: 'Late Arrival' },
  { key: 'Half Day', color: 'halfday', label: 'H', name: 'Half Day', desc: 'Half Session' },
];

function StaffStudentAttendance() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    academicYearId: '',
    classId: '',
    sectionId: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: status }
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, halfDay: 0, notMarked: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Bus seat booking view options
  const [viewMode, setViewMode] = useState('bus'); // 'bus' | 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [legendFilter, setLegendFilter] = useState('ALL');
  const [quickAbsentMode, setQuickAbsentMode] = useState(false);

  useEffect(() => {
    academicAPI.getYears().then(r => {
      setYears(r.data.years);
      const current = r.data.years.find(y => y.is_current);
      if (current) setForm(f => ({ ...f, academicYearId: String(current.id) }));
    });
    academicAPI.getClasses().then(r => setClasses(r.data.classes));
  }, []);

  useEffect(() => {
    if (form.classId) {
      academicAPI.getSections({ class_id: form.classId }).then(r => {
        setSections(r.data.sections);
        setForm(f => ({ ...f, sectionId: '' }));
        setStudents([]);
        setFetched(false);
      });
    }
  }, [form.classId]);

  const updateSummary = useCallback((att, studList) => {
    const s = { total: studList.length, present: 0, absent: 0, late: 0, halfDay: 0, notMarked: 0 };
    studList.forEach(st => {
      const status = att[st.id];
      if (status === 'Present') s.present++;
      else if (status === 'Absent') s.absent++;
      else if (status === 'Late') s.late++;
      else if (status === 'Half Day') s.halfDay++;
      else s.notMarked++;
    });
    setSummary(s);
  }, []);

  const fetchStudents = async () => {
    if (!form.academicYearId || !form.classId || !form.sectionId || !form.date) {
      toast.error('Please select all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await attendanceAPI.getStudents({
        class_id: form.classId,
        section_id: form.sectionId,
        academic_year_id: form.academicYearId,
        date: form.date,
      });
      const { students: studentList, isExisting: existing } = res.data;
      setStudents(studentList);
      setIsExisting(existing);
      setFetched(true);

      // Initialize attendance from existing data
      const attMap = {};
      studentList.forEach(s => {
        if (s.attendance_status) attMap[s.id] = s.attendance_status;
      });
      setAttendance(attMap);
      updateSummary(attMap, studentList);

      if (existing) {
        toast('Existing attendance records loaded', { icon: '📋' });
      } else {
        toast.success(`Loaded ${studentList.length} student seats`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Direct status setter
  const setStatus = (studentId, status) => {
    const newAtt = { ...attendance };
    if (newAtt[studentId] === status) {
      delete newAtt[studentId]; // toggle off if already set
    } else {
      newAtt[studentId] = status;
    }
    setAttendance(newAtt);
    updateSummary(newAtt, students);
  };

  // Bus seat box click: toggle or cycle
  const handleSeatClick = (studentId) => {
    if (quickAbsentMode) {
      setStatus(studentId, 'Absent');
      toast('Marked seat as Absent', { icon: '🔴', duration: 1500 });
      return;
    }

    const current = attendance[studentId];
    let nextStatus = 'Present';
    if (!current) nextStatus = 'Present';
    else if (current === 'Present') nextStatus = 'Absent';
    else if (current === 'Absent') nextStatus = 'Late';
    else if (current === 'Late') nextStatus = 'Half Day';
    else if (current === 'Half Day') nextStatus = undefined;

    const newAtt = { ...attendance };
    if (!nextStatus) {
      delete newAtt[studentId];
    } else {
      newAtt[studentId] = nextStatus;
    }
    setAttendance(newAtt);
    updateSummary(newAtt, students);
  };

  const markAllPresent = () => {
    const newAtt = {};
    students.forEach(s => (newAtt[s.id] = 'Present'));
    setAttendance(newAtt);
    updateSummary(newAtt, students);
    toast.success('All student seats booked as Present 🟢');
  };

  const clearAttendance = () => {
    if (!window.confirm('Clear all seat bookings?')) return;
    setAttendance({});
    updateSummary({}, students);
    toast('Seat bookings cleared', { icon: '🗑️' });
  };

  const saveAttendance = async () => {
    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length > 0 && !window.confirm(`${unmarked.length} seats remain unconfirmed/vacant. Proceed with saving?`)) return;

    setSaving(true);
    try {
      const attData = students
        .filter(s => attendance[s.id])
        .map(s => ({ studentId: s.id, status: attendance[s.id] }));

      await attendanceAPI.saveStudentAttendance({
        classId: form.classId,
        sectionId: form.sectionId,
        academicYearId: form.academicYearId,
        date: form.date,
        attendance: attData,
      });
      toast.success(`Seat attendance saved for ${attData.length} students! 🎟️`);
      setIsExisting(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Filter students based on search and legend filter
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchSearch =
        searchTerm === '' ||
        `${st.first_name} ${st.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(st.roll_number || '').includes(searchTerm) ||
        String(st.student_id || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (legendFilter === 'ALL') return true;
      if (legendFilter === 'UNMARKED') return !attendance[st.id];
      return attendance[st.id] === legendFilter;
    });
  }, [students, searchTerm, legendFilter, attendance]);

  // Group students into 4-seat rows for the 2x2 bus layout
  const busRows = useMemo(() => {
    const rows = [];
    const listToChunk = filteredStudents;
    for (let i = 0; i < listToChunk.length; i += 4) {
      rows.push({
        rowNumber: Math.floor(i / 4) + 1,
        leftWindow: listToChunk[i] || null,
        leftAisle: listToChunk[i + 1] || null,
        rightAisle: listToChunk[i + 2] || null,
        rightWindow: listToChunk[i + 3] || null,
      });
    }
    return rows;
  }, [filteredStudents]);

  const occupancyRate = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  // Render individual seat box
  const renderSeatBox = (student, seatIndex, positionLabel = '') => {
    if (!student) {
      return (
        <div
          className="bus-seat-box seat-unmarked"
          style={{
            opacity: 0.35,
            borderStyle: 'dashed',
            minHeight: '110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Empty Slot</span>
        </div>
      );
    }

    const currentStatus = attendance[student.id];
    const statusClass = currentStatus
      ? `seat-${currentStatus.toLowerCase().replace(' ', '')}`
      : 'seat-unmarked';

    const seatCode = `S-${String(seatIndex + 1).padStart(2, '0')}`;

    return (
      <div
        key={student.id}
        className={`bus-seat-box ${statusClass}`}
        onClick={() => handleSeatClick(student.id)}
        title={`Click to cycle status. Roll: ${student.roll_number || 'N/A'}`}
      >
        {/* Seat Top Strip */}
        <div className="bus-seat-top">
          <span className="bus-seat-number">
            {seatCode} {positionLabel && <span style={{ opacity: 0.65 }}>• {positionLabel}</span>}
          </span>
          <span
            className="bus-seat-badge"
            style={{
              background: currentStatus === 'Present' ? 'var(--present)' :
                currentStatus === 'Absent' ? 'var(--absent)' :
                currentStatus === 'Late' ? 'var(--late)' :
                currentStatus === 'Half Day' ? 'var(--halfday)' : 'rgba(0,0,0,0.06)',
              color: currentStatus ? 'white' : 'var(--text-muted)'
            }}
          >
            {currentStatus || 'Available'}
          </span>
        </div>

        {/* Student Identity */}
        <div className="bus-seat-student">
          <div
            className="bus-seat-avatar"
            style={{
              background: currentStatus === 'Present' ? 'var(--present)' :
                currentStatus === 'Absent' ? 'var(--absent)' :
                currentStatus === 'Late' ? 'var(--late)' :
                currentStatus === 'Half Day' ? 'var(--halfday)' : 'var(--primary-100)',
              color: currentStatus ? 'white' : 'var(--primary)',
            }}
          >
            {student.roll_number || student.first_name[0]}
          </div>
          <div className="bus-seat-details">
            <div className="bus-seat-name" title={`${student.first_name} ${student.last_name}`}>
              {student.first_name} {student.last_name}
            </div>
            <div className="bus-seat-subtext">
              Roll {student.roll_number || '—'} • {student.student_id}
            </div>
          </div>
        </div>

        {/* Quick Micro Status Picker */}
        <div className="bus-seat-actions" onClick={e => e.stopPropagation()}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`bus-seat-btn btn-${opt.label.toLowerCase()} ${currentStatus === opt.key ? 'active' : ''}`}
              title={`Mark ${opt.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setStatus(student.id, opt.key);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bus size={26} color="var(--primary)" /> Student Attendance
          </h1>
          <p className="page-subtitle">Interactive Bus Seat & Classroom Desk Booking System</p>
        </div>
        {fetched && students.length > 0 && (
          <button id="save-attendance-btn" className="btn btn-primary" onClick={saveAttendance} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Class & Date Selector Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="form-row cols-2" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Academic Year</label>
            <select
              className="form-control"
              value={form.academicYearId}
              onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}
            >
              <option value="">Select Year</option>
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.name} {y.is_current ? '(Current)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Attendance Date</label>
            <input
              type="date"
              className="form-control"
              value={form.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row cols-2" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Class</label>
            <select
              className="form-control"
              value={form.classId}
              onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Section</label>
            <select
              className="form-control"
              value={form.sectionId}
              onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
              disabled={!form.classId}
            >
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          id="fetch-students-btn"
          className="btn btn-primary btn-full"
          onClick={fetchStudents}
          disabled={loading || !form.academicYearId || !form.classId || !form.sectionId || !form.date}
        >
          {loading ? (
            <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Loading Seats...</>
          ) : (
            <><Bus size={16} /> Load Seating Layout & Students</>
          )}
        </button>
      </div>

      {/* No students state */}
      {fetched && students.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Users size={48} />
            <h3>No students enrolled</h3>
            <p>No active students found in the selected class and section</p>
          </div>
        </div>
      )}

      {/* Seating Layout Canvas */}
      {fetched && students.length > 0 && (
        <div className="seat-booking-wrapper">
          {/* Front Vehicle / Teacher Cabin Banner */}
          <div className="bus-front-cabin">
            <div className="bus-front-cabin-title">
              <Bus size={22} color="#60a5fa" />
              <span>
                {viewMode === 'bus' ? 'School Bus Deck Seating (2 × 2 Layout)' : 'Classroom Desk Layout'}
              </span>
              <span className="bus-front-cabin-badge">
                <Compass size={12} /> Front / Driver Cabin & Entrance
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isExisting && (
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> Existing Data
                </span>
              )}
            </div>
          </div>

          {/* redBus-style Interactive Legend & Filter Bar */}
          <div className="seat-booking-controls">
            <div className="seat-legend-bar">
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Legend:
              </span>
              <div
                className={`seat-legend-item ${legendFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setLegendFilter('ALL')}
              >
                <span>All Seats ({summary.total})</span>
              </div>
              <div
                className={`seat-legend-item ${legendFilter === 'Present' ? 'active' : ''}`}
                onClick={() => setLegendFilter(legendFilter === 'Present' ? 'ALL' : 'Present')}
              >
                <span className="seat-legend-sample present" />
                <span>Present ({summary.present})</span>
              </div>
              <div
                className={`seat-legend-item ${legendFilter === 'Absent' ? 'active' : ''}`}
                onClick={() => setLegendFilter(legendFilter === 'Absent' ? 'ALL' : 'Absent')}
              >
                <span className="seat-legend-sample absent" />
                <span>Absent ({summary.absent})</span>
              </div>
              <div
                className={`seat-legend-item ${legendFilter === 'Late' ? 'active' : ''}`}
                onClick={() => setLegendFilter(legendFilter === 'Late' ? 'ALL' : 'Late')}
              >
                <span className="seat-legend-sample late" />
                <span>Late ({summary.late})</span>
              </div>
              <div
                className={`seat-legend-item ${legendFilter === 'Half Day' ? 'active' : ''}`}
                onClick={() => setLegendFilter(legendFilter === 'Half Day' ? 'ALL' : 'Half Day')}
              >
                <span className="seat-legend-sample halfday" />
                <span>Half Day ({summary.halfDay})</span>
              </div>
              <div
                className={`seat-legend-item ${legendFilter === 'UNMARKED' ? 'active' : ''}`}
                onClick={() => setLegendFilter(legendFilter === 'UNMARKED' ? 'ALL' : 'UNMARKED')}
              >
                <span className="seat-legend-sample unmarked" />
                <span>Available ({summary.notMarked})</span>
              </div>
            </div>

            {/* View Mode Toggle & Quick Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', background: 'var(--gray-100)', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'bus' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setViewMode('bus')}
                  title="Bus 2x2 Seating with Aisle"
                >
                  <Bus size={14} /> Bus (2x2)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setViewMode('grid')}
                  title="Classroom Desks Grid"
                >
                  <LayoutGrid size={14} /> Desk Grid
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setViewMode('list')}
                  title="Table List View"
                >
                  <List size={14} /> List View
                </button>
              </div>

              {/* Quick Absent Mode Switch */}
              <button
                type="button"
                className={`btn btn-sm ${quickAbsentMode ? 'btn-danger' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setQuickAbsentMode(!quickAbsentMode)}
                title="When ON, clicking any seat marks it Absent immediately"
              >
                <XCircle size={14} />
                {quickAbsentMode ? 'Absent Mode: ON' : 'Fast Absent Mode'}
              </button>
            </div>
          </div>

          {/* Quick Roll Call Actions & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button id="mark-all-present-btn" className="btn btn-success btn-sm" onClick={markAllPresent}>
                <CheckSquare size={14} /> Book All Present (Full Deck)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={clearAttendance}>
                <X size={14} /> Reset All Seats
              </button>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search seat or roll..."
                style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Live Occupancy Meter */}
          <div style={{ marginBottom: '18px', background: 'var(--gray-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Armchair size={15} color="var(--primary)" /> Seat Occupancy:
                <strong style={{ color: 'var(--primary)' }}>{summary.present} / {summary.total} Seats Occupied</strong>
              </span>
              <span style={{ color: occupancyRate >= 75 ? 'var(--present)' : 'var(--warning)', fontWeight: 800 }}>
                {occupancyRate}% Present
              </span>
            </div>
            <div className="occupancy-meter-bar">
              <div
                className="occupancy-meter-fill"
                style={{ width: `${occupancyRate}%`, background: 'var(--gradient-primary)' }}
              />
            </div>
          </div>

          {/* Main Seating Floor View */}
          <div className="bus-deck-floor">
            {/* 1. BUS 2x2 AISLE LAYOUT */}
            {viewMode === 'bus' && (
              <>
                {busRows.map(row => (
                  <div key={row.rowNumber} className="bus-seat-row">
                    {/* Left Window Seat */}
                    {renderSeatBox(row.leftWindow, (row.rowNumber - 1) * 4 + 0, 'Window')}

                    {/* Left Aisle Seat */}
                    {renderSeatBox(row.leftAisle, (row.rowNumber - 1) * 4 + 1, 'Aisle')}

                    {/* Walkway / Aisle */}
                    <div className="bus-aisle-divider">
                      <span>R{row.rowNumber}</span>
                      <span>AISLE</span>
                    </div>

                    {/* Right Aisle Seat */}
                    {renderSeatBox(row.rightAisle, (row.rowNumber - 1) * 4 + 2, 'Aisle')}

                    {/* Right Window Seat */}
                    {renderSeatBox(row.rightWindow, (row.rowNumber - 1) * 4 + 3, 'Window')}
                  </div>
                ))}
              </>
            )}

            {/* 2. CLASSROOM DESK GRID LAYOUT */}
            {viewMode === 'grid' && (
              <div className="classroom-desk-grid">
                {filteredStudents.map((st, idx) => renderSeatBox(st, idx))}
              </div>
            )}

            {/* 3. CLASSIC TABLE LIST VIEW */}
            {viewMode === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredStudents.map((student, idx) => {
                  const currentStatus = attendance[student.id];
                  return (
                    <div
                      key={student.id}
                      className="card"
                      style={{
                        padding: '12px',
                        border: currentStatus
                          ? `1.5px solid ${currentStatus === 'Present' ? '#86efac' : currentStatus === 'Absent' ? '#fca5a5' : currentStatus === 'Late' ? '#fcd34d' : '#93c5fd'}`
                          : '1px solid var(--gray-200)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div className="student-info" style={{ flex: 1 }}>
                          <div
                            className="student-avatar"
                            style={{
                              background: currentStatus === 'Present' ? 'var(--present-light)' :
                                currentStatus === 'Absent' ? 'var(--absent-light)' :
                                currentStatus === 'Late' ? 'var(--late-light)' :
                                currentStatus === 'Half Day' ? 'var(--halfday-light)' : 'var(--gray-100)',
                              color: currentStatus === 'Present' ? 'var(--present)' :
                                currentStatus === 'Absent' ? 'var(--absent)' :
                                currentStatus === 'Late' ? 'var(--late)' :
                                currentStatus === 'Half Day' ? 'var(--halfday)' : 'var(--gray-400)',
                            }}
                          >
                            {student.roll_number || student.first_name[0]}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="student-name">{student.first_name} {student.last_name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '1px 6px', borderRadius: '99px' }}>
                                Seat S-{String(idx + 1).padStart(2, '0')} • Roll {student.roll_number || '—'}
                              </span>
                            </div>
                            <div className="student-id">{student.student_id}</div>
                          </div>
                        </div>

                        {/* Status Buttons */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {STATUS_OPTIONS.map(({ key, color, label }) => (
                            <button
                              key={key}
                              className={`att-btn att-btn-${color} ${currentStatus === key ? 'active' : ''}`}
                              onClick={() => setStatus(student.id, key)}
                              title={key}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Save / Confirm Booking Strip */}
          <div style={{ position: 'sticky', bottom: 'calc(var(--mobile-nav-height) + 8px)', marginTop: '20px', zIndex: 50 }}>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={saveAttendance}
              disabled={saving}
              style={{ boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Save size={18} />
              {saving ? 'Saving Bookings...' : `Save Seat Attendance (${Object.keys(attendance).length} / ${students.length} Confirmed)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentAttendance() {
  const { user } = useAuth();
  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentAttendanceView />;
  }
  return <StaffStudentAttendance />;
}
