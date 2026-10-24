import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api';

export function Attendance({ onBack, _onNavigate, initialBatch, initialSubject }) {
  // Date selection (defaults to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Scheduled sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);

  // Student roster & attendance state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [topicCovered, setTopicCovered] = useState('');
  const [isPreviouslyMarked, setIsPreviouslyMarked] = useState(false);

  // Filter & Search
  const [filterView, setFilterView] = useState('all'); // 'all' | 'present' | 'absent'
  const [searchQuery, setSearchQuery] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState('');

  // Batch Filter state ('ALL' or specific batch_id)
  const [selectedBatchId, setSelectedBatchId] = useState('ALL');

  // Extra Session Modal State (for unscheduled ad-hoc classes)
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [myBatches, setMyBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [extraForm, setExtraForm] = useState({
    batch_id: '',
    subject: '',
    start_time: '10:00',
    end_time: '11:30',
    topic_covered: ''
  });
  const [creatingExtra, setCreatingExtra] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
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

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Load teacher's assigned batches on mount
  useEffect(() => {
    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (Array.isArray(data)) setMyBatches(data);
      })
      .catch((err) => console.error('Failed to load my-batches:', err));
  }, []);

  // Compute batch options from myBatches + sessions
  const batchOptions = useMemo(() => {
    const map = new Map();
    (myBatches || []).forEach((b) => {
      map.set(b.batch_id, b.batch_name);
    });
    (sessions || []).forEach((s) => {
      if (s.batch_id && s.batches?.name) {
        map.set(s.batch_id, s.batches.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [myBatches, sessions]);

  // Sync initialBatch prop if provided
  useEffect(() => {
    if (initialBatch && batchOptions.length > 0) {
      const match = batchOptions.find((b) => b.name === initialBatch);
      if (match) setSelectedBatchId(match.id);
    }
  }, [initialBatch, batchOptions]);

  // Filter sessions by selected batch
  const filteredSessions = useMemo(() => {
    if (!selectedBatchId || selectedBatchId === 'ALL') {
      return sessions;
    }
    return sessions.filter((s) => s.batch_id === selectedBatchId);
  }, [sessions, selectedBatchId]);

  // ── 1. Fetch Sessions for selected date ──
  const loadSessionsForDate = useCallback(async (dateStr) => {
    setLoadingSessions(true);
    try {
      const data = await apiRequest(`/api/teacher/sessions?session_date=${dateStr}`);
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      showToast('Could not load class sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Load sessions when date changes
  useEffect(() => {
    setIsSubmitted(false);
    loadSessionsForDate(selectedDate);
  }, [selectedDate, loadSessionsForDate]);

  // Ensure active session is synced whenever filteredSessions change
  useEffect(() => {
    if (filteredSessions.length > 0) {
      const exists = filteredSessions.some((s) => s.id === selectedSessionId);
      if (!exists) {
        const nextId = filteredSessions[0].id;
        setSelectedSessionId(nextId);
        loadSessionStudents(nextId);
      }
    } else {
      setSelectedSessionId('');
      setStudents([]);
      setSessionDetails(null);
    }
  }, [filteredSessions, selectedSessionId]);

  // ── 2. Fetch Students for a given session ──
  const loadSessionStudents = async (sessionId) => {
    if (!sessionId) return;
    setLoadingStudents(true);
    setIsSubmitted(false);
    try {
      const res = await apiRequest(`/api/teacher/sessions/${sessionId}/students`);
      const studentList = res?.students || (Array.isArray(res) ? res : []);
      const sessionInfo = res?.session || sessions.find((s) => s.id === sessionId) || null;

      setSessionDetails(sessionInfo);
      setStudents(studentList);
      setTopicCovered(sessionInfo?.topic_covered || '');
      setIsPreviouslyMarked(Boolean(res?.has_marked || sessionInfo?.status === 'COMPLETED'));

      // Initialize attendance map
      const initialMap = {};
      studentList.forEach((s) => {
        initialMap[s.id] = s.attendance_status === 'ABSENT' ? 'ABSENT' : 'PRESENT';
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Failed to fetch students for session:', err);
      showToast('Could not fetch student roster for this session.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    if (sessionId) {
      loadSessionStudents(sessionId);
    } else {
      setStudents([]);
      setSessionDetails(null);
    }
  };

  // ── 3. Teacher Attendance Actions ──
  const toggleAttendance = (studentId) => {
    if (submitting) return;
    setAttendanceMap((prev) => {
      const current = prev[studentId] || 'PRESENT';
      return {
        ...prev,
        [studentId]: current === 'PRESENT' ? 'ABSENT' : 'PRESENT',
      };
    });
  };

  const handleSelectAllPresent = () => {
    const allPresent = {};
    students.forEach((s) => {
      allPresent[s.id] = 'PRESENT';
    });
    setAttendanceMap(allPresent);
    showToast('All students marked as Present ✓');
  };

  // ── 4. Calculate Stats ──
  const { presentList, absentList } = useMemo(() => {
    const present = [];
    const absent = [];
    students.forEach((s) => {
      if (attendanceMap[s.id] === 'ABSENT') {
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

  // Filter & Search on student list
  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const status = attendanceMap[s.id] || 'PRESENT';
      const matchesFilter =
        filterView === 'all' ||
        (filterView === 'present' && status === 'PRESENT') ||
        (filterView === 'absent' && status === 'ABSENT');

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (s.full_name || s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [students, attendanceMap, filterView, searchQuery]);

  // ── 5. Submit Attendance Workflow ──
  const handleInitiateSubmit = () => {
    if (totalCount === 0) {
      showToast('No students enrolled in this batch.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const payload = {
        session_id: selectedSessionId,
        records: students.map((s) => ({
          student_id: s.id,
          status: attendanceMap[s.id] || 'PRESENT',
        })),
        topic_covered: topicCovered.trim() || undefined,
      };

      await apiRequest('/api/teacher/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const summary = {
        batch: sessionDetails?.batches?.name || 'Class Batch',
        subject: sessionDetails?.subject || '',
        date: selectedDate,
        time: `${formatTime(sessionDetails?.start_time)} - ${formatTime(sessionDetails?.end_time)}`,
        totalCount,
        presentCount,
        absentCount,
        attendancePercentage,
        topicCovered: topicCovered.trim(),
      };

      setSubmissionSummary(summary);
      setIsSubmitted(true);
      setIsPreviouslyMarked(true);
      showToast('Attendance recorded in database successfully! ✓');

      // Refresh session counts
      loadSessionsForDate(selectedDate, false);
    } catch (err) {
      console.error('Failed to submit attendance:', err);
      showToast(err.message || 'Error recording attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 6. Extra Class Session Modal Workflow ──
  const openExtraClassModal = async () => {
    setShowExtraModal(true);
    setLoadingBatches(true);
    try {
      const data = await apiRequest('/api/teacher/my-batches');
      const list = Array.isArray(data) ? data : [];
      setMyBatches(list);
      if (list.length > 0) {
        const first = list[0];
        const subjs = first.subjects || [];
        setExtraForm((prev) => ({
          ...prev,
          batch_id: first.batch_id,
          subject: subjs.length > 0 ? (subjs[0].name || subjs[0]) : '',
        }));
      }
    } catch (err) {
      console.error('Failed to load my-batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleCreateExtraSession = async (e) => {
    e.preventDefault();
    if (!extraForm.batch_id || !extraForm.subject) {
      showToast('Please select Batch and Subject.');
      return;
    }
    setCreatingExtra(true);
    try {
      const payload = {
        batch_id: extraForm.batch_id,
        subject: extraForm.subject,
        session_date: selectedDate,
        start_time: extraForm.start_time + ':00',
        end_time: extraForm.end_time + ':00',
        topic_covered: extraForm.topic_covered.trim() || undefined,
      };

      const newSession = await apiRequest('/api/teacher/sessions/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast('Extra class session created! ✓');
      setShowExtraModal(false);

      // Refresh sessions & select newly created session
      await loadSessionsForDate(selectedDate, false);
      if (newSession?.id) {
        setSelectedSessionId(newSession.id);
        loadSessionStudents(newSession.id);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      showToast(err.message || 'Failed to create extra session.');
    } finally {
      setCreatingExtra(false);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'ST';
    const parts = nameStr.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : nameStr.slice(0, 2).toUpperCase();
  };

  const activeBatchSubjects = useMemo(() => {
    const found = myBatches.find((b) => b.batch_id === extraForm.batch_id);
    return found ? (found.subjects || []) : [];
  }, [myBatches, extraForm.batch_id]);

  return (
    <div className="att-container">
      {/* ── AUTOMATIC DATE & SESSION META CARD ── */}
      <section className="att-meta-card">
        <div className="att-meta-grid">
          {/* Calendar Date Selector */}
          <div className="att-meta-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="att-meta-label" htmlFor="att-date-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Select Date</span>
              </label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F46E5',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                title="Reset to Today"
              >
                Today
              </button>
            </div>
            <div className="att-input-wrapper">
              <input
                id="att-date-input"
                type="date"
                className="att-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.target.showPicker?.();
                  } catch (err) {}
                }}
              />
            </div>
          </div>

          {/* Batch Selector Dropdown */}
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
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setIsSubmitted(false);
                }}
              >
                <option value="ALL">All Batches</option>
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
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
        </div>

        {/* ── QUICK SESSION CAPSULES STRIP ── */}
        {filteredSessions.length > 0 && (
          <div className="att-sessions-strip">
            <div className="att-sessions-strip-label">
              <span>
                {selectedBatchId !== 'ALL'
                  ? `Scheduled Sessions for ${batchOptions.find((b) => b.id === selectedBatchId)?.name || 'Selected Batch'} on ${formattedDate} (${filteredSessions.length})`
                  : `Scheduled Sessions on ${formattedDate} (${filteredSessions.length})`}
              </span>
              <button
                type="button"
                className="att-btn-link"
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                onClick={openExtraClassModal}
              >
                + Schedule Extra Session
              </button>
            </div>
            <div className="att-session-chips-container">
              {filteredSessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                const isComp = s.status === 'COMPLETED';
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`att-session-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                  >
                    <div className="att-session-chip-time">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatTime(s.start_time)} - {formatTime(s.end_time)}</span>
                    </div>
                    <div className="att-session-chip-title" title={`${s.batches?.name} • ${s.subject}`}>
                      {s.batches?.name} — {s.subject}
                    </div>
                    <div className={`att-session-chip-badge ${isComp ? 'completed' : 'scheduled'}`}>
                      {isComp ? '✓ Attendance Recorded' : '● Scheduled'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── PREVIOUSLY MARKED BANNER ── */}
      {selectedSessionId && isPreviouslyMarked && !isSubmitted && (
        <div className="att-previously-marked-banner">
          <div className="att-previously-marked-banner-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <strong>Attendance already recorded for this session.</strong>
              <span style={{ marginLeft: 6, opacity: 0.9 }}>
                You can review, modify statuses, and click "Update Attendance" to save changes.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="att-mark-all-btn"
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            onClick={handleSelectAllPresent}
          >
            Mark All Present ✓
          </button>
        </div>
      )}

      {/* ── STATE 1: NO SESSION SELECTED ── */}
      {!selectedSessionId ? (
        <div className="att-select-prompt">
          <div className="att-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          {filteredSessions.length > 0 ? (
            <>
              <h3 className="att-prompt-title">Select a Class Session</h3>
              <p className="att-prompt-desc">
                Please click one of the scheduled sessions above to view the student list and record today's attendance.
              </p>
            </>
          ) : (
            <>
              <h3 className="att-prompt-title">
                {selectedBatchId !== 'ALL'
                  ? `No Sessions for ${batchOptions.find((b) => b.id === selectedBatchId)?.name || 'this Batch'} on ${formattedDate}`
                  : `No Class Sessions on ${formattedDate}`}
              </h3>
              <p className="att-prompt-desc">
                There are no scheduled class sessions found on this date. You can choose "All Batches" above or schedule an extra session.
              </p>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="att-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9999 }}
                  onClick={openExtraClassModal}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Start Extra Class Session</span>
                </button>
              </div>
            </>
          )}
        </div>
      )
 : loadingStudents ? (
        <div className="att-empty-state" style={{ padding: '48px 16px' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6366F1' }}>
            Loading enrolled students from database...
          </p>
        </div>
      ) : (
        <>
          {/* ── LIVE STATS & QUICK ACTIONS BAR ── */}
          <section className="att-summary-bar">
            <div className="att-metric-pill total">
              <span className="att-pill-label">Total Students:</span>
              <span className="att-pill-val">{totalCount}</span>
            </div>

            <div className="att-metric-pill present">
              <span className="att-pill-indicator present" />
              <span className="att-pill-label">Present:</span>
              <span className="att-pill-val">{presentCount}</span>
              <span className="att-pill-pct">({attendancePercentage}%)</span>
            </div>

            <div className="att-metric-pill absent">
              <span className="att-pill-indicator absent" />
              <span className="att-pill-label">Absent:</span>
              <span className="att-pill-val">{absentCount}</span>
            </div>

            <button
              type="button"
              className="att-mark-all-btn"
              onClick={handleSelectAllPresent}
              title="Quickly set everyone to Present"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Mark All Present</span>
            </button>
          </section>

          {/* ── FILTER TABS & REALTIME SEARCH ── */}
          <div className="att-filter-search-row">
            <div className="att-filter-tabs" role="tablist">
              <button
                type="button"
                className={`att-filter-tab ${filterView === 'all' ? 'active' : ''}`}
                onClick={() => setFilterView('all')}
              >
                All ({totalCount})
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

            <div className="att-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="att-search-input"
                placeholder="Search student by name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="att-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
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
                  onClick={() => setIsSubmitted(false)}
                >
                  Edit / Re-take
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

          {/* ── STUDENT ATTENDANCE LIST (TAP TO TOGGLE ABSENT/PRESENT) ── */}
          <section className="att-student-list-section" aria-label="Student Attendance Cards">
            <div className="att-list-header-info">
              <span className="att-guide-text">
                💡 Tap on any student card or switch to mark as <strong>Absent</strong>.
              </span>
              <span className="att-showing-count">
                Showing {displayedStudents.length} of {totalCount} students
              </span>
            </div>

            <div className="att-student-grid">
              {displayedStudents.map((student, idx) => {
                const isPresent = (attendanceMap[student.id] || 'PRESENT') === 'PRESENT';
                const displayName = student.full_name || student.name || 'Student';

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
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="att-card-left">
                      <div className={`att-avatar ${isPresent ? 'avatar-present' : 'avatar-absent'}`}>
                        {getInitials(displayName)}
                      </div>
                      <div className="att-student-details">
                        <span className="att-student-name" title={displayName}>
                          {displayName}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {student.phone || student.email || 'Enrolled'}
                        </span>
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
                        aria-label={`Toggle attendance for ${displayName}`}
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

          {/* ── BOTTOM SUBMIT BAR ── */}
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
              disabled={totalCount === 0 || submitting}
            >
              <span>{isPreviouslyMarked ? 'Update Attendance' : 'Submit Attendance'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div
          className="att-modal-overlay"
          onClick={() => setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="att-modal-card" onClick={(e) => e.stopPropagation()}>
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
                  {sessionDetails?.batches?.name} • {sessionDetails?.subject}
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
                    You have marked <strong>{absentCount} student{absentCount > 1 ? 's' : ''}</strong> as <strong>Absent</strong>. Please review before finalizing:
                  </p>
                  <div className="att-absent-chips-list">
                    {absentList.map((st) => (
                      <div key={st.id} className="att-absent-chip">
                        <span className="att-chip-cross">✕</span>
                        <span className="att-chip-name">{st.full_name || st.name}</span>
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
                  <strong>{sessionDetails?.batches?.name}</strong>
                </div>
                <div className="att-mstat-row">
                  <span>Subject:</span>
                  <strong>{sessionDetails?.subject}</strong>
                </div>
                <div className="att-mstat-row">
                  <span>Time:</span>
                  <strong>{formatTime(sessionDetails?.start_time)} - {formatTime(sessionDetails?.end_time)}</strong>
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
                disabled={submitting}
              >
                No, Review List
              </button>
              <button
                type="button"
                className="att-modal-confirm-btn"
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXTRA CLASS SESSION MODAL ── */}
      {showExtraModal && (
        <div
          className="att-modal-overlay"
          onClick={() => setShowExtraModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="att-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header">
              <div className="att-modal-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="att-modal-title-group">
                <h3 className="att-modal-title">Start Extra Class Session</h3>
                <span className="att-modal-subtitle">
                  Create an unscheduled class session on {formattedDate}
                </span>
              </div>
              <button
                type="button"
                className="att-modal-close-btn"
                onClick={() => setShowExtraModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExtraSession} className="att-modal-body">
              {loadingBatches ? (
                <p style={{ textAlign: 'center', color: '#64748B' }}>Loading your assigned batches...</p>
              ) : (
                <>
                  <div className="att-form-group">
                    <label className="att-form-label">Batch</label>
                    <select
                      className="att-form-select"
                      value={extraForm.batch_id}
                      onChange={(e) => {
                        const newBatchId = e.target.value;
                        const match = myBatches.find((b) => b.batch_id === newBatchId);
                        const firstSubj = match?.subjects?.[0];
                        setExtraForm((prev) => ({
                          ...prev,
                          batch_id: newBatchId,
                          subject: firstSubj ? (firstSubj.name || firstSubj) : '',
                        }));
                      }}
                      required
                    >
                      <option value="" disabled>Select Batch</option>
                      {myBatches.map((b) => (
                        <option key={b.batch_id} value={b.batch_id}>
                          {b.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="att-form-group">
                    <label className="att-form-label">Subject</label>
                    <select
                      className="att-form-select"
                      value={extraForm.subject}
                      onChange={(e) => setExtraForm((prev) => ({ ...prev, subject: e.target.value }))}
                      required
                    >
                      <option value="" disabled>Select Subject</option>
                      {activeBatchSubjects.map((s, i) => {
                        const sName = typeof s === 'string' ? s : s.name;
                        return (
                          <option key={i} value={sName}>
                            {sName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="att-form-row">
                    <div className="att-form-group">
                      <label className="att-form-label">Start Time</label>
                      <input
                        type="time"
                        className="att-form-input"
                        value={extraForm.start_time}
                        onChange={(e) => setExtraForm((prev) => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="att-form-group">
                      <label className="att-form-label">End Time</label>
                      <input
                        type="time"
                        className="att-form-input"
                        value={extraForm.end_time}
                        onChange={(e) => setExtraForm((prev) => ({ ...prev, end_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="att-form-group">
                    <label className="att-form-label">Topic Covered (Optional)</label>
                    <input
                      type="text"
                      className="att-form-input"
                      placeholder="e.g. Doubt clearing & numericals"
                      value={extraForm.topic_covered}
                      onChange={(e) => setExtraForm((prev) => ({ ...prev, topic_covered: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="att-modal-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="att-modal-cancel-btn"
                  onClick={() => setShowExtraModal(false)}
                  disabled={creatingExtra}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="att-modal-confirm-btn"
                  style={{ background: '#4F46E5' }}
                  disabled={creatingExtra || loadingBatches}
                >
                  {creatingExtra ? 'Creating...' : 'Create & Start Session'}
                </button>
              </div>
            </form>
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
