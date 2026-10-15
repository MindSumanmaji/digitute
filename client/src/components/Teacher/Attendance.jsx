import React, { useState, useMemo, useEffect } from 'react';
import {
  BATCHES,
  BATCH_SUBJECTS_MAP,
  getStudentsForCombo,
  saveAttendanceSubmission,
} from '../../data/academicData';
export function Attendance({ onBack, _onNavigate, initialBatch, initialSubject }) {
  const [selectedBatch, setSelectedBatch] = useState(initialBatch || '');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Filter state for reviewing students: 'all', 'present', 'absent'
  const [filterView, setFilterView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance state: Map of studentId -> 'present' | 'absent' (Default: all present)
  const [attendanceMap, setAttendanceMap] = useState({});

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Success state after submission
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState('');

  // Ready state: user must manually pick both batch and subject
  const readyToShow = Boolean(selectedBatch && selectedSubject);

  // Get roster for current batch + subject
  const currentSubjects = selectedBatch ? (BATCH_SUBJECTS_MAP[selectedBatch] || []) : [];
  const students = useMemo(() => {
    if (!readyToShow) return [];
    return getStudentsForCombo(selectedBatch, selectedSubject);
  }, [selectedBatch, selectedSubject, readyToShow]);

  // Initialize all students as DEFAULT PRESENT
  useEffect(() => {
    if (students && students.length > 0) {
      const initialMap = {};
      students.forEach((s) => {
        initialMap[s.id] = 'present';
      });
      setAttendanceMap(initialMap);
      setIsSubmitted(false);
    }
  }, [students]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Toggle single student between Present and Absent
  const toggleAttendance = (studentId) => {
    if (isSubmitted) return;
    setAttendanceMap((prev) => {
      const current = prev[studentId] || 'present';
      return {
        ...prev,
        [studentId]: current === 'present' ? 'absent' : 'present',
      };
    });
  };

  // Select all (Mark All Present)
  const handleSelectAllPresent = () => {
    const allPresent = {};
    students.forEach((s) => {
      allPresent[s.id] = 'present';
    });
    setAttendanceMap(allPresent);
    showToast('All students marked as Present ✓');
  };

  // Quick switch scheduled batch from capsules
  const handleSwitchScheduledClass = (cls) => {
    setSelectedBatch(cls.batch);
    setSelectedSubject(cls.subject);
    setIsSubmitted(false);
  };

  // Handle batch dropdown change - reset subject so teacher manually selects it
  const handleBatchChange = (newBatch) => {
    setSelectedBatch(newBatch);
    setSelectedSubject('');
    setIsSubmitted(false);
  };

  // Calculate Present and Absent counts
  const { presentList, absentList } = useMemo(() => {
    const present = [];
    const absent = [];
    students.forEach((s) => {
      if (attendanceMap[s.id] === 'absent') {
        absent.push(s);
      } else {
        present.push(s);
      }
    });
    return { presentList: present, absentList: absent };
  }, [students, attendanceMap]);

  const totalCount = students.length;
  const presentCount = presentList.length;
  const absentCount = absentList.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered list based on tab filter
  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const status = attendanceMap[s.id] || 'present';
      const matchesFilter =
        filterView === 'all' ||
        (filterView === 'present' && status === 'present') ||
        (filterView === 'absent' && status === 'absent');

      return matchesFilter;
    });
  }, [students, attendanceMap, filterView]);

  // Click submit -> Open Confirmation Popup
  const handleInitiateSubmit = () => {
    if (totalCount === 0) {
      showToast('No students in this batch.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Final Confirmation Submit
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);

    const record = {
      id: `att-${Date.now()}`,
      batch: selectedBatch,
      subject: selectedSubject,
      date: selectedDate,
      totalCount,
      presentCount,
      absentCount,
      attendancePercentage,
      createdAt: new Date().toISOString(),
      records: students.map((s) => ({
        studentId: s.id,
        name: s.name,
        roll: s.roll,
        status: attendanceMap[s.id] === 'absent' ? 'Absent' : 'Present',
      })),
      absentees: absentList.map((s) => ({
        id: s.id,
        name: s.name,
        roll: s.roll,
      })),
    };

    saveAttendanceSubmission(record);

    setSubmissionSummary(record);
    setIsSubmitted(true);
  };

  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="att-container">
      {/* ── HEADER NAVIGATION BAR ── */}
      <div className="att-top-nav">
        <button
          type="button"
          className="att-back-btn"
          onClick={onBack}
          aria-label="Back to Academics"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Academics</span>
        </button>

        <div className="att-live-badge">
          <span className="att-pulse-dot" />
          <span>Live Attendance</span>
        </div>
      </div>

      {/* ── HERO HEADER ── */}
      <header className="att-hero-header">
        <div className="att-hero-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="9 16 11 18 15 14" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="att-hero-text">
          <h1 className="att-hero-title">Smart Attendance System</h1>
          <p className="att-hero-subtitle">
            Students are marked Present by default. Unmark absentees and confirm.
          </p>
        </div>
      </header>



      {/* ── AUTOMATIC BATCH, SUBJECT & DATE CARD ── */}
      <section className="att-meta-card">
        <div className="att-meta-grid">
          {/* Automatic Date */}
          <div className="att-meta-item">
            <label className="att-meta-label" htmlFor="att-date-input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Date (Automatic)</span>
            </label>
            <div className="att-input-wrapper">
              <input
                id="att-date-input"
                type="date"
                className="att-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <span className="att-formatted-date-badge">{formattedDate}</span>
            </div>
          </div>

          {/* Batch Selector */}
          <div className="att-meta-item">
            <label className="att-meta-label" htmlFor="att-batch-select">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span>Batch</span>
            </label>
            <div className="att-select-wrapper">
              <select
                id="att-batch-select"
                className="att-select"
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
              >
                <option value="" disabled>— Select Batch —</option>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <div className="att-select-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="att-meta-item">
            <label className="att-meta-label" htmlFor="att-subject-select">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Subject</span>
            </label>
            <div className="att-select-wrapper">
              <select
                id="att-subject-select"
                className="att-select"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setIsSubmitted(false);
                }}
                disabled={!selectedBatch}
              >
                <option value="" disabled>
                  {selectedBatch ? '— Select Subject —' : '— Select Batch First —'}
                </option>
                {currentSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="att-select-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!readyToShow ? (
        <div className="att-select-prompt">
          <div className="att-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="att-prompt-title">Select Batch &amp; Subject</h3>
          <p className="att-prompt-desc">
            Please manually select a Batch and Subject above to view the student list and record today's attendance.
          </p>
        </div>
      ) : (
        <>
          {/* ── LIVE STATS & QUICK ACTIONS BAR ── */}
          <section className="att-summary-bar">
            <div className="att-metric-pill total">
              <span className="att-pill-label">Total</span>
              <span className="att-pill-val">{totalCount}</span>
            </div>

            <div className="att-metric-pill present">
              <span className="att-pill-indicator present" />
              <span className="att-pill-label">Present</span>
              <span className="att-pill-val">{presentCount}</span>
              <span className="att-pill-pct">({attendancePercentage}%)</span>
            </div>

            <div className="att-metric-pill absent">
              <span className="att-pill-indicator absent" />
              <span className="att-pill-label">Absent</span>
              <span className="att-pill-val">{absentCount}</span>
            </div>
          </section>

          {/* ── FILTER TABS & SEARCH ── */}
          <div className="att-filter-search-row">
            <div className="att-filter-tabs" role="tablist">
              <button
                type="button"
                className={`att-filter-tab ${filterView === 'all' ? 'active' : ''}`}
                onClick={() => setFilterView('all')}
              >
                All Students ({totalCount})
              </button>
              <button
                type="button"
                className={`att-filter-tab present ${filterView === 'present' ? 'active' : ''}`}
                onClick={() => setFilterView('present')}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                className={`att-filter-tab absent ${filterView === 'absent' ? 'active' : ''}`}
                onClick={() => setFilterView('absent')}
              >
                Absent ({absentCount})
              </button>
            </div>

            
          </div>

          {/* ── SUBMISSION SUCCESS BANNER IF JUST SUBMITTED ── */}
          {isSubmitted && submissionSummary && (
            <div className="att-success-card">
              <div className="att-success-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="att-success-info">
                <h3 className="att-success-title">Attendance Submitted Successfully!</h3>
                <p className="att-success-details">
                  Recorded for <strong>{submissionSummary.batch}</strong> ({submissionSummary.subject}) on {formattedDate}.
                </p>
                <div className="att-success-badges">
                  <span className="att-success-pill green">✓ {submissionSummary.presentCount} Present</span>
                  <span className="att-success-pill red">✕ {submissionSummary.absentCount} Absent</span>
                  <span className="att-success-pill blue">Ratio: {submissionSummary.attendancePercentage}%</span>
                </div>
              </div>
              <div className="att-success-actions">
                <button
                  type="button"
                  className="att-btn-outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    handleSelectAllPresent();
                  }}
                >
                  Update / Re-take
                </button>
                <button
                  type="button"
                  className="att-btn-primary"
                  onClick={onBack}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── STUDENT ATTENDANCE LIST (TAP TO UNMARK ABSENTEES) ── */}
          <section className="att-student-list-section" aria-label="Student Attendance Cards">
            <div className="att-list-header-info">
              <span className="att-guide-text">
                💡 Tap on any student card or switch to mark as <strong>Absent</strong>.
              </span>
              <span className="att-showing-count">
                Showing {displayedStudents.length} of {totalCount}
              </span>
            </div>

            <div className="att-student-grid">
              {displayedStudents.map((student, idx) => {
                const isPresent = (attendanceMap[student.id] || 'present') === 'present';

                return (
                  <div
                    key={student.id}
                    className={`att-student-card ${isPresent ? 'is-present' : 'is-absent'}`}
                    onClick={() => toggleAttendance(student.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleAttendance(student.id);
                      }
                    }}
                    style={{ animationDelay: `${idx * 28}ms` }}
                  >
                    <div className="att-card-left">
                      <div className={`att-avatar ${isPresent ? 'avatar-present' : 'avatar-absent'}`}>
                        {getInitials(student.name)}
                      </div>
                      <div className="att-student-details">
                        <span className="att-student-name" title={student.name}>{student.name}</span>
                      </div>
                    </div>

                    <div className="att-card-right">
                      <div className={`att-status-badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                        {isPresent ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Absent</span>
                          </>
                        )}
                      </div>

                      {/* Interactive Toggle Switch */}
                      <div
                        className={`att-toggle-switch ${isPresent ? 'toggle-on' : 'toggle-off'}`}
                        aria-label={`Toggle attendance for ${student.name}`}
                      >
                        <div className="att-toggle-thumb" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedStudents.length === 0 && (
              <div className="att-empty-state">
                <p>No students match your search or filter.</p>
              </div>
            )}
          </section>

          {/* ── IN-FLOW BOTTOM SUBMIT BAR (CENTERED, ONLY AT END OF SCROLL, NOT FIXED) ── */}
          <div className="att-scroll-submit-container">
            <div className="att-scroll-submit-summary">
              <strong>{presentCount}</strong> / {totalCount} Present
              {absentCount > 0 && (
                <span className="att-bar-absent-highlight">{absentCount} absent</span>
              )}
            </div>
            <button
              type="button"
              className="att-submit-btn att-submit-btn-center"
              onClick={handleInitiateSubmit}
              disabled={totalCount === 0}
            >
              <span>Submit Attendance</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* ── CONFIRMATION MODAL (POPUP BEFORE FINAL SUBMIT) ── */}
      {showConfirmModal && (
        <div
          className="att-modal-overlay"
          onClick={() => setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="att-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="att-modal-header">
              <div className="att-modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="att-modal-title-group">
                <h3 className="att-modal-title">
                  {absentCount > 0 ? 'Confirm Absent Students' : 'Confirm Attendance Submission'}
                </h3>
                <span className="att-modal-subtitle">
                  {selectedBatch} • {selectedSubject}
                </span>
              </div>
              <button
                type="button"
                className="att-modal-close-btn"
                onClick={() => setShowConfirmModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="att-modal-body">
              {absentCount > 0 ? (
                <>
                  <p className="att-modal-warning-text">
                    You have marked <strong>{absentCount} student{absentCount > 1 ? 's' : ''}</strong> as <strong>Absent</strong>. Please review before proceeding:
                  </p>
                  <div className="att-absent-chips-list">
                    {absentList.map((st) => (
                      <div key={st.id} className="att-absent-chip">
                        <span className="att-chip-cross">✕</span>
                        <span className="att-chip-name">{st.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="att-all-present-notice">
                  <span className="att-notice-icon">🎉</span>
                  <p className="att-notice-text">
                    <strong>100% Attendance!</strong> All {totalCount} students in this batch are marked as <strong>Present</strong>.
                  </p>
                </div>
              )}

              <div className="att-modal-stats-box">
                <div className="att-mstat-row">
                  <span>Batch:</span>
                  <strong>{selectedBatch}</strong>
                </div>
                <div className="att-mstat-row">
                  <span>Subject:</span>
                  <strong>{selectedSubject}</strong>
                </div>
                <div className="att-mstat-row">
                  <span>Date:</span>
                  <strong>{formattedDate}</strong>
                </div>
                <div className="att-mstat-row highlight">
                  <span>Total Present:</span>
                  <strong className="green">{presentCount} / {totalCount} ({attendancePercentage}%)</strong>
                </div>
                <div className="att-mstat-row highlight">
                  <span>Total Absent:</span>
                  <strong className="red">{absentCount}</strong>
                </div>
              </div>
            </div>

            <div className="att-modal-actions">
              <button
                type="button"
                className="att-modal-cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                No, Review List
              </button>
              <button
                type="button"
                className="att-modal-confirm-btn"
                onClick={handleConfirmSubmit}
              >
                Yes, Submit Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="att-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Attendance;
