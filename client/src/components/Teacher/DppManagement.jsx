import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { apiRequest, formatApiErrorMessage } from '../../api';



export function DppManagement({ _onBack, initialBatch = '', initialSubject = '' }) {
  // Navigation tabs: 'create' | 'published'
  const [activeTab, setActiveTab] = useState('create');

  // Form selections
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [batchesList, setBatchesList] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [batchesError, setBatchesError] = useState(null);
  const [dppTitle, setDppTitle] = useState('');

  // Mode: 'file' (Upload Image/PDF) or 'typed' (Manual Typing)
  const [contentMode, setContentMode] = useState('file');

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDragActive, setFileDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Typing State: single freeform text
  const [typedContent, setTypedContent] = useState('');

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [lastPublishedDpp, setLastPublishedDpp] = useState(null);
  const [viewingQuestionsDpp, setViewingQuestionsDpp] = useState(null);

  // Published DPPs List
  const [publishedList, setPublishedList] = useState([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [publishedFilterBatch, setPublishedFilterBatch] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Toasts & feedback
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2800);
  };

  // Fetch published DPPs from backend API
  const fetchPublishedDpps = useCallback(async () => {
    setIsLoadingPublished(true);
    try {
      const data = await apiRequest('/api/teacher/dpps');
      if (Array.isArray(data)) {
        const mapped = data.map((d) => ({
          id: d.id,
          batch: d.batches?.name || d.batch_id,
          batchId: d.batch_id,
          subject: d.subject,
          title: d.title,
          contentType: d.content_type || (d.file_url ? 'FILE' : 'MANUAL'),
          questions: d.questions,
          submissionType: (d.content_type === 'MANUAL' || (!d.file_url && d.questions)) ? 'typed' : 'file',
          fileName: d.file_url ? d.file_url.split('/').pop()?.replace(/^[a-f0-9]+_/, '') : 'In-App Questions',
          fileUrl: d.file_url,
          signedUrl: d.signed_url,
          status: 'Published',
          publishedAt: d.created_at,
        }));
        setPublishedList(mapped);
      } else {
        setPublishedList([]);
      }
    } catch (err) {
      console.warn('Could not load published DPPs from server:', err);
      setPublishedList([]);
    } finally {
      setIsLoadingPublished(false);
    }
  }, []);

  // Fetch teacher's assigned batches & subjects on mount (reuses Study Materials pattern)
  useEffect(() => {
    let isMounted = true;

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
                const subMatch = matched.subjects?.find(
                  (s) => (typeof s === 'string' ? s : s.name) === initialSubject
                );
                if (subMatch) {
                  setSelectedSubject(typeof subMatch === 'string' ? subMatch : subMatch.name);
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
        console.error('Failed to load teacher batches for DPP:', err);
        setBatchesError(err.message || 'Failed to load assigned batches');
        showToast('⚠️ Could not load assigned batches from server.');
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

  useEffect(() => {
    fetchPublishedDpps();
  }, [fetchPublishedDpps]);

  // Current batch object & display name
  const currentBatchObj = useMemo(() => {
    return batchesList.find(
      (b) => b.batch_id === selectedBatch || b.batch_name === selectedBatch
    );
  }, [batchesList, selectedBatch]);
  const selectedBatchName = currentBatchObj?.batch_name || selectedBatch;

  // Subjects dynamic list derived from assigned batches
  const availableSubjects = useMemo(() => {
    if (!currentBatchObj || !currentBatchObj.subjects) return [];
    return currentBatchObj.subjects
      .map((s) => (typeof s === 'string' ? s : s?.name || ''))
      .filter(Boolean);
  }, [currentBatchObj]);

  // Handle batch change
  const handleBatchChange = (batchId) => {
    setSelectedBatch(batchId);
    setSelectedSubject('');
  };

  // Handle subject change
  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    if (subject) {
      setDppTitle(`DPP — ${subject} Practice`);
    }
  };

  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('⚠️ Please upload a valid PDF or Image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('⚠️ File size exceeds 15MB limit.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setUploadedFile({
      name: file.name,
      size: sizeFormatted,
      type: file.type,
      rawFile: file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast(`✓ Attached: ${file.name}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setFileDragActive(true);
  };

  const handleDragLeave = () => {
    setFileDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFileDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Form validation before initiating submit
  const validateForm = () => {
    if (!selectedBatch) {
      showToast('⚠️ Please select a Batch first.');
      return false;
    }
    if (!selectedSubject) {
      showToast('⚠️ Please select a Subject.');
      return false;
    }

    if (contentMode === 'file') {
      if (!uploadedFile || !uploadedFile.rawFile) {
        showToast('⚠️ Please upload a PDF / Image or switch to Manual Typing.');
        return false;
      }
    } else {
      if (!typedContent.trim()) {
        showToast('⚠️ Please type or paste the questions before submitting.');
        return false;
      }
    }

    return true;
  };

  // Initiate submit
  const handleInitiateSubmit = () => {
    if (isUploading) return;
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // Confirm publish with real API call
  const handleConfirmPublish = async () => {
    if (isUploading) return;

    const finalTitle = dppTitle.trim() || `DPP — ${selectedSubject} Practice`;
    setIsUploading(true);

    try {
      let result;
      if (contentMode === 'file') {
        if (!uploadedFile || !uploadedFile.rawFile) {
          showToast('⚠️ Please attach a real PDF or Image file to publish.');
          setShowConfirmModal(false);
          setIsUploading(false);
          return;
        }
        const formData = new FormData();
        formData.append('batch_id', selectedBatch);
        formData.append('subject', selectedSubject);
        formData.append('title', finalTitle);
        formData.append('file', uploadedFile.rawFile);

        result = await apiRequest('/api/teacher/dpps', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!typedContent.trim()) {
          showToast('⚠️ Please enter questions before publishing.');
          setShowConfirmModal(false);
          setIsUploading(false);
          return;
        }
        const rawText = typedContent.trim();
        const items = rawText
          .split(/\n{2,}/)
          .map((q) => q.trim())
          .filter(Boolean);

        const questionsPayload = {
          raw_text: rawText,
          items: items.length > 0 ? items : [rawText],
        };

        result = await apiRequest('/api/teacher/dpps/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: selectedBatch,
            subject: selectedSubject,
            title: finalTitle,
            questions: questionsPayload,
          }),
        });
      }

      const publishedRecord = {
        id: result.id,
        batch: selectedBatchName,
        batchId: selectedBatch,
        subject: selectedSubject,
        title: result.title || finalTitle,
        contentType: result.content_type || (contentMode === 'typed' ? 'MANUAL' : 'FILE'),
        questions: result.questions,
        submissionType: contentMode,
        fileName: contentMode === 'file' ? (uploadedFile?.name || 'Worksheet') : 'In-App Questions',
        fileSize: contentMode === 'file' ? (uploadedFile?.size || 'Attached File') : 'JSON Questions',
        status: 'Published',
        publishedAt: result.created_at || new Date().toISOString(),
        fileUrl: result.file_url,
        signedUrl: result.signed_url,
      };

      setLastPublishedDpp(publishedRecord);
      setShowSuccessCard(true);
      setShowConfirmModal(false);
      setUploadedFile(null);
      setTypedContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast('🎉 DPP Published Successfully to Students!');

      // Refresh published list from backend
      await fetchPublishedDpps();
    } catch (err) {
      console.error('Failed to publish DPP:', err);
      const displayMsg = formatApiErrorMessage(err, err?.status);
      showToast(`❌ Failed to publish DPP: ${displayMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset create form for another DPP
  const handleResetForm = () => {
    setSelectedBatch('');
    setSelectedSubject('');
    setDppTitle('');
    setUploadedFile(null);
    setTypedContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowSuccessCard(false);
    setLastPublishedDpp(null);
  };

  // Delete a published DPP via backend API
  const handleDeletePublished = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this DPP'}"?`)) {
      return;
    }
    try {
      await apiRequest(`/api/teacher/dpps/${id}`, { method: 'DELETE' });
      setPublishedList((prev) => prev.filter((d) => d.id !== id));
      showToast('✓ DPP deleted successfully.');
    } catch (err) {
      console.error('Failed to delete DPP:', err);
      showToast(`❌ Delete failed: ${formatApiErrorMessage(err, err?.status)}`);
    }
  };

  // View / open a published DPP file or manual questions
  const handleViewDpp = async (dpp) => {
    if (dpp.contentType === 'MANUAL' || (!dpp.fileUrl && dpp.questions)) {
      setViewingQuestionsDpp(dpp);
      return;
    }

    try {
      let url = dpp.signedUrl;
      if (!url) {
        const res = await apiRequest(`/api/teacher/dpps/${dpp.id}/access-url`);
        url = res.signed_url;
      }
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        showToast('⚠️ Unable to generate secure view link.');
      }
    } catch (err) {
      console.error('Failed to view DPP:', err);
      showToast(`❌ View error: ${formatApiErrorMessage(err, err?.status)}`);
    }
  };

  // Filtered published list
  const filteredPublishedDpps = useMemo(() => {
    return publishedList.filter((dpp) => {
      const matchBatch =
        publishedFilterBatch === 'all' ||
        dpp.batch === publishedFilterBatch ||
        dpp.batchId === publishedFilterBatch;
      const q = searchFilter.toLowerCase().trim();
      const matchSearch =
        !q ||
        dpp.title?.toLowerCase().includes(q) ||
        dpp.subject?.toLowerCase().includes(q);
      return matchBatch && matchSearch;
    });
  }, [publishedList, publishedFilterBatch, searchFilter]);

  return (
    <div className="dpp-container">
      {/* ── TOP VIEW TAB SWITCHER ── */}
      <div className="dpp-main-tab-bar" role="tablist">
        <button
          type="button"
          className={`dpp-main-tab-btn ${activeTab === 'create' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('create');
            setShowSuccessCard(false);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>Create New DPP</span>
        </button>

        <button
          type="button"
          className={`dpp-main-tab-btn ${activeTab === 'published' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Published DPPs</span>
          <span className="dpp-tab-count-pill">{publishedList.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: CREATE NEW DPP
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="dpp-create-layout">
          {/* Success Banner if published */}
          {showSuccessCard && lastPublishedDpp && (
            <div className="dpp-success-banner">
              <div className="dpp-success-icon-box">✓</div>
              <div className="dpp-success-info">
                <h3 className="dpp-success-title">DPP Published Successfully!</h3>
                <p className="dpp-success-desc">
                  <strong>{lastPublishedDpp.title}</strong> has been published for{' '}
                  <strong>{lastPublishedDpp.batch}</strong>.
                </p>
                <div className="dpp-success-meta-chips">
                  <span className="dpp-schip">Subject: {lastPublishedDpp.subject}</span>
                </div>
              </div>
              <div className="dpp-success-actions">
                <button
                  type="button"
                  className="dpp-btn-outline"
                  onClick={handleResetForm}
                >
                  + Create Another
                </button>
                <button
                  type="button"
                  className="dpp-btn-primary"
                  onClick={() => setActiveTab('published')}
                >
                  View in Published
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: BATCH & SUBJECT */}
          <section className="dpp-card dpp-config-card">
            <div className="dpp-card-header">
              <span className="dpp-step-badge">STEP 1</span>
              <div>
                <h2 className="dpp-card-title">Select Batch &amp; Subject</h2>
                <p className="dpp-card-desc">Choose the target batch and subject for this DPP.</p>
              </div>
            </div>

            <div className="dpp-grid-3">
              {/* Batch Selector */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-batch-select">
                  <span>Batch</span>
                  <span className="dpp-required">*</span>
                </label>
                <div className="dpp-select-wrap">
                  <select
                    id="dpp-batch-select"
                    className="dpp-select-input"
                    value={selectedBatch}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    disabled={isLoadingBatches || (!batchesError && batchesList.length === 0)}
                  >
                    {isLoadingBatches ? (
                      <option value="" disabled>Loading assigned batches...</option>
                    ) : batchesError ? (
                      <option value="" disabled>Error loading batches</option>
                    ) : batchesList.length === 0 ? (
                      <option value="" disabled>No batches assigned</option>
                    ) : (
                      <>
                        <option value="" disabled>— Select Batch —</option>
                        {batchesList.map((b) => (
                          <option key={b.batch_id} value={b.batch_id}>
                            {b.batch_name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="dpp-chevron-arrow">▼</div>
                </div>
              </div>

              {/* Subject Selector */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-subject-select">
                  <span>Subject</span>
                  <span className="dpp-required">*</span>
                </label>
                <div className="dpp-select-wrap">
                  <select
                    id="dpp-subject-select"
                    className="dpp-select-input"
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={isLoadingBatches || !selectedBatch || availableSubjects.length === 0}
                  >
                    {isLoadingBatches ? (
                      <option value="" disabled>Loading...</option>
                    ) : !selectedBatch ? (
                      <option value="" disabled>— Select Batch First —</option>
                    ) : availableSubjects.length === 0 ? (
                      <option value="" disabled>No subjects assigned for this batch</option>
                    ) : (
                      <>
                        <option value="" disabled>— Select Subject —</option>
                        {availableSubjects.map((s, idx) => (
                          <option key={idx} value={s}>
                            {s}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="dpp-chevron-arrow">▼</div>
                </div>
              </div>

              {/* DPP Title */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-title-input">
                  <span>DPP Title</span>
                </label>
                <input
                  id="dpp-title-input"
                  type="text"
                  className="dpp-text-input"
                  placeholder="e.g. DPP #04 — Routing & Subnetting"
                  value={dppTitle}
                  onChange={(e) => setDppTitle(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* STEP 2: CONTENT CREATION MODE (UPLOAD OR TYPING) */}
          <section className="dpp-card dpp-content-card">
            <div className="dpp-card-header">
              <span className="dpp-step-badge">STEP 2</span>
              <div className="dpp-header-title-flex">
                <div>
                  <h2 className="dpp-card-title">DPP Content (Upload or Manual Typing)</h2>
                  <p className="dpp-card-desc">Choose whether to attach a PDF/Image file or manually type the questions.</p>
                </div>

                {/* Mode Selector Pill */}
                <div className="dpp-mode-switch" role="tablist">
                  <button
                    type="button"
                    className={`dpp-mode-pill ${contentMode === 'file' ? 'is-active' : ''}`}
                    onClick={() => setContentMode('file')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload Image / PDF</span>
                  </button>

                  <button
                    type="button"
                    className={`dpp-mode-pill ${contentMode === 'typed' ? 'is-active' : ''}`}
                    onClick={() => setContentMode('typed')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Manual Typing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── MODE A: UPLOAD FILE ── */}
            {contentMode === 'file' && (
              <div className="dpp-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="dpp-hidden-file-input"
                  onChange={handleFileSelect}
                />

                {!uploadedFile ? (
                  <div
                    className={`dpp-dropzone ${fileDragActive ? 'is-dragover' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dpp-dropzone-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <polyline points="9 15 12 12 15 15" />
                      </svg>
                    </div>

                    <div className="dpp-dropzone-text">
                      <h3 className="dpp-dropzone-title">Click to upload or drag and drop</h3>
                      <p className="dpp-dropzone-subtitle">PDF documents or PNG/JPG images (Max 15 MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="dpp-file-preview-card">
                    <div className="dpp-file-icon-box">
                      {uploadedFile.type === 'application/pdf' ? '📄' : '🖼️'}
                    </div>

                    <div className="dpp-file-meta">
                      <span className="dpp-file-name">{uploadedFile.name}</span>
                      <span className="dpp-file-sub">
                        {uploadedFile.size} • Attached at {uploadedFile.uploadedAt}
                      </span>
                    </div>

                    {uploadedFile.previewUrl && (
                      <div className="dpp-image-thumbnail-box">
                        <img src={uploadedFile.previewUrl} alt="Preview" className="dpp-img-thumb" />
                      </div>
                    )}

                    <div className="dpp-file-actions">
                      <button
                        type="button"
                        className="dpp-file-change-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        className="dpp-file-remove-btn"
                        onClick={() => setUploadedFile(null)}
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MODE B: MANUAL TYPING ── */}
            {contentMode === 'typed' && (
              <div className="dpp-typing-area">
                <textarea
                  className="dpp-qtextarea"
                  rows="8"
                  placeholder="Type or paste all your questions here...&#10;&#10;Example:&#10;Q1. Explain the OSI model and describe each layer.&#10;Q2. Solve the given numerical problem and justify each step."
                  value={typedContent}
                  onChange={(e) => setTypedContent(e.target.value)}
                  style={{ minHeight: '180px', resize: 'vertical' }}
                />
              </div>
            )}
          </section>

          {/* ACTION BUTTONS (SUBMIT & CLEAR) */}
          <div className="dpp-bottom-action-bar">
            <button
              type="button"
              className="dpp-btn-secondary"
              onClick={handleResetForm}
              disabled={isUploading}
            >
              Clear Form
            </button>

            <button
              type="button"
              className="dpp-btn-submit"
              onClick={handleInitiateSubmit}
              disabled={isUploading}
            >
              <span>{isUploading ? 'Publishing DPP...' : 'Submit & Publish DPP'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: PUBLISHED DPPS LIST
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'published' && (
        <div className="dpp-published-view">
          {/* Filter and Search Bar */}
          <div className="dpp-filter-row">
            <div className="dpp-batch-filter-pills">
              <button
                type="button"
                className={`dpp-fpill ${publishedFilterBatch === 'all' ? 'is-active' : ''}`}
                onClick={() => setPublishedFilterBatch('all')}
              >
                All Batches ({publishedList.length})
              </button>
              {batchesList.map((b) => (
                <button
                  key={b.batch_id}
                  type="button"
                  className={`dpp-fpill ${publishedFilterBatch === b.batch_name ? 'is-active' : ''}`}
                  onClick={() => setPublishedFilterBatch(b.batch_name)}
                >
                  {b.batch_name}
                </button>
              ))}
            </div>

            <div className="dpp-search-wrap">
              <input
                type="text"
                className="dpp-search-input"
                placeholder="Search DPPs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* DPP Cards Grid */}
          {isLoadingPublished ? (
            <div className="dpp-empty-state">
              <p>Loading published DPPs...</p>
            </div>
          ) : (
            <div className="dpp-published-grid">
              {filteredPublishedDpps.map((dpp) => (
                <div key={dpp.id} className="dpp-published-card">
                  <div className="dpp-pcard-top">
                    <div className="dpp-pcard-tags">
                      <span className="dpp-ptag-batch">{dpp.batch}</span>
                      <span className="dpp-ptag-subject">{dpp.subject}</span>
                    </div>
                    <span className="dpp-published-status">Published</span>
                  </div>

                  <h3 className="dpp-pcard-title">{dpp.title}</h3>

                  <div className="dpp-pcard-meta-list">
                    <div className="dpp-pmeta-item">
                      <span className="dpp-pmeta-label">Format:</span>
                      <span className="dpp-pmeta-val">
                        {dpp.contentType === 'MANUAL'
                          ? '✍️ In-App Questions (JSON)'
                          : `📄 Document (${dpp.fileName || 'Attached'})`}
                      </span>
                    </div>
                    <div className="dpp-pmeta-item">
                      <span className="dpp-pmeta-label">Published:</span>
                      <span className="dpp-pmeta-val">
                        {dpp.publishedAt ? new Date(dpp.publishedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="dpp-pcard-footer">
                    <button
                      type="button"
                      className="dpp-pcard-del-btn"
                      onClick={() => handleDeletePublished(dpp.id, dpp.title)}
                      title="Delete DPP"
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      className="dpp-pcard-view-btn"
                      onClick={() => handleViewDpp(dpp)}
                    >
                      {dpp.contentType === 'MANUAL' ? 'View Questions' : 'Open Document'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingPublished && filteredPublishedDpps.length === 0 && (
            <div className="dpp-empty-state">
              <span className="dpp-empty-icon">📋</span>
              <h3>No DPPs Found</h3>
              <p>No published DPPs match your current filter. Create a new DPP to get started!</p>
              <button
                type="button"
                className="dpp-btn-submit"
                onClick={() => setActiveTab('create')}
              >
                + Create New DPP
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONFIRMATION POPUP MODAL (YES / NO)
          ══════════════════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div
          className="dpp-modal-overlay"
          onClick={() => !isUploading && setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dpp-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dpp-modal-header">
              <div className="dpp-modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="dpp-modal-title-group">
                <h3 className="dpp-modal-title">Confirm DPP Publication</h3>
                <span className="dpp-modal-subtitle">Will be distributed to all students</span>
              </div>
              <button
                type="button"
                className="dpp-modal-close-btn"
                onClick={() => !isUploading && setShowConfirmModal(false)}
                aria-label="Close modal"
                disabled={isUploading}
              >
                ✕
              </button>
            </div>

            <div className="dpp-modal-body">
              <p className="dpp-modal-lead">
                Are you sure you want to publish this Daily Practice Problem sheet? It will become immediately visible to the selected batch.
              </p>

              <div className="dpp-modal-summary-box">
                <div className="dpp-msum-row">
                  <span>Batch:</span>
                  <strong>{selectedBatchName}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Subject:</span>
                  <strong>{selectedSubject}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Title:</span>
                  <strong>{dppTitle || `DPP — ${selectedSubject} Practice`}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Format:</span>
                  <strong>
                    {contentMode === 'file' ? `Attached File (${uploadedFile?.name})` : 'Typed Questions (In-App JSON)'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="dpp-modal-actions">
              <button
                type="button"
                className="dpp-modal-cancel-btn"
                onClick={() => !isUploading && setShowConfirmModal(false)}
                disabled={isUploading}
              >
                No, Review Draft
              </button>
              <button
                type="button"
                className="dpp-modal-confirm-btn"
                onClick={handleConfirmPublish}
                disabled={isUploading}
              >
                {isUploading ? 'Publishing DPP...' : 'Yes, Publish DPP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          IN-APP QUESTIONS VIEWER MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {viewingQuestionsDpp && (
        <div
          className="dpp-modal-overlay"
          onClick={() => setViewingQuestionsDpp(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dpp-modal-card"
            style={{ maxWidth: '640px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dpp-modal-header">
              <div className="dpp-modal-icon-wrap" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                ✍️
              </div>
              <div className="dpp-modal-title-wrap">
                <h3 className="dpp-modal-title">{viewingQuestionsDpp.title}</h3>
                <span className="dpp-modal-subtitle">
                  {viewingQuestionsDpp.batch} • {viewingQuestionsDpp.subject} • Manual DPP
                </span>
              </div>
              <button
                type="button"
                className="dpp-modal-close-btn"
                onClick={() => setViewingQuestionsDpp(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="dpp-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const q = viewingQuestionsDpp.questions;
                if (!q) {
                  return <p style={{ color: '#64748b' }}>No question text stored for this DPP.</p>;
                }
                const items = Array.isArray(q.items)
                  ? q.items
                  : Array.isArray(q)
                    ? q
                    : q.raw_text
                      ? q.raw_text.split(/\n{2,}/).filter(Boolean)
                      : [typeof q === 'string' ? q : JSON.stringify(q, null, 2)];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: '4px' }}>
                          QUESTION {idx + 1}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="dpp-modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="dpp-btn-preview"
                onClick={() => {
                  const q = viewingQuestionsDpp.questions;
                  const text = q?.raw_text || JSON.stringify(q, null, 2);
                  navigator.clipboard.writeText(text);
                  showToast('📋 Questions copied to clipboard!');
                }}
              >
                📋 Copy Text
              </button>
              <button
                type="button"
                className="dpp-btn-submit"
                onClick={() => setViewingQuestionsDpp(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="dpp-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default DppManagement;
