import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { apiRequest } from '../../api';
import './TimetableRoutine.css';

// Weekdays mapping: index 0 (Mon) -> 6 (Sun)
const WEEK_DAYS = [
  { dayIndex: 1, name: 'Monday', short: 'Mon' },
  { dayIndex: 2, name: 'Tuesday', short: 'Tue' },
  { dayIndex: 3, name: 'Wednesday', short: 'Wed' },
  { dayIndex: 4, name: 'Thursday', short: 'Thu' },
  { dayIndex: 5, name: 'Friday', short: 'Fri' },
  { dayIndex: 6, name: 'Saturday', short: 'Sat' },
  { dayIndex: 7, name: 'Sunday', short: 'Sun' }
];

// Sun-first calendar weekday headers for Reschedule calendar
const RSC_WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper: Format "HH:MM:SS" or "HH:MM" into clean 12-hour format e.g. "10:00 AM"
const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
};

// Helper: Format Date to YYYY-MM-DD local string
const toLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get Monday of the week for a given date
const getMondayOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

// Helper: Format date object to readable string like "Thursday, October 15, 2026"
const formatDateFull = (d) => {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function TimetableRoutine({ onNavigate, user }) {
  // Main Action Switcher: 'schedule' | 'reschedule'
  const [activeActionTab, setActiveActionTab] = useState('schedule');

  // Capsule switcher: 'today' | 'week' | 'month'
  const [activeCapsule, setActiveCapsule] = useState('today');

  // ---- SCHEDULE VIEW DATA ----
  const [masterRoutines, setMasterRoutines] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Month navigation state (Schedule > Month view)
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Modal Dialog state for day schedule popup (Schedule > Week/Month)
  const [selectedModalData, setSelectedModalData] = useState(null);

  // ---- RESCHEDULE VIEW DATA ----
  const [rescheduleMonth, setRescheduleMonth] = useState(() => new Date());
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState(() => new Date());
  const [allMonthSessions, setAllMonthSessions] = useState([]); // all teachers for the month
  const [allRoutines, setAllRoutines] = useState([]); // all active routines (own + others)
  const [allDateSessions, setAllDateSessions] = useState([]);   // all teachers for selected date
  const [rscLoading, setRscLoading] = useState(false);

  // Manage Session Modal state
  const [manageSessionModal, setManageSessionModal] = useState(null); // { session }
  const [manageTab, setManageTab] = useState('reschedule'); // 'reschedule' | 'cancel'
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', startTime: '', endTime: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null); // success message

  // Today reference
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => toLocalDateString(today), [today]);

  // Current user info
  const currentUser = user;

  // --------------------------------------------------------------------------
  // FETCH: Schedule view data (own routines + sessions)
  // --------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routinesRes, sessionsRes] = await Promise.all([
        apiRequest('/api/teacher/my-routine').catch((err) => {
          console.warn('Failed to load routines:', err);
          return [];
        }),
        apiRequest('/api/teacher/sessions').catch((err) => {
          console.warn('Failed to load sessions:', err);
          return [];
        })
      ]);

      setMasterRoutines(Array.isArray(routinesRes) ? routinesRes : []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    } catch (err) {
      console.error('Error fetching timetable data:', err);
      setError('Failed to load routine and timetable schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --------------------------------------------------------------------------
  // FETCH: Reschedule view — all sessions for a month
  // --------------------------------------------------------------------------
  const fetchRescheduleMonthData = useCallback(async (monthDate) => {
    setRscLoading(true);
    try {
      const year = monthDate.getFullYear();
      const month = String(monthDate.getMonth() + 1).padStart(2, '0');
      // Fetch concrete sessions AND all routines in parallel
      const [sessionsData, routinesData] = await Promise.all([
        apiRequest(`/api/teacher/sessions/all?month=${year}-${month}`).catch(() => []),
        apiRequest('/api/teacher/routines/all').catch(() => [])
      ]);
      setAllMonthSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setAllRoutines(Array.isArray(routinesData) ? routinesData : []);
    } catch (err) {
      console.warn('Failed to load reschedule month data:', err);
      setAllMonthSessions([]);
      setAllRoutines([]);
    } finally {
      setRscLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // FETCH: Reschedule view — all sessions for selected date
  // --------------------------------------------------------------------------
  const fetchRescheduleDateData = useCallback(async (dateObj) => {
    try {
      const dateStr = toLocalDateString(dateObj);
      const data = await apiRequest(`/api/teacher/sessions/all?session_date=${dateStr}`);
      setAllDateSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load all sessions for date:', err);
      setAllDateSessions([]);
    }
  }, []);

  // When reschedule tab activates or rescheduleMonth changes, fetch month data
  useEffect(() => {
    if (activeActionTab === 'reschedule') {
      fetchRescheduleMonthData(rescheduleMonth);
    }
  }, [activeActionTab, rescheduleMonth, fetchRescheduleMonthData]);

  // When selectedRescheduleDate changes, fetch date sessions
  useEffect(() => {
    if (activeActionTab === 'reschedule') {
      fetchRescheduleDateData(selectedRescheduleDate);
    }
  }, [activeActionTab, selectedRescheduleDate, fetchRescheduleDateData]);

  // --------------------------------------------------------------------------
  // SCHEDULE VIEW HELPERS
  // --------------------------------------------------------------------------
  const getClassesForDate = useCallback(
    (targetDateStr, dayOfWeek) => {
      const matchedSessions = sessions.filter(
        (s) => s.session_date === targetDateStr && s.status !== 'CANCELLED'
      );

      if (matchedSessions.length > 0) {
        return matchedSessions
          .map((s) => ({
            id: s.id,
            batchName: s.batches?.name || s.batch_name || 'Assigned Batch',
            subject: s.subject || 'General Subject',
            startTime: s.start_time,
            endTime: s.end_time,
            status: s.status || 'SCHEDULED',
            topic: s.topic_covered || null,
            type: 'SESSION'
          }))
          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      }

      const matchedRoutines = masterRoutines.filter(
        (r) => Number(r.day_of_week) === Number(dayOfWeek) && r.is_active !== false
      );

      return matchedRoutines
        .map((r) => ({
          id: r.id,
          batchName: r.batches?.name || r.batch_name || 'Assigned Batch',
          subject: r.subject || 'General Subject',
          startTime: r.start_time,
          endTime: r.end_time,
          status: 'SCHEDULED',
          topic: null,
          type: 'ROUTINE'
        }))
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    },
    [sessions, masterRoutines]
  );

  // 1. TODAY'S DATA
  const todayJsDay = today.getDay();
  const todayDayOfWeek = todayJsDay === 0 ? 7 : todayJsDay;
  const todayClasses = useMemo(() => {
    return getClassesForDate(todayDateStr, todayDayOfWeek);
  }, [getClassesForDate, todayDateStr, todayDayOfWeek]);

  const formattedTodayFull = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [today]);

  // 2. THIS WEEK'S DATA
  const currentWeekDays = useMemo(() => {
    const monday = getMondayOfWeek(today);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateStr = toLocalDateString(d);
      const dayOfWeek = i + 1;
      const classes = getClassesForDate(dateStr, dayOfWeek);
      const isTodayDate = dateStr === todayDateStr;
      days.push({
        dayIndex: dayOfWeek,
        dayName: WEEK_DAYS[i].name,
        shortDay: WEEK_DAYS[i].short,
        dateObj: d,
        dateStr,
        shortDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        formattedDate: d.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        isToday: isTodayDate,
        classes
      });
    }
    return days;
  }, [today, todayDateStr, getClassesForDate]);

  const weekRangeText = useMemo(() => {
    if (currentWeekDays.length < 7) return '';
    const first = currentWeekDays[0].shortDate;
    const last = currentWeekDays[6].shortDate;
    const yr = currentWeekDays[6].dateObj.getFullYear();
    return `${first} - ${last}, ${yr}`;
  }, [currentWeekDays]);

  // 3. THIS MONTH'S CALENDAR
  const monthDisplayTitle = useMemo(() => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleResetToCurrentMonth = () => setCurrentMonth(new Date());

  const monthCalendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayJs = firstDay.getDay();
    const blankOffset = firstDayJs === 0 ? 6 : firstDayJs - 1;
    const blanks = Array.from({ length: blankOffset }, (_, i) => ({ key: `blank-${i}`, isBlank: true }));
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = toLocalDateString(d);
      const jsDay = d.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const classes = getClassesForDate(dateStr, dayOfWeek);
      const isTodayDate = dateStr === todayDateStr;
      days.push({
        key: `day-${dateStr}`,
        isBlank: false,
        dayNumber: day,
        dateObj: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        formattedDate: d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        isToday: isTodayDate,
        classes
      });
    }
    return [...blanks, ...days];
  }, [currentMonth, todayDateStr, getClassesForDate]);

  // --------------------------------------------------------------------------
  // RESCHEDULE VIEW HELPERS
  // --------------------------------------------------------------------------
  const rescheduleMonthTitle = useMemo(() => {
    return rescheduleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [rescheduleMonth]);

  const prevRescheduleMonth = () => setRescheduleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextRescheduleMonth = () => setRescheduleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // Build calendar dots map: dateStr => { own: bool, other: bool }
  // Combines concrete sessions + routine-generated virtual dates for the current reschedule month
  const calendarDotsMap = useMemo(() => {
    const map = {};

    // Helper: JS getDay() 0=Sun..6=Sat → our day_of_week 1=Mon..7=Sun
    // Routine day_of_week: 1=Mon, 2=Tue, ..., 6=Sat, 7=Sun
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    const routineDowToJsDay = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:0 };

    // Step 1: Generate virtual dots from recurring routines for each day in the month
    if (allRoutines.length > 0) {
      const year  = rescheduleMonth.getFullYear();
      const month = rescheduleMonth.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();

      for (const routine of allRoutines) {
        if (routine.is_active === false) continue;
        const dow = Number(routine.day_of_week); // 1-7
        const jsDay = routineDowToJsDay[dow];    // 0-6
        if (jsDay === undefined) continue;

        for (let day = 1; day <= totalDays; day++) {
          const d = new Date(year, month, day);
          if (d.getDay() !== jsDay) continue;
          const dateStr = toLocalDateString(d);
          if (!map[dateStr]) map[dateStr] = { own: false, other: false };
          if (routine.is_own) map[dateStr].own = true;
          else                map[dateStr].other = true;
        }
      }
    }

    // Step 2: Overlay concrete sessions (they can override or add to routine dots)
    // If a session is CANCELLED, remove the dot (override routine dot to false for own)
    for (const s of allMonthSessions) {
      const ds = s.session_date;
      if (!ds) continue;
      if (s.status === 'CANCELLED') {
        // If cancelled and is own, don't show own dot for this date if no other own session
        // (we handle this by just not adding — the routine dot may still show;
        //  for accurate cancellation, skip this date's own dot from routine side)
        if (s.is_own && map[ds]) map[ds].own = false;
        continue;
      }
      if (!map[ds]) map[ds] = { own: false, other: false };
      if (s.is_own) map[ds].own = true;
      else          map[ds].other = true;
    }

    return map;
  }, [allMonthSessions, allRoutines, rescheduleMonth]);

  // Build reschedule calendar grid (Sun-first)
  const rscCalendarGrid = useMemo(() => {
    const year = rescheduleMonth.getFullYear();
    const month = rescheduleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayJs = firstDay.getDay(); // 0=Sun
    const blanks = Array.from({ length: firstDayJs }, (_, i) => ({ key: `rb-${i}`, isBlank: true }));
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = toLocalDateString(d);
      const isTodayDate = dateStr === todayDateStr;
      const selectedDateStr = toLocalDateString(selectedRescheduleDate);
      const dots = calendarDotsMap[dateStr] || { own: false, other: false };
      days.push({
        key: `rd-${dateStr}`,
        isBlank: false,
        dayNumber: day,
        dateObj: d,
        dateStr,
        isToday: isTodayDate,
        isSelected: dateStr === selectedDateStr,
        hasOwnClass: dots.own,
        hasOtherClass: dots.other
      });
    }
    return [...blanks, ...days];
  }, [rescheduleMonth, todayDateStr, selectedRescheduleDate, calendarDotsMap]);

  // Sorted own and other sessions for selected date
  const ownSessions = useMemo(() => allDateSessions.filter((s) => s.is_own), [allDateSessions]);
  const otherSessions = useMemo(() => allDateSessions.filter((s) => !s.is_own), [allDateSessions]);

  const formattedSelectedRescheduleDate = useMemo(() => {
    return formatDateFull(selectedRescheduleDate);
  }, [selectedRescheduleDate]);

  // Open manage modal
  const openManageModal = (session) => {
    setManageSessionModal(session);
    setManageTab('reschedule');
    setRescheduleForm({
      newDate: session.session_date || '',
      startTime: (session.start_time || '').slice(0, 5),
      endTime: (session.end_time || '').slice(0, 5)
    });
    setCancelReason('');
    setActionSuccess(null);
    setSubmittingAction(false);
  };

  const closeManageModal = () => {
    setManageSessionModal(null);
    setActionSuccess(null);
  };

  // Compute time conflict: does the new date/time overlap any OTHER teacher's session on that date?
  const timeConflictWarning = useMemo(() => {
    if (!rescheduleForm.newDate || !rescheduleForm.startTime || !rescheduleForm.endTime) return null;
    if (!manageSessionModal) return null;

    const newStart = rescheduleForm.startTime; // "HH:MM"
    const newEnd   = rescheduleForm.endTime;

    // Get all sessions on the new date (from allMonthSessions, filtered by date)
    const conflicting = allMonthSessions.filter((s) => {
      if (s.session_date !== rescheduleForm.newDate) return false;
      if (s.id === manageSessionModal.id) return false; // skip self
      if (!s.is_own) {
        // Check time overlap: intervals overlap if start1 < end2 AND start2 < end1
        const s1 = (s.start_time || '').slice(0, 5);
        const e1 = (s.end_time   || '').slice(0, 5);
        return newStart < e1 && s1 < newEnd;
      }
      return false;
    });

    if (conflicting.length === 0) return null;

    const names = conflicting.map((s) =>
      `${s.batches?.name || 'Another class'} (${(s.start_time || '').slice(0, 5)}–${(s.end_time || '').slice(0, 5)})`
    ).join(', ');

    return `Time conflict detected! Another teacher's class overlaps on this slot: ${names}`;
  }, [rescheduleForm, allMonthSessions, manageSessionModal]);

  // Handle Reschedule submit
  const handleReschedule = async () => {
    if (!rescheduleForm.newDate || !rescheduleForm.startTime || !rescheduleForm.endTime) {
      alert('Please fill in the new date, start time, and end time.');
      return;
    }
    setSubmittingAction(true);
    try {
      const sessionId = manageSessionModal.id;
      await apiRequest(
        `/api/teacher/sessions/${sessionId}/reschedule?new_date=${rescheduleForm.newDate}&new_start_time=${rescheduleForm.startTime}:00&new_end_time=${rescheduleForm.endTime}:00`,
        { method: 'POST' }
      );
      setActionSuccess('Class rescheduled successfully!');
      // Refresh data
      fetchRescheduleMonthData(rescheduleMonth);
      fetchRescheduleDateData(selectedRescheduleDate);
      fetchData();
      setTimeout(() => closeManageModal(), 1800);
    } catch (err) {
      alert('Failed to reschedule: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Cancel Class submit
  const handleCancelClass = async () => {
    setSubmittingAction(true);
    try {
      const sessionId = manageSessionModal.id;
      await apiRequest(
        `/api/teacher/sessions/${sessionId}/cancel?reason=${encodeURIComponent(cancelReason)}`,
        { method: 'POST' }
      );
      setActionSuccess('Class cancelled successfully!');
      fetchRescheduleMonthData(rescheduleMonth);
      fetchRescheduleDateData(selectedRescheduleDate);
      fetchData();
      setTimeout(() => closeManageModal(), 1800);
    } catch (err) {
      alert('Failed to cancel class: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="tr-page-container">
      {/* 1. Page Header */}
      <div className="tr-page-header">
        <div className="tr-page-title-group">
          <h1 className="tr-page-title">Timetable &amp; Routine</h1>
          <p className="tr-page-subtitle">Manage your classes here</p>
        </div>
      </div>

      {/* Main Action Capsule (My Schedule | Reschedule) */}
      <div className="tr-main-action-wrapper">
        <div className="tr-main-action-capsule" role="tablist" aria-label="Action Switcher">
          {/* Animated sliding pill background */}
          <div
            className={`tr-main-action-slider ${
              activeActionTab === 'reschedule' ? 'slide-right' : 'slide-left'
            }`}
            aria-hidden="true"
          />

          <button
            type="button"
            role="tab"
            aria-selected={activeActionTab === 'schedule'}
            className={`tr-main-action-btn ${activeActionTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveActionTab('schedule')}
          >
            <Calendar size={18} className="tr-btn-icon" />
            <span>My Schedule</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeActionTab === 'reschedule'}
            className={`tr-main-action-btn ${activeActionTab === 'reschedule' ? 'active' : ''}`}
            onClick={() => setActiveActionTab('reschedule')}
          >
            <RotateCw size={18} className="tr-btn-icon" />
            <span>Reschedule</span>
          </button>
        </div>
      </div>

      {/* ================================================================
          SCHEDULE VIEW
         ================================================================ */}
      {activeActionTab === 'schedule' ? (
        <>
          {/* Capsule Segmented Control Switch */}
          <div className="tr-capsule-nav-wrapper">
            <div className="tr-capsule-switch" role="tablist" aria-label="Routine views">
              <button
                type="button"
                role="tab"
                aria-selected={activeCapsule === 'today'}
                className={`tr-capsule-btn ${activeCapsule === 'today' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('today')}
              >
                Today
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCapsule === 'week'}
                className={`tr-capsule-btn ${activeCapsule === 'week' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('week')}
              >
                This Week
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCapsule === 'month'}
                className={`tr-capsule-btn ${activeCapsule === 'month' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('month')}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Loading & Error States */}
          {loading ? (
            <div className="tr-content-card">
              <div className="tr-loading-state">
                <div className="tr-spinner" />
                <span className="tr-loading-text">Loading routine &amp; timetable schedule...</span>
              </div>
            </div>
          ) : error ? (
            <div className="tr-content-card">
              <div className="tr-error-state">
                <AlertCircle size={36} color="#E11D48" />
                <p className="tr-empty-subtitle">{error}</p>
                <button type="button" className="tr-btn-retry" onClick={fetchData}>
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VIEW A: TODAY */}
              {activeCapsule === 'today' && (
                <div className="tr-content-card">
                  <div className="tr-today-header">
                    <div className="tr-today-date-info">
                      <div className="tr-today-calendar-icon">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <h2 className="tr-today-date-title">{formattedTodayFull}</h2>
                        <span className="tr-today-day-name">Today's Class Schedule</span>
                      </div>
                    </div>
                    <div className={`tr-today-badge ${todayClasses.length === 0 ? 'none' : ''}`}>
                      <CalendarCheck size={15} />
                      <span>
                        {todayClasses.length} {todayClasses.length === 1 ? 'Class' : 'Classes'} Scheduled
                      </span>
                    </div>
                  </div>

                  {todayClasses.length === 0 ? (
                    <div className="tr-empty-state">
                      <div className="tr-empty-icon-circle">
                        <CalendarX size={34} />
                      </div>
                      <h3 className="tr-empty-title">No class scheduled for today</h3>
                      <p className="tr-empty-subtitle">
                        You do not have any classes scheduled for today. Enjoy your time or prepare for upcoming sessions!
                      </p>
                    </div>
                  ) : (
                    <div className="tr-class-list">
                      {todayClasses.map((cls, idx) => (
                        <div key={cls.id || idx} className="tr-class-card">
                          <div className="tr-class-card-left">
                            <div className="tr-class-batch-subject">
                              <span>{cls.batchName}</span>
                              <span className="tr-class-subject-tag">({cls.subject})</span>
                            </div>
                            <div className="tr-class-meta-row">
                              <span className="tr-class-timing-meta">
                                <Clock size={15} />
                                {formatTimeRange(cls.startTime, cls.endTime)}
                              </span>
                              {cls.topic && (
                                <span className="tr-class-topic-meta">
                                  <BookOpen size={14} />
                                  {cls.topic}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="tr-class-card-right">
                            <span className={`tr-class-status-pill ${cls.status?.toLowerCase() || 'scheduled'}`}>
                              {cls.status || 'SCHEDULED'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW B: THIS WEEK */}
              {activeCapsule === 'week' && (
                <div className="tr-content-card">
                  <div className="tr-week-header">
                    <span className="tr-week-range-text">Weekly Schedule ({weekRangeText})</span>
                  </div>
                  <div className="tr-week-boxes-grid">
                    {currentWeekDays.map((day) => {
                      const hasClasses = day.classes.length > 0;
                      return (
                        <div
                          key={day.dayName}
                          className={`tr-week-day-box ${hasClasses ? 'clickable' : 'disabled'} ${
                            day.isToday ? 'is-today' : ''
                          }`}
                          onClick={() => {
                            if (hasClasses) {
                              setSelectedModalData({
                                title: `${day.dayName}'s Classes`,
                                subTitle: day.formattedDate,
                                totalCount: day.classes.length,
                                classes: day.classes
                              });
                            }
                          }}
                          role={hasClasses ? 'button' : undefined}
                          tabIndex={hasClasses ? 0 : undefined}
                        >
                          <div className="tr-week-box-info">
                            <span className="tr-week-day-title">{day.dayName}</span>
                            <span className="tr-week-date-sub">{day.shortDate}</span>
                          </div>
                          <div className="tr-week-box-badge-wrap">
                            <span className={`tr-week-count-badge ${hasClasses ? 'has-classes' : 'zero-classes'}`}>
                              {day.classes.length} {day.classes.length === 1 ? 'Class' : 'Classes'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW C: THIS MONTH */}
              {activeCapsule === 'month' && (
                <div className="tr-content-card">
                  <div className="tr-month-nav-header">
                    <div className="tr-month-nav-controls">
                      <button type="button" className="tr-month-nav-btn" onClick={handlePrevMonth}>
                        <ChevronLeft size={20} />
                      </button>
                      <h2 className="tr-month-display-title">{monthDisplayTitle}</h2>
                      <button type="button" className="tr-month-nav-btn" onClick={handleNextMonth}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    <button type="button" className="tr-month-today-quick-btn" onClick={handleResetToCurrentMonth}>
                      Current Month
                    </button>
                  </div>

                  <div className="tr-calendar-wrapper">
                    <div className="tr-calendar-weekdays-row">
                      {WEEK_DAYS.map((wd) => (
                        <div key={wd.dayIndex} className="tr-calendar-weekday-cell">
                          {wd.short}
                        </div>
                      ))}
                    </div>
                    <div className="tr-calendar-days-grid">
                      {monthCalendarGrid.map((cell) => {
                        if (cell.isBlank) return <div key={cell.key} className="tr-calendar-blank-cell" />;
                        const hasClasses = cell.classes.length > 0;
                        return (
                          <div
                            key={cell.key}
                            className={`tr-calendar-day-cell ${hasClasses ? 'has-classes' : 'no-classes'} ${
                              cell.isToday ? 'is-today' : ''
                            }`}
                            onClick={() => {
                              if (hasClasses) {
                                setSelectedModalData({
                                  title: cell.formattedDate,
                                  subTitle: `${cell.dayName} Schedule`,
                                  totalCount: cell.classes.length,
                                  classes: cell.classes
                                });
                              }
                            }}
                            role={hasClasses ? 'button' : undefined}
                            tabIndex={hasClasses ? 0 : undefined}
                          >
                            <span className="tr-calendar-day-number">{cell.dayNumber}</span>
                            {hasClasses && (
                              <div className="tr-calendar-dot-indicator">
                                <span className="tr-calendar-dot" />
                                <span className="tr-calendar-dot-count">{cell.classes.length}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* ================================================================
           RESCHEDULE VIEW
           ================================================================ */
        <div className="rsc-container">
          {/* Legend Row */}
          <div className="rsc-legend-row">
            <span className="rsc-legend-item">
              <span className="rsc-dot blue" />
              Your Class
            </span>
            <span className="rsc-legend-divider">|</span>
            <span className="rsc-legend-item">
              <span className="rsc-dot red" />
              Other Teacher Class
            </span>
            <span className="rsc-legend-divider">|</span>
            <span className="rsc-legend-item">
              <span className="rsc-dot blue" />
              <span className="rsc-dot red" />
              Both
            </span>
          </div>

          {/* Calendar Card */}
          <div className="rsc-calendar-card">
            {/* Month Nav Header */}
            <div className="rsc-cal-header">
              <button type="button" className="rsc-cal-nav-btn" onClick={prevRescheduleMonth} aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <span className="rsc-month-title">{rescheduleMonthTitle}</span>
              <button type="button" className="rsc-cal-nav-btn" onClick={nextRescheduleMonth} aria-label="Next month">
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className="rsc-today-btn"
                onClick={() => {
                  setRescheduleMonth(new Date());
                  setSelectedRescheduleDate(new Date());
                }}
              >
                Today
              </button>
            </div>

            {/* Weekday Headers (Sun-first) */}
            <div className="rsc-cal-weekdays">
              {RSC_WEEKDAY_HEADERS.map((d) => (
                <div key={d} className="rsc-cal-weekday-cell">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="rsc-cal-days-grid">
              {rscCalendarGrid.map((cell) => {
                if (cell.isBlank) return <div key={cell.key} className="rsc-cal-blank" />;
                return (
                  <div
                    key={cell.key}
                    className={`rsc-cal-day ${cell.isSelected ? 'selected' : ''} ${cell.isToday ? 'today' : ''}`}
                    onClick={() => setSelectedRescheduleDate(cell.dateObj)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="rsc-cal-day-num">{cell.dayNumber}</span>
                    {/* Dot indicators */}
                    {(cell.hasOwnClass || cell.hasOtherClass) && (
                      <div className="rsc-cal-dots">
                        {cell.hasOwnClass && <span className="rsc-cal-dot-blue" />}
                        {cell.hasOtherClass && <span className="rsc-cal-dot-red" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {rscLoading && (
              <div className="rsc-cal-loading">
                <div className="tr-spinner" style={{ width: 20, height: 20 }} />
              </div>
            )}
          </div>

          {/* Date Detail Section */}
          <div className="rsc-date-detail">
            <div className="rsc-date-heading">
              <CalendarDays size={20} className="rsc-date-icon" />
              <div>
                <span className="rsc-date-heading-text">{formattedSelectedRescheduleDate}</span>
                <span className="rsc-date-heading-sub">Class Schedule</span>
              </div>
            </div>

            {/* YOUR CLASSES */}
            <div className="rsc-section">
              <h4 className="rsc-section-title">
                <span className="rsc-section-dot blue" />
                Your Classes ({ownSessions.length})
              </h4>
              {ownSessions.length === 0 ? (
                <div className="rsc-no-class-note">No classes scheduled for you on this date.</div>
              ) : (
                ownSessions.map((cls) => (
                  <div key={cls.id} className="rsc-class-card own">
                    <div className="rsc-class-time-col">
                      <span className="rsc-class-time-start">{formatTime12h(cls.start_time)}</span>
                      <span className="rsc-class-time-end">{formatTime12h(cls.end_time)}</span>
                    </div>
                    <div className="rsc-class-info-col">
                      <span className="rsc-class-batch">{cls.batches?.name || 'Batch'}</span>
                      <span className="rsc-class-subject">{cls.subject}</span>
                      {cls.topic_covered && (
                        <span className="rsc-class-topic">
                          <BookOpen size={12} /> {cls.topic_covered}
                        </span>
                      )}
                    </div>
                    <div className="rsc-class-right-col">
                      <span className="rsc-badge own">Your Class</span>
                      <button
                        type="button"
                        className="rsc-reschedule-btn"
                        onClick={() => openManageModal(cls)}
                      >
                        <Pencil size={13} />
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* OTHER TEACHERS' CLASSES */}
            <div className="rsc-section">
              <h4 className="rsc-section-title">
                <span className="rsc-section-dot red" />
                Other Teachers' Classes ({otherSessions.length})
              </h4>
              {otherSessions.length === 0 ? (
                <div className="rsc-no-class-note">No other teachers' classes on this date.</div>
              ) : (
                otherSessions.map((cls) => (
                  <div key={cls.id} className="rsc-class-card other">
                    <div className="rsc-class-time-col">
                      <span className="rsc-class-time-start">{formatTime12h(cls.start_time)}</span>
                      <span className="rsc-class-time-end">{formatTime12h(cls.end_time)}</span>
                    </div>
                    <div className="rsc-class-info-col">
                      <span className="rsc-class-batch">{cls.batches?.name || 'Class'}</span>
                      <span className="rsc-class-subject">{cls.subject}</span>
                      {cls.topic_covered && (
                        <span className="rsc-class-topic">
                          <BookOpen size={12} /> {cls.topic_covered}
                        </span>
                      )}
                    </div>
                    <div className="rsc-class-right-col">
                      <span className="rsc-badge other">Other Teacher</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SCHEDULE VIEW: POPUP MODAL (Week/Month day details)
         ================================================================ */}
      {selectedModalData && (
        <div
          className="tr-modal-backdrop"
          onClick={() => setSelectedModalData(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="tr-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tr-modal-header">
              <div className="tr-modal-title-group">
                <h2 className="tr-modal-title">{selectedModalData.title}</h2>
                <span className="tr-modal-subtitle">{selectedModalData.subTitle}</span>
              </div>
              <button type="button" className="tr-modal-close-btn" onClick={() => setSelectedModalData(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="tr-modal-body">
              <div className="tr-modal-total-banner">
                <span className="tr-modal-total-text">
                  <CalendarCheck size={18} />
                  Total {selectedModalData.totalCount}{' '}
                  {selectedModalData.totalCount === 1 ? 'Class' : 'Classes'} Scheduled
                </span>
              </div>
              {selectedModalData.classes.map((cls, idx) => (
                <div key={cls.id || idx} className="tr-modal-class-item">
                  <div className="tr-modal-class-item-top">
                    <span className="tr-modal-class-batch-subject">
                      {cls.batchName} <span className="tr-modal-class-subject-span">({cls.subject})</span>
                    </span>
                    <span className={`tr-class-status-pill ${cls.status?.toLowerCase() || 'scheduled'}`}>
                      {cls.status || 'SCHEDULED'}
                    </span>
                  </div>
                  <div className="tr-modal-class-time-row">
                    <Clock size={15} />
                    <span>Timing: {formatTimeRange(cls.startTime, cls.endTime)}</span>
                  </div>
                  {cls.topic && (
                    <div className="tr-modal-class-topic-row">
                      <BookOpen size={14} />
                      <span>Topic: {cls.topic}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="tr-modal-footer">
              <button type="button" className="tr-modal-action-btn" onClick={() => setSelectedModalData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          RESCHEDULE VIEW: MANAGE CLASS SESSION MODAL
         ================================================================ */}
      {manageSessionModal && (
        <div className="rsc-modal-backdrop" onClick={closeManageModal} role="dialog" aria-modal="true">
          <div className="rsc-modal-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="rsc-modal-header">
              <div>
                <h2 className="rsc-modal-title">Manage Class Session</h2>
                <p className="rsc-modal-subtitle">
                  {manageSessionModal.subject} &middot; {manageSessionModal.batches?.name || 'Batch'}
                </p>
              </div>
              <button type="button" className="rsc-modal-close" onClick={closeManageModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Success State */}
            {actionSuccess ? (
              <div className="rsc-modal-success">
                <CheckCircle2 size={40} color="#16a34a" />
                <p>{actionSuccess}</p>
              </div>
            ) : (
              <>
                {/* Capsule Tab Switcher */}
                <div className="rsc-modal-tab-capsule-wrap">
                  <div className="rsc-modal-tab-capsule">
                    <div
                      className={`rsc-modal-tab-slider ${manageTab === 'cancel' ? 'slide-right' : 'slide-left'}`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className={`rsc-modal-tab-btn ${manageTab === 'reschedule' ? 'active' : ''}`}
                      onClick={() => setManageTab('reschedule')}
                    >
                      <RotateCw size={14} />
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className={`rsc-modal-tab-btn ${manageTab === 'cancel' ? 'active' : ''}`}
                      onClick={() => setManageTab('cancel')}
                    >
                      <CalendarX size={14} />
                      Cancel Class
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT WRAPPER — smooth cross-fade */}
                <div className="rsc-modal-tab-content">

                {/* TAB: RESCHEDULE */}
                {manageTab === 'reschedule' && (
                  <div className="rsc-modal-body">
                    <div className="rsc-info-grid">
                      <div className="rsc-info-row">
                        <span className="rsc-info-label">Current Date</span>
                        <strong className="rsc-info-value">{manageSessionModal.session_date}</strong>
                      </div>
                      <div className="rsc-info-row">
                        <span className="rsc-info-label">Current Time</span>
                        <strong className="rsc-info-value">
                          {formatTimeRange(manageSessionModal.start_time, manageSessionModal.end_time)}
                        </strong>
                      </div>
                      <div className="rsc-info-row">
                        <span className="rsc-info-label">Current Status</span>
                        <span className="rsc-status-badge">
                          {manageSessionModal.status || 'SCHEDULED'}
                        </span>
                      </div>
                    </div>

                    <div className="rsc-form-group">
                      <label className="rsc-form-label">NEW SESSION DATE</label>
                      <input
                        type="date"
                        className="rsc-form-input"
                        value={rescheduleForm.newDate}
                        onChange={(e) => setRescheduleForm((f) => ({ ...f, newDate: e.target.value }))}
                      />
                    </div>

                    <div className="rsc-form-row">
                      <div className="rsc-form-group">
                        <label className="rsc-form-label">START TIME</label>
                        <input
                          type="time"
                          className="rsc-form-input"
                          value={rescheduleForm.startTime}
                          onChange={(e) => setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="rsc-form-group">
                        <label className="rsc-form-label">END TIME</label>
                        <input
                          type="time"
                          className="rsc-form-input"
                          value={rescheduleForm.endTime}
                          onChange={(e) => setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Time Conflict Warning */}
                    {timeConflictWarning && (
                      <div className="rsc-conflict-warning">
                        <AlertCircle size={15} />
                        <span>{timeConflictWarning}</span>
                      </div>
                    )}

                    <div className="rsc-modal-footer">
                      <button type="button" className="rsc-btn-cancel" onClick={closeManageModal} disabled={submittingAction}>
                        <X size={14} /> Close
                      </button>
                      <button
                        type="button"
                        className="rsc-btn-confirm"
                        onClick={handleReschedule}
                        disabled={submittingAction}
                      >
                        {submittingAction ? (
                          <><div className="rsc-btn-spinner" /> Updating...</>
                        ) : (
                          <><CheckCircle2 size={15} /> Confirm Reschedule</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: CANCEL CLASS */}
                {manageTab === 'cancel' && (
                  <div className="rsc-modal-body">
                    <div className="rsc-info-grid">
                      <div className="rsc-info-row">
                        <span className="rsc-info-label">Current Date</span>
                        <strong className="rsc-info-value">{manageSessionModal.session_date}</strong>
                      </div>
                      <div className="rsc-info-row">
                        <span className="rsc-info-label">Current Class Time</span>
                        <strong className="rsc-info-value">
                          {formatTimeRange(manageSessionModal.start_time, manageSessionModal.end_time)}
                        </strong>
                      </div>
                    </div>

                    <div className="rsc-form-group">
                      <label className="rsc-form-label">REASON FOR CANCELLATION</label>
                      <textarea
                        className="rsc-form-textarea"
                        placeholder="Enter reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="rsc-modal-footer">
                      <button type="button" className="rsc-btn-cancel" onClick={closeManageModal} disabled={submittingAction}>
                        <X size={14} /> Close
                      </button>
                      <button
                        type="button"
                        className="rsc-btn-danger"
                        onClick={handleCancelClass}
                        disabled={submittingAction}
                      >
                        {submittingAction ? (
                          <><div className="rsc-btn-spinner" /> Cancelling...</>
                        ) : (
                          <><CalendarX size={15} /> Cancel Class</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                </div>{/* end rsc-modal-tab-content */}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
