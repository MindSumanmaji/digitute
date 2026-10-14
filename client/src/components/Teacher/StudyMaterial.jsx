import React, { useState, useRef, useMemo } from 'react';
import EducationIllustration from './EducationIllustration';
const INITIAL_MATERIALS = [
  {
    id: 'mat-1',
    name: 'Unit-1-Computer-Networks-Overview.pdf',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '14 Oct 2026',
    type: 'pdf',
    size: '2.4 MB'
  },
  {
    id: 'mat-2',
    name: 'OSI-Model-Architecture-Diagram.png',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '12 Oct 2026',
    type: 'image',
    size: '1.1 MB'
  },
  {
    id: 'mat-3',
    name: 'TCP-IP-Protocol-Suite-Lecture-Notes.docx',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '10 Oct 2026',
    type: 'word',
    size: '850 KB'
  },
  {
    id: 'mat-4',
    name: 'DPP-01-Subnetting-Practice-Problems.pdf',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '08 Oct 2026',
    type: 'pdf',
    size: '1.6 MB'
  },
  {
    id: 'mat-5',
    name: 'Routing-Algorithms-Lab-Manual.xlsx',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    date: '05 Oct 2026',
    type: 'excel',
    size: '420 KB'
  }
];

export function StudyMaterial() {
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
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

  const triggerUploadClick = () => {
    if (!selectedBatch || !selectedSubject) {
      showToast('⚠️ Please select both Batch and Subject before uploading files.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    if (!selectedBatch || !selectedSubject) {
      showToast('⚠️ Please select both Batch and Subject before uploading files.');
      return;
    }

    const newItems = Array.from(filesList).map((file, idx) => {
      const type = getFileType(file.name);
      return {
        id: `mat-${Date.now()}-${idx}`,
        name: file.name,
        batch: selectedBatch,
        subject: selectedSubject,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
    });

    setMaterials((prev) => [...newItems, ...prev]);
    showToast(`Uploaded ${newItems.length} file${newItems.length > 1 ? 's' : ''} successfully to ${selectedBatch}!`);
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

  const handleDelete = (id, name) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast(`Deleted "${name}"`);
  };

  const handleView = (name) => {
    showToast(`Opening "${name}"...`);
  };

  const handleDownload = (name) => {
    showToast(`Downloading "${name}"...`);
  };

  const filteredMaterials = useMemo(() => {
    if (!selectedBatch || !selectedSubject) return [];
    return materials.filter((item) => {
      const matchSubject = !item.subject || item.subject.toLowerCase() === selectedSubject.toLowerCase();
      const matchSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchSearch;
    });
  }, [materials, selectedBatch, selectedSubject, searchQuery]);

  return (
    <div className="sm-page-wrapper">
      <main className="sm-container">
        {/* ==================================================================
            1. HERO SECTION (Clean alignment, realistic education SVG, no upload button)
            ================================================================== */}
        <section className="sm-hero" aria-label="Study Material Header">
          <div className="sm-hero-content">
            <span className="sm-hero-label">STUDY MATERIAL</span>
            <div className="sm-hero-title-group">
              <h1 className="sm-hero-heading">Study Materials</h1>
              <div className="sm-hero-underline" aria-hidden="true" />
            </div>
            <p className="sm-hero-subtitle">
              Share syllabus, lecture notes, DPPs and resources with students.
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
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    aria-label="Select Batch"
                  >
                    <option value="">-- Select Batch --</option>
                    <option value="B.Sc 6th Sem">B.Sc 6th Sem</option>
                    <option value="B.Sc 4th Sem">B.Sc 4th Sem</option>
                    <option value="B.Sc 2nd Sem">B.Sc 2nd Sem</option>
                    <option value="BCA 6th Sem">BCA 6th Sem</option>
                    <option value="MCA 2nd Sem">MCA 2nd Sem</option>
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
                  >
                    <option value="">-- Select Subject --</option>
                    <option value="Computer Network">Computer Network</option>
                    <option value="Database Management">Database Management</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Web Technologies">Web Technologies</option>
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
                  Supported: PDF, Image, Word, Excel &amp; More
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="sm-hidden-input"
                multiple
                onChange={handleFileInputChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />

              {/* Dashed Drag-Drop Area */}
              <div
                className={`sm-drop-area ${isDragOver ? 'is-dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerUploadClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerUploadClick();
                  }
                }}
                aria-label="Upload files by dragging or clicking"
              >
                <div className="sm-drop-cloud-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <p className="sm-drop-title">
                  Drag and drop files here, or <span className="sm-browse-text">Browse</span>
                </p>
                <p className="sm-drop-subtitle">
                  {selectedBatch && selectedSubject 
                    ? `Files will be assigned to ${selectedBatch} • ${selectedSubject}` 
                    : 'Select Batch & Subject above first'}
                </p>
              </div>
            </section>
          </div>

          {/* ==================================================================
              4. SHARED MATERIALS LIST (NO upload button next to header)
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

                {/* Search Input - NO upload button here */}
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
              {!selectedBatch || !selectedSubject ? (
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
                  No study materials found for {selectedBatch} • {selectedSubject}
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
                          onClick={() => handleView(file.name)}
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
                          onClick={() => handleDownload(file.name)}
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
