import React, { useState, useEffect, useMemo, useRef } from 'react';
import realisticEducationSvg from '../../assets/digitute_realistic_education_resized.svg';
import { getLiveBatchDoubtStats } from '../../data/doubtData';
import { apiRequest } from '../../api';

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */
const getLiveDateTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { dateStr, timeStr };
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'GOOD MORNING,';
  if (h >= 12 && h < 17) return 'GOOD AFTERNOON,';
  return 'GOOD EVENING,';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
};

/* Ring stroke offset for a given percentage (circumference = 2π×25 ≈ 157) */
const ringOffset = (pct) => 157 * (1 - Math.min(Math.max(pct, 0), 100) / 100);

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
const Dashboard = ({ onNavigate, user }) => {
  // Batches from database
  const [batchesList, setBatchesList] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Selected batch and subject
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);

  // Date selection (defaults to today YYYY-MM-DD)
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Scheduled sessions for selectedDate from database
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Ref for hidden native datepicker attached to the calendar icon

  const teacherName = user?.full_name || (() => {
    try {
      const stored = localStorage.getItem('digitute_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.full_name) return u.full_name;
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.name) return p.name;
      }
    } catch { }
    return 'Teacher';
  })();

  // Live date + time (updates every minute automatically)
  const [liveDateTime, setLiveDateTime] = useState(() => getLiveDateTime());

  useEffect(() => {
    // Sync to the top of the next minute so updates feel sharp
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    let interval;
    const timeout = setTimeout(() => {
      setLiveDateTime(getLiveDateTime());
      interval = setInterval(() => setLiveDateTime(getLiveDateTime()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const { timeStr } = liveDateTime;

  // Formatted selected date
  const formattedSelectedDate = useMemo(() => {
    try {
      const d = new Date(todayDateStr + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return todayDateStr;
    }
  }, [todayDateStr]);

  // Animation values for smooth number counter & progress advancement
  const [animatedSolved, setAnimatedSolved] = useState(0);
  const [animatedSyllabus, setAnimatedSyllabus] = useState(0);
  const [animatedStudents, setAnimatedStudents] = useState(0);
  const [animateKey, setAnimateKey] = useState(0);

  // 1. Fetch batches directly from database on mount (matching Syllabus Setup & Study Materials)
  useEffect(() => {
    let isMounted = true;
    setLoadingBatches(true);

    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setBatchesList(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load teacher batches for dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBatches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch sessions for selectedDate from database
  useEffect(() => {
    let isMounted = true;
    setLoadingSessions(true);

    apiRequest(`/api/teacher/sessions?session_date=${todayDateStr}`)
      .then((data) => {
        if (!isMounted) return;
        setSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load sessions for date:', err);
        if (isMounted) setSessions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [todayDateStr]);

  // Derived batch metadata & available subjects from database
  const selectedBatchObj = useMemo(() => {
    return batchesList.find((b) => b.batch_id === selectedBatch || b.batch_name === selectedBatch) || null;
  }, [batchesList, selectedBatch]);

  const selectedBatchName = selectedBatchObj ? selectedBatchObj.batch_name : (selectedBatch || '');

  const availableSubjects = useMemo(() => {
    if (!selectedBatchObj || !selectedBatchObj.subjects) return [];
    return selectedBatchObj.subjects
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
  }, [selectedBatchObj]);

  const bothSelected = Boolean(selectedBatch && selectedSubject);

  // Track if user has manually chosen a batch/subject
  const userManuallyChanged = useRef(false);

  /* When batch changes, reset subject to blank and mark as user manual action */
  const handleBatchChange = (val) => {
    userManuallyChanged.current = true;
    setSelectedBatch(val || null);
    setSelectedSubject(null);
  };

  const handleSubjectChange = (val) => {
    userManuallyChanged.current = true;
    setSelectedSubject(val || null);
  };

  // Helper to parse "HH:MM" or "HH:MM:SS" into minutes from midnight
  const parseTimeToMinutes = (tStr) => {
    if (!tStr) return null;
    const parts = tStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Auto-detect ongoing/active class for right now
  useEffect(() => {
    if (userManuallyChanged.current) return;
    if (!sessions || sessions.length === 0 || !batchesList || batchesList.length === 0) return;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Find any non-cancelled session happening right now
    const activeSession = sessions.find((s) => {
      if (s.status === 'CANCELLED') return false;
      const startMins = parseTimeToMinutes(s.start_time);
      const endMins = parseTimeToMinutes(s.end_time);
      if (startMins === null || endMins === null) return false;
      return currentMins >= startMins && currentMins < endMins;
    });

    if (activeSession) {
      // Find matching batch in batchesList by batch_id or batch_name
      const targetBatchId = activeSession.batch_id;
      const targetBatchName = activeSession.batches?.name || activeSession.batch_name;
      const matchedBatch = batchesList.find(
        (b) => b.batch_id === targetBatchId || (targetBatchName && b.batch_name?.toLowerCase() === targetBatchName.toLowerCase())
      );

      if (matchedBatch) {
        setSelectedBatch(matchedBatch.batch_id);

        // Check if session subject matches available subjects in this batch
        if (activeSession.subject) {
          const subjects = (matchedBatch.subjects || []).map((subj) =>
            typeof subj === 'string' ? subj : subj.name
          );
          const matchedSubject = subjects.find(
            (subName) => subName && subName.toLowerCase() === activeSession.subject.toLowerCase()
          );
          if (matchedSubject) {
            setSelectedSubject(matchedSubject);
          } else {
            setSelectedSubject(activeSession.subject);
          }
        }
      }
    } else {
      // If class time has passed or no class is active right now, reset if it was auto-selected
      // (Only if user hasn't manually selected)
      if (!userManuallyChanged.current && selectedBatch) {
        setSelectedBatch(null);
        setSelectedSubject(null);
      }
    }
  }, [sessions, batchesList, liveDateTime]);

  // 3. Live Batch Summary (students count and doubts) from database
  const [batchSummary, setBatchSummary] = useState(null);

  useEffect(() => {
    if (!bothSelected) {
      setBatchSummary(null);
      return;
    }

    let isMounted = true;
    const params = new URLSearchParams({
      batch_id: selectedBatch || '',
      batch_name: selectedBatchName || '',
      subject: selectedSubject || '',
    });

    apiRequest(`/api/teacher/batch-summary?${params.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setBatchSummary(data);
          setAnimateKey((k) => k + 1);
        }
      })
      .catch((err) => {
        console.warn('Failed to load batch summary from DB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, selectedBatchName, selectedSubject, bothSelected]);

  // 4. Live Syllabus stats from Database
  const [dbSyllabusStats, setDbSyllabusStats] = useState(null);

  useEffect(() => {
    if (!bothSelected) {
      setDbSyllabusStats(null);
      return;
    }

    let isMounted = true;
    const params = new URLSearchParams({
      batch_id: selectedBatch || '',
      batch_name: selectedBatchName || '',
      subject: selectedSubject || '',
    });

    apiRequest(`/api/teacher/syllabus?${params.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.total > 0) {
          setDbSyllabusStats({
            completed: data.completed,
            total: data.total,
            pct: data.pct
          });
          setAnimateKey((k) => k + 1);
        } else {
          setDbSyllabusStats({ completed: 0, total: 0, pct: 0 });
        }
      })
      .catch((err) => {
        console.warn('Failed to load DB syllabus stats for dashboard:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, selectedBatchName, selectedSubject, bothSelected]);

  // Listen for real-time syllabus updates from Syllabus Setup
  useEffect(() => {
    const handleSyllabusUpdated = (e) => {
      const detail = e.detail;
      if (
        detail &&
        (detail.batch === selectedBatch || detail.batch_name === selectedBatchName) &&
        detail.subject === selectedSubject
      ) {
        setDbSyllabusStats({
          completed: detail.completed,
          total: detail.total,
          pct: detail.pct
        });
        setAnimateKey((k) => k + 1);
      }
    };
    window.addEventListener('digitute_syllabus_updated', handleSyllabusUpdated);
    return () => window.removeEventListener('digitute_syllabus_updated', handleSyllabusUpdated);
  }, [selectedBatch, selectedBatchName, selectedSubject]);

  // Synchronize syllabus stats from Database (or localStorage fallback)
  const syllabusStats = useMemo(() => {
    if (!bothSelected) return { completed: 0, total: 0, pct: 0 };
    if (dbSyllabusStats && dbSyllabusStats.total > 0) return dbSyllabusStats;

    const keyWithId = `digitute_syllabus_v1_${selectedBatch}_${selectedSubject}`;
    const keyWithName = `digitute_syllabus_v1_${selectedBatchName}_${selectedSubject}`;
    try {
      const savedRaw = localStorage.getItem(keyWithId) || localStorage.getItem(keyWithName);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
          const comp = parsed.chapters.filter((c) => c.completed).length;
          const tot = parsed.totalChapters || parsed.chapters.length;
          const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
          return { completed: comp, total: tot, pct };
        }
      }
    } catch (e) {
      console.error('Error reading saved syllabus:', e);
    }
    return dbSyllabusStats || { completed: 0, total: 0, pct: 0 };
  }, [selectedBatch, selectedBatchName, selectedSubject, bothSelected, dbSyllabusStats]);

  // Listen for real-time doubt updates
  useEffect(() => {
    const handleSync = () => setAnimateKey((k) => k + 1);
    window.addEventListener('digitute_doubts_updated', handleSync);
    return () => window.removeEventListener('digitute_doubts_updated', handleSync);
  }, []);

  // Compute live doubt stats for the selected batch and subject from Doubt Corner store
  const liveDoubtStats = useMemo(() => {
    if (!selectedBatchName) return null;
    return getLiveBatchDoubtStats(selectedBatchName, selectedSubject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchName, selectedSubject, batchSummary, dbSyllabusStats]);

  /* Smooth sequential animation when both batch & subject are chosen */
  useEffect(() => {
    if (!bothSelected) {
      setAnimatedSolved(0);
      setAnimatedSyllabus(0);
      setAnimatedStudents(0);
      return;
    }

    // Compute targets from current data (avoid depending on liveDoubtStats to prevent infinite loop)
    const targetStudents = batchSummary ? batchSummary.students : 0;
    const currentDoubtStats = selectedBatchName ? getLiveBatchDoubtStats(selectedBatchName, selectedSubject) : null;
    const targetSolved = currentDoubtStats ? currentDoubtStats.solvedPct : (batchSummary?.doubts?.solved_pct ?? 100);
    const targetSyllabus = syllabusStats.pct || 0;

    setAnimatedStudents(0);
    setAnimatedSolved(0);
    setAnimatedSyllabus(0);

    let animationFrameId;
    const startTimestamp = performance.now();

    const doubtDuration = 750;
    const syllabusDelay = 320;
    const syllabusDuration = 800;

    const tick = (now) => {
      const elapsed = now - startTimestamp;

      // 1. Students & Doubt ring animate immediately
      const doubtProgress = Math.min(elapsed / doubtDuration, 1);
      const doubtEase = 1 - Math.pow(1 - doubtProgress, 3);
      setAnimatedStudents(Math.round(targetStudents * doubtEase));
      setAnimatedSolved(Math.round(targetSolved * doubtEase));

      // 2. Syllabus progress starts at syllabusDelay and advances to target
      if (elapsed > syllabusDelay) {
        const syllabusProgress = Math.min((elapsed - syllabusDelay) / syllabusDuration, 1);
        const syllabusEase = 1 - Math.pow(1 - syllabusProgress, 4);
        setAnimatedSyllabus(Math.round(targetSyllabus * syllabusEase));
      } else {
        setAnimatedSyllabus(0);
      }

      if (elapsed < syllabusDelay + syllabusDuration) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setAnimatedStudents(targetStudents);
        setAnimatedSolved(targetSolved);
        setAnimatedSyllabus(targetSyllabus);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedSubject, batchSummary, syllabusStats.pct, bothSelected]);

  const targetPendingDoubts = liveDoubtStats ? liveDoubtStats.pending : (batchSummary?.doubts?.pending ?? 0);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-main">

        {/* ════════════════════════════════════════════════════════════════
            1. GREETING HERO BANNER
            ════════════════════════════════════════════════════════════════ */}
        <section className="dash-hero-banner" aria-label="Greeting Banner">
          <div className="dash-hero-content">
            <span className="dash-hero-salutation">{getGreeting()}</span>
            <div className="dash-hero-title-group">
              <h1 className="dash-hero-name">{teacherName}</h1>
              <div className="dash-hero-underline" aria-hidden="true" />
            </div>
            <div
              className="dash-hero-action"
              onClick={() => onNavigate && onNavigate('academics')}
              role="button"
              tabIndex={0}
            >
              <span className="dash-hero-subtitle">Let's make today productive</span>
              <svg className="dash-hero-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
          <div className="dash-hero-art" aria-hidden="true">
            <img
              src={realisticEducationSvg}
              alt="DigiTute realistic books, graduation cap and plant"
              className="dash-hero-illustration-img"
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            2. TOP ROW — Date & Time  |  Today's Total Class
            ════════════════════════════════════════════════════════════════ */}
        <section className="dashboard-top-row" aria-label="Date and Today's Classes">

          {/* Card A: Date & Time — always shows today */}
          <div className="dash-card metric-card">
            <div className="metric-left-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2.5" ry="2.5" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="8" cy="14" r="1" fill="#1E293B" />
                <circle cx="12" cy="14" r="1" fill="#1E293B" />
                <circle cx="16" cy="14" r="1" fill="#1E293B" />
                <circle cx="8" cy="18" r="1" fill="#1E293B" />
                <circle cx="12" cy="18" r="1" fill="#1E293B" />
              </svg>
            </div>
            <div className="metric-text-group">
              <span className="metric-label">Date &amp; Time</span>
              <span className="metric-date">{formattedSelectedDate}</span>
              <span className="metric-time">{timeStr}</span>
            </div>
          </div>

          {/* Card B: Total Class for date — click opens modal ONLY if count > 0 */}
          <div
            className={`dash-card metric-card ${sessions.length > 0 ? 'clickable-metric' : ''}`}
            onClick={() => {
              if (sessions.length > 0) setShowClassModal(true);
            }}
            style={{ cursor: sessions.length > 0 ? 'pointer' : 'default' }}
            role={sessions.length > 0 ? 'button' : undefined}
            tabIndex={sessions.length > 0 ? 0 : undefined}
            aria-label={`${"Today's"} ${sessions.length} classes${sessions.length > 0 ? ' — click to see details' : ''}`}
          >
            <div className="metric-left-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="metric-text-group">
              <span className="metric-label">Today's Classes</span>
              <span className="metric-bold-value">{loadingSessions ? '…' : sessions.length}</span>
            </div>
            {sessions.length > 0 && (
              <div className="metric-right-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            )}
          </div>

        </section>

        {/* ════════════════════════════════════════════════════════════════
            3. BATCH & SUBJECT SELECTOR (FETCHED FROM DATABASE)
            ════════════════════════════════════════════════════════════════ */}
        <section className="dash-card selector-card" aria-label="Batch and Subject Selection">
          <div className="selector-grid">
            {/* Batch half */}
            <div className="selector-halve">
              <div className="selector-circle-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="selector-text-box">
                <label htmlFor="batch-select-input" className="selector-sub-label">Batch</label>
                <div className="selector-custom-dropdown">
                  <select
                    id="batch-select-input"
                    className={`selector-native-select${!selectedBatch ? ' selector-placeholder' : ''}`}
                    value={selectedBatch || ''}
                    onChange={(e) => handleBatchChange(e.target.value || null)}
                    aria-label="Select Batch"
                  >
                    <option value="" disabled>
                      {loadingBatches ? 'Loading batches…' : batchesList.length === 0 ? 'No batches assigned' : 'Select batch…'}
                    </option>
                    {batchesList.map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>
                    ))}
                  </select>
                  <svg className="selector-chevron-svg" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="selector-vertical-divider" aria-hidden="true" />

            {/* Subject half */}
            <div className="selector-halve">
              <div className="selector-circle-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div className="selector-text-box">
                <label htmlFor="subject-select-input" className="selector-sub-label">Subject</label>
                <div className="selector-custom-dropdown">
                  <select
                    id="subject-select-input"
                    className={`selector-native-select${!selectedSubject ? ' selector-placeholder' : ''}`}
                    value={selectedSubject || ''}
                    onChange={(e) => handleSubjectChange(e.target.value || null)}
                    disabled={!selectedBatch || availableSubjects.length === 0}
                    aria-label="Select Subject"
                  >
                    <option value="" disabled>
                      {!selectedBatch ? 'Select batch first' : availableSubjects.length === 0 ? 'No subjects found' : 'Select subject…'}
                    </option>
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <svg className="selector-chevron-svg" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Context chip — only when batch is selected */}
          {selectedBatch && (
            <div className="selector-context-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {bothSelected
                ? <>Showing stats for <strong>{selectedBatchName}</strong> — <strong>{selectedSubject}</strong></>
                : <>Batch selected — now choose a <strong>subject</strong></>
              }
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
            4 & 5. BATCH-AWARE STATS — only when BOTH batch & subject selected
            ════════════════════════════════════════════════════════════════ */}
        {bothSelected ? (
          <div key={`stats-view-${animateKey}`} className="dash-stats-animated-wrapper">
            {/* Stats Row: Total Students | Doubt Status */}
            <section className="dashboard-stats-row" aria-label="Batch Statistics">

              {/* Total Students */}
              <div className="dash-card metric-card dash-animated-card delay-1">
                <div className="metric-left-circle" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="metric-text-group">
                  <span className="metric-label">Total Students</span>
                  <span className="metric-bold-value">{animatedStudents}</span>
                </div>
              </div>

              {/* Doubt Status */}
              <div
                className="dash-card doubt-status-card dash-animated-card delay-2"
                onClick={() => onNavigate && onNavigate('academics', { section: 'doubt-corner', batch: selectedBatchName, subject: selectedSubject })}
                role="button"
                tabIndex={0}
                title="Click to open Doubt Corner for this batch"
              >
                <div className="doubt-header-top">
                  <span className="doubt-header-label">Doubt Status</span>
                </div>
                <div className="doubt-card-body">
                  <div className="doubt-ring-container" aria-label={`${animatedSolved}% resolved doubts`}>
                    <svg className="doubt-ring-svg doubt-ring-spinning" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="25" fill="none" stroke="#EEF2FF" strokeWidth="5" />
                      <circle
                        cx="30" cy="30" r="25"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="5"
                        strokeDasharray="157"
                        strokeDashoffset={ringOffset(animatedSolved)}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <div className="doubt-ring-inner">
                      <span className="doubt-ring-percent">{animatedSolved}%</span>
                      <span className="doubt-ring-tag">Solved</span>
                    </div>
                  </div>
                  <div className="doubt-divider" aria-hidden="true" />
                  <div className="doubt-pending-group">
                    <div className="doubt-pending-row">
                      <div className="doubt-sandwatch-badge" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 22h14" />
                          <path d="M5 2h14" />
                          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                        </svg>
                      </div>
                      <div className="doubt-pending-meta">
                        <span className="doubt-pending-sub">Pending</span>
                        <span className="doubt-pending-num">{targetPendingDoubts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            {/* Syllabus Progress */}
            <section className="dash-card syllabus-card dash-animated-card delay-3" aria-label="Syllabus Progress Summary">
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
                <span className="syllabus-percent-badge">{animatedSyllabus}%</span>
              </div>

              <div
                className="syllabus-track-bar"
                role="progressbar"
                aria-valuenow={animatedSyllabus}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Syllabus progress ${animatedSyllabus}%`}
              >
                <div className="syllabus-fill-pill" style={{ width: `${animatedSyllabus}%` }}>
                  <div className="syllabus-pill-glow" />
                </div>
              </div>

              <div className="syllabus-bottom-meta">
                <span className="syllabus-completion-text">
                  {syllabusStats.completed} / {syllabusStats.total} Chapters Complete
                </span>
                <span className="syllabus-subject-chip">{selectedSubject}</span>
              </div>
            </section>
          </div>
        ) : (
          /* ── Empty state prompt ── */
          <div className="dash-select-prompt" role="status">
            <div className="dash-select-prompt-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <p className="dash-select-prompt-text">
              {!selectedBatch
                ? 'Select a batch to view student stats, doubt status, and syllabus progress'
                : 'Now select a subject to load full stats for this batch'}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            6. QUICK ACTIONS
            ════════════════════════════════════════════════════════════════ */}
        <section className="quick-actions-container" aria-label="Quick Actions">
          <div className="quick-actions-bar">
            <h2 className="quick-actions-title">Quick Actions</h2>
            <button
              type="button"
              className="quick-actions-view-all"
              onClick={() => onNavigate && onNavigate('academics')}
            >
              <span>View All</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="quick-actions-grid">
            {/* Take Attendance */}
            <button
              type="button"
              className="action-card attendance-action"
              onClick={() => onNavigate && onNavigate('academics', { section: 'attendance', batch: selectedBatchName, subject: selectedSubject })}
              aria-label="Take Attendance"
            >
              <div className="action-card-header">
                <div className="action-icon-box attendance-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
              </div>
              <div className="action-card-footer">
                <span className="action-name">Take Attendance</span>
                <svg className="action-bottom-arrow" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

            {/* Money */}
            <button
              type="button"
              className="action-card money-action"
              onClick={() => onNavigate && onNavigate('finance')}
              aria-label="Manage Fees and Money"
            >
              <div className="action-card-header">
                <div className="action-icon-box money-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                </div>
              </div>
              <div className="action-card-footer">
                <span className="action-name">Money</span>
                <svg className="action-bottom-arrow" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

            {/* Create DPP */}
            <button
              type="button"
              className="action-card ddp-action"
              onClick={() => onNavigate && onNavigate('academics', { section: 'dpp-management', batch: selectedBatchName, subject: selectedSubject })}
              aria-label="Create DPP"
            >
              <div className="action-card-header">
                <div className="action-icon-box ddp-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
              </div>
              <div className="action-card-footer">
                <span className="action-name">Create DPP</span>
                <svg className="action-bottom-arrow" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>
          </div>
        </section>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TODAY'S / SCHEDULED CLASSES MODAL POPUP (DATABASE BACKED)
          ══════════════════════════════════════════════════════════════════ */}
      {showClassModal && sessions.length > 0 && (
        <div
          className="class-modal-backdrop"
          onClick={() => setShowClassModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Class schedule"
        >
          <div
            className="class-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="class-modal-header">
              <div className="class-modal-title-group">
                <h2 className="class-modal-title">Today's Schedule</h2>
                <span className="class-modal-date">{formattedSelectedDate}</span>
              </div>
              <button
                type="button"
                className="class-modal-close"
                onClick={() => setShowClassModal(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Class Count Badge */}
            <div className="class-modal-count-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {sessions.length} {sessions.length === 1 ? 'Class' : 'Classes'} Today
            </div>

            {/* Class Capsule List */}
            <div className="class-modal-list">
              {sessions.map((cls, idx) => {
                const startTimeStr = formatTime(cls.start_time) || '--:--';
                const endTimeStr = formatTime(cls.end_time) || '--:--';
                const batchName = cls.batches?.name || 'Assigned Batch';
                const subjectName = cls.subject || 'Subject';

                return (
                  <div key={cls.id || idx} className="class-capsule">
                    {/* Clean Time column */}
                    <div className="class-capsule-time-col">
                      <span className="class-capsule-time-start">{startTimeStr}</span>
                      <span className="class-capsule-time-divider">to</span>
                      <span className="class-capsule-time-end">{endTimeStr}</span>
                    </div>

                    {/* Card Content */}
                    <div className="class-capsule-card">
                      <div className="class-capsule-info">
                        <span className="class-capsule-subject">{subjectName}</span>
                        <div className="class-capsule-batch-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                          </svg>
                          <span>{batchName}</span>
                        </div>
                      </div>
                      <div className="class-capsule-index" aria-hidden="true">
                        #{String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

