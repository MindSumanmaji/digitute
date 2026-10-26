import React, { useState, useEffect, useMemo } from 'react';
import AttendanceAnalysis from './AttendanceAnalysis';
import { apiRequest } from '../../api';

// Helper to format 24h time to 12h AM/PM
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour < 10 ? '0' + hour : hour}:${min} ${ampm}`;
};

// Helper to map subject to theme bar color
const getSubjectBarColor = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'sp-bar-blue';
  if (s.includes('phys')) return 'sp-bar-mint';
  if (s.includes('chem')) return 'sp-bar-purple';
  if (s.includes('bio')) return 'sp-bar-amber';
  if (s.includes('comp')) return 'sp-bar-slate';
  return 'sp-bar-blue';
};

// Subject meta helper (supports any subject name variation)
const getSubjectMeta = (subject = '') => {
  const s = String(subject || '').toLowerCase();
  if (s.includes('phys')) return { icon: '⚡', color: '#10b981', lightBg: '#ecfdf5', badgeBg: '#dcfce7', code: 'PHY-102' };
  if (s.includes('math')) return { icon: '📐', color: '#2563eb', lightBg: '#eff6ff', badgeBg: '#dbeafe', code: 'MTH-101' };
  if (s.includes('chem')) return { icon: '🧪', color: '#9333ea', lightBg: '#faf5ff', badgeBg: '#f3e8ff', code: 'CHM-103' };
  if (s.includes('bio')) return { icon: '🧬', color: '#ea580c', lightBg: '#fff7ed', badgeBg: '#ffedd5', code: 'BIO-104' };
  if (s.includes('comp') || s.includes('cs') || s.includes('it')) return { icon: '💻', color: '#0284c7', lightBg: '#f0f9ff', badgeBg: '#e0f2fe', code: 'CS-105' };
  return { icon: '📖', color: '#2563eb', lightBg: '#eff6ff', badgeBg: '#dbeafe', code: `${(subject || 'SUB').slice(0, 3).toUpperCase()}-101` };
};

export default function ClassesTab({ showToast }) {
  const [classesPeriod, setClassesPeriod] = useState('Today');
  const [enteredWeekDay, setEnteredWeekDay] = useState(null);
  const [enteredMonthDate, setEnteredMonthDate] = useState(null);
  const [showAnalysisView, setShowAnalysisView] = useState(false);

  // Date navigation offsets for Today, This Week, and This Month
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  // Subject-wise attendance section states
  const [selectedAttSubject, setSelectedAttSubject] = useState('');
  const [selectedAttIso, setSelectedAttIso] = useState(null);
  const [subCalMonthOffset, setSubCalMonthOffset] = useState(0);
  const [attStatusFilter, setAttStatusFilter] = useState('All');

  // Live Backend Data States
  const [attendanceData, setAttendanceData] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [routinesList, setRoutinesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local ISO date formatter (avoiding UTC timezone shifting bugs)
  const formatToIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const realTodayObj = useMemo(() => new Date(), []);
  const realTodayIso = useMemo(() => formatToIso(realTodayObj), [realTodayObj]);
  const todayDateNum = useMemo(() => realTodayObj.getDate(), [realTodayObj]);

  // 1. Fetch live data from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      apiRequest('/api/student/my-attendance').catch(() => null),
      apiRequest('/api/student/my-sessions').catch(() => []),
      apiRequest('/api/student/my-classes').catch(() => [])
    ])
      .then(([att, sessions, routines]) => {
        if (!isMounted) return;
        if (att) setAttendanceData(att);
        if (Array.isArray(sessions)) setSessionsList(sessions);
        if (Array.isArray(routines)) setRoutinesList(routines);

        // Auto select first available subject
        if (att?.subject_wise && Object.keys(att.subject_wise).length > 0) {
          setSelectedAttSubject(Object.keys(att.subject_wise)[0]);
        } else if (Array.isArray(routines) && routines.length > 0 && routines[0].subject) {
          setSelectedAttSubject(routines[0].subject);
        }

        // Align mini calendar month to active attendance records only if current month has no records
        if (att?.subject_wise) {
          const currentYear = realTodayObj.getFullYear();
          const currentMonth = realTodayObj.getMonth();
          let currentMonthHasRecords = false;
          let latestDateStr = null;

          Object.values(att.subject_wise).forEach((s) => {
            (s.records || []).forEach((r) => {
              if (r.date) {
                if (!latestDateStr || r.date > latestDateStr) {
                  latestDateStr = r.date;
                }
                const parts = r.date.split('-');
                if (parts.length >= 2) {
                  const y = parseInt(parts[0], 10);
                  const m = parseInt(parts[1], 10) - 1;
                  if (y === currentYear && m === currentMonth) {
                    currentMonthHasRecords = true;
                  }
                }
              }
            });
          });

          if (!currentMonthHasRecords && latestDateStr) {
            const recDate = new Date(latestDateStr);
            const diff = (recDate.getFullYear() - currentYear) * 12 + (recDate.getMonth() - currentMonth);
            setSubCalMonthOffset(diff);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [realTodayObj]);

  // View Day for 'Today' tab (allows +/- days)
  const viewDayObj = useMemo(() => {
    const d = new Date(realTodayObj);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset, realTodayObj]);
  const viewDayIso = useMemo(() => formatToIso(viewDayObj), [viewDayObj]);
  const isViewDayRealToday = dayOffset === 0;

  // View Week Monday for 'This Week' tab (allows +/- weeks)
  const viewWeekMonday = useMemo(() => {
    const d = new Date(realTodayObj);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    d.setDate(d.getDate() - dayOfWeek + weekOffset * 7);
    return d;
  }, [weekOffset, realTodayObj]);

  // View Month for 'This Month' tab (allows +/- months)
  const viewMonthObj = useMemo(() => {
    const d = new Date(realTodayObj.getFullYear(), realTodayObj.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset, realTodayObj]);

  // Unified class resolver for any concrete date (Strictly from real database class_sessions & class_routines)
  const getDayClasses = (targetDate, targetIso) => {
    // 1. Match concrete sessions from class_sessions table
    const daySessions = sessionsList.filter((s) => s.session_date === targetIso);
    if (daySessions.length > 0) {
      return daySessions.map((s) => ({
        id: s.id,
        timeStart: formatTime(s.start_time),
        timeEnd: formatTime(s.end_time),
        barColor: getSubjectBarColor(s.subject),
        subject: s.subject,
        topic: s.topic_covered || `Curriculum Module - ${s.subject}`,
        teacher: s.teacher_name || 'Faculty',
        avatar: (s.teacher_name || s.subject)[0].toUpperCase(),
        avatarBg: '#eff6ff',
        avatarColor: '#2563eb',
        status: s.student_attendance_status || (s.status === 'COMPLETED' ? 'Attended' : 'Upcoming')
      }));
    }

    // 2. Fallback: If no concrete session was generated yet, check recurring class_routines from database for current/future dates
    if (targetIso >= realTodayIso && routinesList && routinesList.length > 0) {
      const targetDow = (targetDate.getDay() + 6) % 7 + 1; // 1=Mon ... 7=Sun
      const matchingRoutines = routinesList.filter((r) => parseInt(r.day_of_week, 10) === targetDow);
      if (matchingRoutines.length > 0) {
        return matchingRoutines.map((r) => {
          const tName = r.users?.full_name || r.teacher?.full_name || 'Faculty';
          return {
            id: `routine-${r.id}`,
            timeStart: formatTime(r.start_time),
            timeEnd: formatTime(r.end_time),
            barColor: getSubjectBarColor(r.subject),
            subject: r.subject,
            topic: `Regular Class Timetable · ${r.subject}`,
            teacher: tName,
            avatar: (tName || r.subject)[0].toUpperCase(),
            avatarBg: '#eff6ff',
            avatarColor: '#2563eb',
            status: 'Upcoming'
          };
        });
      }
    }

    return [];
  };

  // 3. Dynamic 7-day data for active week
  const weekDaysData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return days.map((dayName, idx) => {
      const curDate = new Date(viewWeekMonday);
      curDate.setDate(viewWeekMonday.getDate() + idx);
      const isoDate = formatToIso(curDate);
      const dateNum = curDate.getDate();
      const dateFormatted = curDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const isToday = isoDate === realTodayIso;

      const classes = getDayClasses(curDate, isoDate);
      const attendedCount = classes.filter((c) => c.status === 'Attended').length;

      let statusText = isToday
        ? `${classes.length} Classes Scheduled (Today)`
        : classes.length > 0
        ? `${attendedCount} Attended · ${classes.length} Total`
        : 'No classes scheduled';

      return {
        day: dayName,
        short: shortDays[idx],
        date: dateFormatted,
        dateNum,
        isoDate,
        isToday,
        statusText,
        classesCount: classes.length,
        classes
      };
    });
  }, [viewWeekMonday, realTodayIso, sessionsList, routinesList]);

  // Active week day item for drill-down view
  const activeWeekDayObj = useMemo(() => {
    return weekDaysData.find((w) => w.day === enteredWeekDay) || weekDaysData.find((w) => w.isToday) || weekDaysData[0];
  }, [weekDaysData, enteredWeekDay]);

  // Classes for active navigated day in 'Today' tab
  const todayClassesData = useMemo(() => {
    return getDayClasses(viewDayObj, viewDayIso);
  }, [viewDayObj, viewDayIso, sessionsList, routinesList]);

  // 4. Month Calendar Cells (Dynamic Navigated Month)
  const monthData = useMemo(() => {
    const year = viewMonthObj.getFullYear();
    const month = viewMonthObj.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon ... 6=Sun
    const monthName = viewMonthObj.toLocaleDateString('en-GB', { month: 'short' });
    const fullMonthName = viewMonthObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const cells = [];
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ num: prevMonthTotalDays - i, isCurrentMonth: false, monthName: '' });
    }
    for (let d = 1; d <= totalDays; d++) {
      const curIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ num: d, isCurrentMonth: true, monthName, isoDate: curIso });
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ num: i, isCurrentMonth: false, monthName: '' });
    }

    return { cells, fullMonthName, totalDays, year, month };
  }, [viewMonthObj]);

  // Helper to get classes for a specific date in active month
  const getClassesForDate = (dateNum) => {
    const year = monthData.year;
    const month = monthData.month;
    const targetIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    const targetDate = new Date(year, month, dateNum);
    return getDayClasses(targetDate, targetIso);
  };

  // 4. Subject-wise attendance calculation from live backend
  const subjectAttendanceList = useMemo(() => {
    const map = {};

    // First populate from routines
    routinesList.forEach((r) => {
      const s = r.subject;
      if (!map[s]) {
        const meta = getSubjectMeta(s);
        map[s] = {
          name: s,
          code: meta.code,
          icon: meta.icon,
          color: meta.color,
          lightBg: meta.lightBg,
          badgeBg: meta.badgeBg,
          teacher: r.users?.full_name || r.teacher?.full_name || 'Faculty',
          totalClasses: 0,
          attended: 0,
          missed: 0,
          percentage: 0,
          records: []
        };
      }
    });

    // Merge backend subject_wise data
    if (attendanceData?.subject_wise) {
      Object.entries(attendanceData.subject_wise).forEach(([sName, sInfo]) => {
        const meta = getSubjectMeta(sName);
        const resolvedTeacher = (sInfo.teacher && sInfo.teacher !== 'Faculty') ? sInfo.teacher : (map[sName]?.teacher || 'Faculty');
        const sTotal = sInfo.total || 0;
        const sPresent = sInfo.present || 0;
        const sAbsent = sInfo.absent || 0;
        const sRate = sTotal > 0 ? (sInfo.percentage ?? Math.round((sPresent / sTotal) * 100)) : 0;
        map[sName] = {
          name: sName,
          code: meta.code,
          icon: meta.icon,
          color: meta.color,
          lightBg: meta.lightBg,
          badgeBg: meta.badgeBg,
          teacher: resolvedTeacher,
          totalClasses: sTotal,
          attended: sPresent,
          missed: sAbsent,
          percentage: sRate,
          records: (sInfo.records || []).map((rec, i) => {
            const dObj = rec.date ? new Date(rec.date) : null;
            return {
              id: i,
              date: dObj ? dObj.getDate() : i + 1,
              monthShort: dObj ? dObj.toLocaleDateString('en-GB', { month: 'short' }) : '',
              fullDate: rec.date,
              day: dObj ? dObj.toLocaleDateString('en-GB', { weekday: 'short' }) : 'Day',
              topic: rec.topic || `${sName} Session`,
              time: rec.time || '10:00 AM - 11:30 AM',
              status: rec.status,
              teacher: rec.teacher || resolvedTeacher,
              remark: rec.status === 'Present' ? 'Attended Class' : 'Absent (Missed Class)'
            };
          })
        };
      });
    }

    return map;
  }, [routinesList, attendanceData]);

  const currentSubj = subjectAttendanceList[selectedAttSubject] || Object.values(subjectAttendanceList)[0] || {
    name: selectedAttSubject || 'General',
    code: 'GEN-101',
    icon: '📖',
    color: '#2563eb',
    lightBg: '#eff6ff',
    badgeBg: '#dbeafe',
    teacher: 'Faculty',
    totalClasses: 0,
    attended: 0,
    missed: 0,
    percentage: 100,
    records: []
  };

  const recordsByIso = useMemo(() => {
    const map = {};
    (currentSubj?.records || []).forEach((r) => {
      if (r.fullDate) {
        map[r.fullDate] = r;
      }
    });
    return map;
  }, [currentSubj]);

  // Mini Calendar month object for Subject Attendance box
  const subCalMonthObj = useMemo(() => {
    const d = new Date(realTodayObj);
    d.setDate(1);
    d.setMonth(d.getMonth() + subCalMonthOffset);
    return d;
  }, [realTodayObj, subCalMonthOffset]);

  // Mini Calendar grid cells for Subject Attendance box (Clean 7-col layout)
  const subCalCells = useMemo(() => {
    const year = subCalMonthObj.getFullYear();
    const month = subCalMonthObj.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun ... 6=Sat
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const prev = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      prev.push(prevMonthTotalDays - i);
    }
    const days = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { num: dayNum, iso };
    });
    return {
      prev,
      days,
      fullMonthName: subCalMonthObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      year,
      month
    };
  }, [subCalMonthObj]);

  // Filter records strictly by the currently displayed month in the mini calendar
  const currentMonthSubjRecords = useMemo(() => {
    const list = (currentSubj.records || []).filter((r) => {
      if (!r?.fullDate) return false;
      const parts = r.fullDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed month
        return y === subCalCells.year && m === subCalCells.month;
      }
      const d = new Date(r.fullDate);
      return d.getFullYear() === subCalCells.year && d.getMonth() === subCalCells.month;
    });

    // Sort chronologically ascending by fullDate
    return [...list].sort((a, b) => (a.fullDate || '').localeCompare(b.fullDate || ''));
  }, [currentSubj, subCalCells.year, subCalCells.month]);

  // Attendance metrics for the active calendar month
  const monthSubjAttended = useMemo(() => {
    return currentMonthSubjRecords.filter((r) => r.status === 'Present').length;
  }, [currentMonthSubjRecords]);

  const monthSubjMissed = useMemo(() => {
    return currentMonthSubjRecords.filter((r) => r.status === 'Absent').length;
  }, [currentMonthSubjRecords]);

  const monthSubjTotal = currentMonthSubjRecords.length;
  const monthSubjRate = monthSubjTotal > 0
    ? Math.round((monthSubjAttended / monthSubjTotal) * 100 * 10) / 10
    : 0;

  // Filter records by status and selected date within the displayed month
  let filteredRecords = currentMonthSubjRecords;
  if (attStatusFilter !== 'All') {
    filteredRecords = filteredRecords.filter((r) => r.status === attStatusFilter);
  }
  if (selectedAttIso) {
    filteredRecords = filteredRecords.filter((r) => r.fullDate === selectedAttIso);
  }

  // Top metric numbers
  const attendedCount = attendanceData?.month_summary?.attended ?? attendanceData?.present_classes ?? 0;
  const missedCount = attendanceData?.month_summary?.missed ?? attendanceData?.absent_classes ?? 0;
  const attendanceRate = attendanceData?.month_summary?.rate ?? attendanceData?.attendance_percentage ?? 100;

  // Render individual class row
  const renderClassRow = (cls, idx, isLast) => (
    <div key={cls.id || idx} className={`sp-class-v2-row ${isLast ? 'last-row' : ''}`}>
      <div className="sp-c2-time-col">
        <strong>{cls.timeStart}</strong>
        <span>{cls.timeEnd}</span>
      </div>
      <div className={`sp-c2-bar ${cls.barColor || 'sp-bar-blue'}`} />
      <div className="sp-c2-info-col">
        <h4>{cls.subject}</h4>
        <p>{cls.topic}</p>
      </div>
      <div className="sp-c2-teacher-col">
        <div
          className="sp-c2-avatar-circle"
          style={{ background: cls.avatarBg || '#eff6ff', color: cls.avatarColor || '#2563eb' }}
        >
          {cls.avatar || cls.teacher[0]}
        </div>
        <div>
          <strong>{cls.teacher}</strong>
        </div>
      </div>
      <div className="sp-c2-status-col">
        {cls.status === 'Attended' && (
          <span className="sp-badge-attended">
            <span className="sp-badge-check">✓</span> Attended
          </span>
        )}
        {cls.status === 'Absent' && (
          <span className="sp-status-tag tag-absent" style={{ fontWeight: 600, padding: '5px 12px' }}>
            ✕ Absent
          </span>
        )}
        {cls.status === 'Live' && (
          <span className="sp-live-badge-pulse" style={{ padding: '4px 10px', fontSize: '12px' }}>
            ● Live Now
          </span>
        )}
        {(cls.status === 'Upcoming' || cls.status === 'Completed') && (
          <span className="sp-badge-upcoming">
            🕒 {cls.status}
          </span>
        )}
      </div>
    </div>
  );

  if (showAnalysisView) {
    return (
      <AttendanceAnalysis
        onBack={() => setShowAnalysisView(false)}
        showToast={showToast}
        attendanceData={attendanceData}
        routinesList={routinesList}
        sessionsList={sessionsList}
      />
    );
  }

  return (
    <div className="sp-view-container sp-classes-view">
      {/* Header with Blue Calendar Icon */}
      <div className="sp-classes-header-row">
        <div className="sp-classes-title-group">
          <div className="sp-classes-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="sp-page-title">Classes & Attendance</h1>
            <p className="sp-page-subtitle">View your real-time class schedule and track attendance records.</p>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="sp-metrics-grid-3">
        {/* 1. Classes Attended */}
        <div className="sp-metric-card">
          <div className="sp-metric-icon-box sp-bg-mint">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <polyline points="9 13 11 15 15 11" />
            </svg>
          </div>
          <div className="sp-metric-info">
            <strong className="sp-metric-value">{attendedCount}</strong>
            <span className="sp-metric-label">Classes Attended</span>
            <span className="sp-metric-sub">{attendanceData?.month_summary?.month_name || 'This Month'}</span>
          </div>
        </div>

        {/* 2. Classes Missed */}
        <div className="sp-metric-card">
          <div className="sp-metric-icon-box sp-bg-pink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="10" x2="14" y1="12" y2="16" />
              <line x1="14" x2="10" y1="12" y2="16" />
            </svg>
          </div>
          <div className="sp-metric-info">
            <strong className="sp-metric-value">{missedCount}</strong>
            <span className="sp-metric-label">Classes Missed</span>
            <span className="sp-metric-sub">{attendanceData?.month_summary?.month_name || 'This Month'}</span>
          </div>
        </div>

        {/* 3. Attendance Rate */}
        <div
          className="sp-metric-card sp-metric-card-clickable"
          onClick={() => setShowAnalysisView(true)}
          title="Click to open Full Attendance Analysis & Graphs (Week, Month, Year)"
        >
          <div className="sp-metric-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <svg width="30" height="30" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={`${Math.min(100, attendanceRate)}, 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="sp-metric-info" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong className="sp-metric-value">{attendanceRate}%</strong>
              <span className="sp-metric-action-tag">Analysis ↗</span>
            </div>
            <span className="sp-metric-label">Attendance Rate</span>
            <span className="sp-metric-sub">Click for Week/Month/Year Graphs</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Date Switcher Strip */}
      <div className="sp-classes-filter-bar">
        {/* Segmented Filter Pills */}
        <div className="sp-segmented-pills">
          {['Today', 'This Week', 'This Month'].map((tab) => (
            <button
              key={tab}
              className={`sp-seg-pill ${classesPeriod === tab ? 'active' : ''}`}
              onClick={() => {
                setClassesPeriod(tab);
                setEnteredWeekDay(null);
                setEnteredMonthDate(null);
                if (tab === 'Today') setDayOffset(0);
                if (tab === 'This Week') setWeekOffset(0);
                if (tab === 'This Month') setMonthOffset(0);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Context Header for Current Selection with < > Navigation */}
        <div className="sp-date-navigator">
          {classesPeriod === 'Today' && (
            <>
              <button
                className="sp-date-nav-btn"
                onClick={() => setDayOffset((prev) => prev - 1)}
                title="Previous Day"
                aria-label="Previous Day"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <strong className="sp-date-nav-text">
                {viewDayObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                {isViewDayRealToday ? ' (Today)' : ''}
              </strong>
              <button
                className="sp-date-nav-btn"
                onClick={() => setDayOffset((prev) => prev + 1)}
                title="Next Day"
                aria-label="Next Day"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {classesPeriod === 'This Week' && (
            <>
              <button
                className="sp-date-nav-btn"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                title="Previous Week"
                aria-label="Previous Week"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <strong className="sp-date-nav-text" style={{ padding: '0 4px' }}>
                {enteredWeekDay
                  ? `Viewing: ${enteredWeekDay}`
                  : weekOffset === 0
                  ? `Current Week (${weekDaysData[0]?.short} - ${weekDaysData[6]?.short})`
                  : `${weekDaysData[0]?.date.split(' ').slice(0, 2).join(' ')} - ${weekDaysData[6]?.date}`}
              </strong>
              <button
                className="sp-date-nav-btn"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                title="Next Week"
                aria-label="Next Week"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {classesPeriod === 'This Month' && (
            <>
              <button
                className="sp-date-nav-btn"
                onClick={() => {
                  setMonthOffset((prev) => prev - 1);
                  setEnteredMonthDate(null);
                }}
                title="Previous Month"
                aria-label="Previous Month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <strong className="sp-date-nav-text" style={{ padding: '0 4px' }}>
                {enteredMonthDate
                  ? `Viewing: ${enteredMonthDate} ${monthData.fullMonthName}`
                  : monthOffset === 0
                  ? `${monthData.fullMonthName} (Current)`
                  : monthData.fullMonthName}
              </strong>
              <button
                className="sp-date-nav-btn"
                onClick={() => {
                  setMonthOffset((prev) => prev + 1);
                  setEnteredMonthDate(null);
                }}
                title="Next Month"
                aria-label="Next Month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERIOD VIEW (TODAY / WEEK / MONTH)                                     */}
      {/* ========================================================================= */}

      {/* A. TODAY'S VIEW */}
      {classesPeriod === 'Today' && (
        <div className="sp-card sp-todays-classes-box">
          <div className="sp-box-title-row">
            <div className="sp-box-title-left">
              <div className="sp-title-icon-round" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <h3>{isViewDayRealToday ? "Today's Classes" : `Classes for ${viewDayObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`}</h3>
                <span className="sp-card-subtitle-small">
                  {todayClassesData.length} scheduled session{todayClassesData.length === 1 ? '' : 's'} {isViewDayRealToday ? 'for today' : 'on this date'}
                </span>
              </div>
            </div>
            {todayClassesData.length > 0 && (
              <span className="sp-live-badge-pulse">
                ● {todayClassesData.filter((c) => c.status === 'Attended').length} Attended, {todayClassesData.filter((c) => c.status === 'Upcoming' || c.status === 'Live').length} Remaining
              </span>
            )}
          </div>

          <div className="sp-classes-v2-list">
            {todayClassesData.length > 0 ? (
              todayClassesData.map((cls, idx, arr) =>
                renderClassRow(cls, idx, idx === arr.length - 1)
              )
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
                  {isViewDayRealToday ? "No classes scheduled for today." : `No classes scheduled for ${viewDayObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}.`}
                </p>
                <small style={{ color: '#94a3b8' }}>Use the navigation buttons or check the 'This Week' tab to view upcoming timetable sessions.</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. THIS WEEK VIEW */}
      {classesPeriod === 'This Week' && (
        <>
          {!enteredWeekDay ? (
            <div className="sp-week-view-wrapper">
              <div className="sp-week-days-grid">
                {weekDaysData.map((d) => (
                  <div
                    key={d.day}
                    className={`sp-week-day-card ${d.isToday ? 'is-active-day' : ''}`}
                    onClick={() => setEnteredWeekDay(d.day)}
                  >
                    <div className="sp-wd-head">
                      <div>
                        <h4 className="sp-wd-title">{d.day}</h4>
                        <span className="sp-wd-date">{d.date}</span>
                      </div>
                      {d.isToday && <span className="sp-wd-today-pill">TODAY</span>}
                    </div>

                    <div className="sp-wd-body">
                      <p className="sp-wd-status-text">{d.statusText}</p>
                    </div>

                    <div className="sp-wd-footer-row">
                      <span className="sp-wd-class-badge">📚 {d.classesCount} Classes</span>
                      <span className="sp-wd-enter-link">Enter Day →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="sp-card sp-todays-classes-box" style={{ marginBottom: '24px' }}>
              <div className="sp-box-title-row" style={{ flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="sp-back-to-grid-btn"
                    onClick={() => setEnteredWeekDay(null)}
                    title="Back to 7 Days Overview"
                  >
                    ← Back to 7 Days
                  </button>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                      {activeWeekDayObj.day} Timetable ({activeWeekDayObj.date})
                    </h3>
                    <span className="sp-card-subtitle-small">
                      {activeWeekDayObj.classes.length} scheduled sessions for {activeWeekDayObj.day}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="sp-live-badge-pulse">● {activeWeekDayObj.statusText}</span>

                  <div className="sp-days-mini-switcher">
                    {weekDaysData.map((d) => (
                      <button
                        key={d.day}
                        className={`sp-mini-day-btn ${enteredWeekDay === d.day ? 'active' : ''}`}
                        onClick={() => setEnteredWeekDay(d.day)}
                        title={`View ${d.day}`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sp-classes-v2-list">
                {activeWeekDayObj.classes.length > 0 ? (
                  activeWeekDayObj.classes.map((cls, idx, arr) =>
                    renderClassRow(cls, idx, idx === arr.length - 1)
                  )
                ) : (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0 }}>No classes scheduled for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* C. THIS MONTH VIEW */}
      {classesPeriod === 'This Month' && (
        <>
          {!enteredMonthDate ? (
            <div className="sp-month-calendar-box">
              <div className="sp-mcal-top-bar">
                <div className="sp-mcal-title-wrap">
                  <h3>{monthData.fullMonthName} Academic Calendar</h3>
                  <p>Click on any date to inspect its live class timetable</p>
                </div>
                <div className="sp-mcal-legend">
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#10b981' }} /> Attended
                  </div>
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#ef4444' }} /> Missed
                  </div>
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#2563eb' }} /> Scheduled
                  </div>
                </div>
              </div>

              <div className="sp-mcal-grid-container">
                <div className="sp-mcal-header-row">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                    <div key={d} className="sp-mcal-col-header">{d}</div>
                  ))}
                </div>

                <div className="sp-mcal-days-grid">
                  {monthData.cells.map((cell, idx) => {
                    if (!cell.isCurrentMonth) {
                      return (
                        <div key={idx} className="sp-mcal-day-cell muted">
                          <div className="sp-mcal-day-top">
                            <span className="sp-mcal-day-number">{cell.num}</span>
                          </div>
                        </div>
                      );
                    }

                    const isToday = cell.isoDate === realTodayIso;
                    const classes = getClassesForDate(cell.num);
                    const attRecord = attendanceData?.calendar_dates?.[cell.isoDate];

                    const hasAttended = attRecord === 'PRESENT' || classes.some((c) => c.status === 'Attended');
                    const hasAbsent = attRecord === 'ABSENT' || classes.some((c) => c.status === 'Absent');
                    const hasUpcoming = classes.some((c) => c.status === 'Upcoming' || c.status === 'Live');

                    return (
                      <button
                        key={idx}
                        className={`sp-mcal-day-cell ${isToday ? 'is-selected-date' : ''}`}
                        onClick={() => setEnteredMonthDate(cell.num)}
                      >
                        <div className="sp-mcal-day-top">
                          <span className={`sp-mcal-day-number ${isToday ? 'glow-today' : ''}`}>
                            {cell.num}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 700 }}>
                              TODAY
                            </span>
                          )}
                        </div>

                        <div className="sp-mcal-day-classes-preview">
                          {classes.length > 0 && (
                            <span className="sp-mcal-mini-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                              {classes.length} Class{classes.length > 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>

                        <div className="sp-mcal-dots-row">
                          {hasAttended && <span className="sp-mcal-dot" style={{ background: '#10b981' }} />}
                          {hasAbsent && <span className="sp-mcal-dot" style={{ background: '#ef4444' }} />}
                          {hasUpcoming && <span className="sp-mcal-dot" style={{ background: '#2563eb' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="sp-card sp-todays-classes-box" style={{ marginBottom: '24px' }}>
              <div className="sp-box-title-row" style={{ flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="sp-back-to-grid-btn"
                    onClick={() => setEnteredMonthDate(null)}
                    title="Back to Month Calendar"
                  >
                    ← Back to Calendar
                  </button>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                      Date Timetable ({enteredMonthDate} {monthData.fullMonthName})
                    </h3>
                    <span className="sp-card-subtitle-small">
                      {getClassesForDate(enteredMonthDate).length} scheduled sessions for this date
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="sp-date-nav-btn"
                    disabled={enteredMonthDate <= 1}
                    onClick={() => setEnteredMonthDate((prev) => Math.max(1, prev - 1))}
                    title="Previous Date"
                  >
                    ⟨
                  </button>
                  <strong className="sp-date-nav-text" style={{ minWidth: '90px', textAlign: 'center' }}>
                    {enteredMonthDate} {monthData.fullMonthName}
                  </strong>
                  <button
                    className="sp-date-nav-btn"
                    disabled={enteredMonthDate >= monthData.totalDays}
                    onClick={() => setEnteredMonthDate((prev) => Math.min(monthData.totalDays, prev + 1))}
                    title="Next Date"
                  >
                    ⟩
                  </button>
                </div>
              </div>

              <div className="sp-classes-v2-list">
                {getClassesForDate(enteredMonthDate).length > 0 ? (
                  getClassesForDate(enteredMonthDate).map((cls, idx, arr) =>
                    renderClassRow(cls, idx, idx === arr.length - 1)
                  )
                ) : (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0 }}>No classes scheduled on this date.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBJECT-WISE ATTENDANCE & DATE RECORDS (CLEAN 2-COLUMN SPLIT)           */}
      {/* ========================================================================= */}
      <div className="sp-card sp-subject-att-card">
        <div className="sp-sub-att-header-simple">
          <div>
            <h3>Subject Attendance</h3>
            <p className="sp-sub-att-desc">Track attended and missed classes by subject</p>
          </div>
          <div className="sp-sub-att-stat-inline">
            <span className="sp-stat-inline-item text-green">● {monthSubjAttended} Present</span>
            <span className="sp-stat-inline-item text-red">● {monthSubjMissed} Absent</span>
            <span className="sp-stat-inline-item text-dark">
              <strong>{monthSubjTotal > 0 ? `${monthSubjRate}%` : '0%'}</strong> Rate
            </span>
          </div>
        </div>

        {/* Minimalist Subject Selector Pills */}
        <div className="sp-sub-pills-bar">
          {Object.keys(subjectAttendanceList).map((subjKey) => {
            const subj = subjectAttendanceList[subjKey];
            const isActive = selectedAttSubject === subjKey;
            return (
              <button
                key={subjKey}
                className={`sp-sub-simple-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAttSubject(subjKey);
                  setSelectedAttIso(null);
                }}
              >
                <span className="sp-pill-label">{subj.name}</span>
                <span className="sp-pill-rate">{subj.totalClasses > 0 ? `${subj.percentage}%` : '0%'}</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Split: Clean Calendar on Left, Class History Table on Right */}
        <div className="sp-sub-split-clean">
          {/* Left: Minimal Calendar */}
          <div className="sp-cal-box-clean">
            <div className="sp-cal-nav-row">
              <strong className="sp-cal-month-title">{subCalCells.fullMonthName}</strong>
              <div className="sp-cal-arrows">
                <button 
                  className="sp-cal-btn-mini" 
                  onClick={() => {
                    setSubCalMonthOffset((prev) => prev - 1);
                    setSelectedAttIso(null);
                  }} 
                  title="Previous Month"
                >
                  ⟨
                </button>
                <button 
                  className="sp-cal-btn-mini" 
                  onClick={() => {
                    setSubCalMonthOffset((prev) => prev + 1);
                    setSelectedAttIso(null);
                  }} 
                  title="Next Month"
                >
                  ⟩
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="sp-cal-clean-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => (
                <div key={i} className="sp-cal-clean-weekday">{dayChar}</div>
              ))}

              {/* Prev days muted */}
              {subCalCells.prev.map((d) => (
                <div key={`prev-${d}`} className="sp-cal-clean-cell muted">{d}</div>
              ))}

              {/* Month days */}
              {subCalCells.days.map((cell) => {
                const rec = recordsByIso[cell.iso];
                const isSelected = selectedAttIso === cell.iso;
                const isPresent = rec?.status === 'Present';
                const isAbsent = rec?.status === 'Absent';
                const isToday = cell.iso === realTodayIso;

                let cellClass = 'sp-cal-clean-cell';
                if (isSelected) cellClass += ' is-selected';
                if (isToday) cellClass += ' is-today';

                return (
                  <button
                    key={`cal-${cell.iso}`}
                    className={cellClass}
                    onClick={() => {
                      if (selectedAttIso === cell.iso) {
                        setSelectedAttIso(null);
                      } else {
                        setSelectedAttIso(cell.iso);
                      }
                    }}
                  >
                    <span className="sp-cal-cell-num">{cell.num}</span>
                    {isPresent && <span className="sp-cal-clean-dot dot-present" />}
                    {isAbsent && <span className="sp-cal-clean-dot dot-absent" />}
                  </button>
                );
              })}
            </div>

            {/* Minimal Legend */}
            <div className="sp-cal-clean-legend">
              <span className="sp-legend-label">
                <i className="sp-dot-indicator dot-present" /> Present ({monthSubjAttended})
              </span>
              <span className="sp-legend-label">
                <i className="sp-dot-indicator dot-absent" /> Absent ({monthSubjMissed})
              </span>
            </div>
          </div>

          {/* Right: Clean Class Log */}
          <div className="sp-log-box-clean">
            <div className="sp-log-nav-row">
              <div className="sp-log-nav-title">
                <h4>{currentSubj.name} Classes</h4>
                <span className="sp-log-teacher-sub">{currentSubj.teacher}</span>
              </div>

              {/* Clean Status Pills */}
              <div className="sp-log-filter-group">
                <button
                  className={`sp-log-tab ${attStatusFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('All')}
                >
                  All
                </button>
                <button
                  className={`sp-log-tab ${attStatusFilter === 'Present' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('Present')}
                >
                  Present
                </button>
                <button
                  className={`sp-log-tab ${attStatusFilter === 'Absent' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('Absent')}
                >
                  Absent
                </button>
              </div>
            </div>

            {selectedAttIso && (
              <div className="sp-date-filter-chip">
                <span>
                  Showing: {(() => {
                    try {
                      const [y, m, d] = selectedAttIso.split('-');
                      const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    } catch {
                      return selectedAttIso;
                    }
                  })()}
                </span>
                <button onClick={() => setSelectedAttIso(null)} title="Clear date filter">✕ Show Full Month</button>
              </div>
            )}

            {/* List */}
            <div className="sp-log-rows-wrap">
              {filteredRecords.length === 0 ? (
                <div className="sp-log-empty-clean">
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#475569' }}>
                    {currentMonthSubjRecords.length === 0
                      ? `No ${currentSubj.name} classes scheduled in ${subCalCells.fullMonthName}.`
                      : `No ${attStatusFilter !== 'All' ? attStatusFilter.toLowerCase() : ''} classes found for this selection.`
                    }
                  </p>
                  {(attStatusFilter !== 'All' || selectedAttIso) && (
                    <button onClick={() => { setAttStatusFilter('All'); setSelectedAttIso(null); }}>
                      Show all {subCalCells.fullMonthName} classes
                    </button>
                  )}
                </div>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isPresent = item.status === 'Present';
                  return (
                    <div key={idx} className="sp-log-row-clean">
                      <div className="sp-log-date-col">
                        <strong>{item.date} {item.monthShort || ''}</strong>
                        <span>{item.day}</span>
                      </div>
                      <div className="sp-log-info-col">
                        <span className="sp-log-topic-title">{item.topic}</span>
                        <span className="sp-log-time-sub">{item.time}</span>
                      </div>
                      <div className="sp-log-status-col">
                        <span className={`sp-status-tag ${isPresent ? 'tag-present' : 'tag-absent'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
