import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';

export default function StudentProfileCardModal({ isOpen, onClose, studentData, showToast }) {
  if (!isOpen) return null;

  const loggedInUser = (() => {
    try {
      const s = localStorage.getItem('digitute_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();
  const loggedInUserId = loggedInUser?.id;

  // Real backend metrics state
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch real database metrics for the specific student ID
  useEffect(() => {
    const studentId = studentData?.student_id || studentData?.id || loggedInUserId;
    if (!studentId) return;

    let isMounted = true;
    setLoading(true);

    apiRequest(`/api/student/peers/${studentId}/academic-card`)
      .then((data) => {
        if (isMounted && data) {
          setLiveData(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch peer live academic metrics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentData?.student_id, studentData?.id, loggedInUserId]);

  const defaultStudent = {
    name: 'Student',
    badge: 'Gold',
    photo: null,
    initial: 'S',
    bg: '#eff6ff',
    color: '#2563eb',
    className: 'Class XII',
    stream: 'Science',
    batch: 'Class XII - Science (Batch A)',
    session: '2026 - 2027',
    attendancePct: 0,
    attendanceDetail: '0 / 0 classes',
    avgScorePct: 0,
    avgScoreDetail: 'Across tests',
    rank: '—',
    rankSub: 'Rank (Batch)',
    rankTrend: 'Active Student',
    subjects: [
      { id: 'sub_physics', name: 'Physics', pct: 0, color: '#2563eb', bg: '#f5f3ff', icon: '⚛️' },
      { id: 'sub_chemistry', name: 'Chemistry', pct: 0, color: '#059669', bg: '#ecfdf5', icon: '🧪' },
      { id: 'sub_math', name: 'Mathematics', pct: 0, color: '#8b5cf6', bg: '#f5f3ff', icon: '📐' }
    ],
    testsTaken: 0,
    totalTests: 0,
    bestScore: '—',
    bestScoreTest: '—'
  };

  const student = {
    ...defaultStudent,
    ...studentData,
    ...(liveData || {}),
    subjects: ((liveData?.subjects && liveData.subjects.length > 0) ? liveData.subjects : (studentData?.subjects || defaultStudent.subjects)).filter(s => s.name?.toLowerCase() !== 'overall' && s.id !== 'sub_overall'),
    rank: studentData?.rank 
      ? (String(studentData.rank).includes('/') ? studentData.rank : `${studentData.rank} / ${liveData?.batchTotal || studentData?.batchTotal || 20}`) 
      : (liveData?.rank || '—'),
    rankTrend: (() => {
      const rawRank = studentData?.rank || liveData?.rank;
      let rankNum = null;
      if (typeof rawRank === 'number') {
        rankNum = rawRank;
      } else if (typeof rawRank === 'string') {
        const match = rawRank.match(/\d+/);
        if (match) rankNum = parseInt(match[0], 10);
      }
      if (rankNum === 1) return 'Batch Topper';
      if (rankNum === 2) return 'Runner Up';
      if (rankNum === 3) return 'Podium';
      if (rankNum >= 4 && rankNum <= 5) return 'TOP 5 Elite';
      if (rankNum >= 6 && rankNum <= 10) return 'Top 10';
      if (rankNum > 10) return '';

      const rawStanding = studentData?.standing || liveData?.rankTrend || '';
      if (/1st/i.test(rawStanding) || /batch topper/i.test(rawStanding) || /topper/i.test(rawStanding)) return 'Batch Topper';
      if (/2nd/i.test(rawStanding) || /runner/i.test(rawStanding)) return 'Runner Up';
      if (/3rd/i.test(rawStanding) || /podium/i.test(rawStanding)) return 'Podium';
      if (/top 5/i.test(rawStanding)) return 'TOP 5 Elite';
      if (/top 10/i.test(rawStanding)) return 'Top 10';
      return '';
    })(),
    badge: studentData?.rank === 1 ? 'Gold' : (studentData?.rank && studentData.rank <= 3) ? 'Silver' : 'Bronze',
    rankNum: (() => {
      const rawRank = studentData?.rank || liveData?.rank;
      if (typeof rawRank === 'number') return rawRank;
      if (typeof rawRank === 'string') {
        const match = rawRank.match(/\d+/);
        if (match) return parseInt(match[0], 10);
      }
      return null;
    })()
  };

  const targetStudentId = studentData?.student_id || studentData?.id || liveData?.id;

  // Determine if this profile card belongs strictly to the currently logged in student
  const isOwner = Boolean(
    studentData?.isMe === true ||
    studentData?.isMe === 'true' ||
    (loggedInUserId && targetStudentId && String(loggedInUserId) === String(targetStudentId)) ||
    (!targetStudentId && !studentData?.isPeer)
  );

  const getInitials = (name) => {
    if (!name) return 'RD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Persisted Quote / Motto - only use personal stored quote if viewer is the owner
  const [quote, setQuote] = useState(() => {
    if (isOwner) {
      try {
        const saved = localStorage.getItem('digitute_student_quote');
        if (saved !== null) return saved;
      } catch {}
    }
    return student.quote || 'Consistent learner, focused on improving every day.';
  });

  // Edit Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftQuote, setDraftQuote] = useState(quote);

  useEffect(() => {
    if (isOwner) {
      try {
        const saved = localStorage.getItem('digitute_student_quote');
        const q = saved !== null ? saved : (student.quote || 'Consistent learner, focused on improving every day.');
        setQuote(q);
        setDraftQuote(q);
      } catch {
        const q = student.quote || 'Consistent learner, focused on improving every day.';
        setQuote(q);
        setDraftQuote(q);
      }
    } else {
      const q = student.quote || 'Consistent learner, focused on improving every day.';
      setQuote(q);
      setDraftQuote(q);
      setIsEditMode(false);
    }
  }, [student.name, student.quote, isOwner]);

  // The 7 Customizable Widgets Visibility State
  const defaultVisibility = {
    attendanceCard: true,          // 1. Attendance Card
    avgScoreCard: true,            // 2. Avg. Score Card
    rankCard: true,                // 3. Batch Rank Card
    overallPerformanceCard: true,  // 4. Overall Performance Banner
    subjectsStrengthCard: true,    // 5. Subjects Strength Box
    testsTakenCard: true,          // 6. Tests Taken Card
    bestScoreCard: true,           // 7. Best Score Card
    // Individual subjects sub-visibility
    sub_physics: true,
    sub_chemistry: true,
    sub_math: true
  };

  const [visibleItems, setVisibleItems] = useState(() => {
    if (isOwner) {
      try {
        const saved = localStorage.getItem('digitute_pcard_item_visibility');
        if (saved) return { ...defaultVisibility, ...JSON.parse(saved) };
      } catch {}
    }
    return defaultVisibility;
  });

  useEffect(() => {
    if (isOwner) {
      try {
        const saved = localStorage.getItem('digitute_pcard_item_visibility');
        if (saved) setVisibleItems({ ...defaultVisibility, ...JSON.parse(saved) });
      } catch {}
    } else {
      setVisibleItems(defaultVisibility);
      setIsEditMode(false);
    }
  }, [isOwner, student.name]);

  const [editDraftVisibility, setEditDraftVisibility] = useState(visibleItems);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleEnterEditMode = () => {
    if (!isOwner) return;
    setDraftQuote(quote);
    setEditDraftVisibility({ ...visibleItems });
    setIsEditMode(true);
    setIsAddMenuOpen(false);
  };

  const handleSaveChanges = () => {
    const trimmed = draftQuote.trim();
    setQuote(trimmed);
    setVisibleItems(editDraftVisibility);
    setIsEditMode(false);
    setIsAddMenuOpen(false);

    try {
      localStorage.setItem('digitute_student_quote', trimmed);
      localStorage.setItem('digitute_pcard_item_visibility', JSON.stringify(editDraftVisibility));
    } catch {}

    if (showToast) {
      showToast('Profile card changes saved successfully!');
    }
  };

  const handleCancelChanges = () => {
    setDraftQuote(quote);
    setEditDraftVisibility({ ...visibleItems });
    setIsEditMode(false);
    setIsAddMenuOpen(false);
  };

  const handleRemoveItem = (itemKey, itemName) => {
    setEditDraftVisibility(prev => ({
      ...prev,
      [itemKey]: false
    }));
    if (showToast) {
      showToast(`Removed "${itemName}"`);
    }
  };

  const handleAddItem = (itemKey, itemName) => {
    setEditDraftVisibility(prev => ({
      ...prev,
      [itemKey]: true
    }));
    setIsAddMenuOpen(false);
    if (showToast) {
      showToast(`Added "${itemName}"`);
    }
  };

  const currentVisibility = isEditMode ? editDraftVisibility : visibleItems;

  // The 7 widgets catalog that user can toggle on or off
  const allCardCatalog = [
    { key: 'attendanceCard', label: 'Attendance', icon: '👤', section: 'Metrics' },
    { key: 'avgScoreCard', label: 'Avg. Score', icon: '📈', section: 'Metrics' },
    { key: 'rankCard', label: 'Batch Rank', icon: '⭐', section: 'Metrics' },
    { key: 'overallPerformanceCard', label: 'Overall Performance', icon: '🎯', section: 'Performance' },
    { key: 'subjectsStrengthCard', label: 'Subjects Strength', icon: '📊', section: 'Academics' },
    { key: 'testsTakenCard', label: 'Tests Taken', icon: '📄', section: 'Tests' },
    { key: 'bestScoreCard', label: 'Best Score', icon: '🏆', section: 'Tests' }
  ];

  const hiddenCards = allCardCatalog.filter(item => !currentVisibility[item.key]);

  const targetAttendance = Number(student.attendancePct) || 0;
  const targetAvgScore = Number(student.avgScorePct) || 0;
  const rankMatch = String(student.rank || '').match(/(\d+)/);
  const targetRank = rankMatch ? parseInt(rankMatch[1], 10) : 1;
  const rankSuffix = String(student.rank || '').includes('/') 
    ? String(student.rank).substring(String(student.rank).indexOf('/')) 
    : '';

  const [attendanceCount, setAttendanceCount] = useState(0);
  const [avgScoreCount, setAvgScoreCount] = useState(0);
  const [rankCount, setRankCount] = useState(0);
  const [subjectPcts, setSubjectPcts] = useState((student.subjects || []).map(() => 0));
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    setAttendanceCount(0);
    setAvgScoreCount(0);
    setRankCount(0);
    setSubjectPcts((student.subjects || []).map(() => 0));
    setBarsAnimated(false);

    const barTimer = setTimeout(() => {
      setBarsAnimated(true);
    }, 60);

    const duration = 900;
    const startTime = performance.now();
    let animationFrameId;

    const animateNumbers = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAttendanceCount(Math.round(targetAttendance * easeOut));
      setAvgScoreCount(Math.round(targetAvgScore * easeOut));
      setRankCount(Math.max(1, Math.round(targetRank * easeOut)));
      setSubjectPcts((student.subjects || []).map(s => Math.round((Number(s.pct) || 0) * easeOut)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateNumbers);
      } else {
        setAttendanceCount(targetAttendance);
        setAvgScoreCount(targetAvgScore);
        setRankCount(targetRank);
        setSubjectPcts((student.subjects || []).map(s => Number(s.pct) || 0));
      }
    };

    animationFrameId = requestAnimationFrame(animateNumbers);

    return () => {
      clearTimeout(barTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, targetAttendance, targetAvgScore, targetRank, student.subjects?.length]);

  // Responsive column calculation when cards are hidden in edit mode
  const visibleMetricsCount = [
    currentVisibility.attendanceCard,
    currentVisibility.avgScoreCard,
    currentVisibility.rankCard
  ].filter(Boolean).length;

  const visibleTestsCount = [
    currentVisibility.testsTakenCard,
    currentVisibility.bestScoreCard
  ].filter(Boolean).length;

  // Arc Gauge Geometry (240 deg active curve)
  // r = 22 => circumference = 2 * PI * 22 = 138.23
  // 240 deg arc = 92.15, offset to center open gap at bottom = -23
  const gaugeR = 22;
  const gaugeC = 138.23;
  const arcLength = 92.15;
  const attOffset = arcLength - (attendanceCount / 100) * arcLength - 23;
  const avgOffset = arcLength - (avgScoreCount / 100) * arcLength - 23;
  const rankTotal = student.batchTotal || 48;
  const rankPct = Math.max(0, Math.min(100, Math.round(((rankTotal - rankCount + 1) / rankTotal) * 100)));
  const rankArcOffset = arcLength - (rankPct / 100) * arcLength - 23;

  return (
    <div className="sp-card-modal-backdrop" onClick={onClose}>
      <div 
        className="sp-card-modal-container"
        onClick={(e) => {
          e.stopPropagation();
          if (isAddMenuOpen) setIsAddMenuOpen(false);
        }}
      >
        {/* Modal Header */}
        <div className="sp-card-modal-header">
          <div className="sp-card-modal-drag-handle" />
          <div className="sp-card-modal-title-row">
            <h3 className="sp-card-modal-title">Profile Card</h3>
            <button 
              type="button"
              className="sp-card-modal-close-btn"
              onClick={onClose}
              aria-label="Close Profile Card"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="sp-card-modal-body">
          {/* Edit Mode Top Notification Bar */}
          {isEditMode && (
            <div className="sp-pcard-edit-mode-bar">
              <div className="sp-pcard-edit-mode-info">
                <span className="sp-pcard-edit-mode-tag">Editing</span>
                <span>Customize your profile card (hide/show widgets)</span>
              </div>
              <div className="sp-pcard-edit-mode-actions">
                <button 
                  type="button"
                  className="sp-pcard-quote-cancel-btn" 
                  onClick={handleCancelChanges}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hero Section Banner */}
          <div className="sp-pcard-hero-banner">
            {/* Watermark Graduation Cap in Hero */}
            <svg 
              className="sp-pcard-hero-watermark" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>

            {/* Edit pencil icon button (only for card owner) */}
            {!isEditMode && isOwner && (
              <div className="sp-pcard-hero-top">
                <button 
                  type="button"
                  className="sp-pcard-edit-btn"
                  onClick={handleEnterEditMode}
                  title="Customize Profile Card"
                  aria-label="Customize Profile Card"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Avatar with White Glow Ring & Golden Crown Badge */}
            <div className="sp-pcard-avatar-wrap">
              {student.photo ? (
                <img 
                  src={student.photo} 
                  alt={student.name}
                  className="sp-pcard-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="sp-pcard-avatar-initials"
                style={{ display: student.photo ? 'none' : 'flex' }}
              >
                {getInitials(student.name)}
              </div>
              
              {/* Crown badge (Shown only for Podium Ranks: 1, 2, 3) */}
              {student.rankNum !== null && student.rankNum >= 1 && student.rankNum <= 3 && (
                <div 
                  className={`sp-pcard-crown-badge rank-${student.rankNum}`}
                  title={student.rankNum === 1 ? 'Gold Crown - 1st Position' : student.rankNum === 2 ? 'Silver Crown - 2nd Position' : 'Bronze Crown - 3rd Position'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Name, Batch with Graduation Cap Icon & Moto */}
            <div className="sp-pcard-identity">
              <div className="sp-pcard-name-row">
                <h4 className="sp-pcard-name">{student.name}</h4>
                {student.isMe && (
                  <span className="sp-badge-you" style={{ margin: '0 0 0 4px', padding: '1px 7px', fontSize: '10.5px' }}>
                    You
                  </span>
                )}
              </div>
              


              {!isEditMode ? (
                <p className="sp-pcard-quote">
                  {quote || 'Consistent learner, focused on improving every day.'}
                </p>
              ) : (
                <div className="sp-pcard-quote-edit-box">
                  <textarea
                    className="sp-pcard-quote-input"
                    value={draftQuote}
                    onChange={(e) => setDraftQuote(e.target.value)}
                    placeholder="Type your personal motto..."
                    autoFocus
                    maxLength={140}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3 Metrics Row with Semi-circular Gauges (Attendance, Avg Score, Rank) */}
          {visibleMetricsCount > 0 && (
            <div className={`sp-pcard-metrics-row ${visibleMetricsCount === 2 ? 'cols-2' : visibleMetricsCount === 1 ? 'cols-1' : ''}`}>
              {/* 1. Attendance Card */}
              {currentVisibility.attendanceCard && (
                <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
                  {isEditMode && (
                    <button 
                      type="button"
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('attendanceCard', 'Attendance')}
                      title="Remove Attendance Widget"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card green">
                    {/* Bottom liquid wave */}
                    <svg className="sp-pm-card-bottom-wave" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ color: 'rgba(187, 247, 208, 0.55)' }}>
                      <path d="M0,24 C35,38 75,10 120,22 L120,40 L0,40 Z" fill="currentColor" />
                    </svg>

                    <div className="sp-pm-gauge-wrap">
                      <svg className="sp-pm-gauge-svg" viewBox="0 0 60 60">
                        {/* Background track */}
                        <circle 
                          className="sp-pm-gauge-bg" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset="-23" 
                        />
                        {/* Progress arc */}
                        <circle 
                          className="sp-pm-gauge-progress green" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset={barsAnimated ? attOffset : 69.15} 
                        />
                      </svg>
                      <div className="sp-pm-icon-inner green">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    </div>
                    <strong className="sp-pm-val">{attendanceCount}%</strong>
                    <span className="sp-pm-label">Attendance</span>
                    <span className="sp-pm-sub">{student.attendanceDetail}</span>
                  </div>
                </div>
              )}

              {/* 2. Avg. Score Card */}
              {currentVisibility.avgScoreCard && (
                <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
                  {isEditMode && (
                    <button 
                      type="button"
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('avgScoreCard', 'Avg. Score')}
                      title="Remove Avg. Score Widget"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card blue">
                    {/* Bottom liquid wave */}
                    <svg className="sp-pm-card-bottom-wave" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ color: 'rgba(191, 219, 254, 0.6)' }}>
                      <path d="M0,24 C35,38 75,10 120,22 L120,40 L0,40 Z" fill="currentColor" />
                    </svg>

                    <div className="sp-pm-gauge-wrap">
                      <svg className="sp-pm-gauge-svg" viewBox="0 0 60 60">
                        <circle 
                          className="sp-pm-gauge-bg" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset="-23" 
                        />
                        <circle 
                          className="sp-pm-gauge-progress blue" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset={barsAnimated ? avgOffset : 69.15} 
                        />
                      </svg>
                      <div className="sp-pm-icon-inner blue">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                          <polyline points="17 6 23 6 23 12"/>
                        </svg>
                      </div>
                    </div>
                    <strong className="sp-pm-val">{avgScoreCount}%</strong>
                    <span className="sp-pm-label">Avg. Score</span>
                    <span className="sp-pm-sub">{student.avgScoreDetail}</span>
                  </div>
                </div>
              )}

              {/* 3. Rank Card */}
              {currentVisibility.rankCard && (
                <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
                  {isEditMode && (
                    <button 
                      type="button"
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('rankCard', 'Rank')}
                      title="Remove Rank Widget"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card purple">
                    {/* Bottom liquid wave */}
                    <svg className="sp-pm-card-bottom-wave" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ color: 'rgba(233, 213, 255, 0.55)' }}>
                      <path d="M0,24 C35,38 75,10 120,22 L120,40 L0,40 Z" fill="currentColor" />
                    </svg>

                    <div className="sp-pm-gauge-wrap">
                      <svg className="sp-pm-gauge-svg" viewBox="0 0 60 60">
                        <circle 
                          className="sp-pm-gauge-bg" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset="-23" 
                        />
                        <circle 
                          className="sp-pm-gauge-progress purple" 
                          cx="30" 
                          cy="30" 
                          r={gaugeR} 
                          strokeDasharray="92.15 138.23" 
                          strokeDashoffset={barsAnimated ? rankArcOffset : 69.15} 
                        />
                      </svg>
                      <div className="sp-pm-icon-inner purple">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                    </div>
                    <strong className="sp-pm-val">
                      {rankCount} {rankSuffix || `/ ${student.batchTotal || 48}`}
                    </strong>
                    <span className="sp-pm-label">{student.rankSub || 'Rank (Batch)'}</span>
                    <span className="sp-pm-trend">{student.rankTrend}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Overall Performance Target Dart Banner */}
          {currentVisibility.overallPerformanceCard && (
            <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
              {isEditMode && (
                <button 
                  type="button"
                  className="sp-pcard-remove-badge"
                  onClick={() => handleRemoveItem('overallPerformanceCard', 'Overall Performance')}
                  title="Remove Overall Performance Widget"
                >
                  ✕
                </button>
              )}
              <div className="sp-pcard-overall-card">
                <div className="sp-pcard-overall-left">
                  <div className="sp-pcard-overall-header">
                    <div className="sp-pcard-overall-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    </div>
                    <div className="sp-pcard-overall-title-wrap">
                      <span className="sp-pcard-overall-label">Overall Performance</span>
                      <strong className="sp-pcard-overall-pct">{avgScoreCount}%</strong>
                    </div>
                  </div>
                  <div className="sp-pcard-overall-bar-track">
                    <div 
                      className="sp-pcard-overall-bar-fill"
                      style={{ width: barsAnimated ? `${targetAvgScore}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Target Board with Embedded Dart Arrow */}
                <div className="sp-pcard-overall-target-art">
                  <svg width="78" height="78" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="48" fill="#FFF1F2" opacity="0.6" />
                    <circle cx="50" cy="50" r="40" fill="#FFE4E6" opacity="0.75" />
                    <circle cx="50" cy="50" r="32" fill="#FFFFFF" stroke="#FDA4AF" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="24" fill="#F43F5E" />
                    <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
                    <circle cx="50" cy="50" r="8" fill="#F43F5E" />
                    <line x1="86" y1="14" x2="52" y2="48" stroke="#BE123C" strokeWidth="3.5" strokeLinecap="round" />
                    <polygon points="86,14 78,10 84,6" fill="#F43F5E" />
                    <polygon points="86,14 90,22 94,16" fill="#F43F5E" />
                    <polygon points="86,14 92,10 84,16" fill="#E11D48" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* 5. Subjects Strength Section */}
          {currentVisibility.subjectsStrengthCard && (
            <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
              {isEditMode && (
                <button 
                  type="button"
                  className="sp-pcard-remove-badge"
                  onClick={() => handleRemoveItem('subjectsStrengthCard', 'Subjects Strength')}
                  title="Remove Subjects Strength Section"
                >
                  ✕
                </button>
              )}
              <div className="sp-pcard-section">
                <div className="sp-pcard-section-header">
                  <h5 className="sp-pcard-section-title">Subjects Strength</h5>
                </div>

                <div className="sp-pcard-subjects-list">
                  {student.subjects.map((sub, idx) => {
                    const subKey = sub.id || sub.name.toLowerCase();
                    if (currentVisibility[subKey] === false) return null;

                    const currentPct = subjectPcts[idx] !== undefined ? subjectPcts[idx] : sub.pct;
                    const barWidth = barsAnimated ? `${sub.pct}%` : '0%';

                    // Custom vector icons per subject
                    const isPhysics = sub.name.toLowerCase().includes('physic');
                    const isChemistry = sub.name.toLowerCase().includes('chem');
                    const isMath = sub.name.toLowerCase().includes('math');

                    return (
                      <div key={idx} className="sp-pcard-removable-row">
                        <div className="sp-pcard-subject-row">
                          <div 
                            className="sp-pcard-sub-icon-wrap" 
                            style={{ 
                              background: isChemistry ? '#ecfdf5' : '#f5f3ff',
                              color: isChemistry ? '#10b981' : isMath ? '#8b5cf6' : '#2563eb'
                            }}
                          >
                            {isPhysics ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="2.5" fill="#2563eb"/>
                                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)"/>
                                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)"/>
                              </svg>
                            ) : isChemistry ? (
                              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 2v7.31L4.17 19.5A2 2 0 0 0 5.89 22h12.22a2 2 0 0 0 1.72-2.5L14 9.31V2"/>
                                <path d="M8.5 2h7"/>
                                <path d="M7 16h10"/>
                              </svg>
                            ) : isMath ? (
                              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.3 15.3l-9.6-9.6a2 2 0 0 0-2.8 0L2.7 11.9a2 2 0 0 0 0 2.8l9.6 9.6a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8z"/>
                                <line x1="8" y1="12" x2="10" y2="14"/>
                                <line x1="11" y1="9" x2="13" y2="11"/>
                                <line x1="14" y1="6" x2="16" y2="8"/>
                              </svg>
                            ) : (
                              <span>{sub.icon || '📚'}</span>
                            )}
                          </div>
                          <span className="sp-pcard-sub-name">{sub.name}</span>
                          <div className="sp-pcard-sub-bar-track">
                            <div 
                              className="sp-pcard-sub-bar-fill" 
                              style={{ 
                                width: barWidth, 
                                backgroundColor: isPhysics ? '#2563eb' : isChemistry ? '#059669' : '#8b5cf6'
                              }}
                            />
                          </div>
                          <span className="sp-pcard-sub-pct">{currentPct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 6 & 7. Bottom Tests Grid (Tests Taken & Best Score) with watermark illustrations */}
          {visibleTestsCount > 0 && (
            <div className={`sp-pcard-bottom-grid ${visibleTestsCount === 1 ? 'cols-1' : ''}`}>
              {/* 6. Tests Taken Card */}
              {currentVisibility.testsTakenCard && (
                <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
                  {isEditMode && (
                    <button 
                      type="button"
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('testsTakenCard', 'Tests Taken')}
                      title="Remove Tests Taken Widget"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-summary-card blue">
                    {/* Watermark Clipboard Art */}
                    <svg className="sp-psc-watermark" viewBox="0 0 24 24" fill="#0284c7">
                      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>

                    <div className="sp-psc-icon-box blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div className="sp-psc-content">
                      <span className="sp-psc-label">Tests<br/>Taken</span>
                      <strong className="sp-psc-val">{student.testsTaken}</strong>
                      <span className="sp-psc-sub">out of {student.totalTests || 20}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Best Score Card */}
              {currentVisibility.bestScoreCard && (
                <div className={`sp-pcard-removable-wrap ${isEditMode ? 'is-editing' : ''}`}>
                  {isEditMode && (
                    <button 
                      type="button"
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('bestScoreCard', 'Best Score')}
                      title="Remove Best Score Widget"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-summary-card amber">
                    {/* Watermark Golden Trophy Art */}
                    <svg className="sp-psc-watermark" viewBox="0 0 24 24" fill="#d97706">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                    </svg>

                    <div className="sp-psc-icon-box amber">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    </div>
                    <div className="sp-psc-content">
                      <span className="sp-psc-label">Best Score</span>
                      <strong className="sp-psc-val">{student.bestScore}</strong>
                      <span className="sp-psc-sub">{student.bestScoreTest}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* In Edit Mode: "+ Add Widget from Available Options" Button & Dropdown */}
          {isEditMode && (
            <div className="sp-pcard-add-section-wrap">
              {isAddMenuOpen && (
                <div className="sp-pcard-add-dropdown-menu">
                  {hiddenCards.length > 0 ? (
                    hiddenCards.map(item => (
                      <button 
                        key={item.key}
                        type="button"
                        className="sp-pcard-add-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem(item.key, item.label);
                        }}
                      >
                        <div className="sp-pcard-add-item-left">
                          <span className="sp-pcard-add-item-icon">{item.icon}</span>
                          <span>{item.label}</span>
                          <span className="sp-pcard-item-tag">{item.section}</span>
                        </div>
                        <span className="sp-pcard-add-item-plus">+</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '14px', textAlign: 'center', fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
                      ✨ All 7 widgets are currently active on your card!
                    </div>
                  )}
                </div>
              )}

              <button 
                type="button"
                className="sp-pcard-add-btn-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddMenuOpen(!isAddMenuOpen);
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span>
                <span>{isAddMenuOpen ? 'Close Menu' : 'Add Widget from Available Options'}</span>
                {hiddenCards.length > 0 && (
                  <span style={{ 
                    background: '#dbeafe', 
                    color: '#1d4ed8', 
                    borderRadius: '999px', 
                    padding: '2px 8px', 
                    fontSize: '11px',
                    fontWeight: 800 
                  }}>
                    {hiddenCards.length} hidden
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        {isEditMode ? (
          <div className="sp-pcard-modal-footer-save">
            <button type="button" className="sp-pcard-cancel-main-btn" onClick={handleCancelChanges}>
              Cancel
            </button>
            <button type="button" className="sp-pcard-save-main-btn" onClick={handleSaveChanges}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Save Changes</span>
            </button>
          </div>
        ) : (
          <div className="sp-card-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: isOwner ? 'space-between' : 'flex-end' }}>
            {isOwner && (
              <button 
                type="button"
                className="sp-pcard-customize-trigger-btn"
                onClick={handleEnterEditMode}
                title="Customize which widgets appear on this card"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Customize Widgets</span>
              </button>
            )}
            <button 
              type="button" 
              className="sp-btn-secondary" 
              onClick={onClose}
              style={{ padding: '8px 18px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
