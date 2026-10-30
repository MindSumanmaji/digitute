import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api';


export function ExamEvaluation({ onBack, onNavigateToStudentInfo }) {
  // ── VIEW SWITCHER: 'list' (DEFAULT) OR 'form' (CREATE / EVALUATE) ──
  const [view, setView] = useState('list');
  const [editingExamId, setEditingExamId] = useState(null);

  // ── EXAMS LIST STATE ──
  const [examsList, setExamsList] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'scheduled', 'completed', 'draft', 'cancelled'
  const [batchFilter, setBatchFilter] = useState('all');
  const [listSearchQuery, setListSearchQuery] = useState('');

  // ── REAL BATCHES & SUBJECTS STATE ──
  const [batchesList, setBatchesList] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBatchName, setSelectedBatchName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // ── FORM EXAM METADATA (schema.sql Table 11) ──
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [status, setStatus] = useState('scheduled'); // 'scheduled', 'completed', 'draft', 'cancelled'

  // ── REAL STUDENTS ROSTER (FROM DATABASE) ──
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [marksMap, setMarksMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // ── UI STATES ──
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedExamRecord, setSavedExamRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── FETCH EXAMS LIST FROM DATABASE ──
  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await apiRequest('/api/teacher/exams');
      setExamsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load exams list:', err);
      showToast('⚠️ Could not load exams list.');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  // Fetch Teacher's Assigned Batches on Mount
  useEffect(() => {
    let isMounted = true;
    setLoadingBatches(true);
    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setBatchesList(list);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load teacher batches:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBatches(false);
      });

    fetchExams();

    return () => {
      isMounted = false;
    };
  }, [fetchExams]);

  // Current batch object & available subjects
  const currentBatch = useMemo(() => {
    return batchesList.find((b) => b.batch_id === selectedBatchId) || null;
  }, [batchesList, selectedBatchId]);

  const currentSubjects = useMemo(() => {
    if (!currentBatch || !Array.isArray(currentBatch.subjects)) return [];
    return currentBatch.subjects.map((s) => (typeof s === 'string' ? s : s.name || s.subject || ''));
  }, [currentBatch]);

  // Fetch real enrolled active students when Batch and Subject are picked in form
  useEffect(() => {
    if (!selectedBatchId || !selectedSubject) {
      setStudents([]);
      setMarksMap({});
      return;
    }

    let isMounted = true;
    setLoadingStudents(true);
    apiRequest(`/api/teacher/students?batch_id=${selectedBatchId}&subject=${encodeURIComponent(selectedSubject)}`)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setStudents(list);

        setMarksMap((prev) => {
          const map = { ...prev };
          list.forEach((s) => {
            if (!map[s.id]) {
              map[s.id] = { obtainedMarks: '' };
            }
          });
          return map;
        });
        setIsSaved(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch batch students:', err);
        showToast('⚠️ Could not load students for this batch.');
        setStudents([]);
      })
      .finally(() => {
        if (isMounted) setLoadingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatchId, selectedSubject]);

  // ── RESET & OPEN CREATE FORM ──
  const handleOpenCreateForm = () => {
    setEditingExamId(null);
    setSelectedBatchId('');
    setSelectedBatchName('');
    setSelectedSubject('');
    setExamTitle('');
    setExamDate('');
    setStartTime('');
    setEndTime('');
    setDurationMinutes('');
    setTotalMarks('');
    setPassingMarks('');
    setSyllabus('');
    setStatus('scheduled'); // Default for new exams is scheduled
    setMarksMap({});
    setIsSaved(false);
    setSavedExamRecord(null);
    setView('form');
  };

  // ── OPEN EDIT / EVALUATE FORM FOR AN EXISTING EXAM ──
  const handleOpenEditForm = (exam, targetStatus = null) => {
    setEditingExamId(exam.id);
    setSelectedBatchId(exam.batch_id || '');
    const foundBatch = batchesList.find((b) => b.batch_id === exam.batch_id);
    setSelectedBatchName(foundBatch ? foundBatch.batch_name : exam.batches?.name || '');
    setSelectedSubject(exam.subject || '');
    setExamTitle(exam.title || '');
    setExamDate(exam.exam_date || '');
    setStartTime(exam.start_time || '');
    setEndTime(exam.end_time || '');
    setDurationMinutes(exam.duration_minutes ? String(exam.duration_minutes) : '');
    setTotalMarks(exam.total_marks ? String(exam.total_marks) : '');
    setPassingMarks(exam.passing_marks !== null && exam.passing_marks !== undefined ? String(exam.passing_marks) : '');
    setSyllabus(exam.syllabus || '');
    // Automatically switch to completed status when evaluate is clicked
    setStatus(targetStatus || 'completed');

    // Prepopulate marksMap from exam.results
    const map = {};
    (exam.results || []).forEach((r) => {
      map[r.student_id] = {
        obtainedMarks: r.marks_obtained !== null && r.marks_obtained !== undefined ? r.marks_obtained : '',
      };
    });
    setMarksMap(map);
    setIsSaved(false);
    setSavedExamRecord(null);
    setView('form');
  };

  // ── DELETE EXAM ──
  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this exam'}"?`)) return;
    try {
      await apiRequest(`/api/teacher/exams/${examId}`, { method: 'DELETE' });
      showToast('✓ Exam successfully deleted.');
      fetchExams();
    } catch (err) {
      console.error('Failed to delete exam:', err);
      showToast(`⚠️ Delete failed: ${err.message || 'Error'}`);
    }
  };

  const handleBatchChange = (batchId) => {
    const found = batchesList.find((b) => b.batch_id === batchId);
    setSelectedBatchId(batchId);
    setSelectedBatchName(found ? found.batch_name : '');
    setSelectedSubject('');
    setIsSaved(false);
  };

  // ── STATUS CHANGE HANDLER (Controls unlock of marks entry) ──
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setIsSaved(false);
  };

  // Auto-calculate duration in minutes
  const calculateDuration = (start, end) => {
    try {
      if (!start || !end) return;
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) setDurationMinutes(String(diff));
    } catch {
      // ignore
    }
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
    if (val && endTime) calculateDuration(val, endTime);
  };

  const handleEndTimeChange = (val) => {
    setEndTime(val);
    if (startTime && val) calculateDuration(startTime, val);
  };

  const handleMarksChange = (studentId, value) => {
    if (isSaved) return;

    if (value === '') {
      setMarksMap((prev) => ({
        ...prev,
        [studentId]: {
          obtainedMarks: '',
        },
      }));
      return;
    }

    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    if (!totalMarks || Number(totalMarks) <= 0) {
      showToast('⚠️ Please specify Total Marks in Step 1 first.');
      return;
    }
    if (num > Number(totalMarks)) {
      showToast(`Marks cannot exceed Total Marks (${totalMarks})`);
      return;
    }

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        obtainedMarks: num,
      },
    }));
  };

  // Live Statistics Calculation
  const evaluationStats = useMemo(() => {
    let totalEvaluated = 0;
    let sumMarks = 0;
    let highestMarks = 0;
    const numTotal = Number(totalMarks) || 0;

    students.forEach((s) => {
      const entry = marksMap[s.id];
      if (!entry) return;

      if (entry.obtainedMarks !== '' && !isNaN(Number(entry.obtainedMarks))) {
        totalEvaluated++;
        const marks = Number(entry.obtainedMarks);
        sumMarks += marks;
        if (marks > highestMarks) highestMarks = marks;
      }
    });

    const avgMarks = totalEvaluated > 0 ? (sumMarks / totalEvaluated).toFixed(1) : 0;
    const avgPct = numTotal > 0 && totalEvaluated > 0 ? Math.round((sumMarks / (totalEvaluated * numTotal)) * 100) : 0;

    return {
      totalCount: students.length,
      totalEvaluated,
      avgMarks,
      avgPct,
      highestMarks,
    };
  }, [students, marksMap, totalMarks]);

  // Click Submit -> Show Confirmation Modal
  const handleInitiateSubmit = () => {
    if (!selectedBatchId) {
      showToast('⚠️ Please select a Batch.');
      return;
    }
    if (!selectedSubject) {
      showToast('⚠️ Please select a Subject.');
      return;
    }
    if (!examTitle.trim()) {
      showToast('⚠️ Please enter an Exam Title.');
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      showToast('⚠️ Total Exam Marks must be greater than 0.');
      return;
    }
    if (passingMarks && Number(passingMarks) > Number(totalMarks)) {
      showToast('⚠️ Passing Marks cannot exceed Total Marks.');
      return;
    }
    if (startTime && endTime && startTime >= endTime) {
      showToast('⚠️ End Time must be later than Start Time.');
      return;
    }

    // Only validate student marks if status is 'completed'
    if (status === 'completed' && evaluationStats.totalEvaluated === 0) {
      showToast('⚠️ Please enter marks for at least one student before marking as Completed.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Final Confirmation Submit & Save to Supabase
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // If completed, format student results; otherwise empty results array
      const results = status === 'completed'
        ? students.map((s) => {
            const entry = marksMap[s.id] || { obtainedMarks: '' };
            const marks = entry.obtainedMarks === '' ? null : Number(entry.obtainedMarks);
            return {
              student_id: s.id,
              marks_obtained: marks,
            };
          })
        : [];

      const payload = {
        batch_id: selectedBatchId,
        subject: selectedSubject.trim(),
        title: examTitle.trim(),
        syllabus: syllabus.trim() || null,
        exam_date: examDate,
        start_time: startTime || null,
        end_time: endTime || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        total_marks: Number(totalMarks),
        passing_marks: passingMarks ? Number(passingMarks) : null,
        status: status,
        is_published: status !== 'draft' && status !== 'cancelled',
        results_published: status === 'completed',
        results: results,
      };

      let res;
      if (editingExamId) {
        res = await apiRequest(`/api/teacher/exams/${editingExamId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('✓ Exam successfully updated in database!');
      } else {
        res = await apiRequest('/api/teacher/exams', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('✓ Exam successfully saved to database!');
      }

      setSavedExamRecord(res);
      setIsSaved(true);
      setShowConfirmModal(false);
      fetchExams();
    } catch (err) {
      console.error('Failed to submit exam:', err);
      showToast(`⚠️ Failed to save: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  // Filter exams in list view
  const filteredExams = useMemo(() => {
    return examsList.filter((ex) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'scheduled' && ex.status !== 'scheduled') return false;
        if (statusFilter === 'completed' && ex.status !== 'completed') return false;
        if (statusFilter === 'draft' && ex.status !== 'draft') return false;
        if (statusFilter === 'cancelled' && ex.status !== 'cancelled') return false;
      }
      if (batchFilter !== 'all' && ex.batch_id !== batchFilter) return false;
      if (listSearchQuery.trim()) {
        const q = listSearchQuery.toLowerCase();
        const matchesTitle = ex.title && ex.title.toLowerCase().includes(q);
        const matchesSubject = ex.subject && ex.subject.toLowerCase().includes(q);
        const matchesBatch = ex.batches?.name && ex.batches.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesBatch) return false;
      }
      return true;
    });
  }, [examsList, statusFilter, batchFilter, listSearchQuery]);

  // Counts for list view status pills
  const statusCounts = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    let draft = 0;
    let cancelled = 0;
    examsList.forEach((e) => {
      if (e.status === 'scheduled') scheduled++;
      else if (e.status === 'completed') completed++;
      else if (e.status === 'draft') draft++;
      else if (e.status === 'cancelled') cancelled++;
    });
    return {
      all: examsList.length,
      scheduled,
      completed,
      draft,
      cancelled,
    };
  }, [examsList]);

  // Filter students in marks entry roster
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.roll && s.roll.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
    );
  }, [students, searchQuery]);

  const readyToShow = Boolean(selectedBatchId && selectedSubject);
  const isCompleted = status === 'completed';

  return (
    <div className="ee-container">
      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: TEST SERIES DASHBOARD & LIST VIEW (DEFAULT)
          ══════════════════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div className="ee-list-view">
          {/* Top Header Row with "+ Create Exam" button */}
          <div className="ee-list-header">
            <div className="ee-list-title-group">
              <h2>Exam Evaluation &amp; Test Series</h2>
              <p>Upcoming scheduled tests, completed evaluation records, and batch merit standings.</p>
            </div>

            <button
              type="button"
              className="ee-create-exam-btn"
              onClick={handleOpenCreateForm}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Exam</span>
            </button>
          </div>

          {/* Filters & Status Pills Toolbar */}
          <div className="ee-filters-toolbar">
            {/* Status Pills */}
            <div className="ee-status-pills" role="tablist">
              <button
                type="button"
                className={`ee-filter-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Tests ({statusCounts.all})
              </button>
              <button
                type="button"
                className={`ee-filter-pill ${statusFilter === 'scheduled' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('scheduled')}
              >
                🗓️ Upcoming / Scheduled ({statusCounts.scheduled})
              </button>
              <button
                type="button"
                className={`ee-filter-pill ${statusFilter === 'completed' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                ✓ Completed / Evaluated ({statusCounts.completed})
              </button>
              <button
                type="button"
                className={`ee-filter-pill ${statusFilter === 'draft' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('draft')}
              >
                Drafts ({statusCounts.draft})
              </button>
              {statusCounts.cancelled > 0 && (
                <button
                  type="button"
                  className={`ee-filter-pill ${statusFilter === 'cancelled' ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled ({statusCounts.cancelled})
                </button>
              )}
            </div>

            {/* Batch Filter & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="ee-select-wrap" style={{ minWidth: '170px' }}>
                <select
                  className="ee-select"
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  style={{ padding: '7px 28px 7px 12px', fontSize: '0.8rem' }}
                >
                  <option value="all">All Batches</option>
                  {batchesList.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.batch_name}
                    </option>
                  ))}
                </select>
                <div className="ee-caret" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>

              <div className="ee-search-input-wrap" style={{ maxWidth: '240px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ee-search-input"
                  placeholder="Search exam or subject..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  style={{ padding: '7px 12px 7px 32px', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingExams ? (
            <div className="ee-select-prompt" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <h3 className="ee-prompt-title">Loading Exams &amp; Test Series...</h3>
              <p className="ee-prompt-desc">Fetching examination schedules and evaluation records from database.</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="ee-select-prompt" style={{ minHeight: '280px' }}>
              <div className="ee-prompt-icon" aria-hidden="true" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="ee-prompt-title">No Exams Found</h3>
              <p className="ee-prompt-desc">
                {statusFilter !== 'all' || batchFilter !== 'all' || listSearchQuery
                  ? 'No examinations match your current filters.'
                  : 'You have not created any tests or exams yet.'}
              </p>
              <button
                type="button"
                className="ee-create-exam-btn"
                style={{ marginTop: '12px' }}
                onClick={handleOpenCreateForm}
              >
                + Create First Exam
              </button>
            </div>
          ) : (
            <div className="ee-exams-grid">
              {filteredExams.map((exam) => {
                const batchName = exam.batches?.name || batchesList.find((b) => b.batch_id === exam.batch_id)?.batch_name || 'Assigned Batch';
                const resultsArr = Array.isArray(exam.results) ? exam.results : [];
                const evaluatedCount = resultsArr.filter((r) => r.marks_obtained !== null && r.marks_obtained !== undefined).length;

                return (
                  <div key={exam.id} className="ee-exam-card">
                    {/* Top Row: Badges & Status */}
                    <div className="ee-card-top-row">
                      <div className="ee-card-badges">
                        <span className="ee-tag-batch">{batchName}</span>
                        <span className="ee-tag-subject">{exam.subject}</span>
                      </div>

                      <span
                        className={`ee-card-status-badge ${
                          exam.status === 'completed'
                            ? 'ee-badge-completed'
                            : exam.status === 'scheduled'
                            ? 'ee-badge-scheduled'
                            : exam.status === 'draft'
                            ? 'ee-badge-draft'
                            : 'ee-badge-cancelled'
                        }`}
                      >
                        {exam.status === 'completed' ? '✓ Completed' : exam.status === 'scheduled' ? '🗓️ Scheduled' : exam.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="ee-card-title">{exam.title}</h3>

                    {/* Syllabus / Topics if provided */}
                    {exam.syllabus && (
                      <div className="ee-card-syllabus" title={exam.syllabus}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exam.syllabus}
                        </span>
                      </div>
                    )}

                    {/* Exam Timing & Marks Details */}
                    <div className="ee-card-details-grid">
                      <div className="ee-card-detail-item">
                        <span>Exam Date</span>
                        <strong>{exam.exam_date}</strong>
                      </div>
                      <div className="ee-card-detail-item">
                        <span>Total Marks</span>
                        <strong>{exam.total_marks} {exam.passing_marks ? `(Pass: ${exam.passing_marks})` : ''}</strong>
                      </div>
                      <div className="ee-card-detail-item">
                        <span>Time / Duration</span>
                        <strong>
                          {exam.start_time ? exam.start_time.slice(0, 5) : '—'}
                          {exam.duration_minutes ? ` (${exam.duration_minutes}m)` : ''}
                        </strong>
                      </div>
                      <div className="ee-card-detail-item">
                        <span>Evaluation</span>
                        <strong style={{ color: evaluatedCount > 0 ? '#16A34A' : '#64748B' }}>
                          {evaluatedCount} Evaluated
                        </strong>
                      </div>
                    </div>

                    {/* Publish status pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#64748B' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {exam.is_published ? '🟢 Notice Live' : '⚪ Notice Hidden'}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {exam.results_published ? '🏆 Results Live' : '🔒 Results Pending'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="ee-card-actions">
                      <button
                        type="button"
                        className="ee-btn-evaluate"
                        onClick={() => handleOpenEditForm(exam, 'completed')}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>{exam.status === 'completed' ? 'View / Edit Marks' : 'Enter Marks & Evaluate'}</span>
                      </button>

                      <button
                        type="button"
                        className="ee-btn-delete-card"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        title="Delete Exam Record"
                        aria-label="Delete Exam"
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: CREATE / EVALUATE FORM VIEW
          ══════════════════════════════════════════════════════════════════════ */}
      {view === 'form' && (
        <div className="ee-form-view">
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              type="button"
              className="ee-back-btn"
              onClick={() => {
                setView('list');
                fetchExams();
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to All Exams</span>
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>
              {editingExamId ? 'Editing Exam Record' : 'New Exam Setup & Evaluation'}
            </span>
          </div>

          {/* ── STEP 1: EXAM SETUP INPUTS (ACCORDING TO schema.sql Table 11) ── */}
          <section className="ee-setup-card" aria-label="Exam Parameters">
            <div className="ee-setup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="ee-step-badge">Step 1</div>
                <h2 className="ee-setup-heading">
                  {editingExamId ? 'Edit Exam Setup & Configuration' : 'Exam Setup & Configuration'}
                </h2>
              </div>
            </div>

            <div className="ee-setup-grid">
              {/* 1. Select Batch */}
              <div className="ee-input-group">
                <label htmlFor="ee-batch-select" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <span>Batch *</span>
                </label>
                <div className="ee-select-wrap">
                  <select
                    id="ee-batch-select"
                    className="ee-select"
                    value={selectedBatchId}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    disabled={loadingBatches}
                  >
                    <option value="" disabled>
                      {loadingBatches ? 'Loading batches...' : '— Select Batch —'}
                    </option>
                    {batchesList.map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>
                        {b.batch_name}
                      </option>
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
                  <span>Subject *</span>
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
                    disabled={!selectedBatchId}
                  >
                    <option value="" disabled>
                      {selectedBatchId ? '— Select Subject —' : '— Select Batch First —'}
                    </option>
                    {currentSubjects.map((s, idx) => (
                      <option key={`${s}-${idx}`} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="ee-caret" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>

              {/* 3. Exam Title */}
              <div className="ee-input-group">
                <label htmlFor="ee-title-input" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>Exam Title *</span>
                </label>
                <input
                  id="ee-title-input"
                  type="text"
                  className="ee-text-input"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Weekly Test #3 - Thermodynamics"
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
                  <span>Exam Date *</span>
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
                  <span>Total Marks *</span>
                </label>
                <div className="ee-total-input-wrap">
                  <input
                    id="ee-total-marks"
                    type="number"
                    min="1"
                    step="0.5"
                    className="ee-number-input"
                    placeholder="e.g. 100"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                  />
                  <span className="ee-marks-unit">Marks</span>
                </div>
              </div>

              {/* 6. Passing Marks */}
              <div className="ee-input-group">
                <label htmlFor="ee-pass-marks" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Pass Marks</span>
                </label>
                <div className="ee-total-input-wrap">
                  <input
                    id="ee-pass-marks"
                    type="number"
                    min="0"
                    max={totalMarks ? Number(totalMarks) : undefined}
                    step="0.5"
                    className="ee-number-input"
                    placeholder="e.g. 40"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                  />
                  <span className="ee-marks-unit">Cutoff</span>
                </div>
              </div>

              {/* 7. Start Time */}
              <div className="ee-input-group">
                <label htmlFor="ee-start-time" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Start Time</span>
                </label>
                <input
                  id="ee-start-time"
                  type="time"
                  className="ee-date-input"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>

              {/* 8. End Time */}
              <div className="ee-input-group">
                <label htmlFor="ee-end-time" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>End Time</span>
                </label>
                <input
                  id="ee-end-time"
                  type="time"
                  className="ee-date-input"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
              </div>

              {/* 9. Duration (Minutes) */}
              <div className="ee-input-group">
                <label htmlFor="ee-duration" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 10" />
                  </svg>
                  <span>Duration</span>
                </label>
                <div className="ee-total-input-wrap">
                  <input
                    id="ee-duration"
                    type="number"
                    min="1"
                    className="ee-number-input"
                    placeholder="Minutes"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  <span className="ee-marks-unit">Mins</span>
                </div>
              </div>

              {/* 10. Syllabus / Topics Covered */}
              <div className="ee-input-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="ee-syllabus" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <span>Syllabus / Topics Covered</span>
                </label>
                <input
                  id="ee-syllabus"
                  type="text"
                  className="ee-text-input"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="e.g. Chapters 1 &amp; 2: Electrostatics and Current Electricity"
                />
              </div>

              {/* 11. Workflow Status (Trigger for Marks Entry Visibility) */}
              <div className="ee-input-group">
                <label htmlFor="ee-status" className="ee-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Status *</span>
                </label>
                <div className="ee-select-wrap">
                  <select
                    id="ee-status"
                    className="ee-select"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{
                      borderColor: status === 'completed' ? '#16A34A' : status === 'cancelled' ? '#EF4444' : '#2563EB',
                      color: status === 'completed' ? '#15803D' : status === 'cancelled' ? '#DC2626' : '#1E293B',
                      fontWeight: 700,
                    }}
                  >
                    {editingExamId ? (
                      <>
                        <option value="completed">✓ Completed (Evaluated)</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="scheduled">🗓️ Scheduled (Upcoming)</option>
                        <option value="draft">Draft</option>
                      </>
                    )}
                  </select>
                  <div className="ee-caret" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CONDITIONAL SECTION: SELECT BATCH FIRST OR MARKS ENTRY UNLOCK ── */}
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
                Please choose a Batch and Subject in Step 1 above to load the live enrolled student roster from the database.
              </p>
            </div>
          ) : !isCompleted ? (
            <>
              {/* ── LOCKED MARKS ENTRY BANNER FOR SCHEDULED / DRAFT TESTS ── */}
              <div className="ee-select-prompt" style={{ background: '#FFFFFF', border: '1.5px dashed #CBD5E1', padding: '36px 24px', borderRadius: '16px', margin: '20px 0' }}>
                <div
                  className="ee-prompt-icon"
                  style={{
                    background: status === 'scheduled' ? '#EFF6FF' : '#F1F5F9',
                    color: status === 'scheduled' ? '#2563EB' : '#64748B',
                    fontSize: '1.5rem',
                  }}
                >
                  {status === 'scheduled' ? '🗓️' : status === 'draft' ? '📝' : '⚠️'}
                </div>
                <h3 className="ee-prompt-title" style={{ marginTop: '12px' }}>
                  {status === 'scheduled'
                    ? 'Exam Scheduled (Upcoming Test)'
                    : status === 'draft'
                    ? 'Exam Saved as Draft'
                    : 'Exam Cancelled'}
                </h3>
                <p className="ee-prompt-desc" style={{ maxWidth: '580px', margin: '6px auto 18px', lineHeight: '1.5' }}>
                  {status === 'scheduled'
                    ? 'This exam is scheduled for upcoming delivery and visible to students if published. The student roster and marks assignment will automatically appear once the exam status is set to "Completed (Evaluated)".'
                    : status === 'draft'
                    ? 'This exam is currently a draft. You can schedule or publish it whenever ready.'
                    : 'This exam has been marked as Cancelled.'}
                </p>
                <div style={{
                  background: '#F8FAFC',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.84rem',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>💡 Exam conducted already?</span>
                  <span>Switch Status above to <strong>"Completed (Evaluated)"</strong> to enter marks.</span>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('completed')}
                    style={{
                      padding: '6px 14px',
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Completed &amp; Assign Marks →
                  </button>
                </div>
              </div>

              {/* ── STICKY BOTTOM SUBMIT BAR FOR SCHEDULED / DRAFT ── */}
              <footer className="ee-bottom-submit-bar">
                <div className="ee-bottom-info">
                  <div className="ee-evaluated-summary">
                    <span>Status: </span>
                    <strong style={{ color: status === 'scheduled' ? '#2563EB' : status === 'cancelled' ? '#DC2626' : '#64748B' }}>
                      {status === 'scheduled' ? '🗓️ Scheduled (Upcoming)' : status === 'draft' ? 'Draft' : status === 'cancelled' ? '⚠️ Cancelled' : status}
                    </strong>
                  </div>
                  <span className="ee-batch-tag">{selectedBatchName} • {selectedSubject}</span>
                </div>

                <button
                  type="button"
                  className="ee-submit-results-btn"
                  onClick={handleInitiateSubmit}
                  disabled={isSubmitting}
                  style={{ background: status === 'cancelled' ? '#DC2626' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                >
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : editingExamId && status === 'cancelled'
                      ? 'Confirm & Cancel Exam'
                      : editingExamId
                      ? 'Update Exam Record'
                      : 'Save & Schedule Exam'}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </footer>
            </>
          ) : loadingStudents ? (
            <div className="ee-select-prompt">
              <div style={{ fontSize: '1.8rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <h3 className="ee-prompt-title">Loading Enrolled Students...</h3>
              <p className="ee-prompt-desc">Fetching enrolled students for {selectedBatchName} from database.</p>
            </div>
          ) : students.length === 0 ? (
            <div className="ee-select-prompt">
              <div className="ee-prompt-icon" aria-hidden="true" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="ee-prompt-title">No Students Enrolled</h3>
              <p className="ee-prompt-desc">There are no active enrolled students found in {selectedBatchName}.</p>
            </div>
          ) : (
            <>
              {/* ── LIVE PERFORMANCE ANALYTICS / SUMMARY (ONLY WHEN COMPLETED) ── */}
              <section className="ee-stats-bar" aria-label="Live Class Statistics">
                <div className="ee-stat-card">
                  <span className="ee-stat-title">Evaluated</span>
                  <span className="ee-stat-number green">{evaluationStats.totalEvaluated} / {evaluationStats.totalCount}</span>
                </div>

                <div className="ee-stat-card">
                  <span className="ee-stat-title">Class Average</span>
                  <span className="ee-stat-number blue">
                    {evaluationStats.avgMarks} <small>/ {totalMarks || '—'} ({evaluationStats.avgPct}%)</small>
                  </span>
                </div>

                <div className="ee-stat-card">
                  <span className="ee-stat-title">Highest Score</span>
                  <span className="ee-stat-number purple">
                    {evaluationStats.highestMarks} <small>/ {totalMarks || '—'}</small>
                  </span>
                </div>
              </section>

              {/* ── SUCCESS NOTIFICATION CARD IF SAVED TO DATABASE ── */}
              {isSaved && savedExamRecord && (
                <div className="ee-saved-card">
                  <div className="ee-saved-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="ee-saved-content">
                    <h3 className="ee-saved-title">Exam Performance Successfully Saved to Database!</h3>
                    <p className="ee-saved-desc">
                      Exam <strong>{savedExamRecord.title || examTitle}</strong> records have been stored in Supabase for <strong>{selectedBatchName}</strong>.
                    </p>
                    <div className="ee-saved-actions">
                      <button
                        type="button"
                        className="ee-btn-primary"
                        onClick={() => {
                          setView('list');
                          fetchExams();
                        }}
                      >
                        ← View in Exams List
                      </button>
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

              {/* ── STEP 2: STUDENT MARKS ENTRY LIST (ONLY WHEN COMPLETED) ── */}
              <section className="ee-roster-section" aria-label="Student Marks Evaluation Roster">
                <div className="ee-roster-header">
                  <div className="ee-roster-title-group">
                    <div className="ee-step-badge">Step 2</div>
                    <h2 className="ee-roster-heading">Student Marks Entry</h2>
                    <span className="ee-roster-sub">
                      Enter obtained marks for each enrolled student. Total marks ({totalMarks || '—'}) is read-only.
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
                      placeholder="Search student by name or roll..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Student Marks List Table */}
                <div className="ee-table-container">
                  <table className="ee-table">
                    <thead>
                      <tr>
                        <th className="th-idx">#</th>
                        <th className="th-student">Student Name</th>
                        <th className="th-marks">Obtained Marks &amp; Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const entry = marksMap[student.id] || { obtainedMarks: '' };

                        return (
                          <tr
                            key={student.id}
                            className="ee-table-row"
                            style={{ animationDelay: `${idx * 25}ms` }}
                          >
                            {/* Index */}
                            <td className="td-idx">
                              <span className="ee-idx-badge">{idx + 1}</span>
                            </td>

                            {/* Student Info */}
                            <td className="td-student">
                              <div className="ee-student-cell">
                                <div className="ee-avatar">
                                  {student.avatar_url ? (
                                    <img
                                      src={student.avatar_url}
                                      alt={student.name}
                                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    getInitials(student.name)
                                  )}
                                </div>
                                <div className="ee-student-info">
                                  <span className="ee-name">{student.name}</span>
                                  {student.roll && (
                                    <span className="ee-roll">{student.roll}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Obtained Marks Input & Read-only Total Marks */}
                            <td className="td-marks">
                              <div className="ee-marks-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  max={totalMarks ? Number(totalMarks) : undefined}
                                  step="0.5"
                                  placeholder="Marks"
                                  className="ee-marks-input"
                                  value={entry.obtainedMarks}
                                  onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                  disabled={isSaved}
                                  aria-label={`Obtained marks for ${student.name}`}
                                />

                                {/* Strictly Read-Only Total Marks Display */}
                                <div className="ee-total-readonly-badge" title="Total Exam Marks (Read-Only)">
                                  <span className="ee-slash">/</span>
                                  <span className="ee-total-val">{totalMarks || '—'}</span>
                                </div>
                              </div>
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

              {/* ── STICKY BOTTOM SUBMIT BAR FOR COMPLETED EVALUATIONS ── */}
              <footer className="ee-bottom-submit-bar">
                <div className="ee-bottom-info">
                  <div className="ee-evaluated-summary">
                    <strong>{evaluationStats.totalEvaluated}</strong> of {evaluationStats.totalCount} Evaluated
                  </div>
                  <span className="ee-batch-tag">{selectedBatchName} • {selectedSubject}</span>
                </div>

                <button
                  type="button"
                  className="ee-submit-results-btn"
                  onClick={handleInitiateSubmit}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Saving...' : editingExamId ? 'Update Exam & Marks' : 'Submit & Save to Database'}</span>
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
              onClick={() => !isSubmitting && setShowConfirmModal(false)}
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
                    <h3 className="ee-modal-title">
                      {isCompleted ? 'Confirm Exam Results Submission' : 'Confirm Exam Schedule'}
                    </h3>
                    <span className="ee-modal-sub">{examTitle} • {selectedBatchName}</span>
                  </div>
                  <button
                    type="button"
                    className="ee-mclose-btn"
                    onClick={() => !isSubmitting && setShowConfirmModal(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="ee-modal-body">
                  <p className="ee-modal-intro">
                    {isCompleted
                      ? 'Please verify the exam parameters and evaluated summary below. Upon confirmation, marks will be saved to the database.'
                      : 'Please verify the exam schedule parameters below. Upon confirmation, the upcoming test will be scheduled in the system.'}
                  </p>

                  <div className="ee-modal-data-card">
                    <div className="ee-mdata-row">
                      <span>Batch &amp; Subject:</span>
                      <strong>{selectedBatchName} • {selectedSubject}</strong>
                    </div>
                    <div className="ee-mdata-row">
                      <span>Exam Title:</span>
                      <strong>{examTitle}</strong>
                    </div>
                    <div className="ee-mdata-row">
                      <span>Exam Date:</span>
                      <strong>{examDate}</strong>
                    </div>
                    {syllabus && (
                      <div className="ee-mdata-row">
                        <span>Syllabus:</span>
                        <strong>{syllabus}</strong>
                      </div>
                    )}
                    <div className="ee-mdata-row">
                      <span>Total Exam Marks:</span>
                      <strong>{totalMarks} {passingMarks ? `(Pass: ${passingMarks})` : ''}</strong>
                    </div>
                    <div className="ee-mdata-row">
                      <span>Status:</span>
                      <strong style={{ color: isCompleted ? '#16A34A' : '#2563EB' }}>
                        {isCompleted ? '✓ Completed' : status === 'scheduled' ? '🗓️ Scheduled' : status}
                      </strong>
                    </div>

                    {isCompleted && (
                      <>
                        <div className="ee-mdata-row">
                          <span>Enrolled Students:</span>
                          <strong>{evaluationStats.totalCount}</strong>
                        </div>
                        <div className="ee-mdata-row highlight">
                          <span>Evaluated Count:</span>
                          <strong className="green">{evaluationStats.totalEvaluated} / {evaluationStats.totalCount}</strong>
                        </div>
                        <div className="ee-mdata-row highlight">
                          <span>Class Average Score:</span>
                          <strong className="blue">{evaluationStats.avgMarks} / {totalMarks || '—'} ({evaluationStats.avgPct}%)</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="ee-modal-actions">
                  <button
                    type="button"
                    className="ee-modal-btn-cancel"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isSubmitting}
                  >
                    Review &amp; Edit
                  </button>
                  <button
                    type="button"
                    className="ee-modal-btn-confirm"
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Saving to Database...'
                      : isCompleted
                      ? (editingExamId ? 'Confirm & Update Marks' : 'Confirm & Save Results')
                      : (editingExamId ? 'Confirm & Update Schedule' : 'Confirm & Schedule Exam')}
                  </button>
                </div>
              </div>
            </div>
          )}
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
