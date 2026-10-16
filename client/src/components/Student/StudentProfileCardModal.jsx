import React, { useState, useEffect } from 'react';

export default function StudentProfileCardModal({ isOpen, onClose, studentData, showToast }) {
  if (!isOpen) return null;

  const defaultStudent = {
    name: 'Suman Maji',
    handle: '@sumanmaji',
    quote: '"Consistent study today, bigger opportunities tomorrow."',
    badge: 'Silver',
    photo: '/student-avatar.jpg',
    initial: 'S',
    bg: '#eff6ff',
    color: '#2563eb',
    className: 'Class XII',
    stream: 'Science',
    batch: 'Class XII - Science (Batch A)',
    session: '2026 (July - Dec)',
    attendancePct: 87,
    attendanceDetail: '42 / 48 classes',
    avgScorePct: 78,
    avgScoreDetail: 'Across 5 tests',
    rank: '5 / 48',
    rankSub: 'Rank (Batch)',
    rankTrend: '↑ 2 positions',
    subjects: [
      { id: 'sub_physics', name: 'Physics', pct: 85, color: '#3b82f6', bg: '#eff6ff', icon: '⚛️' },
      { id: 'sub_chemistry', name: 'Chemistry', pct: 78, color: '#10b981', bg: '#ecfdf5', icon: '🧪' },
      { id: 'sub_math', name: 'Mathematics', pct: 72, color: '#8b5cf6', bg: '#f5f3ff', icon: '📐' },
      { id: 'sub_overall', name: 'Overall', pct: 78, color: '#f43f5e', bg: '#fff1f2', icon: '⭐' }
    ],
    testsTaken: 12,
    totalTests: 20,
    bestScore: '92/100',
    bestScoreTest: 'Unit Test 2'
  };

  const student = { ...defaultStudent, ...studentData };

  // Persisted Quote
  const [quote, setQuote] = useState(() => {
    try {
      const saved = localStorage.getItem('digitute_student_quote');
      return saved !== null ? saved : student.quote;
    } catch {
      return student.quote;
    }
  });

  // Edit Mode Toggle (Only when pencil is clicked)
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftQuote, setDraftQuote] = useState(quote);

  // Individual visible items state
  const defaultVisibility = {
    // Academic chip
    batchCard: true,
    // Individual metrics
    attendanceCard: true,
    avgScoreCard: true,
    rankCard: true,
    // Individual subjects
    sub_physics: true,
    sub_chemistry: true,
    sub_math: true,
    sub_overall: true,
    // Tests summary
    testsTakenCard: true,
    bestScoreCard: true
  };

  const [visibleItems, setVisibleItems] = useState(() => {
    try {
      const saved = localStorage.getItem('digitute_pcard_item_visibility');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultVisibility;
  });

  // Backup state during edit mode so user can cancel
  const [editDraftVisibility, setEditDraftVisibility] = useState(visibleItems);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Entering edit mode
  const handleEnterEditMode = () => {
    setDraftQuote(quote.replace(/^"|"$/g, ''));
    setEditDraftVisibility({ ...visibleItems });
    setIsEditMode(true);
    setIsAddMenuOpen(false);
  };

  // Exit & Save all changes
  const handleSaveChanges = () => {
    const trimmed = draftQuote.trim();
    const finalQuote = trimmed ? `"${trimmed}"` : '';
    setQuote(finalQuote);
    setVisibleItems(editDraftVisibility);
    setIsEditMode(false);
    setIsAddMenuOpen(false);

    try {
      localStorage.setItem('digitute_student_quote', finalQuote);
      localStorage.setItem('digitute_pcard_item_visibility', JSON.stringify(editDraftVisibility));
    } catch {}

    if (showToast) {
      showToast('Profile card changes saved successfully!');
    }
  };

  // Cancel edit mode
  const handleCancelChanges = () => {
    setDraftQuote(quote);
    setEditDraftVisibility({ ...visibleItems });
    setIsEditMode(false);
    setIsAddMenuOpen(false);
  };

  // Remove individual item during edit mode
  const handleRemoveItem = (itemKey, itemName) => {
    setEditDraftVisibility(prev => ({
      ...prev,
      [itemKey]: false
    }));
    if (showToast) {
      showToast(`Removed "${itemName}"`);
    }
  };

  // Add back individual item from dropdown during edit mode
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

  // Effective visibility depending on whether in edit mode or normal mode
  const currentVisibility = isEditMode ? editDraftVisibility : visibleItems;

  // Catalog of all removable/addable cards for the Add Card dropdown
  const allCardCatalog = [
    { key: 'batchCard', label: 'Batch Name', icon: '👥', section: 'Academic' },
    { key: 'attendanceCard', label: 'Attendance', icon: '👤', section: 'Metrics' },
    { key: 'avgScoreCard', label: 'Avg. Score', icon: '📈', section: 'Metrics' },
    { key: 'rankCard', label: 'Rank', icon: '⭐', section: 'Metrics' },
    { key: 'sub_physics', label: 'Physics Strength', icon: '⚛️', section: 'Subject' },
    { key: 'sub_chemistry', label: 'Chemistry Strength', icon: '🧪', section: 'Subject' },
    { key: 'sub_math', label: 'Mathematics Strength', icon: '📐', section: 'Subject' },
    { key: 'sub_overall', label: 'Overall Strength', icon: '⭐', section: 'Subject' },
    { key: 'testsTakenCard', label: 'Tests Taken', icon: '📄', section: 'Tests' },
    { key: 'bestScoreCard', label: 'Best Score', icon: '🏆', section: 'Tests' }
  ];

  const hiddenCards = allCardCatalog.filter(c => !currentVisibility[c.key]);

  // Numerical values for count-up animation
  const targetAttendance = Number(student.attendancePct) || 0;
  const targetAvgScore = Number(student.avgScorePct) || 0;
  const rankMatch = String(student.rank || '').match(/^(\d+)/);
  const targetRank = rankMatch ? parseInt(rankMatch[1], 10) : 5;
  const rankSuffix = String(student.rank || '').includes('/') 
    ? String(student.rank).substring(String(student.rank).indexOf('/')) 
    : '';

  const [attendanceCount, setAttendanceCount] = useState(0);
  const [avgScoreCount, setAvgScoreCount] = useState(0);
  const [rankCount, setRankCount] = useState(0);
  const [subjectPcts, setSubjectPcts] = useState(student.subjects.map(() => 0));
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    setAttendanceCount(0);
    setAvgScoreCount(0);
    setRankCount(0);
    setSubjectPcts(student.subjects.map(() => 0));
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
      setSubjectPcts(student.subjects.map(s => Math.round((Number(s.pct) || 0) * easeOut)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateNumbers);
      } else {
        setAttendanceCount(targetAttendance);
        setAvgScoreCount(targetAvgScore);
        setRankCount(targetRank);
        setSubjectPcts(student.subjects.map(s => Number(s.pct) || 0));
      }
    };

    animationFrameId = requestAnimationFrame(animateNumbers);

    return () => {
      clearTimeout(barTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, targetAttendance, targetAvgScore, targetRank]);

  // Check if any academic chips or metrics are visible
  const hasAcademicChips = currentVisibility.batchCard;
  const hasMetrics = currentVisibility.attendanceCard || currentVisibility.avgScoreCard || currentVisibility.rankCard;
  const hasSubjects = student.subjects.some(s => currentVisibility[s.id || s.name.toLowerCase()]);
  const hasTests = currentVisibility.testsTakenCard || currentVisibility.bestScoreCard;

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
          {/* Edit Mode Top Banner */}
          {isEditMode && (
            <div className="sp-pcard-edit-mode-bar">
              <div className="sp-pcard-edit-mode-info">
                <span className="sp-pcard-edit-mode-tag">Editing</span>
                <span>Customize your profile card</span>
              </div>
              <div className="sp-pcard-edit-mode-actions">
                <button 
                  className="sp-pcard-quote-cancel-btn" 
                  onClick={handleCancelChanges}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hero Section: Clean profile view without the outer gradient box */}
          <div className="sp-pcard-hero-banner">
            {/* Top row with pencil edit button */}
            <div className="sp-pcard-hero-top">
              {!isEditMode && (
                <button 
                  className="sp-pcard-edit-btn"
                  onClick={handleEnterEditMode}
                  title="Edit Profile Card Details"
                  aria-label="Edit Profile Card Details"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Avatar with Online/Verified Indicator */}
            <div className="sp-pcard-avatar-wrap">
              <img 
                src={student.photo || '/student-avatar.jpg'} 
                alt={student.name}
                className="sp-pcard-avatar-img"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                }}
              />
              <span className="sp-pcard-online-dot" />
            </div>

            {/* Name, Handle & Bio */}
            <div className="sp-pcard-identity">
              <div className="sp-pcard-name-row">
                <h4 className="sp-pcard-name">{student.name}</h4>
                <svg className="sp-pcard-verified-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981"/>
                </svg>
              </div>
              <span className="sp-pcard-handle">{student.handle || '@' + student.name.toLowerCase().replace(/\s+/g, '')}</span>
              
              {/* Motivational Quote: Editable only in Edit Mode */}
              {!isEditMode ? (
                <p className="sp-pcard-quote">
                  {quote || <span style={{ color: '#94a3b8' }}>Consistent study today, bigger opportunities tomorrow.</span>}
                </p>
              ) : (
                <div className="sp-pcard-quote-edit-box">
                  <textarea
                    className="sp-pcard-quote-input"
                    value={draftQuote}
                    onChange={(e) => setDraftQuote(e.target.value)}
                    placeholder="Type your motivational quote..."
                    autoFocus
                    maxLength={140}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Academic Info Chip (Only Batch Name) */}
          {hasAcademicChips && (
            <div className="sp-pcard-chips-grid single-chip">
              {currentVisibility.batchCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('batchCard', 'Batch Name')}
                      title="Remove Batch Name"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-chip">
                    <span className="sp-chip-icon purple">👥</span>
                    <div className="sp-chip-text">
                      <strong>{student.batch}</strong>
                      <span>Batches</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3 Individual Metric Summary Cards (Attendance, Avg Score, Rank) */}
          {hasMetrics && (
            <div className="sp-pcard-metrics-row">
              {/* Attendance Card */}
              {currentVisibility.attendanceCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('attendanceCard', 'Attendance')}
                      title="Remove Attendance"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card green">
                    <div className="sp-pm-icon-wrap green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <strong className="sp-pm-val">{attendanceCount}%</strong>
                    <span className="sp-pm-label">Attendance</span>
                    <span className="sp-pm-sub">{student.attendanceDetail}</span>
                  </div>
                </div>
              )}

              {/* Avg. Score Card */}
              {currentVisibility.avgScoreCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('avgScoreCard', 'Avg. Score')}
                      title="Remove Avg. Score"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card blue">
                    <div className="sp-pm-icon-wrap blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    </div>
                    <strong className="sp-pm-val">{avgScoreCount}%</strong>
                    <span className="sp-pm-label">Avg. Score</span>
                    <span className="sp-pm-sub">{student.avgScoreDetail}</span>
                  </div>
                </div>
              )}

              {/* Rank Card */}
              {currentVisibility.rankCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('rankCard', 'Rank')}
                      title="Remove Rank"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-metric-card purple">
                    <div className="sp-pm-icon-wrap purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <strong className="sp-pm-val">
                      {rankCount} {rankSuffix}
                    </strong>
                    <span className="sp-pm-label">{student.rankSub}</span>
                    <span className="sp-pm-trend">{student.rankTrend}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subjects Strength Section (Each subject can be removed individually) */}
          {hasSubjects && (
            <div className="sp-pcard-section">
              <div className="sp-pcard-section-header">
                <h5 className="sp-pcard-section-title">Subjects Strength</h5>
                <button 
                  className="sp-pcard-link-btn"
                  onClick={() => showToast && showToast('Detailed subject breakdown available in Performance tab')}
                >
                  <span>View Details</span>
                  <span>→</span>
                </button>
              </div>

              <div className="sp-pcard-subjects-list">
                {student.subjects.map((sub, idx) => {
                  const subKey = sub.id || sub.name.toLowerCase();
                  if (!currentVisibility[subKey]) return null;

                  const currentPct = subjectPcts[idx] !== undefined ? subjectPcts[idx] : sub.pct;
                  const barWidth = barsAnimated ? `${sub.pct}%` : '0%';

                  return (
                    <div key={idx} className="sp-pcard-removable-row">
                      {isEditMode && (
                        <button 
                          className="sp-pcard-remove-badge"
                          style={{ top: '2px', right: '-4px' }}
                          onClick={() => handleRemoveItem(subKey, sub.name)}
                          title={`Remove ${sub.name}`}
                        >
                          ✕
                        </button>
                      )}
                      <div className="sp-pcard-subject-row">
                        <div className="sp-pcard-sub-icon-wrap" style={{ background: sub.bg }}>
                          <span>{sub.icon}</span>
                        </div>
                        <span className="sp-pcard-sub-name">{sub.name}</span>
                        <div className="sp-pcard-sub-bar-track">
                          <div 
                            className="sp-pcard-sub-bar-fill" 
                            style={{ 
                              width: barWidth, 
                              backgroundColor: sub.color 
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
          )}

          {/* Test Performance Bottom Cards (Tests Taken & Best Score individually removable) */}
          {hasTests && (
            <div className="sp-pcard-bottom-grid">
              {currentVisibility.testsTakenCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('testsTakenCard', 'Tests Taken')}
                      title="Remove Tests Taken"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-summary-card purple">
                    <div className="sp-psc-icon-box purple">
                      📄
                    </div>
                    <div className="sp-psc-content">
                      <span className="sp-psc-label">Tests Taken</span>
                      <strong className="sp-psc-val">{student.testsTaken}</strong>
                      <span className="sp-psc-sub">out of {student.totalTests}</span>
                    </div>
                  </div>
                </div>
              )}

              {currentVisibility.bestScoreCard && (
                <div className="sp-pcard-removable-wrap">
                  {isEditMode && (
                    <button 
                      className="sp-pcard-remove-badge"
                      onClick={() => handleRemoveItem('bestScoreCard', 'Best Score')}
                      title="Remove Best Score"
                    >
                      ✕
                    </button>
                  )}
                  <div className="sp-pcard-summary-card blue">
                    <div className="sp-psc-icon-box blue">
                      📈
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

          {/* In Edit Mode: "+ Add Card" Trigger with Dropdown showing available cards */}
          {isEditMode && (
            <div className="sp-pcard-add-section-wrap">
              {/* Floating Dropdown List of removed/available cards */}
              {isAddMenuOpen && (
                <div className="sp-pcard-add-dropdown-menu">
                  {hiddenCards.length > 0 ? (
                    hiddenCards.map(item => (
                      <button 
                        key={item.key}
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
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                      All cards are already added to your profile!
                    </div>
                  )}
                </div>
              )}

              <button 
                className="sp-pcard-add-btn-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddMenuOpen(!isAddMenuOpen);
                }}
              >
                <span>+</span>
                <span>{isAddMenuOpen ? 'Close Menu' : 'Add Card from Available Options'}</span>
                {hiddenCards.length > 0 && (
                  <span style={{ 
                    background: '#dbeafe', 
                    color: '#1d4ed8', 
                    borderRadius: '999px', 
                    padding: '1px 7px', 
                    fontSize: '11px',
                    fontWeight: 800 
                  }}>
                    {hiddenCards.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Edit Mode Sticky Footer: Save Changes & Cancel */}
        {isEditMode && (
          <div className="sp-pcard-modal-footer-save">
            <button className="sp-pcard-cancel-main-btn" onClick={handleCancelChanges}>
              Cancel
            </button>
            <button className="sp-pcard-save-main-btn" onClick={handleSaveChanges}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
