import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredDoubts,
  getGroupedPendingDoubts,
  getOfflineDoubts,
  getSolvedDoubts,
  submitDoubtSolution,
  markDoubtAsOffline,
  resolveOfflineDoubt,
} from '../../data/doubtData';
import { BATCHES, BATCH_SUBJECTS_MAP } from '../../data/academicData';
/**
 * Word count helper
 */
const countWords = (str = '') => {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

export default function DoubtCorner({ onBack, initialBatch = null, initialSubject = null }) {
  // 1. Top Configuration States
  const [selectedBatch, setSelectedBatch] = useState(initialBatch || '');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');

  // 2. 3 Side-by-side Tabs: 'pending' (default) | 'offline' | 'solved'
  const [activeTab, setActiveTab] = useState('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Active student being solved in Solver view (null = viewing list)
  const [activeSolvingStudent, setActiveSolvingStudent] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Form states in Solver view
  const [answerText, setAnswerText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Attachment preview modal state
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Quick offline note prompt modal
  const [offlineModalDoubt, setOfflineModalDoubt] = useState(null);
  const [offlineNoteInput, setOfflineNoteInput] = useState('');

  // Quick answer modal for offline doubts
  const [answerOfflineModalDoubt, setAnswerOfflineModalDoubt] = useState(null);
  const [offlineAnswerText, setOfflineAnswerText] = useState('');

  // Force re-render on data update
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Sync with custom event
  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('digitute_doubts_updated', handleSync);
    return () => window.removeEventListener('digitute_doubts_updated', handleSync);
  }, []);

  // Update initial parameters if passed externally
  useEffect(() => {
    if (initialBatch) setSelectedBatch(initialBatch);
    if (initialSubject) setSelectedSubject(initialSubject);
  }, [initialBatch, initialSubject]);

  // Available subjects for the selected batch
  const availableSubjects = useMemo(() => {
    if (!selectedBatch) return [];
    return BATCH_SUBJECTS_MAP[selectedBatch] || [];
  }, [selectedBatch]);

  // Is batch and subject selection complete?
  const isSelectionComplete = Boolean(selectedBatch && selectedSubject);

  // Read data for the chosen batch and subject
  const groupedPending = useMemo(() => {
    if (!isSelectionComplete) return [];
    return getGroupedPendingDoubts(selectedBatch, selectedSubject);
  }, [selectedBatch, selectedSubject, isSelectionComplete, refreshKey]);

  const offlineDoubts = useMemo(() => {
    if (!isSelectionComplete) return [];
    return getOfflineDoubts(selectedBatch, selectedSubject);
  }, [selectedBatch, selectedSubject, isSelectionComplete, refreshKey]);

  const solvedDoubts = useMemo(() => {
    if (!isSelectionComplete) return [];
    return getSolvedDoubts(selectedBatch, selectedSubject);
  }, [selectedBatch, selectedSubject, isSelectionComplete, refreshKey]);

  // Total pending questions count
  const totalPendingCount = useMemo(() => {
    return groupedPending.reduce((acc, g) => acc + g.questions.length, 0);
  }, [groupedPending]);

  // Search filtering for Pending Groups
  const filteredPendingGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedPending;
    const q = searchQuery.toLowerCase();
    return groupedPending.filter((g) => {
      const matchName = g.studentName.toLowerCase().includes(q);
      const matchQuestion = g.questions.some(
        (qst) =>
          qst.questionTitle.toLowerCase().includes(q) ||
          qst.questionText.toLowerCase().includes(q)
      );
      return matchName || matchQuestion;
    });
  }, [groupedPending, searchQuery]);

  // Search filtering for Offline Doubts
  const filteredOfflineDoubts = useMemo(() => {
    if (!searchQuery.trim()) return offlineDoubts;
    const q = searchQuery.toLowerCase();
    return offlineDoubts.filter((d) => {
      return (
        d.studentName.toLowerCase().includes(q) ||
        d.questionTitle.toLowerCase().includes(q) ||
        d.questionText.toLowerCase().includes(q)
      );
    });
  }, [offlineDoubts, searchQuery]);

  // Search filtering for Solved Doubts
  const filteredSolvedDoubts = useMemo(() => {
    if (!searchQuery.trim()) return solvedDoubts;
    const q = searchQuery.toLowerCase();
    return solvedDoubts.filter((d) => {
      return (
        d.studentName.toLowerCase().includes(q) ||
        d.questionTitle.toLowerCase().includes(q) ||
        d.questionText.toLowerCase().includes(q) ||
        (d.teacherAnswer && d.teacherAnswer.toLowerCase().includes(q))
      );
    });
  }, [solvedDoubts, searchQuery]);

  // Active student's questions during solving
  const activeStudentQuestions = useMemo(() => {
    if (!activeSolvingStudent) return [];
    const group = groupedPending.find((g) => g.studentId === activeSolvingStudent.studentId);
    return group ? group.questions : [];
  }, [activeSolvingStudent, groupedPending]);

  const currentQuestion = activeStudentQuestions[currentQuestionIndex] || null;
  const wordCount = countWords(answerText);

  // Handle entering solver view for a student
  const handleOpenStudentDetails = (group) => {
    setActiveSolvingStudent(group);
    setCurrentQuestionIndex(0);
    setAnswerText('');
    setAttachedFile(null);
    setAttachedFilePreview(null);
    setFormError('');
  };

  // Close solver view and return to pending list
  const handleCloseSolver = () => {
    setActiveSolvingStudent(null);
    setCurrentQuestionIndex(0);
    setAnswerText('');
    setAttachedFile(null);
    setAttachedFilePreview(null);
    setFormError('');
  };

  // Handle teacher file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('File size must be under 8MB');
        return;
      }
      setAttachedFile(file);
      const isImg = file.type.startsWith('image/');
      setAttachedFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        isImg,
        url: isImg ? URL.createObjectURL(file) : null
      });
      setFormError('');
    }
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
  };

  // Action: Submit Answer for current question
  const handleSubmitAnswer = () => {
    if (!answerText.trim()) {
      setFormError('Please enter your answer explanation before submitting.');
      return;
    }
    if (wordCount > 200) {
      setFormError('Answer cannot exceed 200 words. Please shorten your answer.');
      return;
    }

    if (!currentQuestion) return;

    submitDoubtSolution(currentQuestion.id, {
      answer: answerText.trim(),
      attachment: attachedFilePreview
        ? {
            name: attachedFilePreview.name,
            size: attachedFilePreview.size,
            url: attachedFilePreview.url || null
          }
        : null
    });

    showToast('Answer submitted and doubt marked as solved!');

    setAnswerText('');
    setAttachedFile(null);
    setAttachedFilePreview(null);
    setFormError('');

    // If more questions exist for this student, advance
    if (currentQuestionIndex < activeStudentQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setTimeout(() => {
        handleCloseSolver();
      }, 1200);
    }
  };

  // Action: Mark current question as Offline
  const handleMarkAsOffline = () => {
    if (!currentQuestion) return;
    markDoubtAsOffline(currentQuestion.id, 'Marked for discussion in classroom session.');
    showToast('Moved to Offline Mark Doubt section.');

    setAnswerText('');
    setAttachedFile(null);
    setAttachedFilePreview(null);
    setFormError('');

    if (currentQuestionIndex < activeStudentQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setTimeout(() => {
        handleCloseSolver();
      }, 800);
    }
  };

  // Action: Offline modal submit
  const handleConfirmOfflineModal = () => {
    if (offlineModalDoubt) {
      markDoubtAsOffline(offlineModalDoubt.id, offlineNoteInput || 'Marked for discussion in next lecture.');
      showToast('Moved to Offline Mark Doubt section.');
      setOfflineModalDoubt(null);
      setOfflineNoteInput('');
    }
  };

  // Action: Submit online solution for an offline doubt
  const handleConfirmAnswerOfflineModal = () => {
    if (answerOfflineModalDoubt && offlineAnswerText.trim()) {
      submitDoubtSolution(answerOfflineModalDoubt.id, {
        answer: offlineAnswerText.trim()
      });
      showToast('Offline doubt solved and answered online!');
      setAnswerOfflineModalDoubt(null);
      setOfflineAnswerText('');
    }
  };

  return (
    <div className="dc-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dc-toast" role="alert">
          {toastMessage}
        </div>
      )}

      {/* --- TOP HEADER / METRICS --- */}
      <header className="dc-header">
        {isSelectionComplete && (
          <div className="dc-header-chips" style={{ marginBottom: '12px' }}>
            <span className="dc-metric-chip pending">
              <span className="dc-dot red" />
              {totalPendingCount} Pending
            </span>
            <span className="dc-metric-chip offline">
              <span className="dc-dot amber" />
              {offlineDoubts.length} Offline Mark
            </span>
            <span className="dc-metric-chip solved">
              <span className="dc-dot green" />
              {solvedDoubts.length} Solved
            </span>
          </div>
        )}

        {/* STEP 1: BATCH & SUBJECT SELECTION BAR */}
        <div className="dc-selector-card" aria-label="Select Batch and Subject">
          <div className="dc-selector-grid">
            {/* Batch Select */}
            <div className="dc-input-group">
              <label htmlFor="dc-batch-select" className="dc-selector-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                <span>Select Batch</span>
              </label>
              <div className="dc-select-wrap">
                <select
                  id="dc-batch-select"
                  className="dc-select-control"
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setSelectedSubject('');
                    setActiveSolvingStudent(null);
                  }}
                >
                  <option value="">-- Select Batch --</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="dc-select-caret" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Subject Select */}
            <div className="dc-input-group">
              <label htmlFor="dc-subject-select" className="dc-selector-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Select Subject</span>
              </label>
              <div className="dc-select-wrap">
                <select
                  id="dc-subject-select"
                  className="dc-select-control"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setActiveSolvingStudent(null);
                  }}
                  disabled={!selectedBatch}
                >
                  <option value="">
                    {selectedBatch ? '-- Select Subject --' : '-- Select Batch First --'}
                  </option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="dc-select-caret" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Status indicator */}
          <div className="dc-selection-status-strip">
            {isSelectionComplete ? (
              <span className="dc-status-active">
                <span className="dc-pulse-dot" />
                Active: <strong>{selectedBatch}</strong> &bull; <strong>{selectedSubject}</strong>
              </span>
            ) : (
              <span className="dc-status-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Please select both Batch and Subject above to view doubts
              </span>
            )}
          </div>
        </div>

        {/* STEP 2: 3 SIDE-BY-SIDE CAPSULE TABS (Only shown once selection is complete) */}
        {isSelectionComplete && !activeSolvingStudent && (
          <div className="dc-main-capsule-bar" role="tablist" aria-label="Doubt Categories">
            {/* 1. Pending Doubts (Automatic default) */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pending'}
              className={`dc-capsule-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('pending');
                setActiveSolvingStudent(null);
              }}
            >
              <span className="dc-capsule-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="dc-capsule-text">Pending Doubts</span>
              <span className="dc-badge pending-badge">{totalPendingCount}</span>
            </button>

            {/* 2. Offline Mark Doubt */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'offline'}
              className={`dc-capsule-btn ${activeTab === 'offline' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('offline');
                setActiveSolvingStudent(null);
              }}
            >
              <span className="dc-capsule-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 21h18M3 7v14M21 7v14M6 21V11h4v10M14 21V11h4v10M12 3L2 7h20L12 3z"/>
                </svg>
              </span>
              <span className="dc-capsule-text">Offline Mark Doubt</span>
              <span className="dc-badge offline-badge">{offlineDoubts.length}</span>
            </button>

            {/* 3. Solved Doubts */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'solved'}
              className={`dc-capsule-btn ${activeTab === 'solved' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('solved');
                setActiveSolvingStudent(null);
              }}
            >
              <span className="dc-capsule-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <span className="dc-capsule-text">Solved Doubts</span>
              <span className="dc-badge solved-badge">{solvedDoubts.length}</span>
            </button>
          </div>
        )}
      </header>

      {/* --- PROMPT STATE WHEN BATCH/SUBJECT NOT SELECTED --- */}
      {!isSelectionComplete && (
        <section className="dc-prompt-section">
          <div className="dc-empty-prompt-card">
            <div className="dc-prompt-icon-box">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2 className="dc-prompt-title">Select a Batch &amp; Subject to Begin</h2>
            <p className="dc-prompt-desc">
              Choose your course batch and subject from the dropdown above to manage Pending Doubts, Classroom Offline Doubts, and Solved solutions.
            </p>
            <div className="dc-quick-select-pills">
              <button
                type="button"
                className="dc-quick-pill"
                onClick={() => {
                  setSelectedBatch('B.Sc 6th Sem');
                  setSelectedSubject('Computer Network');
                }}
              >
                <span>B.Sc 6th Sem - Computer Network</span>
              </button>
              <button
                type="button"
                className="dc-quick-pill"
                onClick={() => {
                  setSelectedBatch('MCA 2nd Sem');
                  setSelectedSubject('Software Engineering');
                }}
              >
                <span>MCA 2nd Sem - Software Engineering</span>
              </button>
              <button
                type="button"
                className="dc-quick-pill"
                onClick={() => {
                  setSelectedBatch('B.Sc 4th Sem');
                  setSelectedSubject('DBMS');
                }}
              >
                <span>B.Sc 4th Sem - DBMS</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- CONTENT ONCE BATCH AND SUBJECT ARE SELECTED --- */}
      {isSelectionComplete && (
        <main className="dc-content-body">
          {/* SEARCH & FILTER CONTROLS */}
          {!activeSolvingStudent && (
            <div className="dc-filter-strip">
              <div className="dc-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by student name or question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dc-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="dc-clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: PENDING DOUBTS LIST */}
          {activeTab === 'pending' && !activeSolvingStudent && (
            <section className="dc-tab-content">
              {filteredPendingGroups.length === 0 ? (
                <div className="dc-empty-card">
                  <div className="dc-empty-icon-wrap">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3>No Pending Doubts</h3>
                  <p>
                    All doubts for <strong>{selectedBatch}</strong> ({selectedSubject}) have been solved or marked for classroom offline discussion.
                  </p>
                </div>
              ) : (
                <div className="dc-student-grid">
                  {filteredPendingGroups.map((group) => {
                    const count = group.questions.length;
                    return (
                      <article key={group.studentId} className="dc-student-card">
                        <div className="dc-student-card-header">
                          <div className="dc-avatar-box">
                            <span className="dc-avatar-text">{group.avatarInitials}</span>
                          </div>
                          <div className="dc-student-meta">
                            <h3 className="dc-student-name">{group.studentName}</h3>
                            <p className="dc-student-sub">
                              {group.batch} &bull; {group.subject}
                            </p>
                          </div>
                          <div className="dc-count-badge" title="Number of pending questions">
                            <span className="dc-badge-num">{count}</span>
                            <span className="dc-badge-label">{count === 1 ? 'Doubt' : 'Doubts'}</span>
                          </div>
                        </div>

                        <div className="dc-student-card-body">
                          <div className="dc-doubts-preview">
                            <span className="dc-preview-label">Asked about {count} {count === 1 ? 'doubt' : 'doubts'}:</span>
                            <ul className="dc-preview-list">
                              {group.questions.map((q, idx) => (
                                <li key={q.id} className="dc-preview-item">
                                  <span className="dc-preview-index">Q{idx + 1}:</span>
                                  <span className="dc-preview-text">{q.questionTitle}</span>
                                  {q.attachment && (
                                    <span className="dc-has-att-tag" title="Includes student attachment">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                      </svg>
                                      Doc
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="dc-student-card-footer">
                          <button
                            type="button"
                            className="dc-solve-btn"
                            onClick={() => handleOpenStudentDetails(group)}
                            aria-label={`View details and solve ${count} doubts for ${group.studentName}`}
                          >
                            <span>View Details &amp; Solve ({count})</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SEQUENTIAL SOLVER VIEW */}
          {activeTab === 'pending' && activeSolvingStudent && (
            <section className="dc-solver-flow" aria-label="Doubt Solving Interface">
              {/* Solver Header */}
              <div className="dc-solver-header-bar">
                <button
                  type="button"
                  className="dc-back-to-list-btn"
                  onClick={handleCloseSolver}
                  aria-label="Back to student list"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Student Doubts</span>
                </button>

                <div className="dc-solver-student-chip">
                  <div className="dc-chip-avatar">{activeSolvingStudent.avatarInitials}</div>
                  <div className="dc-chip-info">
                    <span className="dc-chip-name">{activeSolvingStudent.studentName}</span>
                    <span className="dc-chip-sub">
                      Roll: {activeSolvingStudent.rollNumber} &bull; {activeSolvingStudent.batch}
                    </span>
                  </div>
                </div>

                <div className="dc-progress-tracker">
                  <span className="dc-progress-text">
                    Question <strong>{currentQuestionIndex + 1}</strong> of <strong>{activeStudentQuestions.length}</strong>
                  </span>
                  <div className="dc-progress-dots">
                    {activeStudentQuestions.map((_, i) => (
                      <span
                        key={i}
                        className={`dc-pdot ${i === currentQuestionIndex ? 'active' : ''} ${i < currentQuestionIndex ? 'done' : ''}`}
                        title={`Question ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Question or Completed State */}
              {!currentQuestion ? (
                <div className="dc-completion-card">
                  <div className="dc-complete-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2>All Doubts Addressed!</h2>
                  <p>
                    You have reviewed and answered all questions for <strong>{activeSolvingStudent.studentName}</strong>.
                  </p>
                  <button type="button" className="dc-primary-btn" onClick={handleCloseSolver}>
                    <span>&larr; Return to Pending Doubts</span>
                  </button>
                </div>
              ) : (
                <div className="dc-active-question-card">
                  {/* Question Info */}
                  <div className="dc-question-meta-strip">
                    <div className="dc-q-badge">Question #{currentQuestionIndex + 1}</div>
                    <div className="dc-q-date">{currentQuestion.createdAt}</div>
                  </div>

                  <h2 className="dc-active-qtitle">{currentQuestion.questionTitle}</h2>
                  <p className="dc-active-qtext">{currentQuestion.questionText}</p>

                  {/* Student Attachment Preview */}
                  {currentQuestion.attachment && (
                    <div className="dc-att-preview-card">
                      <div className="dc-att-label-row">
                        <span className="dc-att-label">Student Attached Reference:</span>
                        <span className="dc-att-type">{currentQuestion.attachment.type.toUpperCase()}</span>
                      </div>

                      <div
                        className="dc-att-clickable"
                        onClick={() => setPreviewAttachment(currentQuestion.attachment)}
                        role="button"
                        tabIndex={0}
                        title="Click to expand file preview"
                      >
                        {currentQuestion.attachment.type === 'image' && (
                          <div className="dc-att-thumb-wrap">
                            <img
                              src={currentQuestion.attachment.url}
                              alt="Student attachment preview"
                              className="dc-att-thumb-img"
                            />
                            <div className="dc-att-zoom-overlay">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                              </svg>
                              <span>Click to Expand</span>
                            </div>
                          </div>
                        )}

                        <div className="dc-att-info-box">
                          <span className="dc-att-name">{currentQuestion.attachment.name}</span>
                          <span className="dc-att-size">{currentQuestion.attachment.size}</span>
                          <span className="dc-att-action-tag">Click to View</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WRITE ANSWER BOX (200 words limit) */}
                  <div className="dc-answer-section">
                    <div className="dc-answer-header">
                      <label htmlFor="dc-answer-box" className="dc-answer-label">
                        Write Answer / Solution Explanation:
                      </label>
                      <div className={`dc-word-counter ${wordCount > 200 ? 'over-limit' : ''} ${wordCount >= 180 && wordCount <= 200 ? 'near-limit' : ''}`}>
                        <span className="dc-counter-val">{wordCount}</span> / 200 words
                      </div>
                    </div>

                    <textarea
                      id="dc-answer-box"
                      className={`dc-answer-textarea ${wordCount > 200 ? 'has-error' : ''}`}
                      rows={6}
                      placeholder="Write your explanation here (max 200 words). Be clear and concise so the student understands easily..."
                      value={answerText}
                      onChange={(e) => {
                        setAnswerText(e.target.value);
                        if (formError) setFormError('');
                      }}
                    />

                    {wordCount > 200 && (
                      <p className="dc-form-error">
                        You have exceeded the 200-word limit. Please shorten your answer by {wordCount - 200} words.
                      </p>
                    )}

                    {formError && <p className="dc-form-error">{formError}</p>}
                  </div>

                  {/* TEACHER ATTACHMENT SECTION (Upload diagram/document) */}
                  <div className="dc-upload-section">
                    <label className="dc-upload-label">
                      Attach Diagram / Solution Document (Optional):
                    </label>

                    {!attachedFilePreview ? (
                      <div className="dc-dropzone">
                        <input
                          type="file"
                          id="teacher-file-input"
                          className="dc-file-hidden-input"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="teacher-file-input" className="dc-dropzone-label">
                          <span className="dc-up-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                          </span>
                          <span className="dc-up-main">Upload Diagram or Solution PDF/Doc</span>
                          <span className="dc-up-hint">PNG, JPG, PDF up to 8MB</span>
                        </label>
                      </div>
                    ) : (
                      <div className="dc-attached-chip">
                        <div className="dc-attached-details">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span className="dc-file-name">{attachedFilePreview.name}</span>
                          <span className="dc-file-size">({attachedFilePreview.size})</span>
                        </div>
                        <button
                          type="button"
                          className="dc-remove-file-btn"
                          onClick={handleRemoveAttachedFile}
                          title="Remove file"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS: MARK AS OFFLINE & SUBMIT */}
                  <div className="dc-action-bar">
                    <button
                      type="button"
                      className="dc-offline-btn"
                      onClick={handleMarkAsOffline}
                      title="Move this question to classroom discussion"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M3 7v14M21 7v14M6 21V11h4v10M14 21V11h4v10M12 3L2 7h20L12 3z"/>
                      </svg>
                      <span>Mark as Offline</span>
                    </button>

                    <button
                      type="button"
                      className="dc-submit-btn"
                      onClick={handleSubmitAnswer}
                      disabled={wordCount > 200 || !answerText.trim()}
                    >
                      <span>Submit Answer &amp; Proceed</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: OFFLINE MARK DOUBTS */}
          {activeTab === 'offline' && !activeSolvingStudent && (
            <section className="dc-tab-content" aria-label="Offline Marked Doubts">
              {filteredOfflineDoubts.length === 0 ? (
                <div className="dc-empty-card">
                  <div className="dc-empty-icon-wrap amber">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v14M21 7v14M6 21V11h4v10M14 21V11h4v10M12 3L2 7h20L12 3z"/>
                    </svg>
                  </div>
                  <h3>No Offline Doubts</h3>
                  <p>
                    There are no doubts marked for classroom discussion in <strong>{selectedBatch}</strong> &bull; {selectedSubject}.
                  </p>
                </div>
              ) : (
                <div className="dc-offline-grid">
                  {filteredOfflineDoubts.map((d) => (
                    <article key={d.id} className="dc-offline-card">
                      <div className="dc-offline-header">
                        <span className="dc-offline-badge">Classroom Discussion</span>
                        <span className="dc-offline-date">{d.offlineMarkedAt || d.createdAt}</span>
                      </div>

                      <div className="dc-offline-student-info">
                        <div className="dc-offline-avatar">{d.studentName ? d.studentName[0] : 'S'}</div>
                        <div>
                          <h4 className="dc-offline-sname">{d.studentName}</h4>
                          <p className="dc-offline-sroll">Roll: {d.rollNumber} &bull; {d.batch}</p>
                        </div>
                      </div>

                      <h3 className="dc-offline-qtitle">{d.questionTitle}</h3>
                      <p className="dc-offline-qtext">{d.questionText}</p>

                      {d.attachment && (
                        <div
                          className="dc-offline-att-pill"
                          onClick={() => setPreviewAttachment(d.attachment)}
                          role="button"
                          tabIndex={0}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          <span>{d.attachment.name}</span>
                          <span className="dc-att-action-tag">View</span>
                        </div>
                      )}

                      <div className="dc-offline-footer">
                        <button
                          type="button"
                          className="dc-resolve-offline-btn"
                          onClick={() => {
                            resolveOfflineDoubt(d.id, 'Resolved in classroom lecture.');
                            showToast('Marked as resolved in classroom!');
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Mark Resolved in Class</span>
                        </button>

                        <button
                          type="button"
                          className="dc-answer-instead-btn"
                          onClick={() => {
                            setAnswerOfflineModalDoubt(d);
                            setOfflineAnswerText('');
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                          </svg>
                          <span>Answer Online</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 3: SOLVED DOUBTS */}
          {activeTab === 'solved' && !activeSolvingStudent && (
            <section className="dc-tab-content" aria-label="Solved Doubts">
              {filteredSolvedDoubts.length === 0 ? (
                <div className="dc-empty-card">
                  <div className="dc-empty-icon-wrap green">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3>No Solved Records</h3>
                  <p>
                    No resolved doubts yet for <strong>{selectedBatch}</strong> &bull; {selectedSubject}.
                  </p>
                </div>
              ) : (
                <div className="dc-solved-grid">
                  {filteredSolvedDoubts.map((d) => (
                    <article key={d.id} className="dc-solved-card">
                      <div className="dc-solved-header">
                        <div className="dc-solved-student-info">
                          <div className="dc-solved-avatar">{d.studentName ? d.studentName[0] : 'S'}</div>
                          <div>
                            <h4 className="dc-solved-sname">{d.studentName}</h4>
                            <p className="dc-solved-sroll">Roll: {d.rollNumber} &bull; {d.batch}</p>
                          </div>
                        </div>
                        <div className="dc-solved-meta-right">
                          {d.resolutionType === 'online' ? (
                            <span className="dc-resolution-badge online">Solved Online</span>
                          ) : (
                            <span className="dc-resolution-badge offline">Resolved in Class</span>
                          )}
                          <span className="dc-solved-date">{d.solvedAt || d.createdAt}</span>
                        </div>
                      </div>

                      <div className="dc-solved-qbox">
                        <h4 className="dc-solved-qtitle">{d.questionTitle}</h4>
                        <p className="dc-solved-qtext">{d.questionText}</p>
                      </div>

                      {d.attachment && (
                        <div
                          className="dc-solved-att-pill"
                          onClick={() => setPreviewAttachment(d.attachment)}
                          role="button"
                          tabIndex={0}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          <span>Student Doc: {d.attachment.name}</span>
                          <span className="dc-att-action-tag">View</span>
                        </div>
                      )}

                      <div className="dc-solved-answer-box">
                        <div className="dc-solved-answer-label">Teacher's Explanation:</div>
                        <p className="dc-solved-answer-text">
                          {d.teacherAnswer || d.offlineNote || 'Explained and cleared in live session.'}
                        </p>
                      </div>

                      {d.teacherAttachment && (
                        <div
                          className="dc-solved-att-pill teacher"
                          onClick={() => setPreviewAttachment(d.teacherAttachment)}
                          role="button"
                          tabIndex={0}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span>Teacher File: {d.teacherAttachment.name}</span>
                          <span className="dc-att-action-tag">View</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* --- ATTACHMENT PREVIEW MODAL --- */}
      {previewAttachment && (
        <div className="dc-modal-overlay" onClick={() => setPreviewAttachment(null)}>
          <div className="dc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dc-modal-header">
              <div className="dc-modal-file-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <span>{previewAttachment.name} ({previewAttachment.size})</span>
              </div>
              <button
                type="button"
                className="dc-modal-close-btn"
                onClick={() => setPreviewAttachment(null)}
                aria-label="Close Preview"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="dc-modal-body">
              {previewAttachment.url && (previewAttachment.type === 'image' || previewAttachment.isImg) ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="dc-modal-full-img"
                />
              ) : (
                <div className="dc-modal-doc-placeholder">
                  <div className="dc-doc-icon-box">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h4>{previewAttachment.name}</h4>
                  <p>Document preview loaded. Ready for faculty review.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK ANSWER OFFLINE MODAL --- */}
      {answerOfflineModalDoubt && (
        <div className="dc-modal-overlay" onClick={() => setAnswerOfflineModalDoubt(null)}>
          <div className="dc-modal-card sm" onClick={(e) => e.stopPropagation()}>
            <div className="dc-modal-header">
              <h3>Answer Offline Doubt Online</h3>
              <button
                type="button"
                className="dc-modal-close-btn"
                onClick={() => setAnswerOfflineModalDoubt(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="dc-modal-body">
              <p className="dc-modal-qinfo">
                <strong>{answerOfflineModalDoubt.studentName}</strong>: {answerOfflineModalDoubt.questionTitle}
              </p>
              <textarea
                className="dc-answer-textarea"
                rows={4}
                placeholder="Write your explanation (max 200 words)..."
                value={offlineAnswerText}
                onChange={(e) => setOfflineAnswerText(e.target.value)}
              />
            </div>
            <div className="dc-modal-footer">
              <button
                type="button"
                className="dc-cancel-btn"
                onClick={() => setAnswerOfflineModalDoubt(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dc-primary-btn"
                onClick={handleConfirmAnswerOfflineModal}
                disabled={!offlineAnswerText.trim() || countWords(offlineAnswerText) > 200}
              >
                Submit Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
