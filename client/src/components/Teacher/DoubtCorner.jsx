import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../../api';
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
  const [batchesList, setBatchesList] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [batchesError, setBatchesError] = useState(null);

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

  // Open attachment directly in a new tab
  const handleOpenAttachment = (att) => {
    if (!att || !att.url) {
      showToast('⚠️ Attachment link not available.');
      return;
    }
    window.open(att.url, '_blank', 'noopener,noreferrer');
  };

  // Quick offline note prompt modal
  const [offlineModalDoubt, setOfflineModalDoubt] = useState(null);
  const [offlineNoteInput, setOfflineNoteInput] = useState('');
  const [resolvingDoubtId, setResolvingDoubtId] = useState(null);


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

  // Fetch teacher's assigned batches & subjects from Supabase via backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoadingBatches(true);
    setBatchesError(null);

    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setBatchesList(data);
          if (initialBatch) {
            const matched = data.find(
              (b) => b.batch_id === initialBatch || b.batch_name === initialBatch
            );
            if (matched) {
              setSelectedBatch(matched.batch_id);
              if (initialSubject) {
                const subjs = (matched.subjects || []).map((s) =>
                  typeof s === 'string' ? s : s.name
                );
                if (subjs.includes(initialSubject)) {
                  setSelectedSubject(initialSubject);
                }
              }
            }
          }
        } else {
          setBatchesList([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load teacher batches:', err);
        setBatchesError('Failed to load assigned batches from server.');
        setBatchesList([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBatches(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialBatch, initialSubject]);

  // Available subjects for the selected batch assigned to this teacher
  const availableSubjects = useMemo(() => {
    if (!selectedBatch) return [];
    const currentBatch = batchesList.find(
      (b) => b.batch_id === selectedBatch || b.batch_name === selectedBatch
    );
    if (!currentBatch || !currentBatch.subjects) return [];
    return currentBatch.subjects
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
  }, [batchesList, selectedBatch]);

  // Human-friendly batch label for headers and status tags
  const selectedBatchLabel = useMemo(() => {
    const found = batchesList.find(
      (b) => b.batch_id === selectedBatch || b.batch_name === selectedBatch
    );
    return found ? found.batch_name : selectedBatch;
  }, [batchesList, selectedBatch]);

  // Is batch and subject selection complete?
  const isSelectionComplete = Boolean(selectedBatch && selectedSubject);

  // Live doubts from backend database
  const [liveDoubts, setLiveDoubts] = useState([]);
  const [isLoadingDoubts, setIsLoadingDoubts] = useState(false);
  const [doubtsError, setDoubtsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch doubts for selected batch and subject from backend API
  const fetchLiveDoubts = useCallback(async () => {
    if (!selectedBatch || !selectedSubject) {
      setLiveDoubts([]);
      return;
    }
    setIsLoadingDoubts(true);
    setDoubtsError(null);
    try {
      const data = await apiRequest(
        `/api/teacher/doubts?batch_id=${encodeURIComponent(selectedBatch)}&subject=${encodeURIComponent(selectedSubject)}`
      );
      if (Array.isArray(data)) {
        setLiveDoubts(data);
      } else {
        setLiveDoubts([]);
      }
    } catch (err) {
      console.error('Failed to fetch doubts:', err);
      setDoubtsError(err.message || 'Failed to load doubts.');
      setLiveDoubts([]);
    } finally {
      setIsLoadingDoubts(false);
    }
  }, [selectedBatch, selectedSubject]);

  useEffect(() => {
    if (isSelectionComplete) {
      fetchLiveDoubts();
    } else {
      setLiveDoubts([]);
    }
  }, [isSelectionComplete, fetchLiveDoubts, refreshKey]);

  // Format live backend database records into Doubt Corner UI models
  const formattedDoubts = useMemo(() => {
    return liveDoubts.map((d) => {
      const studentName = d.student?.full_name || 'Student';
      const initials = studentName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST';

      let attachment = null;
      if (d.question_file_url) {
        const rawName = d.question_file_url.split('/').pop() || 'Attachment';
        const cleanName = rawName.replace(/^[a-f0-9]+_/, '');
        const isImg = /\.(png|jpe?g|webp|gif)($|\?)/i.test(d.question_file_url) || /\.(png|jpe?g|webp|gif)$/i.test(cleanName);
        const isPdf = /\.pdf($|\?)/i.test(d.question_file_url) || /\.pdf$/i.test(cleanName);
        attachment = {
          name: cleanName,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
          isImg,
          isPdf,
          url: d.question_file_signed_url || d.question_file_url,
          size: isPdf ? 'PDF Document' : isImg ? 'Image' : 'Document',
        };
      }

      let teacherAttachment = null;
      if (d.reply_file_url) {
        const rawName = d.reply_file_url.split('/').pop() || 'Solution';
        const cleanName = rawName.replace(/^[a-f0-9]+_/, '');
        const isImg = /\.(png|jpe?g|webp|gif)($|\?)/i.test(d.reply_file_url) || /\.(png|jpe?g|webp|gif)$/i.test(cleanName);
        const isPdf = /\.pdf($|\?)/i.test(d.reply_file_url) || /\.pdf$/i.test(cleanName);
        teacherAttachment = {
          name: cleanName,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
          isImg,
          isPdf,
          url: d.reply_file_signed_url || d.reply_file_url,
          size: isPdf ? 'PDF Solution' : isImg ? 'Solution Image' : 'Solution File',
        };
      }

      const createdDate = d.created_at
        ? new Date(d.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      const resolvedDate = d.resolved_at
        ? new Date(d.resolved_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      let status = 'pending';
      if (d.status === 'RESOLVED') status = 'solved';
      else if (d.status === 'OFFLINE_PENDING') status = 'offline';

      const isOfflineResolved =
        d.reply_text?.toLowerCase().includes('classroom') ||
        d.reply_text?.toLowerCase().includes('offline');

      return {
        id: d.id,
        studentId: d.student_id,
        studentName: studentName,
        studentEmail: d.student?.email || '',
        avatarInitials: initials,
        rollNumber: d.student?.email ? d.student.email.split('@')[0] : 'N/A',
        batch: d.batches?.name || selectedBatchLabel,
        batch_id: d.batch_id,
        subject: d.subject,
        questionTitle: d.question_title,
        questionText: d.question_text,
        attachment,
        createdAt: createdDate,
        askedAt: createdDate,
        status,
        rawStatus: d.status,
        teacherAnswer: d.reply_text || '',
        teacherAttachment,
        offlineMarkedAt: status === 'offline' ? createdDate : null,
        offlineNotes: d.reply_text || '',
        solvedAt: resolvedDate,
        resolutionType: isOfflineResolved ? 'offline' : 'online',
      };
    });
  }, [liveDoubts, selectedBatchLabel]);

  // Tab 1: Group pending doubts by student
  const groupedPending = useMemo(() => {
    const pendingList = formattedDoubts.filter((d) => d.status === 'pending');
    const map = {};
    pendingList.forEach((d) => {
      if (!map[d.studentId]) {
        map[d.studentId] = {
          studentId: d.studentId,
          studentName: d.studentName,
          avatarInitials: d.avatarInitials,
          rollNumber: d.rollNumber,
          batch: d.batch,
          subject: d.subject,
          questions: [],
        };
      }
      map[d.studentId].questions.push(d);
    });
    return Object.values(map);
  }, [formattedDoubts]);

  // Tab 2: Offline-marked doubts
  const offlineDoubts = useMemo(() => {
    return formattedDoubts.filter((d) => d.status === 'offline');
  }, [formattedDoubts]);

  // Tab 3: Solved doubts
  const solvedDoubts = useMemo(() => {
    return formattedDoubts.filter((d) => d.status === 'solved');
  }, [formattedDoubts]);

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
      if (file.size > 15 * 1024 * 1024) {
        setFormError('File size must be under 15MB');
        return;
      }
      setAttachedFile(file);
      const isImg = file.type.startsWith('image/');
      setAttachedFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        isImg,
        url: isImg ? URL.createObjectURL(file) : null,
      });
      setFormError('');
    }
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
  };

  // Action: Submit Answer for current question to database
  const handleSubmitAnswer = async () => {
    if (isSubmitting) return;
    if (!answerText.trim()) {
      setFormError('Please enter your answer explanation before submitting.');
      return;
    }
    if (wordCount > 200) {
      setFormError('Answer cannot exceed 200 words. Please shorten your answer.');
      return;
    }
    if (!currentQuestion) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      let replyFileUrl = null;
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const uploadRes = await apiRequest('/api/teacher/doubts/upload-attachment', {
          method: 'POST',
          body: formData,
        });
        replyFileUrl = uploadRes.file_url;
      }

      await apiRequest('/api/teacher/doubts/resolve', {
        method: 'POST',
        body: JSON.stringify({
          doubt_id: currentQuestion.id,
          status: 'RESOLVED',
          reply_text: answerText.trim(),
          reply_file_url: replyFileUrl,
        }),
      });

      showToast('Answer submitted and doubt marked as solved!');

      setAnswerText('');
      setAttachedFile(null);
      setAttachedFilePreview(null);
      setFormError('');

      await fetchLiveDoubts();
      window.dispatchEvent(new CustomEvent('digitute_doubts_updated'));

      if (currentQuestionIndex < activeStudentQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          handleCloseSolver();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit solution:', err);
      setFormError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Mark current question as Offline in database
  const handleMarkAsOffline = async () => {
    if (isSubmitting || !currentQuestion) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      await apiRequest('/api/teacher/doubts/resolve', {
        method: 'POST',
        body: JSON.stringify({
          doubt_id: currentQuestion.id,
          status: 'OFFLINE_PENDING',
          reply_text: 'Marked for discussion in classroom session.',
        }),
      });

      showToast('Moved to Offline Mark Doubt section.');

      setAnswerText('');
      setAttachedFile(null);
      setAttachedFilePreview(null);
      setFormError('');

      await fetchLiveDoubts();
      window.dispatchEvent(new CustomEvent('digitute_doubts_updated'));

      if (currentQuestionIndex < activeStudentQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          handleCloseSolver();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to mark offline:', err);
      setFormError(err.message || 'Failed to mark doubt as offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Offline modal submit
  const handleConfirmOfflineModal = async () => {
    if (offlineModalDoubt && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await apiRequest('/api/teacher/doubts/resolve', {
          method: 'POST',
          body: JSON.stringify({
            doubt_id: offlineModalDoubt.id,
            status: 'OFFLINE_PENDING',
            reply_text: offlineNoteInput || 'Marked for discussion in next lecture.',
          }),
        });
        showToast('Moved to Offline Mark Doubt section.');
        setOfflineModalDoubt(null);
        setOfflineNoteInput('');
        await fetchLiveDoubts();
        window.dispatchEvent(new CustomEvent('digitute_doubts_updated'));
      } catch (err) {
        showToast(err.message || 'Failed to mark doubt as offline.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Action: Mark offline doubt resolved in class
  const handleResolveOfflineInClass = async (doubtId) => {
    if (resolvingDoubtId || isSubmitting) return;
    setResolvingDoubtId(doubtId);
    try {
      await apiRequest('/api/teacher/doubts/resolve', {
        method: 'POST',
        body: JSON.stringify({
          doubt_id: doubtId,
          status: 'RESOLVED',
          reply_text: 'Resolved during offline classroom discussion.',
        }),
      });
      showToast('✓ Marked as resolved in classroom!');
      await fetchLiveDoubts();
      window.dispatchEvent(new CustomEvent('digitute_doubts_updated'));
    } catch (err) {
      showToast(err.message || 'Failed to resolve doubt.');
    } finally {
      setResolvingDoubtId(null);
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
                  disabled={isLoadingBatches || (batchesList.length === 0 && !batchesError)}
                >
                  <option value="">
                    {isLoadingBatches
                      ? '-- Loading Batches... --'
                      : batchesError
                      ? '-- Error Loading Batches --'
                      : batchesList.length === 0
                      ? '-- No Batches Assigned --'
                      : '-- Select Batch --'}
                  </option>
                  {batchesList.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.batch_name}
                    </option>
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
                  disabled={!selectedBatch || availableSubjects.length === 0}
                >
                  <option value="">
                    {!selectedBatch
                      ? '-- Select Batch First --'
                      : availableSubjects.length === 0
                      ? '-- No Subjects Assigned --'
                      : '-- Select Subject --'}
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
            {batchesError ? (
              <span className="dc-status-hint" style={{ color: '#DC2626' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {batchesError}
              </span>
            ) : isSelectionComplete ? (
              <span className="dc-status-active">
                <span className="dc-pulse-dot" />
                Active: <strong>{selectedBatchLabel}</strong> &bull; <strong>{selectedSubject}</strong>
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
                    All doubts for <strong>{selectedBatchLabel}</strong> ({selectedSubject}) have been solved or marked for classroom offline discussion.
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
                        onClick={() => handleOpenAttachment(currentQuestion.attachment)}
                        role="button"
                        tabIndex={0}
                        title="Click to open attachment in new tab"
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
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              <span>Open in New Tab</span>
                            </div>
                          </div>
                        )}

                        <div className="dc-att-info-box">
                          <span className="dc-att-name">{currentQuestion.attachment.name}</span>
                          <span className="dc-att-size">{currentQuestion.attachment.size}</span>
                          <span className="dc-att-action-tag">Open in New Tab ↗</span>
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
                    There are no doubts marked for classroom discussion in <strong>{selectedBatchLabel}</strong> &bull; {selectedSubject}.
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
                          onClick={() => handleOpenAttachment(d.attachment)}
                          role="button"
                          tabIndex={0}
                          title="Open student attachment in new tab"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          <span>{d.attachment.name}</span>
                          <span className="dc-att-action-tag">Open in New Tab ↗</span>
                        </div>
                      )}

                      <div className="dc-offline-footer">
                        <button
                          type="button"
                          className="dc-resolve-offline-btn"
                          disabled={resolvingDoubtId === d.id}
                          onClick={() => handleResolveOfflineInClass(d.id)}
                        >
                          {resolvingDoubtId === d.id ? (
                            <span>Resolving...</span>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Mark Resolved in Class</span>
                            </>
                          )}
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
                    No resolved doubts yet for <strong>{selectedBatchLabel}</strong> &bull; {selectedSubject}.
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
                          onClick={() => handleOpenAttachment(d.attachment)}
                          role="button"
                          tabIndex={0}
                          title="Open student attachment in new tab"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          <span>Student Doc: {d.attachment.name}</span>
                          <span className="dc-att-action-tag">Open ↗</span>
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
                          onClick={() => handleOpenAttachment(d.teacherAttachment)}
                          role="button"
                          tabIndex={0}
                          title="Open teacher solution in new tab"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          <span>Teacher File: {d.teacherAttachment.name}</span>
                          <span className="dc-att-action-tag">Open ↗</span>
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




    </div>
  );
}
