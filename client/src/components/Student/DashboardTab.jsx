import React, { useState, useEffect } from 'react';

export default function DashboardTab({ setActiveTab, user }) {
  const [time, setTime] = useState(new Date());
  const [monthOffset, setMonthOffset] = useState(0);

  const displayName = user?.full_name || 'Suman Maji';
  const batchSubtitle = (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name)
    || user?.batch
    || 'Class XII - Science • Batch A';

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

  const [selectedDate, setSelectedDate] = useState(14);

  const monthsData = {
    '-1': {
      name: 'September 2026',
      prevDays: [30, 31],
      totalDays: 30,
      presentDays: [1, 2, 4, 7, 8, 9, 11, 14, 15, 16, 18, 21, 22, 23, 25, 28, 29, 30],
      absentDays: [5, 12, 19],
      presentCount: 24,
      absentCount: 3
    },
    '0': {
      name: 'October 2026',
      prevDays: [27, 28, 29, 30],
      totalDays: 31,
      presentDays: [1, 3, 5, 6, 7, 10, 13, 14],
      absentDays: [8, 12],
      presentCount: 22,
      absentCount: 3
    },
    '1': {
      name: 'November 2026',
      prevDays: [],
      totalDays: 30,
      presentDays: [],
      absentDays: [],
      presentCount: 0,
      absentCount: 0
    }
  };

  const activeMonth = monthsData[String(monthOffset)] || monthsData['0'];
  const currentMonthName = activeMonth.name;
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const prevDays = activeMonth.prevDays;
  const currentDays = Array.from({ length: activeMonth.totalDays }, (_, i) => i + 1);
  const presentDays = activeMonth.presentDays;
  const absentDays = activeMonth.absentDays;
  const today = 14;

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

      {/* ══════════════════════════════════════════════════════════════════
          1. TOP ROW: WELCOME BANNER & NIGHT SUNSET LIVE TIME WIDGET
         ══════════════════════════════════════════════════════════════════ */}
      <div className="sp-dash-top-hero-row">

        {/* Left: Welcome Banner Card with Mountain Watermark & Quote */}
        <div className="sp-dash-exact-welcome-card">
          {/* Subtle Mountain Hills Watermark Background */}
          <div className="sp-dash-welcome-watermark">
            <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="sp-dash-watermark-svg">
              <path
                d="M0 160 L0 120 Q 80 70 160 110 T 320 80 T 500 130 L 500 160 Z"
                fill="#e0f2fe"
                opacity="0.45"
              />
              <path
                d="M120 160 L120 100 Q 220 50 320 90 T 500 70 L 500 160 Z"
                fill="#bae6fd"
                opacity="0.3"
              />
              <path
                d="M240 160 L240 85 Q 350 45 440 80 T 500 65 L 500 160 Z"
                fill="#93c5fd"
                opacity="0.25"
              />
            </svg>
          </div>

          <div className="sp-dash-welcome-content">
            <div className="sp-dash-welcome-text-col">
              <span className="sp-dash-welcome-greeting">{greeting}</span>
              <h1 className="sp-dash-welcome-title">{displayName}</h1>
              <p className="sp-dash-welcome-subtitle">
                {batchSubtitle}
              </p>
            </div>

            {/* Motivational Quote on the right */}
            <div className="sp-dash-quote-block">
              <span className="sp-dash-quote-mark">❝</span>
              <p className="sp-dash-quote-text">
                Discipline today builds the freedom you want tomorrow.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Night Sunset Live Time Widget */}
        <div className="sp-dash-exact-night-card">
          {/* Sunset Horizon with Mountains SVG */}
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
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
              </defs>

              {/* Tiny Stars in the sky */}
              <circle cx="20" cy="18" r="0.8" fill="#ffffff" opacity="0.8" />
              <circle cx="55" cy="12" r="1.1" fill="#ffffff" opacity="0.9" />
              <circle cx="95" cy="22" r="0.9" fill="#ffffff" opacity="0.75" />
              <circle cx="140" cy="14" r="1" fill="#ffffff" opacity="0.85" />
              <circle cx="180" cy="24" r="1.2" fill="#ffffff" opacity="0.9" />
              <circle cx="215" cy="16" r="0.8" fill="#ffffff" opacity="0.7" />

              {/* Glowing Sun setting behind mountain */}
              <circle cx="195" cy="98" r="30" fill="url(#sunGlow)" />

              {/* Distant Mountain Range */}
              <path d="M120 150 Q 165 72 205 102 T 250 150 Z" fill="url(#mountFar)" />

              {/* Middle Mountain Range */}
              <path d="M80 150 Q 135 88 185 118 T 250 150 Z" fill="url(#mountMid)" />

              {/* Near Mountain Ridge with Tree Silhouettes */}
              <path d="M60 150 Q 115 106 170 126 T 250 150 Z" fill="url(#mountNear)" />

              {/* Stylized pine tree silhouettes on the ridge */}
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


      {/* ══════════════════════════════════════════════════════════════════
          2. 4 METRIC CARDS ROW (Exact Colors, Badges & Mini Bar Graphs)
         ══════════════════════════════════════════════════════════════════ */}
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
            <div className="sp-dash-stat-val">87%</div>
            <span className="sp-dash-stat-sub">42 of 48 classes</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className="sp-dash-stat-trend trend-green">↑ +4% this month</span>
            {/* Mini 5-bar vertical chart */}
            <div className="sp-dash-mini-bars bars-green">
              <span style={{ height: '35%' }} />
              <span style={{ height: '50%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '80%' }} />
              <span style={{ height: '100%' }} />
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
            <div className="sp-dash-stat-val">78%</div>
            <span className="sp-dash-stat-sub">Across 5 tests</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className="sp-dash-stat-trend trend-green">↑ +12% growth</span>
            {/* Mini 5-bar vertical chart */}
            <div className="sp-dash-mini-bars bars-blue">
              <span style={{ height: '40%' }} />
              <span style={{ height: '55%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '75%' }} />
              <span style={{ height: '95%' }} />
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
            <div className="sp-dash-stat-val stat-val-red">₹600</div>
            <span className="sp-dash-stat-sub">Due: 10 Sep 2026</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className="sp-dash-stat-badge-red">! Pending Payment</span>
            {/* Watermark Card Icon */}
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
            <div className="sp-dash-stat-val">3</div>
            <span className="sp-dash-stat-sub">Next: 12 Oct 2026</span>
          </div>
          <div className="sp-dash-stat-footer">
            <span className="sp-dash-stat-sub-note">→ Physics Chapter Test</span>
            {/* Watermark Calendar Icon */}
            <div className="sp-dash-watermark-icon watermark-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect width="18" height="18" x="3" y="4" rx="2"/>
              </svg>
            </div>
          </div>
        </div>

      </div>


      {/* ══════════════════════════════════════════════════════════════════
          3. MAIN STACK (Sequence: Quick Access -> Latest Notice -> Timetable -> Calendar)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="sp-dash-exact-vertical-stack">

        {/* 1. Quick Access Row */}
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

        {/* 2. Latest Notice Box */}
        <div className="sp-dash-exact-card sp-dash-exact-notice-card">
          <div className="sp-dash-notice-header">
            <div className="sp-dash-notice-title-row">
              <span className="sp-dash-notice-horn">📢</span>
              <h3 className="sp-dash-notice-title">Latest Notice</h3>
            </div>
            <button
              className="sp-dash-notice-view-all"
              onClick={() => setActiveTab('announcements')}
            >
              View All →
            </button>
          </div>

          {/* Notice Bubble */}
          <div
            className="sp-dash-notice-body"
            onClick={() => setActiveTab('announcements')}
          >
            <div className="sp-dash-notice-top">
              <span className="sp-dash-notice-new-badge">New</span>
              <h4 className="sp-dash-notice-headline">
                Special Physics Problem-Solving Session this Sunday
              </h4>
            </div>
            <p className="sp-dash-notice-snippet">
              R. Sharma Sir will conduct an intensive 2-hour session on Gauss's Law this Sunday, 08:30 – 10:30 AM, Room 204.
            </p>
            <div className="sp-dash-notice-meta">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Posted by Academic Head • Yesterday</span>
            </div>
          </div>
        </div>

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

          {/* Timetable Items with Timeline Nodes */}
          <div className="sp-dash-timeline-list">

            {/* Row 1: Physics */}
            <div className="sp-dash-timeline-row">
              <div className="sp-dash-time-col">
                <strong>07:00 AM</strong>
                <span>- 08:00 AM</span>
              </div>

              <div className="sp-dash-node-col">
                <span className="sp-dash-node-dot dot-green" />
                <span className="sp-dash-node-stem" />
              </div>

              <div className="sp-dash-subject-squircle squircle-physics">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="2.5" fill="#0284c7"/>
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)"/>
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)"/>
                </svg>
              </div>

              <div className="sp-dash-schedule-details">
                <h4 className="sp-dash-schedule-title">Physics</h4>
                <p className="sp-dash-schedule-topic">Electrostatics - Gauss's Law</p>
                <div className="sp-dash-schedule-meta">
                  <span>👤 R. Sharma Sir</span>
                  <span>📍 Room 102</span>
                </div>
              </div>

              <div className="sp-dash-schedule-action">
                <span className="sp-dash-status-badge badge-attended">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Attended
                </span>
                <span className="sp-dash-schedule-chevron">›</span>
              </div>
            </div>

            {/* Row 2: Chemistry */}
            <div className="sp-dash-timeline-row">
              <div className="sp-dash-time-col">
                <strong>08:15 AM</strong>
                <span>- 09:15 AM</span>
              </div>

              <div className="sp-dash-node-col">
                <span className="sp-dash-node-dot dot-green" />
                <span className="sp-dash-node-stem" />
              </div>

              <div className="sp-dash-subject-squircle squircle-chem">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v5.5L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 7.5V2"/>
                  <line x1="8.5" x2="15.5" y1="2" y2="2"/>
                  <line x1="6.8" x2="17.2" y1="15" y2="15"/>
                </svg>
              </div>

              <div className="sp-dash-schedule-details">
                <h4 className="sp-dash-schedule-title">Chemistry</h4>
                <p className="sp-dash-schedule-topic">Aldehydes & Ketones</p>
                <div className="sp-dash-schedule-meta">
                  <span>👤 P. Das Sir</span>
                  <span>📍 Room 101</span>
                </div>
              </div>

              <div className="sp-dash-schedule-action">
                <span className="sp-dash-status-badge badge-attended">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Attended
                </span>
                <span className="sp-dash-schedule-chevron">›</span>
              </div>
            </div>

            {/* Row 3: Mathematics */}
            <div className="sp-dash-timeline-row last-row">
              <div className="sp-dash-time-col">
                <strong>04:30 PM</strong>
                <span>- 05:30 PM</span>
              </div>

              <div className="sp-dash-node-col">
                <span className="sp-dash-node-dot dot-orange" />
              </div>

              <div className="sp-dash-subject-squircle squircle-math">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2"/>
                  <line x1="8" x2="16" y1="6" y2="6"/>
                  <line x1="16" x2="16" y1="14" y2="18"/>
                  <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>
                </svg>
              </div>

              <div className="sp-dash-schedule-details">
                <h4 className="sp-dash-schedule-title">Mathematics</h4>
                <p className="sp-dash-schedule-topic">Matrices - Important Questions</p>
                <div className="sp-dash-schedule-meta">
                  <span>👤 S. Roy Sir</span>
                  <span>📍 Room 103</span>
                </div>
              </div>

              <div className="sp-dash-schedule-action">
                <span className="sp-dash-status-badge badge-upcoming">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Upcoming
                </span>
                <span className="sp-dash-schedule-chevron">›</span>
              </div>
            </div>

          </div>
        </div>

        {/* 4. October 2026 Mini Calendar */}
        <div className="sp-dash-exact-card sp-dash-exact-calendar-card">
          <div className="sp-dash-exact-cal-header">
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
                <h3 className="sp-dash-exact-cal-title">{currentMonthName}</h3>
                <p className="sp-dash-exact-card-subtitle">Monthly Attendance Calendar</p>
              </div>
            </div>

            <div className="sp-dash-exact-cal-actions">
              <button
                className="sp-dash-cal-view-full-btn"
                onClick={() => setActiveTab('classes')}
                title="Open Full Attendance Calendar"
              >
                View Full →
              </button>
              <div className="sp-dash-exact-cal-arrows">
                <button
                  className="sp-dash-cal-btn"
                  onClick={() => setMonthOffset((prev) => Math.max(-1, prev - 1))}
                  aria-label="Previous Month"
                  title="Previous Month"
                >
                  ‹
                </button>
                <button
                  className="sp-dash-cal-btn"
                  onClick={() => setMonthOffset((prev) => Math.min(1, prev + 1))}
                  aria-label="Next Month"
                  title="Next Month"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="sp-dash-cal-inner-box">
            {/* Weekdays Row: Sun Mon Tue Wed Thu Fri Sat */}
            <div className="sp-dash-exact-cal-weekdays">
              {daysOfWeek.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="sp-dash-exact-cal-grid">
              {prevDays.map((d) => (
                <div key={`p-${d}`} className="sp-dash-cal-num-cell muted-prev">
                  <span>{d}</span>
                </div>
              ))}
              {currentDays.map((d) => {
                const isPresent = presentDays.includes(d);
                const isAbsent = absentDays.includes(d);
                const isToday = d === today && monthOffset === 0;
                const isSelected = selectedDate === d;

                return (
                  <div
                    key={`c-${d}`}
                    className={`sp-dash-cal-num-cell ${isToday ? 'is-today-active' : ''} ${isSelected && !isToday ? 'is-selected-day' : ''}`}
                    onClick={() => setSelectedDate(d)}
                    title={`Day ${d} ${currentMonthName} - Click to inspect`}
                  >
                    <span className="sp-dash-day-number">{d}</span>
                    {!isToday && isPresent && <span className="sp-dash-cal-dot dot-present" />}
                    {!isToday && isAbsent && <span className="sp-dash-cal-dot dot-absent" />}
                  </div>
                );
              })}
            </div>

            {/* Interactive Day Status Strip */}
            {selectedDate && (
              <div
                className="sp-dash-cal-selected-strip"
                onClick={() => setActiveTab('classes')}
                title="Click to view timetable for this day in Classes & Attendance"
              >
                <div className="sp-dash-cal-selected-info">
                  <span className="sp-dash-cal-selected-pill">
                    {selectedDate} {currentMonthName.split(' ')[0]}
                  </span>
                  <span className="sp-dash-cal-selected-text">
                    {selectedDate === 14 && monthOffset === 0
                      ? '✓ 2 Classes Attended (Today)'
                      : presentDays.includes(selectedDate)
                      ? '✓ Present · 2 Classes'
                      : absentDays.includes(selectedDate)
                      ? '✗ Absent · 0 Attended'
                      : selectedDate > 14 && monthOffset >= 0
                      ? '⏰ Scheduled Classes'
                      : 'No classes on this day'}
                  </span>
                </div>
                <span className="sp-dash-cal-selected-arrow">Open Timetable →</span>
              </div>
            )}

            {/* Footer Legend: Present and Absent */}
            <div className="sp-dash-exact-cal-footer">
              <div
                className="sp-dash-legend-badge clickable-legend"
                onClick={() => setActiveTab('classes')}
                title="View present classes in Attendance page"
              >
                <span className="sp-dash-cal-dot dot-present" />
                <span>Present ({activeMonth.presentCount})</span>
              </div>
              <div
                className="sp-dash-legend-badge clickable-legend"
                onClick={() => setActiveTab('classes')}
                title="View absent records in Attendance page"
              >
                <span className="sp-dash-cal-dot dot-absent" />
                <span>Absent ({activeMonth.absentCount})</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
