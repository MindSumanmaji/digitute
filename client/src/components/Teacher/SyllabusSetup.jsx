import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiRequest } from '../../api';

// Helper for local storage key
const getStorageKey = (batch, subject) => `digitute_syllabus_v1_${batch}_${subject}`;

export function SyllabusSetup({ onBack }) {
  // Database batches & loading state
  const [batchesList, setBatchesList] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Selectors
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [totalChapters, setTotalChapters] = useState('');
  const [chapterInput, setChapterInput] = useState('');

  // Chapter list: [{ id, num, title, completed }]
  const [chapters, setChapters] = useState([]);

  // Saved completed chapter IDs/numbers set (chapters permanently locked after save)
  const [savedCompletedIds, setSavedCompletedIds] = useState(() => new Set());

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

  // Fetch batches directly from database on mount (identical to Study Materials)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingBatches(true);

    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setBatchesList(data);
          if (data.length > 0) {
            setSelectedBatch(data[0].batch_id);
            const firstSubject = data[0].subjects?.[0]?.name || (typeof data[0].subjects?.[0] === 'string' ? data[0].subjects[0] : '');
            if (firstSubject) setSelectedSubject(firstSubject);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load teacher batches for syllabus:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBatches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived batch metadata & available subjects from database
  const selectedBatchObj = useMemo(() => {
    return batchesList.find((b) => b.batch_id === selectedBatch) || null;
  }, [batchesList, selectedBatch]);

  const selectedBatchName = selectedBatchObj ? selectedBatchObj.batch_name : '';

  const availableSubjects = useMemo(() => {
    if (!selectedBatchObj || !selectedBatchObj.subjects) return [];
    return selectedBatchObj.subjects
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
  }, [selectedBatchObj]);

  const readyForChapters = !!(selectedBatch && selectedSubject);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  // Helper to check if a chapter was already saved as completed
  const isChapterSavedCompleted = (ch) => {
    if (!ch) return false;
    return savedCompletedIds.has(String(ch.id)) || savedCompletedIds.has(String(ch.num));
  };

  // Load saved syllabus from Database & LocalStorage when Batch and Subject are both selected
  useEffect(() => {
    if (!readyForChapters) {
      setChapters([]);
      setTotalChapters('');
      setChapterInput('');
      setEditingId(null);
      setIsDirty(false);
      setLastSaved(null);
      setSavedCompletedIds(new Set());
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    // 1. Immediately read from localStorage cache for instant UI rendering
    const key = getStorageKey(selectedBatch, selectedSubject);
    const savedRaw = localStorage.getItem(key);
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
          setChapters(parsed.chapters);
          setTotalChapters(parsed.chapters.length);
          setChapterInput(String(parsed.chapters.length));
          setLastSaved(parsed.lastSaved || null);

          // Populate saved completed chapters from cache
          const compSet = new Set();
          parsed.chapters.forEach((c) => {
            if (c.completed) {
              if (c.id) compSet.add(String(c.id));
              if (c.num) compSet.add(String(c.num));
            }
          });
          setSavedCompletedIds(compSet);
        }
      } catch (err) {
        console.error('Error parsing stored syllabus cache:', err);
      }
    }

    // 2. Query Postgres database via backend API
    const params = new URLSearchParams({
      batch_id: selectedBatch,
      batch_name: selectedBatchName || '',
      subject: selectedSubject,
    });

    apiRequest(`/api/teacher/syllabus?${params.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.chapters) && data.chapters.length > 0) {
          setChapters(data.chapters);
          setTotalChapters(data.chapters.length);
          setChapterInput(String(data.chapters.length));
          setLastSaved(new Date().toISOString());
          setIsDirty(false);

          // Populate saved completed chapters from DB
          const compSet = new Set();
          data.chapters.forEach((c) => {
            if (c.completed) {
              if (c.id) compSet.add(String(c.id));
              if (c.num) compSet.add(String(c.num));
            }
          });
          setSavedCompletedIds(compSet);

          // Update local cache
          localStorage.setItem(key, JSON.stringify({
            batch: selectedBatch,
            batch_name: selectedBatchName,
            subject: selectedSubject,
            totalChapters: data.chapters.length,
            lastSaved: new Date().toISOString(),
            chapters: data.chapters
          }));
        } else if (data && Array.isArray(data.chapters) && data.chapters.length === 0) {
          if (!savedRaw) {
            setChapters([]);
            setTotalChapters('');
            setChapterInput('');
            setLastSaved(null);
            setSavedCompletedIds(new Set());
          }
        }
      })
      .catch((err) => {
        console.warn('Backend syllabus load error (using cache):', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, selectedBatchName, selectedSubject, readyForChapters]);

  // Focus inline edit input
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Batch change
  const handleBatchChange = (newBatchId) => {
    setSelectedBatch(newBatchId);
    const b = batchesList.find((x) => x.batch_id === newBatchId);
    if (b && b.subjects && b.subjects.length > 0) {
      const firstSubj = typeof b.subjects[0] === 'string' ? b.subjects[0] : b.subjects[0].name;
      setSelectedSubject(firstSubj || '');
    } else {
      setSelectedSubject('');
    }
    setTotalChapters('');
    setChapterInput('');
    setChapters([]);
    setEditingId(null);
    setIsDirty(false);
    setSavedCompletedIds(new Set());
  };

  // Subject change
  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    setTotalChapters('');
    setChapterInput('');
    setChapters([]);
    setEditingId(null);
    setIsDirty(false);
    setSavedCompletedIds(new Set());
  };

  // Update total chapters
  const updateChapterCount = (newCount) => {
    if (isNaN(newCount) || newCount < 0) return;

    setTotalChapters(newCount > 0 ? newCount : '');
    setChapterInput(newCount > 0 ? String(newCount) : '');

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
    if (newCount > 0) {
      showToast(`Set to ${newCount} chapter${newCount > 1 ? 's' : ''}`);
    }
  };

  const handleChapterInputChange = (e) => {
    const raw = e.target.value;
    setChapterInput(raw);
    if (raw === '') return;
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateChapterCount(val);
    }
  };

  const handleChapterInputBlur = () => {
    if (!chapterInput.trim()) {
      setChapterInput(chapters.length > 0 ? String(chapters.length) : '');
      return;
    }
    const val = parseInt(chapterInput, 10);
    if (!isNaN(val) && val >= 0) {
      updateChapterCount(val);
    } else {
      setChapterInput(chapters.length > 0 ? String(chapters.length) : '');
    }
  };

  const handleStep = (delta) => {
    const current = chapters.length;
    const next = Math.max(0, current + delta);
    updateChapterCount(next);
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

  // Toggle chapter completion: can be toggled/deselected freely BEFORE save, locked AFTER save
  const handleToggleComplete = (chId) => {
    const existing = chapters.find((c) => c.id === chId || String(c.num) === String(chId));
    if (!existing) return;

    // Once a chapter is saved as completed, it cannot be deselected
    if (existing.completed && isChapterSavedCompleted(existing)) {
      showToast('⚠️ Completed chapters cannot be unmarked after save.');
      return;
    }

    const newStatus = !existing.completed;
    const updated = chapters.map((c) => {
      if (c.id === chId || String(c.num) === String(chId)) {
        return { ...c, completed: newStatus };
      }
      return c;
    });

    setChapters(updated);
    setIsDirty(true);
    showToast(newStatus ? '✓ Chapter marked complete (Save to finalize)' : 'Chapter unmarked as incomplete');
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
      setChapterInput(String(updated.length));
      return updated;
    });
    setIsDirty(true);
    showToast('Added 1 chapter');
  };

  // Delete individual chapter (Prohibited if already saved completed or syllabus complete)
  const handleDeleteChapter = (chId) => {
    if (isSyllabusComplete) {
      showToast('⚠️ Completed syllabus cannot be deleted.');
      return;
    }
    const target = chapters.find((c) => c.id === chId || String(c.num) === String(chId));
    if (target && isChapterSavedCompleted(target)) {
      showToast('⚠️ Completed chapters cannot be deleted once saved.');
      return;
    }
    setChapters((prev) => {
      const filtered = prev.filter((c) => c.id !== chId && String(c.num) !== String(chId));
      const renumbered = filtered.map((c, idx) => ({ ...c, num: idx + 1 }));
      setTotalChapters(renumbered.length);
      setChapterInput(renumbered.length > 0 ? String(renumbered.length) : '');
      return renumbered;
    });
    setIsDirty(true);
    showToast('Chapter removed');
  };

  // Save permanently to database and localStorage
  const handleSavePermanently = async () => {
    if (!selectedBatch || !selectedSubject) {
      showToast('Please select Batch and Subject first');
      return;
    }
    if (chapters.length === 0) {
      showToast('Please enter chapters before saving');
      return;
    }

    const key = getStorageKey(selectedBatch, selectedSubject);
    const nowIso = new Date().toISOString();
    const comp = chapters.filter((c) => c.completed).length;
    const tot = chapters.length;
    const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;

    const payload = {
      batch: selectedBatch,
      batch_name: selectedBatchName,
      subject: selectedSubject,
      totalChapters: tot,
      lastSaved: nowIso,
      chapters,
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
      setLastSaved(nowIso);
      setIsDirty(false);

      // Lock all currently completed chapters permanently after save
      setSavedCompletedIds((prev) => {
        const nextSet = new Set(prev);
        chapters.forEach((c) => {
          if (c.completed) {
            if (c.id) nextSet.add(String(c.id));
            if (c.num) nextSet.add(String(c.num));
          }
        });
        return nextSet;
      });

      // Dispatch real-time event for Dashboard reflection
      window.dispatchEvent(new CustomEvent('digitute_syllabus_updated', {
        detail: {
          batch: selectedBatch,
          batch_name: selectedBatchName,
          subject: selectedSubject,
          completed: comp,
          total: tot,
          pct,
          chapters
        }
      }));

      // Persist to PostgreSQL database
      await apiRequest('/api/teacher/syllabus', {
        method: 'POST',
        body: JSON.stringify({
          batch_id: selectedBatch,
          batch_name: selectedBatchName,
          subject: selectedSubject,
          total_chapters: tot,
          chapters
        })
      });

      showToast(`✓ Syllabus saved to database for ${selectedSubject}!`);
    } catch (e) {
      console.error(e);
      showToast('Saved locally (network error saving to DB)');
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

  // Computed syllabus completion stats
  const completedCount = useMemo(() => chapters.filter((c) => c.completed).length, [chapters]);
  const totalCount = chapters.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Once syllabus is 100% complete, deletion is strictly prohibited
  const isSyllabusComplete = totalCount > 0 && completedCount === totalCount;

  // Once syllabus has been saved or has existing chapters in DB/storage, lock direct modification from top bar
  const isChapterCountLocked = Boolean(readyForChapters && (lastSaved || (chapters.length > 0 && !isDirty)));

  return (
    <div className="ss-wrapper">

      {lastSaved && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <div className="ss-saved-badge" title={`Last saved at ${formattedSavedTime}`}>
            <span className="ss-saved-dot" />
            <span>Saved ({formattedSavedTime})</span>
          </div>
        </div>
      )}

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
              {batchesList.length === 0 ? (
                <option value="" disabled>{isLoadingBatches ? 'Loading batches...' : 'No batches assigned'}</option>
              ) : (
                <>
                  <option value="" disabled>— Choose a batch —</option>
                  {batchesList.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>
                  ))}
                </>
              )}
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
              disabled={!selectedBatch || availableSubjects.length === 0}
            >
              {availableSubjects.length === 0 ? (
                <option value="" disabled>
                  {selectedBatch ? '— No subjects available —' : '— Select batch first —'}
                </option>
              ) : (
                <>
                  <option value="" disabled>— Choose a subject —</option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </>
              )}
            </select>
            <div className="ss-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>

        <div className="ss-selector-divider" aria-hidden="true" />

        {/* Chapter Count */}
        <div className="ss-selector-item">
          <label htmlFor="ss-chapters-input" className="ss-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>CHAPTER</span>
          </label>
          <div className={`ss-chapter-count-box ${!readyForChapters ? 'is-disabled' : ''} ${isChapterCountLocked ? 'is-locked' : ''}`}>
            <span className="ss-chapter-static-label">Chapter</span>
            <input
              id="ss-chapters-input"
              type="number"
              min="0"
              max="100"
              className="ss-chapter-number-field"
              value={chapterInput}
              onChange={!isChapterCountLocked ? handleChapterInputChange : undefined}
              onBlur={!isChapterCountLocked ? handleChapterInputBlur : undefined}
              onKeyDown={(e) => {
                if (!isChapterCountLocked && e.key === 'Enter') {
                  e.preventDefault();
                  handleChapterInputBlur();
                }
              }}
              placeholder={!readyForChapters ? '—' : 'Enter count'}
              disabled={!readyForChapters}
              readOnly={isChapterCountLocked}
              title={isChapterCountLocked ? "Initial chapter count is locked after save. Use '+ Add Another Chapter' below to add more." : undefined}
            />
            {isChapterCountLocked ? (
              <span className="ss-locked-badge" title="Chapter count is locked. Add more chapters using '+ Add Another Chapter' below.">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Locked</span>
              </span>
            ) : readyForChapters && (
              <div className="ss-chapter-stepper">
                <button
                  type="button"
                  className="ss-chapter-step-btn"
                  onClick={() => handleStep(-1)}
                  disabled={chapters.length === 0}
                  title="Decrease chapter count"
                  aria-label="Decrease chapter count"
                >
                  −
                </button>
                <button
                  type="button"
                  className="ss-chapter-step-btn"
                  onClick={() => handleStep(1)}
                  title="Increase chapter count"
                  aria-label="Increase chapter count"
                >
                  +
                </button>
              </div>
            )}
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
              : `${availableSubjects.length} subjects available for ${selectedBatchName || 'this batch'}`}
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
            Enter the number of chapters in the Chapter box above (e.g., 5, 8, 10, or 12).
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

          {/* ── SYLLABUS PROGRESS CARD (Matches Dashboard) ── */}
          <div className="dash-card syllabus-card ss-dash-progress-card" aria-label="Syllabus Progress Summary">
            <div className="syllabus-top-row">
              <div className="syllabus-title-wrap">
                <div className="syllabus-circle-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h2 className="syllabus-card-heading">Syllabus Progress</h2>
              </div>
              <span className="syllabus-percent-badge">{progressPct}%</span>
            </div>

            <div
              className="syllabus-track-bar"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Syllabus progress ${progressPct}%`}
            >
              <div className="syllabus-fill-pill" style={{ width: `${progressPct}%` }}>
                <div className="syllabus-pill-glow" />
              </div>
            </div>

            <div className="syllabus-bottom-meta">
              <span className="syllabus-completion-text">
                {completedCount} / {totalCount} Chapters Complete
              </span>
              <span className="syllabus-subject-chip">{selectedSubject}</span>
            </div>
          </div>

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
                const isCompleted = Boolean(ch.completed);
                const isSavedCompleted = isChapterSavedCompleted(ch);

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
                      <label
                        className={`ss-custom-checkbox ${isSavedCompleted ? 'is-completed-locked' : ''}`}
                        title={
                          isSavedCompleted
                            ? 'Completed chapter (saved, cannot be unmarked)'
                            : isCompleted
                            ? 'Marked complete (Click to unmark)'
                            : 'Mark as completed'
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          disabled={isSavedCompleted}
                          onChange={() => !isSavedCompleted && handleToggleComplete(ch.id)}
                        />
                        <span className="ss-checkbox-checkmark">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      </label>

                      {/* Delete chapter option - Strictly prohibited if saved completed or if syllabus is 100% complete */}
                      {!isSavedCompleted && !isSyllabusComplete ? (
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
                      ) : (
                        <span
                          className="ss-delete-disabled-lock"
                          title={isSyllabusComplete ? 'Completed syllabus cannot be deleted.' : 'Completed chapters cannot be deleted once saved.'}
                          aria-label="Delete locked"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                            strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, color: '#94A3B8' }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                      )}
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
