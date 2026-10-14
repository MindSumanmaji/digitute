import React, { useState, useEffect, useRef } from 'react';

export default function AttendanceAnalysis({ onBack, showToast }) {
  const [timeframe, setTimeframe] = useState('month'); // 'week' | 'month' | 'year'
  const [selectedSubject, setSelectedSubject] = useState('All'); // 'All' | 'Physics' | 'Mathematics' | 'Chemistry' | 'Biology' | 'Computer'
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSubjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subject Metadata
  const subjectMeta = {
    'All': { name: 'All Subjects (Overall)', icon: '📊', color: '#2563eb', bg: '#eff6ff' },
    'Physics': { name: 'Physics', icon: '⚡', color: '#10b981', bg: '#ecfdf5', teacher: 'P. Das Sir', code: 'PHY-102', room: 'Room 102' },
    'Mathematics': { name: 'Mathematics', icon: '📐', color: '#2563eb', bg: '#eff6ff', teacher: 'S. Roy Sir', code: 'MTH-101', room: 'Room 101' },
    'Chemistry': { name: 'Chemistry', icon: '🧪', color: '#9333ea', bg: '#faf5ff', teacher: 'A. Sen Sir', code: 'CHM-103', room: 'Room 101' },
    'Biology': { name: 'Biology', icon: '🧬', color: '#ea580c', bg: '#fff7ed', teacher: 'M. Khan Ma\'am', code: 'BIO-104', room: 'Room 103' },
    'Computer': { name: 'Computer', icon: '💻', color: '#0284c7', bg: '#f0f9ff', teacher: 'K. Gupta Sir', code: 'CS-105', room: 'Lab 2' },
  };

  // Detailed Overall Data by Timeframe (Week, Month, Year)
  const overallDataByTimeframe = {
    week: {
      title: 'Current Week (12 Oct – 18 Oct 2026)',
      overallRate: 92,
      totalClasses: 26,
      attended: 24,
      missed: 2,
      topSubject: {
        name: 'Biology & Mathematics',
        rate: 100,
        attended: 9,
        total: 9,
        teacher: 'M. Khan Ma\'am & S. Roy Sir',
        note: 'Perfect 100% attendance recorded throughout this week'
      },
      lessSubject: {
        name: 'Chemistry',
        rate: 75,
        attended: 3,
        total: 4,
        missed: 1,
        teacher: 'A. Sen Sir',
        note: '1 missed class on Tuesday (Molecular Orbital Theory session)'
      },
      pieSlices: [
        { name: 'Physics', value: 6, rate: 100, color: '#10b981' },
        { name: 'Mathematics', value: 5, rate: 100, color: '#2563eb' },
        { name: 'Biology', value: 4, rate: 100, color: '#ea580c' },
        { name: 'Computer', value: 4, rate: 100, color: '#0284c7' },
        { name: 'Chemistry', value: 3, rate: 75, color: '#9333ea' },
        { name: 'Tests & Labs', value: 2, rate: 100, color: '#f59e0b' },
      ]
    },
    month: {
      title: 'October 2026 (Monthly Progression)',
      overallRate: 90,
      totalClasses: 110,
      attended: 99,
      missed: 11,
      topSubject: {
        name: 'Biology',
        rate: 95,
        attended: 19,
        total: 20,
        teacher: 'M. Khan Ma\'am',
        note: 'Outstanding consistency with only 1 absence during the entire month'
      },
      lessSubject: {
        name: 'Chemistry',
        rate: 85,
        attended: 17,
        total: 20,
        missed: 3,
        teacher: 'A. Sen Sir',
        note: 'Lowest attendance rate this month · Attend next 2 classes to reach 90%'
      },
      pieSlices: [
        { name: 'Mathematics', value: 23, rate: 92, color: '#2563eb' },
        { name: 'Physics', value: 22, rate: 88, color: '#10b981' },
        { name: 'Biology', value: 19, rate: 95, color: '#ea580c' },
        { name: 'Computer', value: 18, rate: 90, color: '#0284c7' },
        { name: 'Chemistry', value: 17, rate: 85, color: '#9333ea' },
      ]
    },
    year: {
      title: 'Academic Year 2026 (Annual Progression)',
      overallRate: 89,
      totalClasses: 940,
      attended: 836,
      missed: 104,
      topSubject: {
        name: 'Biology',
        rate: 95.3,
        attended: 162,
        total: 170,
        teacher: 'M. Khan Ma\'am',
        note: 'Top subject performer consistently across all 3 academic terms'
      },
      lessSubject: {
        name: 'Chemistry',
        rate: 83.5,
        attended: 142,
        total: 170,
        missed: 28,
        teacher: 'A. Sen Sir',
        note: 'Maintain attendance focus to ensure distinction exam clearance'
      },
      pieSlices: [
        { name: 'Mathematics', value: 186, rate: 93, color: '#2563eb' },
        { name: 'Physics', value: 174, rate: 87, color: '#10b981' },
        { name: 'Biology', value: 162, rate: 95.3, color: '#ea580c' },
        { name: 'Computer', value: 144, rate: 90, color: '#0284c7' },
        { name: 'Chemistry', value: 142, rate: 83.5, color: '#9333ea' },
        { name: 'Practical Labs', value: 28, rate: 70, color: '#f59e0b' },
      ]
    }
  };

  // Bar Graph Datasets for individual subjects when chosen from dropdown
  const singleSubjectBarData = {
    week: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      fullLabels: ['Monday (12 Oct)', 'Tuesday (13 Oct)', 'Wednesday (14 Oct)', 'Thursday (15 Oct)', 'Friday (16 Oct)', 'Saturday (17 Oct)', 'Sunday (18 Oct)'],
      Physics: [100, 100, 100, 100, 100, 100, 100],
      Mathematics: [100, 100, 100, 100, 100, 100, 100],
      Chemistry: [100, 0, 100, 100, 100, 100, 100],
      Biology: [100, 100, 100, 100, 100, 100, 100],
      Computer: [100, 100, 100, 100, 100, 100, 100],
    },
    month: {
      categories: ['Week 1', 'Week 2', 'Week 3 (Current)', 'Week 4 (Est.)', 'Week 5 (Est.)'],
      fullLabels: ['Week 1 (Oct 1 – 4)', 'Week 2 (Oct 5 – 11)', 'Week 3 (Oct 12 – 18)', 'Week 4 (Oct 19 – 25)', 'Week 5 (Oct 26 – 31)'],
      Physics: [85, 83, 92, 90, 89],
      Mathematics: [90, 88, 96, 92, 94],
      Chemistry: [82, 78, 88, 86, 85],
      Biology: [95, 92, 98, 95, 96],
      Computer: [88, 86, 92, 90, 93],
    },
    year: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      fullLabels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      Physics: [90, 85, 88, 92, 84, 87, 89, 86, 90, 88, 86, 89],
      Mathematics: [93, 90, 92, 95, 87, 91, 93, 89, 94, 92, 90, 93],
      Chemistry: [86, 82, 85, 90, 80, 84, 87, 82, 88, 85, 84, 87],
      Biology: [96, 93, 95, 98, 91, 94, 96, 92, 96, 95, 93, 95],
      Computer: [91, 87, 89, 93, 85, 88, 90, 86, 91, 90, 88, 90],
    }
  };

  const currentOverview = overallDataByTimeframe[timeframe];
  const activeColor = subjectMeta[selectedSubject]?.color || '#2563eb';

  // Helper to render Donut Pie Chart with math-perfect SVG arcs
  const renderDonutChart = (slices, overallRate) => {
    const cx = 130;
    const cy = 130;
    const R = 98;
    const r = 62;
    const totalValue = slices.reduce((sum, s) => sum + s.value, 0);

    let currentAngle = -Math.PI / 2;

    const paths = slices.map((slice) => {
      const angle = (slice.value / totalValue) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const isHovered = hoveredSlice === slice.name;
      const currentR = isHovered ? R + 5 : R;

      const x1 = cx + currentR * Math.cos(startAngle);
      const y1 = cy + currentR * Math.sin(startAngle);
      const x2 = cx + currentR * Math.cos(endAngle);
      const y2 = cy + currentR * Math.sin(endAngle);

      const x3 = cx + r * Math.cos(endAngle);
      const y3 = cy + r * Math.sin(endAngle);
      const x4 = cx + r * Math.cos(startAngle);
      const y4 = cy + r * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const d = `M ${x1} ${y1} A ${currentR} ${currentR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        ...slice,
        d,
        pct: Math.round((slice.value / totalValue) * 100)
      };
    });

    return (
      <div className="sp-pie-chart-wrap">
        <svg viewBox="0 0 260 260" className="sp-pie-svg">
          <g>
            {paths.map((p, idx) => (
              <path
                key={idx}
                d={p.d}
                fill={p.color}
                stroke="#ffffff"
                strokeWidth="2.5"
                style={{ cursor: 'pointer', transition: 'all 0.16s ease' }}
                onMouseEnter={() => setHoveredSlice(p.name)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
          </g>
          {/* Center Hole Information */}
          <circle cx={cx} cy={cy} r={r - 4} fill="#ffffff" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            fill="#0f172a"
          >
            {overallRate}%
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill="#64748b"
          >
            Overall Rate
          </text>
        </svg>

        {/* Slices Legend Grid */}
        <div className="sp-pie-legend-grid">
          {slices.map((s, idx) => (
            <div
              key={idx}
              className={`sp-pie-legend-item ${hoveredSlice === s.name ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoveredSlice(s.name)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => {
                if (subjectMeta[s.name]) {
                  setSelectedSubject(s.name);
                  if (showToast) showToast(`Filtered to ${s.name}`);
                }
              }}
              title={`Click to analyze ${s.name}`}
            >
              <span className="sp-pie-legend-dot" style={{ background: s.color }} />
              <span className="sp-pie-legend-name">{s.name}</span>
              <strong className="sp-pie-legend-rate">{s.rate}%</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper to render Bar Chart for a specific subject
  const renderSingleSubjectBarChart = () => {
    const barData = singleSubjectBarData[timeframe];
    const values = barData[selectedSubject] || barData.Physics;
    const categories = barData.categories;
    const fullLabels = barData.fullLabels;

    const svgWidth = 720;
    const svgHeight = 260;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 45;
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const getY = (val) => paddingTop + plotHeight - (val / 100) * plotHeight;
    const is75Y = getY(75);

    return (
      <div className="sp-svg-chart-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="sp-responsive-chart-svg">
          <defs>
            <linearGradient id="subjBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[100, 75, 50, 25, 0].map((tick) => {
            const y = getY(tick);
            const is75 = tick === 75;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={is75 ? '#f87171' : '#e2e8f0'}
                  strokeWidth={is75 ? '1.5' : '1'}
                  strokeDasharray={is75 ? '4 4' : 'none'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight={is75 ? '700' : '500'}
                  fill={is75 ? '#dc2626' : '#94a3b8'}
                >
                  {tick}%
                </text>
                {is75 && (
                  <text
                    x={svgWidth - paddingRight}
                    y={y - 5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ef4444"
                  >
                    Center Criteria (75%)
                  </text>
                )}
              </g>
            );
          })}

          {/* Bars */}
          <g>
            {values.map((val, idx) => {
              const totalBars = values.length;
              const availableSlot = plotWidth / totalBars;
              const barWidth = Math.min(
                timeframe === 'year' ? 34 : timeframe === 'month' ? 52 : 44,
                availableSlot * 0.6
              );
              const x = paddingLeft + idx * availableSlot + (availableSlot - barWidth) / 2;
              const y = getY(val);
              const h = paddingTop + plotHeight - y;
              const isHovered = hoveredBar?.idx === idx;

              return (
                <g
                  key={idx}
                  className="sp-bar-group"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setHoveredBar({
                      idx,
                      val,
                      label: fullLabels[idx]
                    })
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <rect
                    x={x}
                    y={paddingTop}
                    width={barWidth}
                    height={plotHeight}
                    fill="#f8fafc"
                    rx="6"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(4, h)}
                    fill={isHovered ? activeColor : 'url(#subjBarGrad)'}
                    rx="6"
                    className="sp-animated-bar"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={timeframe === 'year' ? '10' : '11.5'}
                    fontWeight="700"
                    fill={isHovered ? activeColor : '#334155'}
                  >
                    {val}%
                  </text>
                </g>
              );
            })}
          </g>

          {/* X Axis Labels */}
          {categories.map((cat, idx) => {
            const totalBars = categories.length;
            const availableSlot = plotWidth / totalBars;
            const x = paddingLeft + idx * availableSlot + availableSlot / 2;
            const isHovered = hoveredBar?.idx === idx;

            return (
              <text
                key={idx}
                x={x}
                y={paddingTop + plotHeight + 20}
                textAnchor="middle"
                fontSize={timeframe === 'year' ? '11' : '12'}
                fontWeight={isHovered ? '700' : '600'}
                fill={isHovered ? '#0f172a' : '#64748b'}
              >
                {cat}
              </text>
            );
          })}
        </svg>

        {hoveredBar && (
          <div className="sp-chart-tooltip-floating">
            <strong className="sp-ctt-title">{hoveredBar.label}</strong>
            <div className="sp-ctt-row">
              <span>{selectedSubject} Rate:</span>
              <strong style={{ color: activeColor }}>{hoveredBar.val}%</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sp-view-container sp-analysis-page">
      {/* ========================================================================= */}
      {/* 1. CONTROLS STRIP (ABOVE ATTENDANCE BOX): TIMEFRAME & SUBJECT DROPDOWN    */}
      {/* ========================================================================= */}
      <div className="sp-analysis-controls-strip">
        <button
          className="sp-analysis-back-btn"
          onClick={onBack}
          title="Return to Classes & Attendance"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Classes & Attendance
        </button>

        <div className="sp-analysis-filters-cluster">
          {/* Week, Month, Year Filter */}
          <div className="sp-analysis-time-selector">
            <button
              className={`sp-time-pill ${timeframe === 'week' ? 'active' : ''}`}
              onClick={() => { setTimeframe('week'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              🗓 Week
            </button>
            <button
              className={`sp-time-pill ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => { setTimeframe('month'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              📅 Month
            </button>
            <button
              className={`sp-time-pill ${timeframe === 'year' ? 'active' : ''}`}
              onClick={() => { setTimeframe('year'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              📊 Year
            </button>
          </div>

          {/* Subject Dropdown Filter */}
          <div className="sp-subject-dropdown-wrap" ref={dropdownRef}>
            <button
              className={`sp-subject-dropdown-btn ${subjectDropdownOpen ? 'open' : ''}`}
              onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
              title="Click to Choose Subject"
            >
              <span className="sp-sdb-icon">{subjectMeta[selectedSubject]?.icon || '📊'}</span>
              <span className="sp-sdb-text">
                {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`sp-sdb-arrow ${subjectDropdownOpen ? 'rotated' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {subjectDropdownOpen && (
              <div className="sp-subject-dropdown-menu">
                <div className="sp-sdm-header">Choose Subject</div>
                {Object.keys(subjectMeta).map((subjKey) => {
                  const meta = subjectMeta[subjKey];
                  const isSelected = selectedSubject === subjKey;
                  return (
                    <button
                      key={subjKey}
                      className={`sp-sdm-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSubject(subjKey);
                        setSubjectDropdownOpen(false);
                        setHoveredSlice(null);
                        setHoveredBar(null);
                      }}
                    >
                      <span className="sp-sdm-item-icon">{meta.icon}</span>
                      <span className="sp-sdm-item-name">{meta.name}</span>
                      {isSelected && <span className="sp-sdm-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERALL ATTENDANCE BOX (PIE CHART + TOP & LESS ATTENDED SUBJECTS)      */}
      {/* ========================================================================= */}
      {selectedSubject === 'All' ? (
        <div className="sp-card sp-overall-attendance-card">
          <div className="sp-box-title-row" style={{ marginBottom: '22px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                Overall Attendance ({timeframe.toUpperCase()})
              </h3>
              <p className="sp-card-subtitle-small">
                {currentOverview.title} · Subject-wise breakdown and attendance analysis
              </p>
            </div>
            <span className="sp-chip-green" style={{ fontSize: '12px', padding: '4px 12px' }}>
              ● {currentOverview.overallRate}% Overall Attendance
            </span>
          </div>

          <div className="sp-overall-grid-2col">
            {/* Left Column: Pie / Donut Chart */}
            <div className="sp-overall-pie-col">
              {renderDonutChart(currentOverview.pieSlices, currentOverview.overallRate)}
            </div>

            {/* Right Column: Top Attended & Less Attended Subjects */}
            <div className="sp-overall-stats-column">
              {/* Top Attended Subject */}
              <div className="sp-spotlight-card sp-spotlight-green">
                <div className="sp-spotlight-head">
                  <div className="sp-spotlight-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    🏆
                  </div>
                  <div>
                    <span className="sp-spotlight-badge green">TOP ATTENDED SUBJECT</span>
                    <h4 className="sp-spotlight-title">
                      {currentOverview.topSubject.name} — <span style={{ color: '#16a34a' }}>{currentOverview.topSubject.rate}%</span>
                    </h4>
                  </div>
                </div>
                <div className="sp-spotlight-body">
                  <p className="sp-spotlight-meta">
                    <strong>{currentOverview.topSubject.attended} of {currentOverview.topSubject.total}</strong> classes attended · {currentOverview.topSubject.teacher}
                  </p>
                  <span className="sp-spotlight-note">{currentOverview.topSubject.note}</span>
                </div>
              </div>

              {/* Less Attended Subject */}
              <div className="sp-spotlight-card sp-spotlight-amber">
                <div className="sp-spotlight-head">
                  <div className="sp-spotlight-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                    ⚠️
                  </div>
                  <div>
                    <span className="sp-spotlight-badge amber">LESS ATTENDED SUBJECT</span>
                    <h4 className="sp-spotlight-title">
                      {currentOverview.lessSubject.name} — <span style={{ color: '#d97706' }}>{currentOverview.lessSubject.rate}%</span>
                    </h4>
                  </div>
                </div>
                <div className="sp-spotlight-body">
                  <p className="sp-spotlight-meta">
                    <strong>{currentOverview.lessSubject.attended} of {currentOverview.lessSubject.total}</strong> classes attended · {currentOverview.lessSubject.teacher}
                  </p>
                  <span className="sp-spotlight-note">{currentOverview.lessSubject.note}</span>
                </div>
              </div>

              {/* Quick Summary Numbers Strip */}
              <div className="sp-summary-mini-strip">
                <div className="sp-sms-item">
                  <span>Total Held</span>
                  <strong>{currentOverview.totalClasses} Classes</strong>
                </div>
                <div className="sp-sms-item">
                  <span>Attended</span>
                  <strong style={{ color: '#16a34a' }}>{currentOverview.attended}</strong>
                </div>
                <div className="sp-sms-item">
                  <span>Missed</span>
                  <strong style={{ color: '#ef4444' }}>{currentOverview.missed}</strong>
                </div>
                <div className="sp-sms-item">
                  <span>Center Criteria</span>
                  <strong style={{ color: '#2563eb' }}>75% (Eligible)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* When a single subject is chosen from the dropdown: Show that Subject's Bar Chart */
        <div className="sp-card sp-overall-attendance-card">
          <div className="sp-box-title-row" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: subjectMeta[selectedSubject]?.bg || '#eff6ff',
                  color: activeColor,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '18px'
                }}
              >
                {subjectMeta[selectedSubject]?.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  {selectedSubject} Attendance ({timeframe.toUpperCase()})
                </h3>
                <span className="sp-card-subtitle-small">
                  {subjectMeta[selectedSubject]?.teacher} · {subjectMeta[selectedSubject]?.room} · {subjectMeta[selectedSubject]?.code}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="sp-chart-legend-box">
                <span className="sp-cl-item">
                  <span className="sp-cl-dot" style={{ background: activeColor }} />
                  {selectedSubject} Rate (%)
                </span>
                <span className="sp-cl-item">
                  <span className="sp-cl-line-dash" />
                  75% Center Criteria
                </span>
              </div>
            </div>
          </div>

          {renderSingleSubjectBarChart()}
        </div>
      )}
    </div>
  );
}
