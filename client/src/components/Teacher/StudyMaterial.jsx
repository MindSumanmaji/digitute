import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import EducationIllustration from './EducationIllustration';
import { apiRequest } from '../../api';

export function StudyMaterial() {
  const [batchesList, setBatchesList] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const getFileType = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return 'video';
    return 'default';
  };

  const renderFileBadgeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="sm-file-badge badge-pdf" title="PDF Document">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        );
      case 'video':
        return (
          <div className="sm-file-badge badge-video" title="Video File" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        );
      case 'image':
        return (
          <div className="sm-file-badge badge-image" title="Image File">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        );
      case 'word':
        return (
          <div className="sm-file-badge badge-word" title="Word Document">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
        );
      case 'excel':
        return (
          <div className="sm-file-badge badge-excel" title="Excel Spreadsheet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
              <line x1="12" y1="9" x2="12" y2="21" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="sm-file-badge badge-default" title="File">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
        );
    }
  };

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await apiRequest('/api/teacher/study-materials');
      if (Array.isArray(data)) {
        const formatted = data.map((m) => ({
          id: m.id,
          name: m.title || (m.file_url ? m.file_url.split('/').pop() : 'Study Material'),
          batch_id: m.batch_id,
          batch: m.batches?.name || 'Assigned Batch',
          subject: m.subject,
          date: m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          type: getFileType(m.title || m.file_url || ''),
          file_url: m.file_url,
          signed_url: m.signed_url,
          description: m.description,
        }));
        setMaterials(formatted);
      }
    } catch (err) {
      console.error('Failed to load study materials:', err);
      showToast('⚠️ Could not load study materials from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch batches & materials on mount
  useEffect(() => {
    let isMounted = true;

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
        console.error('Failed to load teacher batches:', err);
      });

    fetchMaterials();

    return () => {
      isMounted = false;
    };
  }, [fetchMaterials]);

  // Derived subjects for the currently selected batch
  const availableSubjects = useMemo(() => {
    const currentBatch = batchesList.find((b) => b.batch_id === selectedBatch);
    if (!currentBatch || !currentBatch.subjects) return [];
    return currentBatch.subjects.map((s) => (typeof s === 'string' ? s : s.name));
  }, [batchesList, selectedBatch]);

  const handleBatchChange = (newBatchId) => {
    setSelectedBatch(newBatchId);
    const b = batchesList.find((x) => x.batch_id === newBatchId);
    if (b && b.subjects && b.subjects.length > 0) {
      const firstSubj = typeof b.subjects[0] === 'string' ? b.subjects[0] : b.subjects[0].name;
      setSelectedSubject(firstSubj || '');
    } else {
      setSelectedSubject('');
    }
  };

  const triggerUploadClick = () => {
    if (!selectedBatch || !selectedSubject) {
      showToast('⚠️ Please select both Batch and Subject before uploading files.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    if (!selectedBatch || !selectedSubject) {
      showToast('⚠️ Please select both Batch and Subject before uploading files.');
      return;
    }

    const filesArray = Array.from(filesList);
    const maxBytes = 50 * 1024 * 1024; // 50 MiB
    const validExtensions = ['.pdf', '.doc', '.docx', '.mp4', '.webm', '.mov', '.mkv'];

    setIsUploading(true);
    let successCount = 0;

    for (const file of filesArray) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        showToast(`❌ "${file.name}" unsupported format. Allowed: PDF, DOC, DOCX, MP4, WEBM, MOV, MKV`);
        continue;
      }
      if (file.size > maxBytes) {
        showToast(`❌ "${file.name}" exceeds the 50 MiB limit.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('batch_id', selectedBatch);
      formData.append('subject', selectedSubject);
      formData.append('title', file.name);

      try {
        await apiRequest('/api/teacher/study-materials', {
          method: 'POST',
          body: formData,
        });
        successCount++;
      } catch (err) {
        showToast(`❌ Failed to upload "${file.name}": ${err.message}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      showToast(`✓ Uploaded ${successCount} file${successCount > 1 ? 's' : ''} successfully!`);
      await fetchMaterials();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      await apiRequest(`/api/teacher/study-materials/${id}`, {
        method: 'DELETE',
      });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      showToast(`✓ Deleted "${name}" successfully.`);
    } catch (err) {
      showToast(`❌ Delete failed: ${err.message}`);
    }
  };

  const handleView = async (item) => {
    try {
      let url = item.signed_url;
      if (!url) {
        const res = await apiRequest(`/api/teacher/study-materials/${item.id}/access-url`);
        url = res.signed_url;
      }
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        showToast('⚠️ Unable to generate secure view link.');
      }
    } catch (err) {
      showToast(`❌ View error: ${err.message}`);
    }
  };

  const handleDownload = async (item) => {
    try {
      let url = item.signed_url;
      if (!url) {
        const res = await apiRequest(`/api/teacher/study-materials/${item.id}/access-url`);
        url = res.signed_url;
      }
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name || 'study-material';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showToast('⚠️ Unable to generate download link.');
      }
    } catch (err) {
      showToast(`❌ Download error: ${err.message}`);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!selectedBatch || !selectedSubject) return [];
    return materials.filter((item) => {
      const matchBatch = item.batch_id === selectedBatch;
      const matchSubject = !item.subject || item.subject.toLowerCase() === selectedSubject.toLowerCase();
      const matchSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBatch && matchSubject && matchSearch;
    });
  }, [materials, selectedBatch, selectedSubject, searchQuery]);

  const selectedBatchObj = batchesList.find((b) => b.batch_id === selectedBatch);
  const selectedBatchName = selectedBatchObj?.batch_name || selectedBatch;

  return (
    <div className="sm-page-wrapper">
      <main className="sm-container">
        {/* ==================================================================
            1. HERO SECTION (Clean alignment, realistic education SVG)
            ================================================================== */}
        <section className="sm-hero" aria-label="Study Material Header">
          <div className="sm-hero-content">
            <span className="sm-hero-label">STUDY MATERIAL</span>
            <div className="sm-hero-title-group">
              <h1 className="sm-hero-heading">Study Materials</h1>
              <div className="sm-hero-underline" aria-hidden="true" />
            </div>
            <p className="sm-hero-subtitle">
              Upload syllabus, lecture notes, DPPs and videos securely to your assigned batches.
            </p>
          </div>

          <div className="sm-hero-illustration" aria-hidden="true">
            <EducationIllustration />
          </div>
        </section>

        {/* Responsive Layout Split: 1-col on mobile, 2-col on PC/Desktop */}
        <div className="sm-desktop-layout">
          <div className="sm-desktop-sidebar">
            {/* ==================================================================
                2. BATCH & SUBJECT SELECTOR
                ================================================================== */}
            <section className="sm-selector-card" aria-label="Batch and Subject Selection">
              {/* Left: Batch Selector */}
              <div className="sm-select-group">
                <div className="sm-select-label-wrap">
                  <div className="sm-select-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span className="sm-select-label">Select Batch</span>
                </div>
                <div className="sm-select-wrapper">
                  <select
                    className="sm-select"
                    value={selectedBatch}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    aria-label="Select Batch"
                  >
                    {batchesList.length === 0 ? (
                      <option value="">No batches assigned</option>
                    ) : (
                      <>
                        <option value="">-- Select Batch --</option>
                        {batchesList.map((b) => (
                          <option key={b.batch_id} value={b.batch_id}>
                            {b.batch_name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="sm-select-arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right: Subject Selector */}
              <div className="sm-select-group">
                <div className="sm-select-label-wrap">
                  <div className="sm-select-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <span className="sm-select-label">Select Subject</span>
                </div>
                <div className="sm-select-wrapper">
                  <select
                    className="sm-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    aria-label="Select Subject"
                    disabled={!selectedBatch || availableSubjects.length === 0}
                  >
                    {availableSubjects.length === 0 ? (
                      <option value="">-- No Subjects --</option>
                    ) : (
                      <>
                        <option value="">-- Select Subject --</option>
                        {availableSubjects.map((s, idx) => (
                          <option key={idx} value={s}>
                            {s}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="sm-select-arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================================
                3. UPLOAD SECTION
                ================================================================== */}
            <section className="sm-upload-card" aria-label="Upload New Material">
              <div className="sm-upload-header">
                <div className="sm-upload-header-left">
                  <div className="sm-upload-header-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 16l-4-4-4 4" />
                      <path d="M12 12v9" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      <polyline points="16 16 12 12 8 16" />
                    </svg>
                  </div>
                  <h2 className="sm-upload-title">Upload New Material</h2>
                </div>
                <span className="sm-upload-supported">
                  PDF, DOC/DOCX, MP4, WEBM (Max 50MB)
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="sm-hidden-input"
                multiple
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.mp4,.webm,.mov,.mkv"
              />

              {/* Dashed Drag-Drop Area */}
              <div
                className={`sm-drop-area ${isDragOver ? 'is-dragover' : ''} ${isUploading ? 'is-uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={isUploading ? undefined : triggerUploadClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                    e.preventDefault();
                    triggerUploadClick();
                  }
                }}
                aria-label="Upload files by dragging or clicking"
                style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'wait' : 'pointer' }}
              >
                <div className="sm-drop-cloud-icon" aria-hidden="true">
                  {isUploading ? (
                    <div style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}>⏳</div>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </div>

                <p className="sm-drop-title">
                  {isUploading ? (
                    'Uploading file(s) to secure storage...'
                  ) : (
                    <>Drag and drop files here, or <span className="sm-browse-text">Browse</span></>
                  )}
                </p>
                <p className="sm-drop-subtitle">
                  {selectedBatch && selectedSubject 
                    ? `Files will be assigned to ${selectedBatchName} • ${selectedSubject}` 
                    : 'Select Batch & Subject above first'}
                </p>
              </div>
            </section>
          </div>

          {/* ==================================================================
              4. SHARED MATERIALS LIST
              ================================================================== */}
          <div className="sm-desktop-main">
            <section className="sm-list-card" aria-label="Shared Materials List">
              <div className="sm-list-header">
                <div className="sm-list-title-wrap">
                  <div className="sm-list-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h2 className="sm-list-title">
                    Your Shared Materials {selectedBatch && selectedSubject ? `(${filteredMaterials.length})` : ''}
                  </h2>
                </div>

                {/* Search Input */}
                <div className="sm-search-box">
                  <div className="sm-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="sm-search-input"
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search shared materials"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="sm-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* List of File Items */}
              {isLoading ? (
                <div className="sm-empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: '#64748B' }}>Loading study materials...</div>
                </div>
              ) : !selectedBatch || !selectedSubject ? (
                <div className="sm-empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B', marginBottom: '4px' }}>
                    Please Select Batch &amp; Subject
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Choose a batch and subject from the dropdowns above to view or upload materials.
                  </div>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="sm-empty-state">
                  No study materials found for {selectedBatchName} • {selectedSubject}
                </div>
              ) : (
                <ul className="sm-files-list">
                  {filteredMaterials.map((file) => (
                    <li key={file.id} className="sm-file-item">
                      <div className="sm-file-item-left">
                        {renderFileBadgeIcon(file.type)}
                        <div className="sm-file-info">
                          <span className="sm-file-name" title={file.name}>
                            {file.name}
                          </span>
                          <span className="sm-file-meta">
                            <span>{file.subject}</span>
                            <span className="sm-meta-dot" aria-hidden="true" />
                            <span>{file.date}</span>
                          </span>
                        </div>
                      </div>

                      {/* 3 Action Buttons */}
                      <div className="sm-file-actions">
                        <button
                          type="button"
                          className="sm-action-btn btn-view"
                          onClick={() => handleView(file)}
                          aria-label={`View ${file.name}`}
                          title="View file"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="sm-action-btn btn-download"
                          onClick={() => handleDownload(file)}
                          aria-label={`Download ${file.name}`}
                          title="Download file"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="sm-action-btn btn-delete"
                          onClick={() => handleDelete(file.id, file.name)}
                          aria-label={`Delete ${file.name}`}
                          title="Delete file"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="sm-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default StudyMaterial;
