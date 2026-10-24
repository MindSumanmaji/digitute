import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function AttendanceAnalysis({ onBack, showToast, attendanceData: initialAttendanceData, routinesList = [], sessionsList = [] }) {
  const [timeframe, setTimeframe] = useState('month'); // 'week' | 'month' | 'year'
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const [liveAttendance, setLiveAttendance] = useState(initialAttendanceData || null);
  const dropdownRef = useRef(null);

  // Fetch live attendance if not provided
  useEffect(() => {
    if (!initialAttendanceData) {
      apiRequest('/api/student/my-attendance')
        .then((data) => {
          if (data) setLiveAttendance(data);
        })
        .catch((err) => console.warn('AttendanceAnalysis fetch error:', err));
    } else {
      setLiveAttendance(initialAttendanceData);
    }
  }, [initialAttendanceData]);

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

  // 1. Dynamic Teacher resolver from routines, sessions, and attendance
  const resolvedTeachers = useMemo(() => {
    const map = {};
    (routinesList || []).forEach((r) => {
      if (r.subject && r.users?.full_name) {
        map[r.subject] = r.users.full_name;
      }
    });
    (sessionsList || []).forEach((s) => {
      if (s.subject && s.teacher_name) {
        map[s.subject] = s.teacher_name;
      }
    });
    if (liveAttendance?.subject_wise) {
      Object.entries(liveAttendance.subject_wise).forEach(([sName, sInfo]) => {
        if (sInfo.teacher && sInfo.teacher !== 'Faculty') {
          map[sName] = sInfo.teacher;
        }
      });
    }
    return map;
  }, [routinesList, sessionsList, liveAttendance]);

  // 2. Dynamic Unique subjects enrolled by student (NO dummy subjects)
  const availableSubjects = useMemo(() => {
    const set = new Set();
    (routinesList || []).forEach((r) => { if (r.subject) set.add(r.subject); });
    (sessionsList || []).forEach((s) => { if (s.subject) set.add(s.subject); });
    if (liveAttendance?.subject_wise) {
      Object.keys(liveAttendance.subject_wise).forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [routinesList, sessionsList, liveAttendance]);

  // 3. Dynamic Subject Metadata helper
  const getSubjectMeta = (subjName) => {
    if (subjName === 'All') {
      return { name: 'All Subjects', icon: '📊', color: '#2563eb', bg: '#eff6ff', teacher: 'All Faculty', code: 'ALL-00' };
    }
    const s = (subjName || '').toLowerCase();
    let icon = '📖';
    let color = '#2563eb';
    let bg = '#eff6ff';
    let code = `${subjName.slice(0, 3).toUpperCase()}-101`;

    if (s.includes('phys')) {
      icon = '⚡';
      color = '#10b981';
      bg = '#ecfdf5';
      code = 'PHY-102';
    } else if (s.includes('math')) {
      icon = '📐';
      color = '#2563eb';
      bg = '#eff6ff';
      code = 'MTH-101';
    } else if (s.includes('chem')) {
      icon = '🧪';
      color = '#9333ea';
      bg = '#faf5ff';
      code = 'CHM-103';
    } else if (s.includes('bio')) {
      icon = '🧬';
      color = '#ea580c';
      bg = '#fff7ed';
      code = 'BIO-104';
    } else if (s.includes('comp') || s.includes('cs') || s.includes('it')) {
      icon = '💻';
      color = '#0284c7';
      bg = '#f0f9ff';
      code = 'CS-105';
    }

    return {
      name: subjName,
      icon,
      color,
      bg,
      code,
      teacher: resolvedTeachers[subjName] || 'Faculty'
    };
  };

  // Compute live slices and top/less subjects dynamically
  const { pieSlices, topSubject, lessSubject, overallRate, totalClasses, attended, missed } = useMemo(() => {
    const sw = liveAttendance?.subject_wise || {};

    const slices = availableSubjects.map((sName) => {
      const sInfo = sw[sName] || {};
      const meta = getSubjectMeta(sName);
      const sTotal = sInfo.total || 0;
      const sRate = sTotal > 0 ? (sInfo.percentage ?? 0) : 0;
      return {
        name: sName,
        value: sTotal, // Real count of classes held (0 if none)
        rate: sRate,
        color: meta.color
      };
    });

    let top = null;
    let less = null;

    if (availableSubjects.length > 0) {
      const activeWithClasses = availableSubjects.filter((s) => (sw[s]?.total || 0) > 0);

      if (activeWithClasses.length > 0) {
        const sorted = [...activeWithClasses].sort((a, b) => {
          const rateA = sw[a]?.total > 0 ? (sw[a]?.percentage ?? 0) : 0;
          const rateB = sw[b]?.total > 0 ? (sw[b]?.percentage ?? 0) : 0;
          return rateB - rateA;
        });
        const topName = sorted[0];
        const topInfo = sw[topName] || {};

        top = {
          name: topName,
          rate: topInfo.total > 0 ? (topInfo.percentage ?? 0) : 0,
          attended: topInfo.present || 0,
          total: topInfo.total || 0,
          teacher: resolvedTeachers[topName] || 'Faculty',
          note: 'Outstanding consistency recorded across current curriculum classes'
        };

        // Only show lessSubject if there are at least 2 subjects with classes held
        if (activeWithClasses.length >= 2) {
          const lessName = sorted[sorted.length - 1];
          const lessInfo = sw[lessName] || {};
          less = {
            name: lessName,
            rate: lessInfo.total > 0 ? (lessInfo.percentage ?? 0) : 0,
            attended: lessInfo.present || 0,
            total: lessInfo.total || 0,
            teacher: resolvedTeachers[lessName] || 'Faculty',
            note: (lessInfo.total > 0 && (lessInfo.percentage ?? 0) < 75)
              ? 'Attendance is below 75% center threshold. Focus on attending upcoming classes.'
              : 'Good standing. Maintain attendance focus to ensure distinction criteria.'
          };
        } else {
          less = null;
        }
      }
    }

    const tClasses = liveAttendance?.total_classes || 0;
    const pClasses = liveAttendance?.present_classes || 0;
    const aClasses = liveAttendance?.absent_classes || 0;
    const rate = liveAttendance?.attendance_percentage ?? 0;

    return {
      pieSlices: slices,
      topSubject: top,
      lessSubject: less,
      overallRate: rate,
      totalClasses: tClasses,
      attended: pClasses,
      missed: aClasses
    };
  }, [liveAttendance, availableSubjects, routinesList, resolvedTeachers]);

  // Overall Data by Timeframe (Week, Month, Year)
  const overallDataByTimeframe = useMemo(() => {
    const monthSummary = liveAttendance?.month_summary || {};
    const monthRate = monthSummary.rate ?? overallRate;
    const hasMonthData = (monthSummary.total !== undefined && monthSummary.total > 0);
    const monthTotal = hasMonthData ? monthSummary.total : (totalClasses || 0);
    const monthAttended = hasMonthData ? monthSummary.attended : attended;
    const monthMissed = hasMonthData ? monthSummary.missed : missed;

    return {
      week: {
        title: 'Current Week',
        overallRate,
        totalClasses,
        attended,
        missed,
        topSubject,
        lessSubject,
        pieSlices
      },
      month: {
        title: `${monthSummary.month_name || 'Current Month'} (Monthly Progression)`,
        overallRate: monthRate,
        totalClasses: monthTotal,
        attended: monthAttended,
        missed: monthMissed,
        topSubject,
        lessSubject,
        pieSlices
      },
      year: {
        title: 'Academic Term (Annual Progression)',
        overallRate,
        totalClasses,
        attended,
        missed,
        topSubject,
        lessSubject,
        pieSlices
      }
    };
  }, [liveAttendance, overallRate, totalClasses, attended, missed, topSubject, lessSubject, pieSlices]);

  // 4. Dynamic Single Subject Bar Data (Strictly calculated from real session records)
  const singleSubjectBarData = useMemo(() => {
    // Collect all unified session records with attendance status
    const getSubjectSessions = (sName) => {
      const recordsMap = {};

      // 1. From sessionsList
      (sessionsList || []).forEach((s) => {
        if (!sName || sName === 'All' || (s.subject || '').toLowerCase() === sName.toLowerCase()) {
          const isAttended = s.student_attendance_status === 'Attended';
          const isAbsent = s.student_attendance_status === 'Absent' || (s.status === 'COMPLETED' && !isAttended);
          const isHeld = isAttended || isAbsent;
          if (s.session_date) {
            recordsMap[s.id || s.session_date] = {
              date: s.session_date,
              isHeld,
              isAttended
            };
          }
        }
      });

      // 2. From liveAttendance history
      const attHistory = liveAttendance?.history || [];
      attHistory.forEach((h) => {
        const subj = h.class_sessions?.subject || h.subject || '';
        if (!sName || sName === 'All' || subj.toLowerCase() === sName.toLowerCase()) {
          const sDate = h.class_sessions?.session_date || h.session_date;
          const isAttended = h.status === 'PRESENT' || h.status === 'Attended';
          if (sDate) {
            recordsMap[h.session_id || sDate] = {
              date: sDate,
              isHeld: true,
              isAttended
            };
          }
        }
      });

      return Object.values(recordsMap);
    };

    const computeRateForItems = (items) => {
      const held = items.filter((it) => it.isHeld);
      if (held.length === 0) return 0;
      const attended = held.filter((it) => it.isAttended).length;
      return Math.round((attended / held.length) * 100);
    };

    const getBarValuesForSubject = (sName) => {
      const items = getSubjectSessions(sName);

      // Determine active month prefix for month breakdown
      let activeMonthPrefix = '';
      const latestHeld = items.filter((it) => it.isHeld).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latestHeld && latestHeld.date) {
        activeMonthPrefix = latestHeld.date.slice(0, 7);
      } else if (items.length > 0 && items[0].date) {
        activeMonthPrefix = items[0].date.slice(0, 7);
      } else {
        activeMonthPrefix = new Date().toISOString().slice(0, 7);
      }

      // WEEK (Mon - Sun: 1=Mon ... 7=Sun)
      const weekVals = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
        const dayItems = items.filter((it) => {
          if (!it.date) return false;
          const d = new Date(it.date);
          const rDow = (d.getDay() + 6) % 7 + 1;
          return rDow === dow;
        });
        return computeRateForItems(dayItems);
      });

      // MONTH (Week 1 - 5 in active month)
      const monthVals = [1, 2, 3, 4, 5].map((w) => {
        const weekItems = items.filter((it) => {
          if (!it.date || !it.date.startsWith(activeMonthPrefix)) return false;
          const dayNum = parseInt(it.date.split('-')[2], 10);
          const recWeek = Math.min(5, Math.ceil(dayNum / 7));
          return recWeek === w;
        });
        return computeRateForItems(weekItems);
      });

      // YEAR (Jan - Dec: 0=Jan ... 11=Dec)
      const yearVals = Array.from({ length: 12 }, (_, mIdx) => {
        const monthItems = items.filter((it) => {
          if (!it.date) return false;
          const m = parseInt(it.date.split('-')[1], 10) - 1;
          return m === mIdx;
        });
        return computeRateForItems(monthItems);
      });

      return {
        week: weekVals,
        month: monthVals,
        year: yearVals
      };
    };

    const subjectMap = {};
    availableSubjects.forEach((sName) => {
      subjectMap[sName] = getBarValuesForSubject(sName);
    });
    subjectMap['All'] = getBarValuesForSubject('All');

    return {
      categories: {
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      fullLabels: {
        week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        year: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      },
      data: subjectMap
    };
  }, [liveAttendance, availableSubjects, sessionsList]);

  const currentOverview = overallDataByTimeframe[timeframe];
  const activeMeta = getSubjectMeta(selectedSubject);
  const activeColor = activeMeta.color;

  // Helper to render Donut Pie Chart with math-perfect SVG arcs
  const renderDonutChart = (slices, overallRateVal) => {
    const cx = 130;
    const cy = 130;
    const R = 98;
    const r = 62;

    // Filter to only subjects with actual classes held (value > 0)
    const activeSlices = (slices || []).filter((s) => (s.value || 0) > 0);
    const totalValue = activeSlices.reduce((sum, s) => sum + s.value, 0);

    let paths = [];
    if (activeSlices.length > 0 && totalValue > 0) {
      let currentAngle = -Math.PI / 2;

      paths = activeSlices.map((slice) => {
        const angle = (slice.value / totalValue) * (2 * Math.PI);
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const isHovered = hoveredSlice === slice.name;
        const currentR = isHovered ? R + 5 : R;

        if (angle >= 2 * Math.PI - 0.001 || activeSlices.length === 1) {
          const d = `M ${cx} ${cy - currentR} A ${currentR} ${currentR} 0 1 1 ${cx} ${cy + currentR} A ${currentR} ${currentR} 0 1 1 ${cx} ${cy - currentR} L ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`;
          return {
            ...slice,
            d,
            pct: 100
          };
        }

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
    }

    return (
      <div className="sp-pie-chart-wrap">
        <svg viewBox="0 0 260 260" className="sp-pie-svg">
          {paths.length === 0 ? (
            <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#e2e8f0" strokeWidth={R - r} />
          ) : (
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
          )}
          <circle cx={cx} cy={cy} r={r - 4} fill="#ffffff" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            fill="#0f172a"
          >
            {overallRateVal}%
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
                setSelectedSubject(s.name);
                if (showToast) showToast(`Filtered to ${s.name}`);
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
    const categories = singleSubjectBarData.categories[timeframe];
    const fullLabels = singleSubjectBarData.fullLabels[timeframe];
    const values = singleSubjectBarData.data[selectedSubject]?.[timeframe] || Array(categories.length).fill(0);

    const svgWidth = 720;
    const svgHeight = 260;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 45;
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const getY = (val) => paddingTop + plotHeight - (val / 100) * plotHeight;

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
      {/* 1. CONTROLS STRIP: TIMEFRAME & SUBJECT DROPDOWN                           */}
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
              <span className="sp-sdb-icon">{activeMeta.icon || '📊'}</span>
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
                {['All', ...availableSubjects].map((subjKey) => {
                  const meta = getSubjectMeta(subjKey);
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
              {currentOverview.topSubject ? (
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
              ) : (
                <div className="sp-spotlight-card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="sp-spotlight-head">
                    <div className="sp-spotlight-icon-box" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      ℹ️
                    </div>
                    <div>
                      <span className="sp-spotlight-badge" style={{ color: '#64748b' }}>TOP ATTENDED SUBJECT</span>
                      <h4 className="sp-spotlight-title" style={{ color: '#64748b' }}>No Classes Held Yet</h4>
                    </div>
                  </div>
                  <div className="sp-spotlight-body">
                    <span className="sp-spotlight-note" style={{ color: '#94a3b8' }}>Classes have not commenced yet.</span>
                  </div>
                </div>
              )}

              {/* Less Attended Subject */}
              {currentOverview.lessSubject ? (
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
              ) : (
                <div className="sp-spotlight-card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="sp-spotlight-head">
                    <div className="sp-spotlight-icon-box" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      ℹ️
                    </div>
                    <div>
                      <span className="sp-spotlight-badge" style={{ color: '#64748b' }}>LESS ATTENDED SUBJECT</span>
                      <h4 className="sp-spotlight-title" style={{ color: '#64748b', fontSize: '15px' }}>
                        No Comparative Subject Yet
                      </h4>
                    </div>
                  </div>
                  <div className="sp-spotlight-body">
                    <p className="sp-spotlight-meta" style={{ color: '#94a3b8' }}>
                      Awaiting classes in other subjects
                    </p>
                    <span className="sp-spotlight-note" style={{ color: '#94a3b8' }}>
                      Once sessions across multiple subjects are conducted, the lowest attended subject will be highlighted here.
                    </span>
                  </div>
                </div>
              )}

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
                  background: activeMeta.bg || '#eff6ff',
                  color: activeColor,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '18px'
                }}
              >
                {activeMeta.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  {selectedSubject} Attendance ({timeframe.toUpperCase()})
                </h3>
                <span className="sp-card-subtitle-small">
                  {activeMeta.teacher} · {activeMeta.code}
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
