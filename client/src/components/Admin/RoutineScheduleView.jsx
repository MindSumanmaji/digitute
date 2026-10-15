import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle2,
  CalendarDays, Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  UserCheck, AlertCircle, Sparkles, Building2, UserCog, MoreVertical,
  X, Check, ArrowRight, ShieldAlert, Edit2, Trash2
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 7, name: 'Sunday', short: 'Sun' }
];

export default function RoutineScheduleView({ batches = [], teachers = [], showToast }) {
  const [subTab, setSubTab] = useState('timetable'); // 'timetable' | 'calendar' | 'today'
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Navigation State (Default October 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 13)); // 13 Oct 2026 (Tuesday)

  // 1. Centralized Master Routines (class_routines in schema.sql)
  const [masterRoutines, setMasterRoutines] = useState([
    {
      id: 'rt-1',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      dayOfWeek: 1, // Monday
      startTime: '16:00',
      endTime: '17:30',
      timeDisplay: '04:00 PM - 05:30 PM',
      room: 'Hall A (Room 02)',
      color: 'teal'
    },
    {
      id: 'rt-2',
      batchId: 'b-102',
      batchName: 'JEE Foundation · Morning',
      subject: 'Higher Mathematics',
      teacherId: 't-3',
      teacherName: 'S. Mukherjee',
      dayOfWeek: 2, // Tuesday
      startTime: '07:00',
      endTime: '08:30',
      timeDisplay: '07:00 AM - 08:30 AM',
      room: 'Lab 01',
      color: 'violet'
    },
    {
      id: 'rt-3',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Mathematics',
      teacherId: 't-3',
      teacherName: 'S. Mukherjee',
      dayOfWeek: 3, // Wednesday
      startTime: '16:30',
      endTime: '18:00',
      timeDisplay: '04:30 PM - 06:00 PM',
      room: 'Hall A (Room 02)',
      color: 'violet'
    },
    {
      id: 'rt-4',
      batchId: 'b-102',
      batchName: 'JEE Foundation · Morning',
      subject: 'Advanced Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      dayOfWeek: 4, // Thursday
      startTime: '07:00',
      endTime: '08:30',
      timeDisplay: '07:00 AM - 08:30 AM',
      room: 'Hall B (Room 01)',
      color: 'teal'
    },
    {
      id: 'rt-5',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Chemistry',
      teacherId: 't-2',
      teacherName: 'Debjani Paul',
      dayOfWeek: 5, // Friday
      startTime: '17:30',
      endTime: '19:00',
      timeDisplay: '05:30 PM - 07:00 PM',
      room: 'Hall C (Room 03)',
      color: 'orange'
    },
    {
      id: 'rt-6',
      batchId: 'b-103',
      batchName: 'Class 11 · Science (2027)',
      subject: 'Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      dayOfWeek: 2, // Tuesday
      startTime: '16:00',
      endTime: '17:30',
      timeDisplay: '04:00 PM - 05:30 PM',
      room: 'Hall B (Room 01)',
      color: 'teal'
    },
    {
      id: 'rt-7',
      batchId: 'b-103',
      batchName: 'Class 11 · Science (2027)',
      subject: 'Chemistry',
      teacherId: 't-2',
      teacherName: 'Debjani Paul',
      dayOfWeek: 4, // Thursday
      startTime: '16:30',
      endTime: '18:00',
      timeDisplay: '04:30 PM - 06:00 PM',
      room: 'Hall C (Room 03)',
      color: 'orange'
    },
    {
      id: 'rt-8',
      batchId: 'b-103',
      batchName: 'Class 11 · Science (2027)',
      subject: 'Biology',
      teacherId: 't-4',
      teacherName: 'Rupa Sen',
      dayOfWeek: 6, // Saturday
      startTime: '15:00',
      endTime: '16:30',
      timeDisplay: '03:00 PM - 04:30 PM',
      room: 'Bio Lab',
      color: 'rose'
    },
    {
      id: 'rt-9',
      batchId: 'b-102',
      batchName: 'JEE Foundation · Morning',
      subject: 'Problem Solving (DPP)',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      dayOfWeek: 6, // Saturday
      startTime: '08:00',
      endTime: '10:00',
      timeDisplay: '08:00 AM - 10:00 AM',
      room: 'Hall B (Room 01)',
      color: 'teal'
    }
  ]);

  // 2. Concrete Date-wise Sessions (class_sessions in schema.sql)
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      routineId: 'rt-2',
      batchId: 'b-102',
      batchName: 'JEE Foundation · Morning',
      subject: 'Higher Mathematics',
      teacherId: 't-3',
      teacherName: 'S. Mukherjee',
      date: '2026-10-13',
      startTime: '07:00',
      endTime: '08:30',
      timeDisplay: '07:00 AM - 08:30 AM',
      room: 'Lab 01',
      color: 'violet',
      status: 'COMPLETED',
      topicCovered: 'Coordinate Geometry - Ellipse & Hyperbola Theorems',
      attendanceCount: { present: 34, absent: 2 }
    },
    {
      id: 'sess-2',
      routineId: 'rt-6',
      batchId: 'b-103',
      batchName: 'Class 11 · Science (2027)',
      subject: 'Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      date: '2026-10-13',
      startTime: '16:00',
      endTime: '17:30',
      timeDisplay: '04:00 PM - 05:30 PM',
      room: 'Hall B (Room 01)',
      color: 'teal',
      status: 'SCHEDULED',
      topicCovered: 'Work, Power & Energy - Mechanical Conservation',
      attendanceCount: { present: 0, absent: 0 }
    },
    {
      id: 'sess-3',
      routineId: 'rt-3',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Mathematics',
      teacherId: 't-3',
      teacherName: 'S. Mukherjee',
      date: '2026-10-14',
      startTime: '16:30',
      endTime: '18:00',
      timeDisplay: '04:30 PM - 06:00 PM',
      room: 'Hall A (Room 02)',
      color: 'violet',
      status: 'SCHEDULED',
      topicCovered: 'Definite Integrals - Area Under Curves',
      attendanceCount: { present: 0, absent: 0 }
    },
    {
      id: 'sess-4',
      routineId: 'rt-4',
      batchId: 'b-102',
      batchName: 'JEE Foundation · Morning',
      subject: 'Advanced Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      date: '2026-10-15',
      startTime: '07:00',
      endTime: '08:30',
      timeDisplay: '07:00 AM - 08:30 AM',
      room: 'Hall B (Room 01)',
      color: 'teal',
      status: 'SCHEDULED',
      topicCovered: 'Rotational Dynamics - Moment of Inertia Matrix',
      attendanceCount: { present: 0, absent: 0 }
    },
    {
      id: 'sess-5',
      routineId: 'rt-5',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Chemistry',
      teacherId: 't-2',
      teacherName: 'Debjani Paul',
      date: '2026-10-16',
      startTime: '17:30',
      endTime: '19:00',
      timeDisplay: '05:30 PM - 07:00 PM',
      room: 'Hall C (Room 03)',
      color: 'orange',
      status: 'SCHEDULED',
      topicCovered: 'Aldehydes, Ketones & Carboxylic Acids Mechanism',
      attendanceCount: { present: 0, absent: 0 }
    },
    {
      id: 'sess-6',
      routineId: 'rt-1',
      batchId: 'b-101',
      batchName: 'Class 12 · Science (2026)',
      subject: 'Physics',
      teacherId: 't-1',
      teacherName: 'Arindam Roy',
      date: '2026-10-19',
      startTime: '16:00',
      endTime: '17:30',
      timeDisplay: '04:00 PM - 05:30 PM',
      room: 'Hall A (Room 02)',
      color: 'teal',
      status: 'SCHEDULED',
      topicCovered: 'Ray Optics - Prism & Total Internal Reflection',
      attendanceCount: { present: 0, absent: 0 }
    }
  ]);

  // Modal Dialog States
  const [activeModal, setActiveModal] = useState(null); // 'auto_generate' | 'add_routine' | 'session_action'
  const [selectedSession, setSelectedSession] = useState(null);

  // New Routine Form with Live Conflict Checker
  const [newSlotForm, setNewSlotForm] = useState({
    batchId: batches[0]?.id || 'b-101',
    subject: 'Physics',
    teacherId: teachers[0]?.id || 't-1',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:30',
    room: 'Hall A (Room 01)'
  });

  // Action Drawer Form (Reschedule / Substitute / Cancel)
  const [sessionActionType, setSessionActionType] = useState('reschedule'); // 'reschedule' | 'substitute' | 'cancel' | 'attendance'
  const [actionForm, setActionForm] = useState({
    newDate: '2026-10-20',
    newTime: '16:00',
    newEndTime: '17:30',
    substituteTeacherId: teachers[1]?.id || 't-2',
    cancelReason: 'Faculty on emergency leave'
  });

  // Target month for auto generation
  const [generateMonth, setGenerateMonth] = useState('2026-11'); // November 2026

  // --------------------------------------------------------------------------
  // LIVE CONFLICT AUDIT ENGINE (Checks schema.sql teacher overlap constraint)
  // --------------------------------------------------------------------------
  const conflictAudit = useMemo(() => {
    if (!newSlotForm.teacherId || !newSlotForm.startTime || !newSlotForm.endTime) return null;

    const teacherObj = teachers.find(t => t.id === newSlotForm.teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Selected Faculty';

    // Find overlapping routine slot on the same day for this teacher
    const conflictingSlot = masterRoutines.find(r => {
      if (r.teacherId !== newSlotForm.teacherId) return false;
      if (Number(r.dayOfWeek) !== Number(newSlotForm.dayOfWeek)) return false;

      // Overlap formula: (existing_start < new_end AND new_start < existing_end)
      const exStart = r.startTime;
      const exEnd = r.endTime;
      const nStart = newSlotForm.startTime;
      const nEnd = newSlotForm.endTime;

      return (exStart < nEnd && nStart < exEnd);
    });

    if (conflictingSlot) {
      return {
        hasConflict: true,
        message: `Conflict detected: ${teacherName} is already assigned to "${conflictingSlot.batchName}" (${conflictingSlot.subject}) from ${conflictingSlot.timeDisplay} on this day!`
      };
    }
    return { hasConflict: false };
  }, [newSlotForm, masterRoutines, teachers]);

  // --------------------------------------------------------------------------
  // Month & Day Utilities
  // --------------------------------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayFormatted = '2026-10-13'; // Fixed institute context date

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (selectedBatch !== 'ALL' && s.batchId !== selectedBatch) return false;
      if (selectedTeacher !== 'ALL' && s.teacherId !== selectedTeacher) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          s.subject.toLowerCase().includes(query) ||
          s.batchName.toLowerCase().includes(query) ||
          s.teacherName.toLowerCase().includes(query) ||
          s.room.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [sessions, selectedBatch, selectedTeacher, searchTerm]);

  // Filtered Master Routines
  const filteredMasterRoutines = useMemo(() => {
    return masterRoutines.filter(r => {
      if (selectedBatch !== 'ALL' && r.batchId !== selectedBatch) return false;
      if (selectedTeacher !== 'ALL' && r.teacherId !== selectedTeacher) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          r.subject.toLowerCase().includes(query) ||
          r.batchName.toLowerCase().includes(query) ||
          r.teacherName.toLowerCase().includes(query) ||
          r.room.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [masterRoutines, selectedBatch, selectedTeacher, searchTerm]);

  // Sessions on "Today"
  const todaySessions = useMemo(() => {
    return filteredSessions.filter(s => s.date === todayFormatted);
  }, [filteredSessions]);

  // --------------------------------------------------------------------------
  // Auto-Generate Next Month Sessions Action (Simulates Cron Job)
  // --------------------------------------------------------------------------
  const handleAutoGenerate = () => {
    const [genYearStr, genMonthStr] = generateMonth.split('-');
    const genYear = parseInt(genYearStr, 10);
    const genMonth = parseInt(genMonthStr, 10) - 1; // 0-indexed

    // Calculate days in targeted month
    const totalDaysInMonth = new Date(genYear, genMonth + 1, 0).getDate();
    const newGeneratedSessions = [];

    // Loop through each calendar day of that month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(genYear, genMonth, day);
      // JS: Sunday = 0, Monday = 1... Saturday = 6.
      // Schema.sql: Monday = 1 ... Sunday = 7
      let dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sun to 7

      const dateStr = `${genYear}-${String(genMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Check which master routines match this day
      masterRoutines.forEach((routine) => {
        if (routine.dayOfWeek === dayOfWeek) {
          newGeneratedSessions.push({
            id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            routineId: routine.id,
            batchId: routine.batchId,
            batchName: routine.batchName,
            subject: routine.subject,
            teacherId: routine.teacherId,
            teacherName: routine.teacherName,
            date: dateStr,
            startTime: routine.startTime,
            endTime: routine.endTime,
            timeDisplay: routine.timeDisplay,
            room: routine.room,
            color: routine.color,
            status: 'SCHEDULED',
            topicCovered: `Curriculum Standard Module - ${routine.subject}`,
            attendanceCount: { present: 0, absent: 0 }
          });
        }
      });
    }

    setSessions(prev => [...prev, ...newGeneratedSessions]);
    setActiveModal(null);
    if (showToast) {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      showToast(
        'Month Sessions Generated',
        `Successfully auto-generated ${newGeneratedSessions.length} sessions for ${monthNames[genMonth]} ${genYear} from master routine!`
      );
    }
  };

  // Add Master Routine Slot
  const handleAddRoutineSlot = (e) => {
    e.preventDefault();
    if (conflictAudit.hasConflict) {
      alert('Cannot add slot: Faculty time clash detected!');
      return;
    }

    const batchObj = batches.find(b => b.id === newSlotForm.batchId);
    const teacherObj = teachers.find(t => t.id === newSlotForm.teacherId);

    const colors = ['teal', 'violet', 'orange', 'rose'];
    const assignedColor = colors[masterRoutines.length % colors.length];

    // Format 24h to 12h display
    const formatTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${String(formattedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const newSlot = {
      id: `rt-${Date.now()}`,
      batchId: newSlotForm.batchId,
      batchName: batchObj ? batchObj.name : 'General Batch',
      subject: newSlotForm.subject,
      teacherId: newSlotForm.teacherId,
      teacherName: teacherObj ? teacherObj.name : 'Faculty Member',
      dayOfWeek: Number(newSlotForm.dayOfWeek),
      startTime: newSlotForm.startTime,
      endTime: newSlotForm.endTime,
      timeDisplay: `${formatTime(newSlotForm.startTime)} - ${formatTime(newSlotForm.endTime)}`,
      room: newSlotForm.room,
      color: assignedColor
    };

    setMasterRoutines(prev => [...prev, newSlot]);
    setActiveModal(null);
    if (showToast) {
      showToast('Routine Slot Created', `Added ${newSlot.subject} (${DAYS_OF_WEEK.find(d => d.id === newSlot.dayOfWeek)?.name}) to ${newSlot.batchName}.`);
    }
  };

  // Delete Routine Slot
  const handleDeleteRoutineSlot = (id) => {
    if (window.confirm('Are you sure you want to remove this weekly recurring class from the master routine?')) {
      setMasterRoutines(prev => prev.filter(r => r.id !== id));
      if (showToast) {
        showToast('Routine Slot Removed', 'Recurring weekly schedule updated.');
      }
    }
  };

  // Handle Session Actions (Reschedule, Substitute, Cancel)
  const handleApplySessionAction = () => {
    if (!selectedSession) return;

    if (sessionActionType === 'cancel') {
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? {
        ...s,
        status: 'CANCELLED',
        cancellationReason: actionForm.cancelReason
      } : s));
      if (showToast) showToast('Session Cancelled', `Marked as cancelled. Reason: ${actionForm.cancelReason}`);
    } else if (sessionActionType === 'substitute') {
      const subTeacher = teachers.find(t => t.id === actionForm.substituteTeacherId);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? {
        ...s,
        teacherId: actionForm.substituteTeacherId,
        teacherName: subTeacher ? `${subTeacher.name} (Substitute)` : 'Substitute Faculty'
      } : s));
      if (showToast) showToast('Faculty Substituted', `Substitute teacher assigned for this date.`);
    } else if (sessionActionType === 'reschedule') {
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? {
        ...s,
        status: 'RESCHEDULED',
        date: actionForm.newDate,
        startTime: actionForm.newTime,
        endTime: actionForm.newEndTime,
        timeDisplay: `${actionForm.newTime} - ${actionForm.newEndTime}`
      } : s));
      if (showToast) showToast('Class Rescheduled', `Class moved to ${actionForm.newDate}. Audit trail logged.`);
    } else if (sessionActionType === 'complete') {
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? {
        ...s,
        status: 'COMPLETED'
      } : s));
      if (showToast) showToast('Class Completed', `Marked session as completed.`);
    }

    setActiveModal(null);
    setSelectedSession(null);
  };

  // Quick navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToday = () => setCurrentDate(new Date(2026, 9, 13));

  // Calendar Day Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon is 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-actions">
          <button
            className="button-secondary"
            onClick={() => setActiveModal('auto_generate')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Sparkles size={16} color="var(--orange)" /> Auto-generate month
          </button>
          <button
            className="button-primary"
            onClick={() => setActiveModal('add_routine')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Add routine slot
          </button>
        </div>
      </div>

      {/* Sub-tabs / View Switcher */}
      <div className="sub-tabs" style={{ marginBottom: 12 }}>
        <button
          className={`sub-tab ${subTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setSubTab('timetable')}
        >
          <CalendarDays size={15} /> 7-Day Master Timetable
          <span className="sub-tab-badge">{masterRoutines.length} slots</span>
        </button>

        <button
          className={`sub-tab ${subTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setSubTab('calendar')}
        >
          <Calendar size={15} /> Monthly Calendar
          <span className="sub-tab-badge">{filteredSessions.length} sessions</span>
        </button>

        <button
          className={`sub-tab ${subTab === 'today' ? 'active' : ''}`}
          onClick={() => setSubTab('today')}
        >
          <Clock size={15} /> Today's Sessions
          <span className="sub-tab-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
            {todaySessions.length} classes
          </span>
        </button>
      </div>

      {/* Filter and Date Controls Toolbar */}
      <div
        className="data-table-toolbar"
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Batch Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-3)' }}>Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--page-bg)',
                color: 'var(--text)'
              }}
            >
              <option value="ALL">All Batches (Centralized)</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-3)' }}>Faculty:</span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--page-bg)',
                color: 'var(--text)'
              }}
            >
              <option value="ALL">All Faculty Members</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="data-table-search" style={{ minWidth: 240, height: 42 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search subject or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: 15 }}
            />
          </div>
        </div>

        {/* Date Month Navigator (Only for Monthly Calendar Grid) */}
        {subTab === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={prevMonth}
              className="icon-button"
              title="Previous Month"
              style={{ width: 34, height: 34 }}
            >
              <ChevronLeft size={18} />
            </button>
            <strong style={{ fontSize: 16.5, minWidth: 130, textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
              {monthName}
            </strong>
            <button
              onClick={nextMonth}
              className="icon-button"
              title="Next Month"
              style={{ width: 34, height: 34 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Today's Live Date (Only for Today's Live Sessions tab) */}
        {subTab === 'today' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
            <CalendarDays size={18} color="var(--teal)" />
            <strong style={{ color: 'var(--text)', fontFamily: 'Manrope, sans-serif' }}>
              Tuesday, 13 October 2026
            </strong>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: 7-DAY CENTRALIZED MASTER TIMETABLE GRID (Monday - Sunday)     */}
      {/* ==================================================================== */}
      {subTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 7-Day Columns Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              alignItems: 'start'
            }}
          >
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = filteredMasterRoutines.filter(r => r.dayOfWeek === day.id);

              return (
                <div
                  key={day.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 260
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      padding: '11px 13px',
                      background: '#f8f9fa',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 16, color: 'var(--text)' }}>
                        {day.name}
                      </strong>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-3)' }}>
                      {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {/* Day Slots List */}
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {daySlots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 10px', color: 'var(--text-3)', fontSize: 14 }}>
                        No scheduled classes
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          style={{
                            background: 'var(--page-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '11px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            position: 'relative'
                          }}
                        >
                          {/* Time */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} color="var(--text-3)" /> {slot.timeDisplay}
                            </span>
                          </div>

                          {/* Subject & Batch */}
                          <div>
                            <strong style={{ fontSize: 16, color: 'var(--text)', display: 'block' }}>
                              {slot.subject}
                            </strong>
                            <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                              {slot.batchName}
                            </span>
                          </div>

                          {/* Faculty & Delete action */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: 6,
                              paddingTop: 8,
                              borderTop: '1px dashed #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  background: slot.color === 'teal' ? '#dcfce7' : slot.color === 'violet' ? '#f3e8ff' : '#ffedd5',
                                  color: slot.color === 'teal' ? '#15803d' : slot.color === 'violet' ? '#7e22ce' : '#c2410c',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 12.5,
                                  fontWeight: 800
                                }}
                              >
                                {slot.teacherName[0]}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
                                {slot.teacherName}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteRoutineSlot(slot.id)}
                              style={{ border: 0, background: 'transparent', color: '#94a3b8', padding: 3, cursor: 'pointer' }}
                              title="Delete recurring slot"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MONTHLY CALENDAR GRID (Concrete Date-wise Sessions)           */}
      {/* ==================================================================== */}
      {subTab === 'calendar' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {/* Calendar Weekday Names */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f8f9fa',
              borderBottom: '1px solid var(--border)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-2)',
              padding: '13px 0'
            }}
          >
            {DAYS_OF_WEEK.map(d => (
              <div key={d.id}>{d.name}</div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              minHeight: 540
            }}
          >
            {/* Blank cells before 1st of month */}
            {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
              <div key={`blank-${idx}`} style={{ background: '#fafbfc', borderRight: '1px solid #edf1f3', borderBottom: '1px solid #edf1f3', minHeight: 105 }} />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const daySessions = filteredSessions.filter(s => s.date === cellDateStr);
              const isCellToday = cellDateStr === todayFormatted;

              return (
                <div
                  key={dayNum}
                  style={{
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    padding: '8px 9px',
                    minHeight: 110,
                    background: isCellToday ? '#f0fdf9' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5
                  }}
                >
                  {/* Day Number Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isCellToday ? 800 : 700,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: isCellToday ? 'var(--teal)' : 'transparent',
                        color: isCellToday ? '#fff' : 'var(--text)'
                      }}
                    >
                      {dayNum}
                    </span>
                    {daySessions.length > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)' }}>
                        {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
                      </span>
                    )}
                  </div>

                  {/* Sessions on this date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {daySessions.map((sess) => {
                      const isCompleted = sess.status === 'COMPLETED';
                      const isCancelled = sess.status === 'CANCELLED';
                      const isRescheduled = sess.status === 'RESCHEDULED';

                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            setSelectedSession(sess);
                            setActiveModal('session_action');
                          }}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 6,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            background: isCancelled ? '#fee2e2' : isCompleted ? '#f1f5f9' : isRescheduled ? '#ffedd5' : 'var(--teal-soft)',
                            borderLeft: `3px solid ${isCancelled ? '#ef4444' : isCompleted ? '#94a3b8' : isRescheduled ? '#f97316' : 'var(--teal)'}`,
                            color: isCancelled ? '#991b1b' : isCompleted ? '#64748b' : isRescheduled ? '#9a3412' : 'var(--teal-dark)',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                            transition: 'transform .1s',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          title="Click to manage (Reschedule / Substitute / Cancel)"
                        >
                          <strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sess.subject}
                          </strong>
                          <span style={{ fontSize: 11.5, opacity: 0.9 }}>
                            {sess.timeDisplay.split(' - ')[0]} · {sess.teacherName.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TODAY'S LIVE SESSIONS & REAL-TIME AUDIT                      */}
      {/* ==================================================================== */}
      {subTab === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {todaySessions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface)', borderRadius: 12 }}>
                No classes scheduled for today.
              </div>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 5,
                          textTransform: 'uppercase',
                          background: session.status === 'COMPLETED' ? '#dcfce7' : session.status === 'CANCELLED' ? '#fee2e2' : 'var(--teal-soft)',
                          color: session.status === 'COMPLETED' ? '#15803d' : session.status === 'CANCELLED' ? '#b91c1c' : 'var(--teal-dark)'
                        }}
                      >
                        {session.status}
                      </span>
                      <h3 style={{ margin: '8px 0 3px', fontSize: 17, fontFamily: 'Manrope, sans-serif' }}>
                        {session.subject}
                      </h3>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{session.batchName}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                        {session.timeDisplay}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--page-bg)',
                      padding: '10px 14px',
                      borderRadius: 9,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: 12
                        }}
                      >
                        {session.teacherName[0]}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 13.5 }}>{session.teacherName}</strong>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Assigned Faculty</span>
                      </div>
                    </div>

                    {session.topicCovered && (
                      <span style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 190, textAlign: 'right' }}>
                        📖 {session.topicCovered}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
                      <button
                        className="button-primary"
                        onClick={() => {
                          setSelectedSession(session);
                          setSessionActionType('complete');
                          handleApplySessionAction();
                        }}
                        style={{ flex: 1, fontSize: 13, padding: '8px 12px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Mark done
                      </button>
                    )}
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('reschedule');
                        setActiveModal('session_action');
                      }}
                      style={{ flex: 1, fontSize: 13, padding: '8px 12px', height: 'auto' }}
                    >
                      Reschedule
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('substitute');
                        setActiveModal('session_action');
                      }}
                      style={{ fontSize: 13, padding: '8px 12px', height: 'auto' }}
                    >
                      Substitute
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('cancel');
                        setActiveModal('session_action');
                      }}
                      style={{ fontSize: 11, padding: '7px 10px', height: 'auto', color: 'var(--rose)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: AUTO-GENERATE NEXT MONTH SESSIONS (Cron Simulation)         */}
      {/* ==================================================================== */}
      {activeModal === 'auto_generate' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2>Auto-Generate Month Sessions</h2>
                <p>Bulk creates date-wise sessions from the 7-day recurring master timetable.</p>
              </div>
              <button className="icon-button" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 11.5,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <Sparkles size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Automated Background Logic:</strong>
                  <div style={{ marginTop: 4, lineHeight: 1.45 }}>
                    The system expands all active <code>class_routines</code> across the chosen month's calendar dates, matching Monday–Sunday without duplicate collision.
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                  TARGET MONTH & YEAR
                </label>
                <input
                  type="month"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span>Active Master Weekly Routines:</span>
                  <strong>{masterRoutines.length} slots / week</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--teal-dark)' }}>
                  <span>Estimated Sessions to Generate:</span>
                  <strong>~{masterRoutines.length * 4} classes</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="button-primary" onClick={handleAutoGenerate}>
                <Check size={16} /> Generate & Sync Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD MASTER ROUTINE SLOT (with Live Conflict Checker)        */}
      {/* ==================================================================== */}
      {activeModal === 'add_routine' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h2>Add Master Weekly Routine Slot</h2>
                <p>Define recurring weekly schedule with automatic faculty conflict detection.</p>
              </div>
              <button className="icon-button" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddRoutineSlot} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Live Conflict Warning Box */}
              {conflictAudit.hasConflict && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: 12,
                    borderRadius: 9,
                    color: '#991b1b',
                    fontSize: 11.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 9
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Faculty Schedule Clash Detected!</strong>
                    <div style={{ marginTop: 3 }}>{conflictAudit.message}</div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <label>
                  <span>Select Batch</span>
                  <select
                    value={newSlotForm.batchId}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, batchId: e.target.value })}
                    required
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Subject</span>
                  <input
                    type="text"
                    value={newSlotForm.subject}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, subject: e.target.value })}
                    placeholder="e.g. Physics, Calculus"
                    required
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Assigned Teacher</span>
                  <select
                    value={newSlotForm.teacherId}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, teacherId: e.target.value })}
                    required
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Day of Week</span>
                  <select
                    value={newSlotForm.dayOfWeek}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, dayOfWeek: Number(e.target.value) })}
                    required
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Start Time</span>
                  <input
                    type="time"
                    value={newSlotForm.startTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, startTime: e.target.value })}
                    required
                  />
                </label>

                <label>
                  <span>End Time</span>
                  <input
                    type="time"
                    value={newSlotForm.endTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, endTime: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="modal-footer" style={{ margin: '10px -20px -16px', padding: '14px 20px' }}>
                <button type="button" className="button-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={conflictAudit.hasConflict}
                >
                  <Plus size={16} /> Save Master Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SESSION MANAGEMENT (Reschedule / Substitute / Cancel)       */}
      {/* ==================================================================== */}
      {activeModal === 'session_action' && selectedSession && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2>Manage Class Session</h2>
                <p>{selectedSession.subject} · {selectedSession.batchName}</p>
              </div>
              <button className="icon-button" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Action tabs */}
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setSessionActionType('reschedule')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: sessionActionType === 'reschedule' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'reschedule' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'reschedule' ? 'var(--text)' : 'var(--text-3)'
                  }}
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setSessionActionType('substitute')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: sessionActionType === 'substitute' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'substitute' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'substitute' ? 'var(--text)' : 'var(--text-3)'
                  }}
                >
                  Substitute
                </button>
                <button
                  type="button"
                  onClick={() => setSessionActionType('cancel')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: sessionActionType === 'cancel' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'cancel' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'cancel' ? 'var(--rose)' : 'var(--text-3)'
                  }}
                >
                  Cancel Class
                </button>
              </div>

              {/* Current Session Snapshot */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Current Date:</span>
                  <strong>{selectedSession.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Current Time:</span>
                  <strong>{selectedSession.timeDisplay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Faculty:</span>
                  <strong>{selectedSession.teacherName}</strong>
                </div>
              </div>

              {/* Action Form Inputs */}
              {sessionActionType === 'reschedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                      NEW DATE
                    </span>
                    <input
                      type="date"
                      value={actionForm.newDate}
                      onChange={(e) => setActionForm({ ...actionForm, newDate: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)' }}
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        START TIME
                      </span>
                      <input
                        type="time"
                        value={actionForm.newTime}
                        onChange={(e) => setActionForm({ ...actionForm, newTime: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        END TIME
                      </span>
                      <input
                        type="time"
                        value={actionForm.newEndTime}
                        onChange={(e) => setActionForm({ ...actionForm, newEndTime: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {sessionActionType === 'substitute' && (
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                    SELECT SUBSTITUTE FACULTY
                  </span>
                  <select
                    value={actionForm.substituteTeacherId}
                    onChange={(e) => setActionForm({ ...actionForm, substituteTeacherId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>
                </label>
              )}

              {sessionActionType === 'cancel' && (
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                    REASON FOR CANCELLATION
                  </span>
                  <textarea
                    rows={3}
                    value={actionForm.cancelReason}
                    onChange={(e) => setActionForm({ ...actionForm, cancelReason: e.target.value })}
                    placeholder="e.g. Faculty illness, festival holiday, weather disruption..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                  />
                </label>
              )}
            </div>

            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="button-primary" onClick={handleApplySessionAction}>
                Apply Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
