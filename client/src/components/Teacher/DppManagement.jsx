import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BATCHES,
  BATCH_SUBJECTS_MAP,
  DEFAULT_SUBJECT_TOPICS,
  getSavedDpps,
  saveDpp,
  deleteDpp,
  getStudentsForCombo,
} from '../../data/academicData';
export function DppManagement({ onBack, initialBatch = '', initialSubject = '' }) {
  // Navigation tabs: 'create' | 'published'
  const [activeTab, setActiveTab] = useState('create');

  // Form selections
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [dppTitle, setDppTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default: 3 days from today
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [totalQuestions, setTotalQuestions] = useState('');
  const [instructions, setInstructions] = useState('');

  // Mode: 'file' (Upload Image/PDF) or 'typed' (Manual Typing)
  const [contentMode, setContentMode] = useState('file');

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDragActive, setFileDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Typing State: list of questions
  const [typedQuestions, setTypedQuestions] = useState([
    { id: 'q-1', text: 'Explain the working principle and provide a neat diagram.', marks: '10' },
    { id: 'q-2', text: 'Solve the given numerical problem and justify each step.', marks: '10' },
  ]);

  // Preview & Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [lastPublishedDpp, setLastPublishedDpp] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Published DPPs List
  const [publishedList, setPublishedList] = useState([]);
  const [publishedFilterBatch, setPublishedFilterBatch] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Toasts & feedback
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  // Load published DPPs on mount
  useEffect(() => {
    setPublishedList(getSavedDpps());
  }, []);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2800);
  };

  // Subjects dynamic list
  const availableSubjects = useMemo(() => {
    return selectedBatch ? (BATCH_SUBJECTS_MAP[selectedBatch] || []) : [];
  }, [selectedBatch]);

  // Suggested topics dynamic list
  const suggestedTopics = useMemo(() => {
    return selectedSubject ? (DEFAULT_SUBJECT_TOPICS[selectedSubject] || []) : [];
  }, [selectedSubject]);

  // Target students count
  const targetStudentsCount = useMemo(() => {
    if (!selectedBatch || !selectedSubject) return 0;
    return getStudentsForCombo(selectedBatch, selectedSubject).length;
  }, [selectedBatch, selectedSubject]);

  // Effective topic string
  const effectiveTopic = selectedTopic.trim();

  // Handle batch change
  const handleBatchChange = (batch) => {
    setSelectedBatch(batch);
    setSelectedSubject('');
    setSelectedTopic('');
    setCustomTopic('');
  };

  // Handle subject change
  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopic('');
    setCustomTopic('');
    // Auto generate suggested DPP title
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
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('⚠️ Please upload a valid PDF or Image file (PNG, JPG, WEBP).');
      return;
    }

    // Size limit 15MB
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

  // Insert mock sample file for fast teacher workflow testing
  const handleInsertSampleFile = () => {
    setUploadedFile({
      name: `${(selectedSubject || 'Subject').replace(/\s+/g, '_')}_DPP_Problems.pdf`,
      size: '640 KB',
      type: 'application/pdf',
      rawFile: null,
      previewUrl: null,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    showToast('✓ Sample PDF attached for testing');
  };

  // Sync total questions with typed questions format
  const handleTotalQuestionsChange = (val) => {
    setTotalQuestions(val);
    const count = parseInt(val, 10);
    if (!isNaN(count) && count > 0 && count <= 100) {
      setTypedQuestions((prev) => {
        if (prev.length === count) return prev;
        if (prev.length < count) {
          const added = Array.from({ length: count - prev.length }, (_, i) => ({
            id: `q-${Date.now()}-${prev.length + i + 1}`,
            text: '',
          }));
          return [...prev, ...added];
        }
        return prev.slice(0, count);
      });
    } else if (val === '') {
      setTypedQuestions([]);
    }
  };

  // Manual questions management
  const handleAddQuestion = () => {
    const nextCount = typedQuestions.length + 1;
    setTotalQuestions(String(nextCount));
    setTypedQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${nextCount}`,
        text: '',
      },
    ]);
  };

  const handleRemoveQuestion = (id) => {
    setTypedQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      setTotalQuestions(filtered.length > 0 ? String(filtered.length) : '');
      return filtered;
    });
  };

  const handleQuestionTextChange = (id, text) => {
    setTypedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text } : q))
    );
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
    if (!effectiveTopic) {
      showToast('⚠️ Please enter a Topic.');
      return false;
    }
    if (!totalQuestions || parseInt(totalQuestions, 10) <= 0) {
      showToast('⚠️ Please enter Total Questions.');
      return false;
    }

    if (contentMode === 'file') {
      if (!uploadedFile) {
        showToast('⚠️ Please upload a PDF / Image or switch to Manual Typing.');
        return false;
      }
    } else {
      const emptyQuestions = typedQuestions.filter((q) => !q.text.trim());
      if (typedQuestions.length === 0 || emptyQuestions.length > 0) {
        showToast('⚠️ Please fill out all question texts before submitting.');
        return false;
      }
    }

    return true;
  };

  // Initiate submit
  const handleInitiateSubmit = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // Confirm publish
  const handleConfirmPublish = () => {
    setShowConfirmModal(false);

    const newRecord = {
      id: `dpp-${Date.now()}`,
      batch: selectedBatch,
      subject: selectedSubject,
      topic: effectiveTopic,
      title: dppTitle.trim() || `DPP — ${effectiveTopic}`,
      dueDate: dueDate,
      totalQuestions: parseInt(totalQuestions, 10) || (contentMode === 'file' ? 1 : typedQuestions.length),
      questionsCount: parseInt(totalQuestions, 10) || (contentMode === 'file' ? 1 : typedQuestions.length),
      submissionType: contentMode,
      fileName: contentMode === 'file' ? uploadedFile?.name : null,
      fileSize: contentMode === 'file' ? uploadedFile?.size : null,
      fileType: contentMode === 'file' ? uploadedFile?.type : null,
      typedQuestions: contentMode === 'typed' ? typedQuestions : null,
      instructions: instructions.trim() || null,
      submittedCount: 0,
      totalStudents: targetStudentsCount || 15,
      status: 'Published',
      publishedAt: new Date().toISOString(),
    };

    const updated = saveDpp(newRecord);
    setPublishedList(updated);
    setLastPublishedDpp(newRecord);
    setShowSuccessCard(true);
    showToast('🎉 DPP Published Successfully to Students!');
  };

  // Reset create form for another DPP
  const handleResetForm = () => {
    setSelectedBatch('');
    setSelectedSubject('');
    setSelectedTopic('');
    setCustomTopic('');
    setDppTitle('');
    setUploadedFile(null);
    setTypedQuestions([
      { id: 'q-1', text: '', marks: '10' },
      { id: 'q-2', text: '', marks: '10' },
    ]);
    setInstructions('');
    setShowSuccessCard(false);
    setLastPublishedDpp(null);
  };

  // Delete a published DPP
  const handleDeletePublished = (id) => {
    if (window.confirm('Are you sure you want to delete this published DPP?')) {
      const updated = deleteDpp(id);
      setPublishedList(updated);
      showToast('DPP deleted.');
    }
  };

  // Filtered published list
  const filteredPublishedDpps = useMemo(() => {
    return publishedList.filter((dpp) => {
      const matchBatch = publishedFilterBatch === 'all' || dpp.batch === publishedFilterBatch;
      const q = searchFilter.toLowerCase().trim();
      const matchSearch =
        !q ||
        dpp.title.toLowerCase().includes(q) ||
        dpp.subject.toLowerCase().includes(q) ||
        dpp.topic.toLowerCase().includes(q);
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
                  <strong>{lastPublishedDpp.title}</strong> has been sent to all{' '}
                  <strong>{lastPublishedDpp.totalStudents} students</strong> of{' '}
                  <strong>{lastPublishedDpp.batch}</strong>.
                </p>
                <div className="dpp-success-meta-chips">
                  <span className="dpp-schip">Subject: {lastPublishedDpp.subject}</span>
                  <span className="dpp-schip">Due: {lastPublishedDpp.dueDate}</span>
                  <span className="dpp-schip">Questions: {lastPublishedDpp.totalQuestions || lastPublishedDpp.questionsCount || 1}</span>
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

          {/* STEP 1: BATCH, SUBJECT & TOPIC CARD */}
          <section className="dpp-card dpp-config-card">
            <div className="dpp-card-header">
              <span className="dpp-step-badge">STEP 1</span>
              <div>
                <h2 className="dpp-card-title">Select Batch, Subject &amp; Topic</h2>
                <p className="dpp-card-desc">Choose the target batch, corresponding subject and topic for this problem sheet.</p>
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
                  >
                    <option value="" disabled>— Select Batch —</option>
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
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
                    disabled={!selectedBatch}
                  >
                    <option value="" disabled>
                      {selectedBatch ? '— Select Subject —' : '— Select Batch First —'}
                    </option>
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="dpp-chevron-arrow">▼</div>
                </div>
              </div>

              {/* Topic Input */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-topic-input">
                  <span>Topic</span>
                  <span className="dpp-required">*</span>
                </label>
                <input
                  id="dpp-topic-input"
                  type="text"
                  className="dpp-text-input"
                  placeholder="Type topics..."
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    if (e.target.value && !dppTitle) {
                      setDppTitle(`DPP — ${e.target.value}`);
                    }
                  }}
                  disabled={!selectedSubject}
                />
              </div>
            </div>

            {/* DPP Metadata sub-grid */}
            <div className="dpp-grid-3 dpp-meta-subgrid">
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

              {/* Due Date */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-due-date">
                  <span>Submission Due Date</span>
                </label>
                <input
                  id="dpp-due-date"
                  type="date"
                  className="dpp-text-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Total Questions */}
              <div className="dpp-form-group">
                <label className="dpp-form-label" htmlFor="dpp-questions-count">
                  <span>Total Questions</span>
                  <span className="dpp-required">*</span>
                </label>
                <input
                  id="dpp-questions-count"
                  type="number"
                  min="1"
                  max="100"
                  className="dpp-text-input"
                  placeholder="Enter number of questions"
                  value={totalQuestions}
                  onChange={(e) => handleTotalQuestionsChange(e.target.value)}
                />
              </div>
            </div>

            {/* Target students badge info */}
            {selectedBatch && selectedSubject && (
              <div className="dpp-target-info-strip">
                <span className="dpp-info-icon">👥</span>
                <span>
                  Will be distributed to <strong>{targetStudentsCount} students</strong> in{' '}
                  <strong>{selectedBatch}</strong>.
                </span>
              </div>
            )}
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

                    <div className="dpp-dropzone-footer">
                      <button
                        type="button"
                        className="dpp-sample-attach-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertSampleFile();
                        }}
                      >
                        ⚡ Attach Sample PDF
                      </button>
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
                <div className="dpp-questions-header">
                  <span className="dpp-qcount-text">
                    {typedQuestions.length} Question{typedQuestions.length > 1 ? 's' : ''} added
                  </span>
                  <button
                    type="button"
                    className="dpp-add-question-btn"
                    onClick={handleAddQuestion}
                  >
                    + Add Question
                  </button>
                </div>

                <div className="dpp-questions-list">
                  {typedQuestions.length === 0 ? (
                    <div className="dpp-empty-questions-prompt" style={{ padding: '28px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px', border: '1.5px dashed #CBD5E1', color: '#64748B', fontSize: '0.88rem' }}>
                      <p>Please enter <strong>Total Questions</strong> above to generate question format.</p>
                    </div>
                  ) : (
                    typedQuestions.map((q, idx) => (
                      <div key={q.id} className="dpp-question-item-card">
                        <div className="dpp-qitem-top">
                          <span className="dpp-qnum-tag">Question {idx + 1}</span>
                          <button
                            type="button"
                            className="dpp-remove-q-btn"
                            onClick={() => handleRemoveQuestion(q.id)}
                            title="Remove question"
                            aria-label={`Remove Question ${idx + 1}`}
                          >
                            ✕
                          </button>
                        </div>

                        <textarea
                          className="dpp-qtextarea"
                          rows="3"
                          placeholder={`Type Question ${idx + 1} description, problem statement, or instructions here...`}
                          value={q.text}
                          onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Optional Instructions */}
            <div className="dpp-form-group dpp-instructions-group">
              <label className="dpp-form-label" htmlFor="dpp-instructions-textarea">
                <span>General Notes / Instructions for Students (Optional)</span>
              </label>
              <textarea
                id="dpp-instructions-textarea"
                className="dpp-text-input dpp-instructions-input"
                rows="2"
                placeholder="e.g. Write solutions in clear handwriting and submit before 5:00 PM."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </section>

          {/* STEP 3: LIVE PREVIEW ACCORDION */}
          <div className="dpp-preview-accordion-card">
            <button
              type="button"
              className="dpp-preview-toggle-bar"
              onClick={() => setShowLivePreview(!showLivePreview)}
            >
              <div className="dpp-preview-bar-left">
                <span className="dpp-preview-icon">👁️</span>
                <span className="dpp-preview-bar-title">Student Sheet Preview</span>
                <span className="dpp-preview-bar-sub">Click to {showLivePreview ? 'hide' : 'expand'}</span>
              </div>
              <span className="dpp-accordion-arrow">{showLivePreview ? '▲' : '▼'}</span>
            </button>

            {showLivePreview && (
              <div className="dpp-live-preview-content">
                <div className="dpp-student-preview-sheet">
                  <div className="dpp-sheet-top-header">
                    <div>
                      <span className="dpp-sheet-batch-tag">{selectedBatch || 'Batch Name'}</span>
                      <h3 className="dpp-sheet-title">{dppTitle || 'Daily Practice Problem'}</h3>
                      <span className="dpp-sheet-topic">{effectiveTopic || 'Topic Name'}</span>
                    </div>
                    <div className="dpp-sheet-stats">
                      <span className="dpp-sheet-stat">Questions: {totalQuestions || (contentMode === "file" ? 1 : typedQuestions.length)}</span>
                      <span className="dpp-sheet-stat">Due: {dueDate}</span>
                    </div>
                  </div>

                  <div className="dpp-sheet-body">
                    {contentMode === 'file' ? (
                      <div className="dpp-sheet-file-wrap">
                        {uploadedFile ? (
                          <div className="dpp-preview-attached-file">
                            <span>📎 {uploadedFile.name} ({uploadedFile.size})</span>
                          </div>
                        ) : (
                          <p className="dpp-empty-preview-note">No file attached yet.</p>
                        )}
                      </div>
                    ) : (
                      <div className="dpp-sheet-questions-preview">
                        {typedQuestions.map((q, i) => (
                          <div key={q.id} className="dpp-preview-q-row">
                            <strong>Q{i + 1}. ({q.marks} Marks)</strong>
                            <p>{q.text || 'Question text preview...'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {instructions && (
                      <div className="dpp-sheet-notes">
                        <strong>Instructions:</strong> {instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS (SUBMIT & CLEAR) */}
          <div className="dpp-bottom-action-bar">
            <button
              type="button"
              className="dpp-btn-secondary"
              onClick={handleResetForm}
            >
              Clear Form
            </button>

            <button
              type="button"
              className="dpp-btn-submit"
              onClick={handleInitiateSubmit}
            >
              <span>Submit &amp; Publish DPP</span>
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
              {BATCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`dpp-fpill ${publishedFilterBatch === b ? 'is-active' : ''}`}
                  onClick={() => setPublishedFilterBatch(b)}
                >
                  {b}
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
                <span className="dpp-pcard-topic">Topic: {dpp.topic}</span>

                <div className="dpp-pcard-meta-list">
                  <div className="dpp-pmeta-item">
                    <span className="dpp-pmeta-label">Due Date:</span>
                    <span className="dpp-pmeta-val">{dpp.dueDate}</span>
                  </div>
                  <div className="dpp-pmeta-item">
                    <span className="dpp-pmeta-label">Total Questions:</span>
                    <span className="dpp-pmeta-val">{dpp.totalQuestions || dpp.questionsCount || 1} Questions</span>
                  </div>
                  <div className="dpp-pmeta-item">
                    <span className="dpp-pmeta-label">Format:</span>
                    <span className="dpp-pmeta-val">
                      {dpp.submissionType === 'file' ? `PDF/Image (${dpp.fileName || 'Attached'})` : `${dpp.questionsCount || 2} Typed Questions`}
                    </span>
                  </div>
                  <div className="dpp-pmeta-item">
                    <span className="dpp-pmeta-label">Submissions:</span>
                    <span className="dpp-pmeta-val green">
                      {dpp.submittedCount} / {dpp.totalStudents} Submitted
                    </span>
                  </div>
                </div>

                <div className="dpp-pcard-footer">
                  <button
                    type="button"
                    className="dpp-pcard-del-btn"
                    onClick={() => handleDeletePublished(dpp.id)}
                    title="Delete DPP"
                  >
                    Delete
                  </button>

                  <button
                    type="button"
                    className="dpp-pcard-view-btn"
                    onClick={() => {
                      showToast(`Viewing: ${dpp.title}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPublishedDpps.length === 0 && (
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
          onClick={() => setShowConfirmModal(false)}
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
                onClick={() => setShowConfirmModal(false)}
                aria-label="Close modal"
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
                  <strong>{selectedBatch}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Subject:</span>
                  <strong>{selectedSubject}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Topic:</span>
                  <strong>{effectiveTopic}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Title:</span>
                  <strong>{dppTitle || `DPP — ${effectiveTopic}`}</strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Format:</span>
                  <strong>
                    {contentMode === 'file' ? `Attached File (${uploadedFile?.name})` : `${typedQuestions.length} Typed Questions`}
                  </strong>
                </div>
                <div className="dpp-msum-row">
                  <span>Due Date:</span>
                  <strong>{dueDate}</strong>
                </div>
                <div className="dpp-msum-row highlight">
                  <span>Target Students:</span>
                  <strong className="green">{targetStudentsCount || 15} Students</strong>
                </div>
              </div>
            </div>

            <div className="dpp-modal-actions">
              <button
                type="button"
                className="dpp-modal-cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                No, Review Draft
              </button>
              <button
                type="button"
                className="dpp-modal-confirm-btn"
                onClick={handleConfirmPublish}
              >
                Yes, Publish DPP
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
