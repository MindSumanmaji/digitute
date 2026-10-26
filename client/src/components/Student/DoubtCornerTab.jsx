import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../api';

// Subject color and icon mapping helper
const getSubjectTheme = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('physic')) {
    return { color: '#0284c7', bg: '#e0f2fe', icon: 'flask' };
  }
  if (s.includes('chem')) {
    return { color: '#16a34a', bg: '#dcfce7', icon: 'flask' };
  }
  if (s.includes('math')) {
    return { color: '#9333ea', bg: '#f3e8ff', icon: 'book' };
  }
  if (s.includes('bio')) {
    return { color: '#059669', bg: '#d1fae5', icon: 'leaf' };
  }
  if (s.includes('dbms') || s.includes('database')) {
    return { color: '#ef4444', bg: '#fee2e2', icon: 'desktop' };
  }
  if (s.includes('network') || s.includes('computer')) {
    return { color: '#0284c7', bg: '#e0f2fe', icon: 'desktop' };
  }
  return { color: '#d97706', bg: '#fef3c7', icon: 'book' };
};

// Date formatter
const formatDoubtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const isImageUrl = (url = '') => {
  return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url);
};

export default function DoubtCornerTab({ showToast }) {
  // 1. Data States
  const [doubtsList, setDoubtsList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentBatchId, setStudentBatchId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Filter States
  const [doubtFilter, setDoubtFilter] = useState('All');
  const [doubtSubjectFilter, setDoubtSubjectFilter] = useState('All Subjects');
  const [expandedDoubtId, setExpandedDoubtId] = useState(null);

  // 3. Bookmark States (persisted in localStorage)
  const [savedDoubtIds, setSavedDoubtIds] = useState(() => {
    try {
      const stored = localStorage.getItem('digitute_student_saved_doubts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 4. Ask Doubt Form States (with separate Doubt Title)
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtSubject, setNewDoubtSubject] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load student's profile & batch subjects
  const loadProfileAndSubjects = useCallback(async () => {
    try {
      const profile = await apiRequest('/api/student/my-profile');
      if (profile) {
        if (profile.batch_id || profile.batches?.id) {
          setStudentBatchId(profile.batch_id || profile.batches?.id);
        }

        const rawSubjects = profile.batches?.subjects || [];
        const extracted = rawSubjects
          .map((s) => (typeof s === 'string' ? s : (s.name || s.subject_name || '')))
          .filter(Boolean);

        if (extracted.length > 0) {
          setSubjects(extracted);
        } else {
          // Fallback common subjects
          setSubjects(['Physics', 'Chemistry', 'Mathematics', 'Biology']);
        }
      }
    } catch (err) {
      console.warn('Could not load profile subjects:', err);
      setSubjects(['Physics', 'Chemistry', 'Mathematics', 'Biology']);
    }
  }, []);

  // Load student's submitted doubts
  const loadDoubts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/student/doubts');
      if (Array.isArray(data)) {
        setDoubtsList(data);
      } else {
        setDoubtsList([]);
      }
    } catch (err) {
      console.error('Failed to load doubts:', err);
      if (showToast) showToast('Could not load doubts from server.');
      setDoubtsList([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfileAndSubjects();
    loadDoubts();
  }, [loadProfileAndSubjects, loadDoubts]);

  // Toggle Bookmark
  const toggleBookmark = (id) => {
    setSavedDoubtIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((item) => item !== id);
        if (showToast) showToast('Doubt removed from bookmarks');
      } else {
        updated = [...prev, id];
        if (showToast) showToast('Doubt saved to bookmarks');
      }
      try {
        localStorage.setItem('digitute_student_saved_doubts', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Handle local file selection
  const handleFileChange = (e, isImage) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (showToast) showToast('File size must be under 10MB.');
      e.target.value = '';
      return;
    }

    const isImg = isImage || file.type.startsWith('image/');
    setAttachedFile({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      isImage: isImg,
      previewUrl: isImg ? URL.createObjectURL(file) : null
    });
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    if (attachedFile?.previewUrl) {
      URL.revokeObjectURL(attachedFile.previewUrl);
    }
    setAttachedFile(null);
  };

  // Submit Doubt Handler
  const handlePostDoubt = async (e) => {
    e.preventDefault();

    if (!newDoubtTitle.trim()) {
      if (showToast) showToast('Please enter a Doubt Title.');
      return;
    }

    if (!newDoubtSubject) {
      if (showToast) showToast('Please select a Subject.');
      return;
    }

    if (!newDoubtQuestion.trim()) {
      if (showToast) showToast('Please explain your doubt before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedFilePath = null;

      // 1. Upload file to Supabase storage if attached
      if (attachedFile?.file) {
        const formData = new FormData();
        formData.append('file', attachedFile.file);

        const uploadRes = await apiRequest('/api/student/doubts/upload-file', {
          method: 'POST',
          body: formData
        });

        uploadedFilePath = uploadRes.storage_path;
      }

      // 2. Submit doubt to backend
      const payload = {
        batch_id: studentBatchId || undefined,
        subject: newDoubtSubject,
        question_title: newDoubtTitle.trim(),
        question_text: newDoubtQuestion.trim(),
        question_file_url: uploadedFilePath
      };

      await apiRequest('/api/student/doubts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (showToast) showToast('Your doubt has been submitted to your teacher!');

      // Reset form
      setNewDoubtTitle('');
      setNewDoubtSubject('');
      setNewDoubtQuestion('');
      handleRemoveFile();

      // Refresh list
      await loadDoubts();
    } catch (err) {
      console.error('Failed to post doubt:', err);
      if (showToast) showToast(err.message || 'Failed to submit doubt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Doubts
  const filteredDoubts = useMemo(() => {
    return doubtsList.filter((item) => {
      // Status filter
      if (doubtFilter === 'Answered') {
        if (item.status !== 'RESOLVED') return false;
      } else if (doubtFilter === 'Pending') {
        if (item.status === 'RESOLVED') return false;
      } else if (doubtFilter === 'Saved') {
        if (!savedDoubtIds.includes(item.id)) return false;
      }

      // Subject filter
      if (doubtSubjectFilter !== 'All Subjects') {
        if (item.subject?.toLowerCase() !== doubtSubjectFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [doubtsList, doubtFilter, doubtSubjectFilter, savedDoubtIds]);

  return (
    <div className="sp-view-container sp-doubts-view">
      {/* Header Card with Red Badge & Graphic */}
      <div className="sp-card sp-doubt-header-banner">
        <div className="sp-doubt-header-left">
          <div className="sp-doubt-red-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="sp-page-title">Doubt Corner</h1>
            <p className="sp-page-subtitle">Ask your doubts directly to your assigned subject teachers.</p>
          </div>
        </div>

        {/* 3D Illustrated Graphic */}
        <div className="sp-doubt-illustration">
          <svg width="120" height="90" viewBox="0 0 140 100" fill="none">
            <circle cx="85" cy="50" r="42" fill="#eff6ff" />
            <path d="M30 65 C45 60, 65 62, 70 75 C75 62, 95 60, 110 65 L110 40 C95 35, 75 37, 70 50 C65 37, 45 35, 30 40 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
            <line x1="70" y1="50" x2="70" y2="75" stroke="#2563eb" strokeWidth="2.5" />
            <line x1="42" y1="48" x2="60" y2="46" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="42" y1="55" x2="58" y2="53" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="46" x2="98" y2="48" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="82" y1="53" x2="98" y2="55" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <g transform="translate(68, 5)">
              <rect width="40" height="32" rx="10" fill="#f87171" opacity="0.9" />
              <path d="M8 32 L3 40 L16 32 Z" fill="#f87171" opacity="0.9" />
              <text x="20" y="22" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">?</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Filters Row */}
      <div className="sp-doubt-filters-row">
        <div className="sp-pills-group">
          {['All', 'Pending', 'Answered', 'Saved'].map((pill) => (
            <button
              key={pill}
              type="button"
              className={`sp-filter-pill ${doubtFilter === pill ? 'active' : ''}`}
              onClick={() => setDoubtFilter(pill)}
            >
              {pill}
              {pill === 'All' && doubtsList.length > 0 && ` (${doubtsList.length})`}
              {pill === 'Pending' && doubtsList.filter(d => d.status !== 'RESOLVED').length > 0 && ` (${doubtsList.filter(d => d.status !== 'RESOLVED').length})`}
              {pill === 'Answered' && doubtsList.filter(d => d.status === 'RESOLVED').length > 0 && ` (${doubtsList.filter(d => d.status === 'RESOLVED').length})`}
            </button>
          ))}
        </div>

        <div className="sp-filter-dropdown-wrap">
          <select
            className="sp-select-pill"
            value={doubtSubjectFilter}
            onChange={(e) => setDoubtSubjectFilter(e.target.value)}
          >
            <option value="All Subjects">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left Feed, Right Ask Doubt */}
      <div className="sp-grid-2col-65-35">
        {/* Left Column: Doubts Feed List */}
        <div className="sp-doubts-feed-list">
          {isLoading ? (
            <div className="sp-doubts-empty-state">
              <div className="sp-doubts-empty-icon">⏳</div>
              <div className="sp-doubts-empty-title">Loading Doubts...</div>
              <p className="sp-doubts-empty-desc">Fetching your submitted doubts from the server.</p>
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="sp-doubts-empty-state">
              <div className="sp-doubts-empty-icon">💬</div>
              <div className="sp-doubts-empty-title">
                {doubtFilter === 'Saved' ? 'No Bookmarked Doubts' : 'No Doubts Found'}
              </div>
              <p className="sp-doubts-empty-desc">
                {doubtFilter === 'Saved'
                  ? 'You haven\'t bookmarked any doubts yet. Click the bookmark icon on any doubt to save it.'
                  : doubtsList.length === 0
                  ? 'You have not submitted any doubts yet. Ask your first doubt in the box on the right!'
                  : 'No doubts found matching the selected filter criteria.'}
              </p>
            </div>
          ) : (
            filteredDoubts.map((item) => {
              const theme = getSubjectTheme(item.subject);
              const isSaved = savedDoubtIds.includes(item.id);
              const isExpanded = expandedDoubtId === item.id;
              const isResolved = item.status === 'RESOLVED';
              const isOffline = item.status === 'OFFLINE_PENDING';

              return (
                <div key={item.id} className="sp-doubt-card-wrapper">
                  {/* Card Header Row */}
                  <div
                    className="sp-card sp-doubt-card-item"
                    onClick={() => setExpandedDoubtId(isExpanded ? null : item.id)}
                  >
                    {/* Subject Icon */}
                    <div className="sp-doubt-item-icon" style={{ backgroundColor: theme.bg, color: theme.color }}>
                      {theme.icon === 'flask' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 2v7.31L4 19a2 2 0 0 0 1.66 3h12.68A2 2 0 0 0 20 19l-6-9.69V2"/>
                          <path d="M8.5 2h7"/>
                          <path d="M14 9.3 8.5 18"/>
                        </svg>
                      ) : theme.icon === 'desktop' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="3" rx="2"/>
                          <line x1="8" x2="16" y1="21" y2="21"/>
                          <line x1="12" x2="12" y1="17" y2="21"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                      )}
                    </div>

                    {/* Title and Metadata */}
                    <div className="sp-doubt-info-col">
                      <span className="sp-subject-tag-pill">{item.subject}</span>
                      <h4 className="sp-doubt-question-title">{item.question_title}</h4>
                      <div className="sp-doubt-meta-date-row">
                        <span className="sp-doubt-meta-date">{formatDoubtDate(item.created_at)}</span>
                        {item.question_file_url && (
                          <span className="sp-doubt-has-attachment">📎 Attachment</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge, Bookmark, Arrow */}
                    <div className="sp-doubt-actions-right">
                      <span className={isResolved ? 'sp-badge-answered' : isOffline ? 'sp-badge-offline' : 'sp-badge-pending'}>
                        {isResolved ? 'Answered' : isOffline ? 'Offline Solve' : 'Pending'}
                      </span>
                      <button
                        type="button"
                        className={`sp-bookmark-btn ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(item.id);
                        }}
                        title={isSaved ? 'Remove bookmark' : 'Bookmark this doubt'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? '#2563eb' : 'none'} stroke={isSaved ? '#2563eb' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <span
                        className="sp-chevron-right"
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          display: 'inline-block'
                        }}
                      >
                        ›
                      </span>
                    </div>
                  </div>

                  {/* Accordion Expanded Drawer */}
                  {isExpanded && (
                    <div className="sp-doubt-expanded-drawer">
                      {/* Question Details Section */}
                      <div className="sp-doubt-expanded-question">
                        <div className="sp-expanded-section-title">Question Explanation</div>
                        <p className="sp-doubt-question-body">{item.question_text}</p>

                        {/* Student Attached File Preview / Link */}
                        {item.question_file_signed_url && (
                          <div className="sp-doubt-file-preview-row">
                            {isImageUrl(item.question_file_url) ? (
                              <div className="sp-doubt-img-thumb-wrap">
                                <a href={item.question_file_signed_url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={item.question_file_signed_url}
                                    alt="Attached Question Diagram"
                                    className="sp-doubt-img-thumb"
                                  />
                                </a>
                                <span className="sp-doubt-img-hint">Click image to view or download full size</span>
                              </div>
                            ) : (
                              <a
                                href={item.question_file_signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sp-doubt-attachment-chip"
                              >
                                📄 View / Download Question Attachment (PDF)
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Solution or Status Notification */}
                      {isResolved ? (
                        <div className="sp-doubt-solution-box">
                          <div className="sp-solution-header">
                            <div className="sp-solution-teacher-info">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                              <span>Teacher Solution</span>
                              {item.users?.full_name && (
                                <span className="sp-solution-teacher-name">({item.users.full_name})</span>
                              )}
                            </div>
                            {item.resolved_at && (
                              <span className="sp-solution-time">Solved on {formatDoubtDate(item.resolved_at)}</span>
                            )}
                          </div>

                          <div className="sp-solution-text">{item.reply_text || 'No solution text provided.'}</div>

                          {/* Teacher Solution File Attachment */}
                          {item.reply_file_signed_url && (
                            <div className="sp-solution-file-row">
                              <a
                                href={item.reply_file_signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sp-solution-attachment-btn"
                              >
                                📎 Download Teacher's Solution File (PDF / Image)
                              </a>
                            </div>
                          )}
                        </div>
                      ) : isOffline ? (
                        <div className="sp-doubt-offline-box">
                          <span style={{ fontSize: '20px' }}>🏫</span>
                          <div>
                            <strong>Scheduled for Offline Discussion</strong>
                            <p>Your teacher will discuss and solve this doubt directly with you in the next offline class.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="sp-doubt-pending-box">
                          <span style={{ fontSize: '20px' }}>⏳</span>
                          <div>
                            <strong>Awaiting Teacher Solution</strong>
                            <p>Your question has been forwarded to the subject teacher. You will see their answer here once resolved.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Ask a New Doubt Card (On mobile, only shown under 'All' filter) */}
        <div className={`sp-card sp-ask-doubt-card ${doubtFilter !== 'All' ? 'sp-hide-on-mobile-filter' : ''}`}>
          <div className="sp-ask-doubt-head">
            <div className="sp-ask-mini-badge">?</div>
            <h3>Ask a New Doubt</h3>
          </div>

          <form onSubmit={handlePostDoubt} className="sp-ask-form">
            {/* 1. Dynamic Subject Selector */}
            <div className="sp-input-icon-field">
              <span className="sp-field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </span>
              <select
                className="sp-form-select"
                value={newDoubtSubject}
                onChange={(e) => setNewDoubtSubject(e.target.value)}
                required
                disabled={isSubmitting}
              >
                <option value="">Select Subject</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            {/* 2. Doubt Title */}
            <div className="sp-input-icon-field">
              <span className="sp-field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </span>
              <input
                type="text"
                className="sp-form-input"
                placeholder="Doubt Title (e.g. Electric flux through sphere)"
                value={newDoubtTitle}
                onChange={(e) => setNewDoubtTitle(e.target.value)}
                required
                maxLength={200}
                disabled={isSubmitting}
              />
            </div>

            {/* 3. Question Textarea */}
            <textarea
              className="sp-form-textarea"
              placeholder="Type your question in detail here..."
              rows={5}
              value={newDoubtQuestion}
              onChange={(e) => setNewDoubtQuestion(e.target.value)}
              required
              disabled={isSubmitting}
            />

            {/* 4. Attachment Pickers */}
            <div className="sp-attach-buttons-row">
              <label className="sp-attach-btn">
                <span>📷</span> Add Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                  onChange={(e) => handleFileChange(e, true)}
                />
              </label>
              <label className="sp-attach-btn">
                <span>📎</span> Add PDF
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                  onChange={(e) => handleFileChange(e, false)}
                />
              </label>
            </div>

            {/* Attached file preview chip */}
            {attachedFile && (
              <div className="sp-attached-preview-card">
                <div className="sp-attached-file-info">
                  <span>{attachedFile.isImage ? '🖼️' : '📄'}</span>
                  <span><strong>{attachedFile.name}</strong> ({attachedFile.size})</span>
                </div>
                <button
                  type="button"
                  className="sp-attached-remove-btn"
                  onClick={handleRemoveFile}
                  title="Remove attachment"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="sp-primary-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="sp-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span>Submit Question</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
