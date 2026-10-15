import React, { useState, useMemo, useEffect } from 'react';
import {
  BATCHES,
  BATCH_SUBJECTS_MAP,
  GRADE_RULES,
  calculateGrade,
  getGradeBadgeStyle,
  getStudentsForCombo,
  saveExamSubmission,
} from '../../data/academicData';
export function ExamEvaluation({ onBack, onNavigateToStudentInfo }) {
  // Step 1: Form Configuration (manual selection by teacher)
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [totalMarks, setTotalMarks] = useState('');

  // Ready state: user must manually pick both batch and subject
  const readyToShow = Boolean(selectedBatch && selectedSubject);

  // Step 2: Evaluation map for each student:
  // { [studentId]: { obtainedMarks: number|string, isAbsent: boolean } }
  const [marksMap, setMarksMap] = useState({});

  // UI state
  const [showConfigRules, setShowConfigRules] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedExamRecord, setSavedExamRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Available subjects for the batch
  const currentSubjects = selectedBatch ? (BATCH_SUBJECTS_MAP[selectedBatch] || []) : [];

  // Roster of students
  const students = useMemo(() => {
    if (!readyToShow) return [];
    return getStudentsForCombo(selectedBatch, selectedSubject);
  }, [selectedBatch, selectedSubject, readyToShow]);

  // Reset marks map when batch or subject changes
  useEffect(() => {
    if (students && students.length > 0) {
      const initialMap = {};
      students.forEach((s) => {
        initialMap[s.id] = {
          obtainedMarks: '',
          isAbsent: false,
        };
      });
      setMarksMap(initialMap);
      setIsSaved(false);
    }
  }, [students, totalMarks]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleBatchChange = (newBatch) => {
    setSelectedBatch(newBatch);
    setSelectedSubject('');
    setIsSaved(false);
  };

  // Change student's obtained marks with validation
  const handleMarksChange = (studentId, value) => {
    if (isSaved) return;

    if (value === '') {
      setMarksMap((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          obtainedMarks: '',
          isAbsent: false,
        },
      }));
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 0) return;
    if (totalMarks && Number(totalMarks) > 0 && num > Number(totalMarks)) {
      showToast(`Marks cannot exceed Total Marks (${totalMarks})`);
      return;
    }

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        obtainedMarks: num,
        isAbsent: false,
      },
    }));
  };

  // Toggle student absent status (✕)
  const toggleAbsent = (studentId) => {
    if (isSaved) return;
    setMarksMap((prev) => {
      const current = prev[studentId] || { obtainedMarks: '', isAbsent: false };
      const nextAbsent = !current.isAbsent;
      return {
        ...prev,
        [studentId]: {
          obtainedMarks: nextAbsent ? '' : current.obtainedMarks,
          isAbsent: nextAbsent,
        },
      };
    });
  };

  // Pre-fill sample marks for quick testing
  const handlePrefillSampleMarks = () => {
    const newMap = {};
    students.forEach((s, idx) => {
      // mark 2 students as absent for realistic demo
      if (idx === 1 || idx === 7) {
        newMap[s.id] = { obtainedMarks: '', isAbsent: true };
      } else {
        // pseudo-random score between 55% and 96%
        const pct = 58 + ((idx * 7) % 39);
        const marks = Math.round((pct / 100) * totalMarks);
        newMap[s.id] = { obtainedMarks: marks, isAbsent: false };
      }
    });
    setMarksMap(newMap);
    showToast('Populated realistic scores for testing ✓');
  };

  // Calculate live statistics
  const evaluationStats = useMemo(() => {
    let totalAbsent = 0;
    let totalEvaluated = 0;
    let sumMarks = 0;
    let highestMarks = 0;
    const gradeDistribution = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0 };

    students.forEach((s) => {
      const entry = marksMap[s.id];
      if (!entry) return;

      if (entry.isAbsent) {
        totalAbsent++;
      } else if (entry.obtainedMarks !== '' && !isNaN(Number(entry.obtainedMarks))) {
        totalEvaluated++;
        const marks = Number(entry.obtainedMarks);
        sumMarks += marks;
        if (marks > highestMarks) highestMarks = marks;
        const pct = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;
        const gr = calculateGrade(pct);
        if (gradeDistribution[gr] !== undefined) {
          gradeDistribution[gr]++;
        }
      }
    });

    const avgMarks = totalEvaluated > 0 ? (sumMarks / totalEvaluated).toFixed(1) : 0;
    const avgPct = totalMarks > 0 && totalEvaluated > 0 ? Math.round((sumMarks / (totalEvaluated * totalMarks)) * 100) : 0;

    return {
      totalCount: students.length,
      totalEvaluated,
      totalAbsent,
      avgMarks,
      avgPct,
      highestMarks,
      gradeDistribution,
    };
  }, [students, marksMap, totalMarks]);

  // Click Submit -> Show Confirmation Modal
  const handleInitiateSubmit = () => {
    if (!examTitle.trim()) {
      showToast('⚠️ Please enter an Exam Title.');
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      showToast('⚠️ Please enter valid Total Exam Marks.');
      return;
    }
    if (evaluationStats.totalEvaluated === 0 && evaluationStats.totalAbsent === 0) {
      showToast('Please enter marks or mark absent for at least one student.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Final Confirmation Submit & Save to LocalStorage
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);

    const results = students.map((s) => {
      const entry = marksMap[s.id] || { obtainedMarks: '', isAbsent: false };
      const isAbsent = Boolean(entry.isAbsent);
      const marks = isAbsent || entry.obtainedMarks === '' ? null : Number(entry.obtainedMarks);
      const percentage = marks !== null && totalMarks > 0 ? Math.round((marks / totalMarks) * 100) : null;
      const grade = percentage !== null ? calculateGrade(percentage) : (isAbsent ? 'AB' : '—');

      return {
        studentId: s.id,
        name: s.name,
        roll: s.roll,
        obtainedMarks: marks,
        isAbsent,
        percentage,
        grade,
      };
    });

    const examRecord = {
      id: `exam-${Date.now()}`,
      examTitle,
      batch: selectedBatch,
      subject: selectedSubject,
      examDate,
      totalMarks: Number(totalMarks),
      stats: evaluationStats,
      results,
      createdAt: new Date().toISOString(),
    };

    saveExamSubmission(examRecord);
    setSavedExamRecord(examRecord);
    setIsSaved(true);
  };

  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="ee-container">
      {/* ── TOP NAV BAR ── */}
      <div className="ee-top-nav">
        <button
          type="button"
          className="ee-back-btn"
          onClick={onBack}
          aria-label="Back to Academics"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Academics</span>
        </button>

        <button
          type="button"
          className="ee-grade-rules-toggle"
          onClick={() => setShowConfigRules(!showConfigRules)}
          aria-expanded={showConfigRules}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Grade Conversion Scale</span>
        </button>
      </div>

      {/* ── HERO BANNER ── */}
      <header className="ee-hero-header">
        <div className="ee-hero-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M8 17l2-5 2 5" strokeWidth="2" />
            <line x1="9" y1="15" x2="11" y2="15" strokeWidth="2" />
            <path d="M14 13h2" strokeWidth="2" />
            <line x1="15" y1="12" x2="15" y2="14" strokeWidth="2" />
          </svg>
        </div>
        <div className="ee-hero-text">
          <h1 className="ee-hero-title">Exam Evaluation &amp; Grading</h1>
          <p className="ee-hero-subtitle">
            Enter student marks and calculate grades automatically.
          </p>
        </div>
      </header>

      {/* ── GRADE CONVERSION SYSTEM CONFIGURATION COLLAPSIBLE ── */}
      {showConfigRules && (
        <section className="ee-config-scale-card" aria-label="Grade Conversion Scale">
          <div className="ee-scale-header">
            <span className="ee-scale-title">Admin Defined Grade Conversion Rules</span>
            <span className="ee-scale-note">(Standard Percentage Scale)</span>
          </div>
          <div className="ee-scale-pills">
            {GRADE_RULES.map((rule) => (
              <div
                key={rule.grade}
                className="ee-scale-pill"
                style={{ backgroundColor: rule.bg, borderColor: rule.color }}
              >
                <span className="ee-scale-badge" style={{ backgroundColor: rule.color }}>
                  {rule.grade}
                </span>
                <span className="ee-scale-label" style={{ color: rule.color }}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXAM SETUP INPUTS (BATCH, SUBJECT, EXAM DATE, TOTAL EXAM MARKS) ── */}
      <section className="ee-setup-card" aria-label="Exam Parameters">
        <div className="ee-setup-header">
          <div className="ee-step-badge">Step 1</div>
          <h2 className="ee-setup-heading">Exam Setup &amp; Configuration</h2>
        </div>

        <div className="ee-setup-grid">
          {/* 1. Select Batch */}
          <div className="ee-input-group">
            <label htmlFor="ee-batch-select" className="ee-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span>Batch</span>
            </label>
            <div className="ee-select-wrap">
              <select
                id="ee-batch-select"
                className="ee-select"
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
              >
                <option value="" disabled>— Select Batch —</option>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="ee-caret" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </div>

          {/* 2. Select Subject */}
          <div className="ee-input-group">
            <label htmlFor="ee-subject-select" className="ee-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Subject</span>
            </label>
            <div className="ee-select-wrap">
              <select
                id="ee-subject-select"
                className="ee-select"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setIsSaved(false);
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
              <div className="ee-caret" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </div>

          {/* 3. Exam Title / Type */}
          <div className="ee-input-group">
            <label htmlFor="ee-title-input" className="ee-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Exam Title</span>
            </label>
            <input
              id="ee-title-input"
              type="text"
              className="ee-text-input"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Type Here..."
            />
          </div>

          {/* 4. Exam Date */}
          <div className="ee-input-group">
            <label htmlFor="ee-date-input" className="ee-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Exam Date</span>
            </label>
            <input
              id="ee-date-input"
              type="date"
              className="ee-date-input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          {/* 5. Total Exam Marks */}
          <div className="ee-input-group">
            <label htmlFor="ee-total-marks" className="ee-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Total Exam Marks</span>
            </label>
            <div className="ee-total-input-wrap">
              <input
                id="ee-total-marks"
                type="number"
                min="1"
                max="1000"
                className="ee-number-input"
                placeholder="Enter Marks"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
              <span className="ee-marks-unit">Marks</span>
            </div>
          </div>
        </div>
      </section>

      {!readyToShow ? (
        <div className="ee-select-prompt">
          <div className="ee-prompt-icon" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 17l2-5 2 5" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="ee-prompt-title">Select Batch &amp; Subject</h3>
          <p className="ee-prompt-desc">
            Please select a Batch and Subject in Step 1 above to display the student roster and enter marks.
          </p>
        </div>
      ) : (
        <>
          {/* ── LIVE PERFORMANCE ANALYTICS / SUMMARY ── */}
          <section className="ee-stats-bar" aria-label="Live Class Statistics">
            <div className="ee-stat-card">
              <span className="ee-stat-title">Evaluated</span>
              <span className="ee-stat-number green">{evaluationStats.totalEvaluated} / {evaluationStats.totalCount}</span>
            </div>

            <div className="ee-stat-card">
              <span className="ee-stat-title">Absent (✕)</span>
              <span className="ee-stat-number red">{evaluationStats.totalAbsent}</span>
            </div>

            <div className="ee-stat-card">
              <span className="ee-stat-title">Class Average</span>
              <span className="ee-stat-number blue">
                {evaluationStats.avgMarks} <small>/ {totalMarks} ({evaluationStats.avgPct}%)</small>
              </span>
            </div>

            <div className="ee-stat-card">
              <span className="ee-stat-title">Highest Score</span>
              <span className="ee-stat-number purple">
                {evaluationStats.highestMarks} <small>/ {totalMarks}</small>
              </span>
            </div>

            <button
              type="button"
              className="ee-autofill-btn"
              onClick={handlePrefillSampleMarks}
              title="Fills demo marks for fast verification"
            >
              <span>⚡ Auto-fill Sample Data</span>
            </button>
          </section>

          {/* ── SUCCESS NOTIFICATION CARD IF SAVED ── */}
          {isSaved && savedExamRecord && (
            <div className="ee-saved-card">
              <div className="ee-saved-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="ee-saved-content">
                <h3 className="ee-saved-title">Exam Performance Successfully Saved!</h3>
                <p className="ee-saved-desc">
                  Scores and overall calculated grades have been saved as Academic Performance Records for <strong>{savedExamRecord.batch}</strong>.
                </p>
                <div className="ee-saved-actions">
                  {onNavigateToStudentInfo && (
                    <button
                      type="button"
                      className="ee-btn-primary"
                      onClick={onNavigateToStudentInfo}
                    >
                      View in Student Info →
                    </button>
                  )}
                  <button
                    type="button"
                    className="ee-btn-secondary"
                    onClick={() => setIsSaved(false)}
                  >
                    Continue Editing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: STUDENT MARKS ENTRY LIST ── */}
          <section className="ee-roster-section" aria-label="Student Marks Evaluation Roster">
            <div className="ee-roster-header">
              <div className="ee-roster-title-group">
                <div className="ee-step-badge">Step 2</div>
                <h2 className="ee-roster-heading">Student Marks Entry</h2>
                <span className="ee-roster-sub">
                  Enter obtained marks for each student. Total marks ({totalMarks}) is read-only.
                </span>
              </div>

              <div className="ee-search-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ee-search-input"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Student Marks List Table / Cards */}
            <div className="ee-table-container">
              <table className="ee-table">
                <thead>
                  <tr>
                    <th className="th-idx">#</th>
                    <th className="th-student">Student Name &amp; Roll</th>
                    <th className="th-marks">Obtained Marks &amp; Total</th>
                    <th className="th-grade">Auto-Calculated Grade</th>
                    <th className="th-absent">Absent (✕)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const entry = marksMap[student.id] || { obtainedMarks: '', isAbsent: false };
                    const isAbsent = entry.isAbsent;
                    const hasMarks = entry.obtainedMarks !== '' && !isAbsent;
                    const marksVal = hasMarks ? Number(entry.obtainedMarks) : null;
                    const percentage = marksVal !== null && totalMarks > 0 ? Math.round((marksVal / totalMarks) * 100) : null;
                    const grade = percentage !== null ? calculateGrade(percentage) : (isAbsent ? 'AB' : '—');
                    const gradeStyle = percentage !== null ? getGradeBadgeStyle(grade) : null;

                    return (
                      <tr
                        key={student.id}
                        className={`ee-table-row ${isAbsent ? 'row-absent' : ''}`}
                        style={{ animationDelay: `${idx * 25}ms` }}
                      >
                        {/* Index */}
                        <td className="td-idx">
                          <span className="ee-idx-badge">{idx + 1}</span>
                        </td>

                        {/* Student Info */}
                        <td className="td-student">
                          <div className="ee-student-cell">
                            <div className={`ee-avatar ${isAbsent ? 'avatar-absent' : ''}`}>
                              {getInitials(student.name)}
                            </div>
                            <div className="ee-student-info">
                              <span className="ee-name">{student.name}</span>
                              <span className="ee-roll">{student.roll} • {selectedBatch}</span>
                            </div>
                          </div>
                        </td>

                        {/* Obtained Marks Input & Read-only Total Marks */}
                        <td className="td-marks">
                          <div className="ee-marks-input-group">
                            <input
                              type="number"
                              min="0"
                              max={totalMarks}
                              step="1"
                              placeholder="Marks"
                              className={`ee-marks-input ${isAbsent ? 'disabled' : ''}`}
                              value={isAbsent ? '' : entry.obtainedMarks}
                              onChange={(e) => handleMarksChange(student.id, e.target.value)}
                              disabled={isAbsent || isSaved}
                              aria-label={`Obtained marks for ${student.name}`}
                            />

                            {/* Strictly Read-Only Total Marks Display */}
                            <div className="ee-total-readonly-badge" title="Total Exam Marks (Read-Only)">
                              <span className="ee-slash">/</span>
                              <span className="ee-total-val">{totalMarks}</span>
                            </div>
                          </div>
                        </td>

                        {/* Auto-calculated Grade Badge */}
                        <td className="td-grade">
                          {isAbsent ? (
                            <div className="ee-grade-badge absent">
                              <span className="ee-grade-text">✕ AB</span>
                              <span className="ee-grade-sub">(Excluded)</span>
                            </div>
                          ) : percentage !== null ? (
                            <div
                              className="ee-grade-badge calculated"
                              style={{
                                color: gradeStyle.color,
                                backgroundColor: gradeStyle.background,
                                borderColor: gradeStyle.borderColor,
                              }}
                            >
                              <span className="ee-grade-letter">{grade}</span>
                              <span className="ee-grade-pct">({percentage}%)</span>
                            </div>
                          ) : (
                            <span className="ee-grade-placeholder">—</span>
                          )}
                        </td>

                        {/* Absent (✕) Toggle Button */}
                        <td className="td-absent">
                          <button
                            type="button"
                            className={`ee-absent-toggle-btn ${isAbsent ? 'active-absent' : ''}`}
                            onClick={() => toggleAbsent(student.id)}
                            disabled={isSaved}
                            title={isAbsent ? 'Unmark Absent' : 'Mark Absent (✕)'}
                            aria-pressed={isAbsent}
                          >
                            <span className="ee-absent-icon">✕</span>
                            <span>{isAbsent ? 'Absent' : 'Mark ✕'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="ee-empty-state">
                <p>No students found matching "{searchQuery}"</p>
              </div>
            )}
          </section>

          {/* ── STICKY BOTTOM SUBMIT BAR ── */}
          <footer className="ee-bottom-submit-bar">
            <div className="ee-bottom-info">
              <div className="ee-evaluated-summary">
                <strong>{evaluationStats.totalEvaluated}</strong> Evaluated
                {evaluationStats.totalAbsent > 0 && (
                  <span className="ee-absent-tag">({evaluationStats.totalAbsent} Absent)</span>
                )}
              </div>
              <span className="ee-batch-tag">{selectedBatch} • {selectedSubject}</span>
            </div>

            <button
              type="button"
              className="ee-submit-results-btn"
              onClick={handleInitiateSubmit}
            >
              <span>Submit &amp; Calculate Grades</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </footer>
        </>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div
          className="ee-modal-overlay"
          onClick={() => setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ee-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ee-modal-header">
              <div className="ee-micon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="ee-mheader-text">
                <h3 className="ee-modal-title">Confirm Exam Results Submission</h3>
                <span className="ee-modal-sub">{examTitle} • {selectedBatch}</span>
              </div>
              <button
                type="button"
                className="ee-mclose-btn"
                onClick={() => setShowConfirmModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ee-modal-body">
              <p className="ee-modal-intro">
                Please verify the summary below. Upon confirmation, grades will be saved to each student's Academic Performance Record.
              </p>

              <div className="ee-modal-data-card">
                <div className="ee-mdata-row">
                  <span>Subject:</span>
                  <strong>{selectedSubject}</strong>
                </div>
                <div className="ee-mdata-row">
                  <span>Exam Date:</span>
                  <strong>{examDate}</strong>
                </div>
                <div className="ee-mdata-row">
                  <span>Total Exam Marks:</span>
                  <strong>{totalMarks}</strong>
                </div>
                <div className="ee-mdata-row">
                  <span>Total Students:</span>
                  <strong>{evaluationStats.totalCount}</strong>
                </div>
                <div className="ee-mdata-row highlight">
                  <span>Evaluated Count:</span>
                  <strong className="green">{evaluationStats.totalEvaluated}</strong>
                </div>
                <div className="ee-mdata-row highlight">
                  <span>Absent Count (✕):</span>
                  <strong className="red">{evaluationStats.totalAbsent}</strong>
                </div>
                <div className="ee-mdata-row highlight">
                  <span>Class Average Score:</span>
                  <strong className="blue">{evaluationStats.avgMarks} / {totalMarks} ({evaluationStats.avgPct}%)</strong>
                </div>
              </div>

              {/* Grade distribution chips */}
              <div className="ee-mgrade-chips">
                <span className="ee-chips-label">Grade Breakdown:</span>
                <div className="ee-chips-row">
                  {Object.entries(evaluationStats.gradeDistribution).map(([gr, count]) => (
                    <span key={gr} className="ee-mchip">
                      <strong>{gr}:</strong> {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ee-modal-actions">
              <button
                type="button"
                className="ee-modal-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Review &amp; Edit
              </button>
              <button
                type="button"
                className="ee-modal-btn-confirm"
                onClick={handleConfirmSubmit}
              >
                Confirm &amp; Save Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST MESSAGE ── */}
      {toastMessage && (
        <div className="ee-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default ExamEvaluation;
