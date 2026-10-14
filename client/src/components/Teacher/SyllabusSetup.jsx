import React, { useState, useEffect, useRef, useMemo } from 'react';
/* ══════════════════════════════════════════════════════════════════════════
   BATCHES & SUBJECTS CONFIGURATION
   ══════════════════════════════════════════════════════════════════════════ */
const BATCHES = [
  'B.Tech CS 3rd Sem',
  'B.Sc 6th Sem',
  'B.Sc 4th Sem',
  'MCA 2nd Sem',
];

const BATCH_SUBJECTS_MAP = {
  'B.Tech CS 3rd Sem': ['Computer Network', 'Data Structures', 'Digital Electronics', 'Discrete Mathematics'],
  'B.Sc 6th Sem':      ['Computer Network', 'Operating Systems', 'Database Systems'],
  'B.Sc 4th Sem':      ['DBMS', 'Data Structures', 'Computer Architecture'],
  'MCA 2nd Sem':       ['Software Engineering', 'Computer Graphics', 'Web Technologies'],
};

const CHAPTER_COUNT_OPTIONS = Array.from({ length: 25 }, (_, i) => i + 1);

// Helper for local storage key
const getStorageKey = (batch, subject) => `digitute_syllabus_v1_${batch}_${subject}`;

export function SyllabusSetup({ onBack }) {
  // Selectors
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [totalChapters, setTotalChapters] = useState('');

  // Chapter list: [{ id, num, title, completed }]
  const [chapters, setChapters] = useState([]);

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const toastTimerRef = useRef(null);
  const editInputRef = useRef(null);

  const availableSubjects = selectedBatch ? (BATCH_SUBJECTS_MAP[selectedBatch] || []) : [];
  const readyForChapters = !!(selectedBatch && selectedSubject);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  // Load saved syllabus when Batch and Subject are both selected
  useEffect(() => {
    if (!readyForChapters) {
      setChapters([]);
      setTotalChapters('');
      setEditingId(null);
      setIsDirty(false);
      setLastSaved(null);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const key = getStorageKey(selectedBatch, selectedSubject);
      const savedRaw = localStorage.getItem(key);

      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
            setChapters(parsed.chapters);
            setTotalChapters(parsed.chapters.length);
            setLastSaved(parsed.lastSaved || null);
            setIsDirty(false);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error parsing stored syllabus:', err);
        }
      }

      // No existing saved syllabus
      setChapters([]);
      setTotalChapters('');
      setLastSaved(null);
      setIsDirty(false);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedBatch, selectedSubject, readyForChapters]);

  // Focus inline edit input
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Batch change
  const handleBatchChange = (newBatch) => {
    setSelectedBatch(newBatch);
    setSelectedSubject('');
    setTotalChapters('');
    setChapters([]);
    setEditingId(null);
    setIsDirty(false);
  };

  // Subject change
  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    setTotalChapters('');
    setChapters([]);
    setEditingId(null);
    setIsDirty(false);
  };

  // Change total chapters from dropdown
  const handleTotalChaptersSelect = (newCountVal) => {
    const newCount = parseInt(newCountVal, 10);
    if (isNaN(newCount) || newCount <= 0) return;

    setTotalChapters(newCount);

    setChapters((prev) => {
      const currentLen = prev.length;
      if (newCount === currentLen) return prev;

      if (newCount > currentLen) {
        // Keep existing ones (preserving custom titles and completion), add new
        const added = [];
        for (let i = currentLen + 1; i <= newCount; i++) {
          added.push({
            id: `ch-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            num: i,
            title: `Chapter ${i}`,
            completed: false,
          });
        }
        return [...prev, ...added];
      } else {
        // Trim to newCount
        return prev.slice(0, newCount).map((c, i) => ({ ...c, num: i + 1 }));
      }
    });

    setIsDirty(true);
    showToast(`Generated ${newCount} chapters for ${selectedSubject}`);
  };

  // Start inline editing
  const handleStartEdit = (ch) => {
    setEditingId(ch.id);
    setEditTitle(ch.title);
  };

  // Save inline edit
  const handleSaveEdit = (chId) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setChapters((prev) =>
      prev.map((c) => (c.id === chId ? { ...c, title: trimmed } : c))
    );
    setEditingId(null);
    setIsDirty(true);
  };

  // Cancel inline edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Toggle chapter completion
  const handleToggleComplete = (chId) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chId ? { ...c, completed: !c.completed } : c))
    );
    setIsDirty(true);
  };

  // Quick Add Chapter
  const handleAddChapter = () => {
    setChapters((prev) => {
      const nextNum = prev.length + 1;
      const newCh = {
        id: `ch-${Date.now()}-${nextNum}`,
        num: nextNum,
        title: `Chapter ${nextNum}`,
        completed: false,
      };
      const updated = [...prev, newCh];
      setTotalChapters(updated.length);
      return updated;
    });
    setIsDirty(true);
    showToast('Added 1 chapter');
  };

  // Delete individual chapter
  const handleDeleteChapter = (chId) => {
    setChapters((prev) => {
      const filtered = prev.filter((c) => c.id !== chId);
      const renumbered = filtered.map((c, idx) => ({ ...c, num: idx + 1 }));
      setTotalChapters(renumbered.length);
      return renumbered;
    });
    setIsDirty(true);
  };

  // Save permanently to localStorage
  const handleSavePermanently = () => {
    if (!selectedBatch || !selectedSubject) {
      showToast('Please select Batch and Subject first');
      return;
    }
    if (chapters.length === 0) {
      showToast('Please select total chapters before saving');
      return;
    }

    const key = getStorageKey(selectedBatch, selectedSubject);
    const nowIso = new Date().toISOString();
    const payload = {
      batch: selectedBatch,
      subject: selectedSubject,
      totalChapters: chapters.length,
      lastSaved: nowIso,
      chapters,
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
      setLastSaved(nowIso);
      setIsDirty(false);
      showToast(`Syllabus saved permanently for ${selectedSubject}!`);
    } catch (e) {
      console.error(e);
      showToast('Error saving to local storage');
    }
  };

  const formattedSavedTime = useMemo(() => {
    if (!lastSaved) return null;
    try {
      const d = new Date(lastSaved);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [lastSaved]);

  return (
    <div className="ss-wrapper">

      {/* ── HEADER BAR ── */}
      <div className="ss-header-bar">
        <button type="button" className="ss-back-btn" onClick={onBack} aria-label="Back to Academics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Academics</span>
        </button>

        {lastSaved && (
          <div className="ss-saved-badge" title={`Last saved at ${formattedSavedTime}`}>
            <span className="ss-saved-dot" />
            <span>Saved ({formattedSavedTime})</span>
          </div>
        )}
      </div>

      {/* ── TITLE BANNER ── */}
      <div className="ss-title-card">
        <div className="ss-title-left">
          <div className="ss-title-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </div>
          <div className="ss-title-text-group">
            <h1 className="ss-title-heading">Syllabus Setup</h1>
            <p className="ss-title-sub">
              Configure curriculum chapters, customize titles, and track topic completion.
            </p>
          </div>
        </div>
      </div>

      {/* ── SELECTORS CARD (Batch, Subject & Chapter Count) ── */}
      <section className="ss-selector-card" aria-label="Syllabus Selectors">
        {/* Batch */}
        <div className="ss-selector-item">
          <label htmlFor="ss-batch-select" className="ss-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>SELECT BATCH</span>
          </label>
          <div className="ss-select-dropdown-wrap">
            <select
              id="ss-batch-select"
              className="ss-native-select"
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              <option value="" disabled>— Choose a batch —</option>
              {BATCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="ss-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>

        <div className="ss-selector-divider" aria-hidden="true" />

        {/* Subject */}
        <div className="ss-selector-item">
          <label htmlFor="ss-subject-select" className="ss-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>SELECT SUBJECT</span>
          </label>
          <div className="ss-select-dropdown-wrap">
            <select
              id="ss-subject-select"
              className="ss-native-select"
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={!selectedBatch}
            >
              <option value="" disabled>
                {selectedBatch ? '— Choose a subject —' : '— Select batch first —'}
              </option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="ss-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>

        <div className="ss-selector-divider" aria-hidden="true" />

        {/* Total Chapters */}
        <div className="ss-selector-item">
          <label htmlFor="ss-chapters-select" className="ss-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>TOTAL CHAPTERS</span>
          </label>
          <div className="ss-select-dropdown-wrap">
            <select
              id="ss-chapters-select"
              className="ss-native-select"
              value={totalChapters}
              onChange={(e) => handleTotalChaptersSelect(e.target.value)}
              disabled={!readyForChapters}
            >
              <option value="" disabled>
                {!readyForChapters ? '— Select subject first —' : '— Select chapters count —'}
              </option>
              {CHAPTER_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'Chapter' : 'Chapters'}
                </option>
              ))}
            </select>
            <div className="ss-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMPTY STATE PROMPT ── */}
      {!readyForChapters && !isLoading && (
        <div className="ss-select-prompt">
          <div className="ss-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </div>
          <p className="ss-prompt-text">
            {!selectedBatch
              ? 'Select a batch to get started'
              : 'Now select a subject to configure syllabus'}
          </p>
          <div className="ss-prompt-hint">
            {!selectedBatch
              ? 'Choose your batch from the dropdown above to view or setup chapters'
              : `${availableSubjects.length} subjects available for ${selectedBatch}`}
          </div>
        </div>
      )}

      {/* ── CHAPTER COUNT PROMPT (When combo selected but chapters not chosen yet) ── */}
      {readyForChapters && !isLoading && chapters.length === 0 && (
        <div className="ss-select-prompt">
          <div className="ss-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <p className="ss-prompt-text">
            How many chapters are in <em>{selectedSubject}</em>?
          </p>
          <div className="ss-prompt-hint">
            Select the total chapters count from the dropdown above (e.g., 5, 8, 10, or 12 chapters).
          </div>
        </div>
      )}

      {/* ── SKELETON LOADING ── */}
      {isLoading && (
        <div className="ss-loading-wrapper" aria-live="polite">
          <div className="ss-loading-label">
            <div className="ss-loading-spinner" aria-hidden="true" />
            <span>Loading syllabus for <strong>{selectedSubject}</strong>…</span>
          </div>
          <div className="ss-skeleton-header" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="ss-skeleton-row" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      )}

      {/* ── SYLLABUS CONTENT ── */}
      {readyForChapters && !isLoading && chapters.length > 0 && (
        <div className="ss-content-section ss-animate-in">

          {/* CHAPTERS LIST */}
          <div className="ss-chapters-list-wrap">
            <div className="ss-chapters-header">
              <div className="ss-ch-col-num">#</div>
              <div className="ss-ch-col-title">Chapter Title (Click pencil to rename)</div>
              <div className="ss-ch-col-status">Status</div>
              <div className="ss-ch-col-check">Completed</div>
            </div>

            <div className="ss-chapters-list">
              {chapters.map((ch, idx) => {
                const isEditing = editingId === ch.id;
                const isCompleted = ch.completed;

                return (
                  <div
                    key={ch.id}
                    className={`ss-chapter-row ss-row-animate ${isCompleted ? 'is-completed' : ''}`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Chapter Number Badge */}
                    <div className="ss-chapter-num-col">
                      <span className="ss-chapter-num-badge">
                        {String(ch.num).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Chapter Title & Inline Edit */}
                    <div className="ss-chapter-title-col">
                      {isEditing ? (
                        <div className="ss-inline-edit-wrap">
                          <input
                            ref={editInputRef}
                            type="text"
                            className="ss-inline-edit-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(ch.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            placeholder="Enter chapter name..."
                          />
                          <button
                            type="button"
                            className="ss-edit-save-btn"
                            onClick={() => handleSaveEdit(ch.id)}
                            title="Save title"
                          >
                            ✓ Save
                          </button>
                          <button
                            type="button"
                            className="ss-edit-cancel-btn"
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="ss-title-display-wrap">
                          <span
                            className={`ss-chapter-title-text ${isCompleted ? 'completed-text' : ''}`}
                            title={ch.title}
                          >
                            {ch.title}
                          </span>
                          <button
                            type="button"
                            className="ss-pencil-btn"
                            onClick={() => handleStartEdit(ch)}
                            title="Edit chapter name"
                            aria-label={`Edit ${ch.title}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="ss-chapter-status-col">
                      {isCompleted ? (
                        <span className="ss-status-badge status-completed">
                          <span className="ss-status-dot" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="ss-status-badge status-pending">
                          <span className="ss-status-dot" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </div>

                    {/* Completion Checkbox on Far Right */}
                    <div className="ss-chapter-check-col">
                      <label className="ss-custom-checkbox" title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggleComplete(ch.id)}
                        />
                        <span className="ss-checkbox-checkmark">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      </label>

                      {/* Delete chapter option */}
                      <button
                        type="button"
                        className="ss-delete-ch-btn"
                        onClick={() => handleDeleteChapter(ch.id)}
                        title="Remove chapter"
                        aria-label={`Remove ${ch.title}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Chapter Bar */}
            <div className="ss-add-chapter-bar">
              <button
                type="button"
                className="ss-add-chapter-btn"
                onClick={handleAddChapter}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Another Chapter</span>
              </button>
            </div>
          </div>

          {/* ── STICKY BOTTOM SAVE ACTION BAR ── */}
          <div className="ss-bottom-action-bar">
            <div className="ss-action-left">
              {isDirty ? (
                <div className="ss-status-indicator indicator-dirty">
                  <span className="ss-pulse-dot" />
                  <span>Unsaved changes</span>
                </div>
              ) : (
                <div className="ss-status-indicator indicator-saved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{lastSaved ? `All changes saved (${formattedSavedTime})` : 'Up to date'}</span>
                </div>
              )}
            </div>

            <div className="ss-action-right">
              <button
                type="button"
                className="ss-save-btn"
                onClick={handleSavePermanently}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="ss-toast" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default SyllabusSetup;
