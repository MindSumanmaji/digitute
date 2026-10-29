import React, { useState, useEffect, useMemo } from 'react';
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

// Helper for subject theme styles
const getSubjectSquircleClass = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('phys')) return 'squircle-physics';
  if (s.includes('chem')) return 'squircle-chem';
  if (s.includes('math')) return 'squircle-math';
  return 'squircle-physics';
};

export default function DashboardTab({ setActiveTab, user }) {
  const [time, setTime] = useState(new Date());
  const [monthOffset, setMonthOffset] = useState(0);

  const displayName = user?.full_name || 'Student';
  const batchSubtitle = (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name)
    || user?.batch
    || 'Enrolled Batch';

  // Live Backend Data
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [routinesList, setRoutinesList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiRequest('/api/student/dashboard-summary').catch(() => null),
      apiRequest('/api/student/my-attendance').catch(() => null),
      apiRequest('/api/student/my-classes').catch(() => [])
    ]).then(([summary, att, routines]) => {
      if (!isMounted) return;
      if (summary) setDashboardSummary(summary);
      if (att) setAttendanceData(att);
      if (Array.isArray(routines)) setRoutinesList(routines);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const greeting = hours < 12 ? 'Good Morning 🌅' : hours < 17 ? 'Good Afternoon ☀️' : 'Good Evening ☀️';

  const timeString = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = time.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const fullDateString = time.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Selected date in calendar
  const todayDateNum = new Date().getDate();
  const [selectedDate, setSelectedDate] = useState(todayDateNum);

  // Dynamic Today's classes from summary or routines
  const todayClasses = useMemo(() => {
    if (dashboardSummary?.today_sessions && dashboardSummary.today_sessions.length > 0) {
      return dashboardSummary.today_sessions.map((s) => ({
        id: s.id,
        timeStart: formatTime(s.start_time),
        timeEnd: formatTime(s.end_time),
        subject: s.subject,
        topic: s.topic_covered || `Curriculum Module - ${s.subject}`,
        teacher: s.teacher_name || 'Faculty',
        status: s.attendance_status === 'PRESENT' ? 'Attended' : s.attendance_status === 'ABSENT' ? 'Absent' : s.status === 'COMPLETED' ? 'Attended' : 'Upcoming'
      }));
    }

    // Fallback: routines for today's weekday (1=Mon ... 7=Sun)
    const todayDow = (new Date().getDay() + 6) % 7 + 1;
    const matching = routinesList.filter((r) => r.day_of_week === todayDow);
    return matching.map((r) => ({
      id: r.id,
      timeStart: formatTime(r.start_time),
      timeEnd: formatTime(r.end_time),
      subject: r.subject,
      topic: `Curriculum Module - ${r.subject}`,
      teacher: r.users?.full_name || 'Faculty',
      status: 'Upcoming'
    }));
  }, [dashboardSummary, routinesList]);

  // Attendance metrics
  const totalClasses = dashboardSummary?.total_classes ?? attendanceData?.total_classes ?? 0;
  const presentClasses = dashboardSummary?.present_classes ?? attendanceData?.present_classes ?? 0;
  const attendanceRate = totalClasses > 0
    ? (dashboardSummary?.attendance_percentage ?? attendanceData?.attendance_percentage ?? 0)
    : 100;

  // Average Score metrics from live DB
  const avgScoreRate = dashboardSummary?.avg_score_percentage != null ? dashboardSummary.avg_score_percentage : 0;
  const testsTakenCount = dashboardSummary?.tests_taken_count ?? 0;

  // Fee due
  const totalDue = dashboardSummary?.total_due != null ? dashboardSummary.total_due : 0;
  // Upcoming tests
  const upcomingTestsCount = dashboardSummary?.upcoming_tests_count ?? 0;

  // Dynamic Monthly Attendance Calendar
  const targetMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const currentMonthName = useMemo(() => {
    return targetMonthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [targetMonthDate]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const { prevDays, currentDays, presentDays, absentDays, presentCount, absentCount } = useMemo(() => {
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun ... 6=Sat

    const pDays = [];
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      pDays.push(prevMonthTotalDays - i);
    }

    const cDays = Array.from({ length: totalDays }, (_, i) => i + 1);

    const presDays = [];
    const absDays = [];
    const calDates = attendanceData?.calendar_dates || {};

    cDays.forEach((d) => {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = calDates[dateKey];
      if (status === 'PRESENT') presDays.push(d);
      else if (status === 'ABSENT') absDays.push(d);
    });

    return {
      prevDays: pDays,
      currentDays: cDays,
      presentDays: presDays,
      absentDays: absDays,
      presentCount: presDays.length,
      absentCount: absDays.length
    };
  }, [targetMonthDate, attendanceData]);

  const quickActions = [
    {
      id: 'classes',
      label: 'Classes',
      bg: '#eff6ff',
      color: '#2563eb',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      )
    },
    {
      id: 'materials',
      label: 'Study Material',
      bg: '#ecfdf5',
      color: '#10b981',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    },
    {
      id: 'assignments',
      label: 'Assignments',
      bg: '#fffbeb',
      color: '#f59e0b',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" x2="8" y1="13" y2="13"/>
          <line x1="16" x2="8" y1="17" y2="17"/>
        </svg>
      )
    },
    {
      id: 'tests',
      label: 'Tests',
      bg: '#faf5ff',
      color: '#9333ea',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="m9 14 2 2 4-4"/>
        </svg>
      )
    },
    {
      id: 'fees',
      label: 'Fee & Payments',
      bg: '#fff1f2',
      color: '#ef4444',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2"/>
          <line x1="2" x2="22" y1="10" y2="10"/>
        </svg>
      )
    },
    {
      id: 'doubts',
      label: 'Ask a Doubt',
      bg: '#f0f9ff',
      color: '#0284c7',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" x2="12.01" y1="17" y2="17"/>
        </svg>
      )
    }
  ];

  return (
    <div className="sp-view-container sp-dash-exact-page">
      {/* 1. TOP ROW: WELCOME BANNER & NIGHT SUNSET LIVE TIME WIDGET */}
      <div className="sp-dash-top-hero-row">
        <div className="sp-dash-exact-welcome-card">
          <div className="sp-dash-welcome-watermark">
            <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="sp-dash-watermark-svg">
              <path d="M0 160 L0 120 Q 80 70 160 110 T 320 80 T 500 130 L 500 160 Z" fill="#e0f2fe" opacity="0.45" />
              <path d="M120 160 L120 100 Q 220 50 320 90 T 500 70 L 500 160 Z" fill="#bae6fd" opacity="0.3" />
              <path d="M240 160 L240 85 Q 350 45 440 80 T 500 65 L 500 160 Z" fill="#93c5fd" opacity="0.25" />
            </svg>
          </div>

          <div className="sp-dash-welcome-content">
            <div className="sp-dash-welcome-text-col">
              <span className="sp-dash-welcome-greeting">{greeting}</span>
              <h1 className="sp-dash-welcome-title">{displayName}</h1>
              <p className="sp-dash-welcome-subtitle">{batchSubtitle}</p>
            </div>

            <div className="sp-dash-quote-block">
              <span className="sp-dash-quote-mark">❝</span>
              <p className="sp-dash-quote-text">
                Discipline today builds the freedom you want tomorrow.
              </p>
            </div>
          </div>
        </div>

        <div className="sp-dash-exact-night-card">
          <div className="sp-dash-night-art">
            <svg viewBox="0 0 240 150" className="sp-dash-night-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb088" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mountFar" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="mountMid" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="mountNear" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="0%" stopColor="#020617" />
                </linearGradient>
              </defs>

              <circle cx="20" cy="18" r="0.8" fill="#ffffff" opacity="0.8" />
              <circle cx="55" cy="12" r="1.1" fill="#ffffff" opacity="0.9" />
              <circle cx="95" cy="22" r="0.9" fill="#ffffff" opacity="0.75" />
              <circle cx="140" cy="14" r="1" fill="#ffffff" opacity="0.85" />
              <circle cx="180" cy="24" r="1.2" fill="#ffffff" opacity="0.9" />
              <circle cx="215" cy="16" r="0.8" fill="#ffffff" opacity="0.7" />
              <circle cx="195" cy="98" r="30" fill="url(#sunGlow)" />
              <path d="M120 150 Q 165 72 205 102 T 250 150 Z" fill="url(#mountFar)" />
              <path d="M80 150 Q 135 88 185 118 T 250 150 Z" fill="url(#mountMid)" />
              <path d="M60 150 Q 115 106 170 126 T 250 150 Z" fill="url(#mountNear)" />
              <polygon points="175,122 178,132 172,132" fill="#020617" />
              <polygon points="185,118 189,130 181,130" fill="#020617" />
              <polygon points="205,116 209,128 201,128" fill="#020617" />
              <polygon points="215,112 220,126 210,126" fill="#020617" />
              <polygon points="228,110 233,124 223,124" fill="#020617" />
            </svg>
          </div>

          <div className="sp-dash-night-content">
            <div className="sp-dash-night-live-tag">
              <span className="sp-dash-night-live-dot" />
              <span>LIVE TIME</span>
            </div>
            <div className="sp-dash-night-clock">{timeString}</div>
            <div className="sp-dash-night-date">{dateString}</div>
            <div className="sp-dash-night-tz">IST (UTC+5:30)</div>
          </div>
        </div>
      </div>

      {/* 2. 4 METRIC CARDS ROW */}
      <div className="sp-dash-exact-stats-grid">
        {/* 1. Attendance Card */}
        <div
          className="sp-dash-exact-stat-card sp-stat-attendance"
          onClick={() => setActiveTab('classes')}
        >
          <div className="sp-dash-stat-header">
            <div className="sp-dash-stat-icon-wrap stat-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="sp-dash-stat-chevron">›</span>
          </div>
          <div className="sp-dash-stat-body">
            <span className="sp-dash-stat-label">Attendance</span>
            <div className="sp-dash-stat-val">{attendanceRate}%</div>
            <span className="sp-dash-stat-sub">{presentClasses} of {totalClasses} classes</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className={`sp-dash-stat-trend ${attendanceRate >= 75 ? 'trend-green' : 'trend-red'}`}>
              {attendanceRate >= 75 ? '↑ On track' : '↓ Below 75% target'}
            </span>
            <div className="sp-dash-mini-bars bars-green">
              <span style={{ height: '35%' }} />
              <span style={{ height: '50%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '80%' }} />
              <span style={{ height: `${Math.min(100, attendanceRate)}%` }} />
            </div>
          </div>
        </div>

        {/* 2. Avg. Score Card */}
        <div
          className="sp-dash-exact-stat-card sp-stat-score"
          onClick={() => setActiveTab('tests')}
        >
          <div className="sp-dash-stat-header">
            <div className="sp-dash-stat-icon-wrap stat-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span className="sp-dash-stat-chevron">›</span>
          </div>
          <div className="sp-dash-stat-body">
            <span className="sp-dash-stat-label">Avg. Score</span>
            <div className="sp-dash-stat-val">
              {testsTakenCount > 0 ? `${avgScoreRate}%` : '—'}
            </div>
            <span className="sp-dash-stat-sub">
              {testsTakenCount > 0 ? `Across ${testsTakenCount} test${testsTakenCount > 1 ? 's' : ''}` : 'No evaluated tests'}
            </span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className={`sp-dash-stat-trend ${avgScoreRate >= 75 ? 'trend-green' : avgScoreRate >= 50 ? 'trend-blue' : 'trend-amber'}`}>
              {testsTakenCount === 0 ? 'No tests taken' : avgScoreRate >= 75 ? '↑ High Performer' : avgScoreRate >= 50 ? '↑ Consistent' : 'Needs Practice'}
            </span>
            <div className="sp-dash-mini-bars bars-blue">
              <span style={{ height: `${Math.min(100, Math.max(15, avgScoreRate * 0.4))}%` }} />
              <span style={{ height: `${Math.min(100, Math.max(25, avgScoreRate * 0.6))}%` }} />
              <span style={{ height: `${Math.min(100, Math.max(35, avgScoreRate * 0.8))}%` }} />
              <span style={{ height: `${Math.min(100, Math.max(45, avgScoreRate * 0.9))}%` }} />
              <span style={{ height: `${Math.min(100, Math.max(20, avgScoreRate))}%` }} />
            </div>
          </div>
        </div>

        {/* 3. Fee Due Card */}
        <div
          className="sp-dash-exact-stat-card sp-stat-feedue"
          onClick={() => setActiveTab('fees')}
        >
          <div className="sp-dash-stat-header">
            <div className="sp-dash-stat-icon-wrap stat-icon-red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
            <span className="sp-dash-stat-chevron">›</span>
          </div>
          <div className="sp-dash-stat-body">
            <span className="sp-dash-stat-label">Fee Due</span>
            <div className="sp-dash-stat-val stat-val-red">₹{totalDue}</div>
            <span className="sp-dash-stat-sub">{totalDue > 0 ? 'Pending Payment' : 'All Dues Cleared'}</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className={totalDue > 0 ? 'sp-dash-stat-badge-red' : 'sp-dash-stat-trend trend-green'}>
              {totalDue > 0 ? '! Pending Payment' : '✓ Cleared'}
            </span>
            <div className="sp-dash-watermark-icon watermark-red">
              <svg width="34" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Upcoming Tests Card */}
        <div
          className="sp-dash-exact-stat-card sp-stat-tests"
          onClick={() => setActiveTab('tests')}
        >
          <div className="sp-dash-stat-header">
            <div className="sp-dash-stat-icon-wrap stat-icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
              </svg>
            </div>
            <span className="sp-dash-stat-chevron">›</span>
          </div>
          <div className="sp-dash-stat-body">
            <span className="sp-dash-stat-label">Upcoming Tests</span>
            <div className="sp-dash-stat-val">{upcomingTestsCount}</div>
            <span className="sp-dash-stat-sub">Scheduled for this term</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className="sp-dash-stat-sub-note">→ View Schedule</span>
            <div className="sp-dash-watermark-icon watermark-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect width="18" height="18" x="3" y="4" rx="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN VERTICAL STACK */}
      <div className="sp-dash-exact-vertical-stack">
        {/* 3. Today's Timetable */}
        <div className="sp-dash-exact-card sp-dash-timetable-card">
          <div className="sp-dash-exact-card-header">
            <div className="sp-dash-card-title-group">
              <div className="sp-dash-icon-circle-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 className="sp-dash-exact-card-title">Today's Timetable</h3>
                <p className="sp-dash-exact-card-subtitle">{fullDateString}</p>
              </div>
            </div>

            <button className="sp-dash-view-all-pill-btn" onClick={() => setActiveTab('classes')}>
              View All →
            </button>
          </div>

          <div className="sp-dash-timeline-list">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls, idx, arr) => (
                <div key={cls.id || idx} className={`sp-dash-timeline-row ${idx === arr.length - 1 ? 'last-row' : ''}`}>
                  <div className="sp-dash-time-col">
                    <strong>{cls.timeStart}</strong>
                    <span>- {cls.timeEnd}</span>
                  </div>

                  <div className="sp-dash-node-col">
                    <span className={`sp-dash-node-dot ${cls.status === 'Attended' ? 'dot-green' : 'dot-orange'}`} />
                    {idx !== arr.length - 1 && <span className="sp-dash-node-stem" />}
                  </div>

                  <div className={`sp-dash-subject-squircle ${getSubjectSquircleClass(cls.subject)}`}>
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>{cls.subject[0]}</span>
                  </div>

                  <div className="sp-dash-schedule-details">
                    <h4 className="sp-dash-schedule-title">{cls.subject}</h4>
                    <p className="sp-dash-schedule-topic">{cls.topic}</p>
                    <div className="sp-dash-schedule-meta">
                      <span>👤 {cls.teacher}</span>
                    </div>
                  </div>

                  <div className="sp-dash-schedule-action">
                    {cls.status === 'Attended' ? (
                      <span className="sp-dash-status-badge badge-attended">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Attended
                      </span>
                    ) : (
                      <span className="sp-dash-status-badge badge-upcoming">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Upcoming
                      </span>
                    )}
                    <span className="sp-dash-schedule-chevron">›</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0 }}>No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="sp-dash-exact-card sp-dash-exact-qa-card">
          <div className="sp-dash-qa-title-row">
            <span className="sp-dash-qa-bolt">⚡</span>
            <h3 className="sp-dash-qa-title">Quick Access</h3>
          </div>

          <div className="sp-dash-exact-qa-grid">
            {quickActions.map((qa) => (
              <button
                key={qa.id}
                className="sp-dash-exact-qa-tile"
                onClick={() => setActiveTab(qa.id)}
              >
                <div className="sp-dash-exact-qa-icon" style={{ background: qa.bg, color: qa.color }}>
                  {qa.icon}
                </div>
                <span className="sp-dash-exact-qa-label">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}