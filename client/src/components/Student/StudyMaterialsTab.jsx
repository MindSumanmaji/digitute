import React, { useState } from 'react';

export default function StudyMaterialsTab({ showToast }) {
  const [materialSubject, setMaterialSubject] = useState('All');

  const studyMaterialsData = [
    {
      id: 1,
      title: 'Electrostatics - Handwritten Notes',
      desc: 'Complete notes for Chapter 1 with important diagrams.',
      subject: 'Physics',
      date: '5 Oct 2026',
      size: 'PDF (3.2 MB)',
      theme: 'red',
      type: 'Notes'
    },
    {
      id: 2,
      title: 'Organic Compounds - Class Notes',
      desc: 'Detailed notes with examples and reactions.',
      subject: 'Chemistry',
      date: '3 Oct 2026',
      size: 'PDF (2.1 MB)',
      theme: 'green',
      type: 'Notes'
    },
    {
      id: 3,
      title: 'Mathematics Formula Sheet',
      desc: 'All important formulas for quick revision.',
      subject: 'Mathematics',
      date: '28 Sep 2026',
      size: 'PDF (1.4 MB)',
      theme: 'purple',
      type: 'Formula Sheet'
    },
    {
      id: 4,
      title: 'DPP Set 3 - Current Electricity',
      desc: 'Practice questions with answer key.',
      subject: 'Physics',
      date: '25 Sep 2026',
      size: 'PDF (2.6 MB)',
      theme: 'blue',
      type: 'DPP'
    },
    {
      id: 5,
      title: 'Biology Diagrams',
      desc: 'Important diagrams for board and entrance exams.',
      subject: 'Biology',
      date: '20 Sep 2026',
      size: 'PDF (1.8 MB)',
      theme: 'red',
      type: 'Diagrams'
    },
    {
      id: 6,
      title: 'Previous Year Questions (2020-2025)',
      desc: 'Chapter-wise PYQs with solutions.',
      subject: 'Mixed',
      date: '15 Sep 2026',
      size: 'PDF (4.5 MB)',
      theme: 'amber',
      type: 'PYQ'
    },
    {
      id: 7,
      title: 'Chemistry - Practice Questions',
      desc: 'Topic-wise important questions.',
      subject: 'Chemistry',
      date: '10 Sep 2026',
      size: 'PDF (2.0 MB)',
      theme: 'cyan',
      type: 'Practice'
    }
  ];

  return (
    <div className="sp-view-container sp-materials-view">
      {/* Header with Title & Current Batch */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">Study Material</h1>
          <p className="sp-page-subtitle">Access notes, DPPs, formula sheets, previous year questions and more.</p>
        </div>
        <div className="sp-batch-pill-card">
          <div className="sp-batch-pill-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <div className="sp-batch-pill-texts">
            <small>Current Batch:</small>
            <strong>Class XII - Science (2026)</strong>
          </div>
          <span className="sp-batch-chevron">⌵</span>
        </div>
      </div>

      {/* Filters Row: Subject pills only */}
      <div className="sp-materials-filter-row">
        <div className="sp-pills-group">
          {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subj) => (
            <button
              key={subj}
              className={`sp-filter-pill ${materialSubject === subj ? 'active' : ''}`}
              onClick={() => setMaterialSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Material Cards List Rows */}
      <div className="sp-materials-cards-stack">
        {studyMaterialsData
          .filter((m) => {
            if (materialSubject !== 'All' && m.subject !== materialSubject && m.subject !== 'Mixed') return false;
            return true;
          })
          .map((item) => (
            <div key={item.id} className="sp-card sp-material-row-card">
              {/* PDF Color Coded Icon */}
              <div className={`sp-pdf-icon-box sp-pdf-${item.theme}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M9 15h1a1.5 1.5 0 0 0 0-3H9v6"/>
                </svg>
              </div>

              {/* Content details */}
              <div className="sp-material-text-block">
                <h4 className="sp-material-title">{item.title}</h4>
                <p className="sp-material-desc">{item.desc}</p>
                <div className="sp-material-meta-row">
                  <span className={`sp-subject-tag-pill tag-${item.subject.toLowerCase()}`}>
                    {item.subject}
                  </span>
                  <span className="sp-meta-sep-dot">·</span>
                  <span className="sp-meta-text">📅 {item.date}</span>
                  <span className="sp-meta-sep-dot">·</span>
                  <span className="sp-meta-text">📄 {item.size}</span>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="sp-material-actions-right">
                <button
                  className="sp-download-btn"
                  onClick={() => showToast(`Starting download: ${item.title}.pdf`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                  Download
                </button>
                <button
                  className="sp-more-dots-btn"
                  onClick={() => showToast(`Options for ${item.title}: Share, Save Offline`)}
                >
                  ⋮
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
