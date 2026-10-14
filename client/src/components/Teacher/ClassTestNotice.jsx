import React, { useState, useEffect, useMemo } from 'react';
import { BATCHES, BATCH_SUBJECTS_MAP } from '../../data/academicData';
const countWords = (str = '') => {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const DEFAULT_SCHEDULED_TESTS = [
  {
    id: 'ct-1',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '2026-10-24',
    chapters: ['Chapter 1: OSI & TCP/IP Model', 'Chapter 2: Data Link Layer & Framing', 'Chapter 3: Sliding Window Protocols'],
    remarks: 'Total Marks: 25. Duration: 45 Minutes. Objective MCQs and 2 descriptive protocol questions. Bring non-programmable scientific calculator.',
    createdAt: '14 Oct 2026'
  },
  {
    id: 'ct-2',
    batch: 'MCA 2nd Sem',
    subject: 'Software Engineering',
    date: '2026-10-28',
    chapters: ['Agile Scrum Framework', 'Sprint Planning & User Stories', 'Software Testing & CI/CD Pipelines'],
    remarks: 'Total Marks: 30. Duration: 60 Minutes. Case study based assessment on modern agile workflows.',
    createdAt: '13 Oct 2026'
  }
];

export default function ClassTestNotice({ onBack }) {
  // 1. Top Selections
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examDate, setExamDate] = useState('');

  // 2. Add Chapters States
  const [chapters, setChapters] = useState([]);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [chapterInput, setChapterInput] = useState('');
  const [isChaptersSaved, setIsChaptersSaved] = useState(false);

  // 3. Remarks (Max 200 words)
  const [remarks, setRemarks] = useState('');

  // Form error and Toast
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Scheduled history
  const [scheduledTests, setScheduledTests] = useState(() => {
    try {
      const saved = localStorage.getItem('digitute_scheduled_tests');
      return saved ? JSON.parse(saved) : DEFAULT_SCHEDULED_TESTS;
    } catch {
      return DEFAULT_SCHEDULED_TESTS;
    }
  });

  // Available subjects for the chosen batch
  const availableSubjects = useMemo(() => {
    if (!selectedBatch) return [];
    return BATCH_SUBJECTS_MAP[selectedBatch] || [];
  }, [selectedBatch]);

  // Are all 3 selections made?
  const isSetupComplete = Boolean(selectedBatch && selectedSubject && examDate);

  const wordCount = countWords(remarks);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('digitute_scheduled_tests', JSON.stringify(scheduledTests));
    } catch {
      // ignore
    }
  }, [scheduledTests]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Add chapter to list
  const handleConfirmAddChapter = () => {
    const trimmed = chapterInput.trim();
    if (!trimmed) return;
    setChapters((prev) => [...prev, trimmed]);
    setChapterInput('');
    setIsAddingChapter(false);
    setIsChaptersSaved(false);
    setFormError('');
  };

  // Remove chapter
  const handleRemoveChapter = (index) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
    setIsChaptersSaved(false);
  };

  // Save chapters button
  const handleSaveChapters = () => {
    if (chapters.length === 0) {
      setFormError('Please add at least one chapter before saving.');
      return;
    }
    setIsChaptersSaved(true);
    setFormError('');
    showToast(`Saved ${chapters.length} syllabus chapters!`);
  };

  // Send Notification
  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!isSetupComplete) {
      setFormError('Please select Batch, Subject, and choose an Exam Date first.');
      return;
    }
    if (chapters.length === 0) {
      setFormError('Please add at least one chapter syllabus for this class test.');
      return;
    }
    if (!remarks.trim()) {
      setFormError('Please provide remarks or exam instructions for the students.');
      return;
    }
    if (wordCount > 200) {
      setFormError('Remarks cannot exceed 200 words. Please shorten your instructions.');
      return;
    }

    const newTest = {
      id: 'ct-' + Date.now(),
      batch: selectedBatch,
      subject: selectedSubject,
      date: examDate,
      chapters: [...chapters],
      remarks: remarks.trim(),
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setScheduledTests([newTest, ...scheduledTests]);
    window.dispatchEvent(new CustomEvent('digitute_class_test_scheduled', { detail: newTest }));

    // Reset details
    setChapters([]);
    setChapterInput('');
    setIsAddingChapter(false);
    setIsChaptersSaved(false);
    setRemarks('');
    setFormError('');

    showToast(`Upcoming Class Test notification broadcasted to ${selectedBatch} (${selectedSubject})!`);
  };

  // Delete scheduled test
  const handleDeleteScheduled = (id) => {
    setScheduledTests(prev => prev.filter(t => t.id !== id));
    showToast('Scheduled test notice cancelled.');
  };

  // Today min date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="ct-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ct-toast" role="alert">
          {toastMessage}
        </div>
      )}

      {/* --- TOP HEADER & BACK NAVIGATION --- */}
      <header className="ct-header">
        <div className="ct-top-actions">
          <button type="button" className="ct-back-btn" onClick={onBack} aria-label="Back to Academics">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Academics</span>
          </button>

          <div className="ct-header-stats">
            <span className="ct-stat-chip">
              <span className="ct-dot purple" />
              {scheduledTests.length} Tests Scheduled
            </span>
          </div>
        </div>

        <div className="ct-title-group">
          <div className="ct-hero-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01" strokeWidth="3" />
              <path d="M12 14h.01" strokeWidth="3" />
              <path d="M16 14h.01" strokeWidth="3" />
            </svg>
          </div>
          <div>
            <h1 className="ct-title">Notify Students For Upcoming Class Test</h1>
            <p className="ct-subtitle">
              Schedule exam date, syllabus and instructions for students.
            </p>
          </div>
        </div>

        {/* --- STEP 1: BATCH | SUBJECT | EXAM DATE SELECTOR --- */}
        <div className="ct-setup-card" aria-label="Select Batch, Subject and Date">
          <div className="ct-setup-grid">
            {/* 1. Batch Selection */}
            <div className="ct-field-group">
              <label htmlFor="ct-batch-select" className="ct-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                <span>Select Batch</span>
              </label>
              <div className="ct-select-wrap">
                <select
                  id="ct-batch-select"
                  className="ct-select"
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setSelectedSubject('');
                    setIsChaptersSaved(false);
                  }}
                >
                  <option value="">-- Choose Batch --</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="ct-caret" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Subject Selection */}
            <div className="ct-field-group">
              <label htmlFor="ct-subject-select" className="ct-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Select Subject</span>
              </label>
              <div className="ct-select-wrap">
                <select
                  id="ct-subject-select"
                  className="ct-select"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setIsChaptersSaved(false);
                  }}
                  disabled={!selectedBatch}
                >
                  <option value="">
                    {selectedBatch ? '-- Choose Subject --' : '-- Choose Batch First --'}
                  </option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="ct-caret" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. Date Choose for Exam */}
            <div className="ct-field-group">
              <label htmlFor="ct-date-picker" className="ct-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Date Choose For Exam</span>
              </label>
              <input
                id="ct-date-picker"
                type="date"
                className="ct-date-input"
                min={todayStr}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>

          {/* Status strip */}
          <div className="ct-setup-status-strip">
            {isSetupComplete ? (
              <span className="ct-status-ready">
                <span className="ct-pulse-dot" />
                Target: <strong>{selectedBatch}</strong> &bull; <strong>{selectedSubject}</strong> &bull; Test Date: <strong>{examDate}</strong>
              </span>
            ) : (
              <span className="ct-status-prompt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Select Batch, Subject, and Exam Date above to open details section
              </span>
            )}
          </div>
        </div>
      </header>

      {/* --- STEP 2: DETAILS SECTION (Opens only when all 3 selections are complete) --- */}
      {isSetupComplete ? (
        <section className="ct-details-section" aria-label="Class Test Details Form">
          <div className="ct-details-grid">
            {/* LEFT COLUMN: ADD CHAPTERS */}
            <div className="ct-card ct-chapters-card">
              <div className="ct-card-head">
                <div className="ct-head-title-wrap">
                  <span className="ct-card-num">1</span>
                  <div>
                    <h2 className="ct-card-title">Add Chapters Syllabus</h2>
                    <p className="ct-card-sub">Define topics &amp; chapters for the upcoming test</p>
                  </div>
                </div>

                {isChaptersSaved && (
                  <span className="ct-saved-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved ({chapters.length})
                  </span>
                )}
              </div>

              {/* Chapters List */}
              <div className="ct-chapters-list-box">
                {chapters.length === 0 ? (
                  <div className="ct-chapters-empty">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <p>No chapters added yet. Click the <strong>"+"</strong> button below to add syllabus chapters.</p>
                  </div>
                ) : (
                  <ul className="ct-chapters-items">
                    {chapters.map((ch, idx) => (
                      <li key={idx} className="ct-chapter-item">
                        <span className="ct-chapter-idx">Ch {idx + 1}</span>
                        <span className="ct-chapter-name">{ch}</span>
                        <button
                          type="button"
                          className="ct-del-ch-btn"
                          onClick={() => handleRemoveChapter(idx)}
                          title="Remove chapter"
                          aria-label={`Remove chapter ${ch}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Input Row for adding chapter (revealed on plus click) */}
                {isAddingChapter && (
                  <div className="ct-add-input-row">
                    <input
                      type="text"
                      className="ct-chapter-input"
                      placeholder="Enter chapter name / topic (e.g. Chapter 3: Graphs & Trees)..."
                      value={chapterInput}
                      onChange={(e) => setChapterInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmAddChapter();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ct-tick-btn"
                      onClick={handleConfirmAddChapter}
                      disabled={!chapterInput.trim()}
                      title="Confirm and Add Chapter"
                      aria-label="Confirm Chapter"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="ct-cancel-add-btn"
                      onClick={() => {
                        setIsAddingChapter(false);
                        setChapterInput('');
                      }}
                      title="Cancel"
                      aria-label="Cancel adding chapter"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Add & Save Action Bar */}
              <div className="ct-chapter-actions-bar">
                {!isAddingChapter && (
                  <button
                    type="button"
                    className="ct-plus-btn"
                    onClick={() => {
                      setIsAddingChapter(true);
                      setChapterInput('');
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Chapter</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`ct-save-chapters-btn ${isChaptersSaved ? 'saved' : ''}`}
                  onClick={handleSaveChapters}
                  disabled={chapters.length === 0}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isChaptersSaved ? 'Chapters Saved' : 'Save Chapters'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: REMARKS BOX (200 Words) */}
            <div className="ct-card ct-remarks-card">
              <div className="ct-card-head">
                <div className="ct-head-title-wrap">
                  <span className="ct-card-num">2</span>
                  <div>
                    <h2 className="ct-card-title">Teacher Remarks &amp; Instructions</h2>
                    <p className="ct-card-sub">Test duration, marks distribution &amp; exam hall rules</p>
                  </div>
                </div>

                <div className={`ct-word-counter ${wordCount > 200 ? 'over-limit' : ''} ${wordCount >= 180 && wordCount <= 200 ? 'near-limit' : ''}`}>
                  <strong>{wordCount}</strong> / 200 words
                </div>
              </div>

              <div className="ct-remarks-body">
                <textarea
                  id="ct-remarks-textarea"
                  className={`ct-remarks-textarea ${wordCount > 200 ? 'has-error' : ''}`}
                  rows={8}
                  placeholder="e.g., Total Marks: 25. Time Duration: 45 Minutes. The exam includes 10 MCQs and 2 descriptive design questions. Please bring your practical graph sheets and reach Lab 3 by 10:15 AM sharp..."
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (formError) setFormError('');
                  }}
                />

                {wordCount > 200 && (
                  <p className="ct-err-text">
                    Remarks exceed 200 words! Please trim by {wordCount - 200} words.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {formError && <p className="ct-global-error">{formError}</p>}

          {/* BOTTOM BROADCAST BUTTON */}
          <div className="ct-broadcast-footer">
            <div className="ct-summary-pill">
              <span>Broadcasting to: </span>
              <strong>{selectedBatch}</strong> &bull; <strong>{selectedSubject}</strong> &bull; <span>Exam: {examDate}</span>
            </div>

            <button
              type="button"
              className="ct-send-notification-btn"
              onClick={handleSendNotification}
              disabled={chapters.length === 0 || !remarks.trim() || wordCount > 200}
            >
              <span>Send Notification</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </section>
      ) : (
        /* Empty Guidance State */
        <section className="ct-prompt-state">
          <div className="ct-prompt-card">
            <div className="ct-prompt-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>Please Select Batch, Subject &amp; Exam Date</h3>
            <p>
              Once you choose the course batch, the corresponding subject, and the upcoming test date, the chapters syllabus editor and remarks box will open immediately.
            </p>
          </div>
        </section>
      )}

      {/* --- RECENTLY SCHEDULED CLASS TESTS LIST --- */}
      <section className="ct-history-section">
        <div className="ct-history-header">
          <div>
            <h2 className="ct-history-title">Upcoming Scheduled Class Tests</h2>
            <p className="ct-history-sub">Notified class test schedules visible to students on their DigiTute app</p>
          </div>
        </div>

        {scheduledTests.length === 0 ? (
          <div className="ct-empty-history">
            <p>No upcoming class tests scheduled yet.</p>
          </div>
        ) : (
          <div className="ct-scheduled-grid">
            {scheduledTests.map((t) => (
              <article key={t.id} className="ct-test-card">
                <div className="ct-test-header">
                  <div className="ct-test-badge-row">
                    <span className="ct-batch-tag">{t.batch}</span>
                    <span className="ct-subject-tag">{t.subject}</span>
                  </div>
                  <div className="ct-test-date-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Test Date: <strong>{t.date}</strong></span>
                  </div>
                </div>

                <div className="ct-test-chapters-box">
                  <span className="ct-ch-label">Syllabus Chapters ({t.chapters.length}):</span>
                  <div className="ct-ch-chips">
                    {t.chapters.map((ch, i) => (
                      <span key={i} className="ct-ch-chip">{ch}</span>
                    ))}
                  </div>
                </div>

                <div className="ct-test-remarks-box">
                  <span className="ct-remarks-label">Instructions:</span>
                  <p className="ct-test-remarks-text">{t.remarks}</p>
                </div>

                <div className="ct-test-footer">
                  <span className="ct-notif-sent-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Broadcast Sent ({t.createdAt})
                  </span>
                  <button
                    type="button"
                    className="ct-del-test-btn"
                    onClick={() => handleDeleteScheduled(t.id)}
                    title="Cancel this test schedule"
                  >
                    Cancel Notice
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
