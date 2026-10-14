import React, { useState } from 'react';

export default function AssignmentsTab({ showToast }) {
  const [assignmentSubject, setAssignmentSubject] = useState('All');

  const assignmentsData = [
    {
      id: 1,
      title: 'DPP 08 - Gauss’s Law & Electric Potential',
      desc: '15 standard numerical and concept questions on symmetrical charge distributions.',
      subject: 'Physics',
      date: '12 Oct 2026',
      size: 'PDF (2.4 MB)',
      theme: 'purple',
    },
    {
      id: 2,
      title: 'DPP 06 - Aldol Reactions & Carbonyl Mechanisms',
      desc: 'Step-by-step cross-aldol condensation mechanisms with practice questions.',
      subject: 'Chemistry',
      date: '10 Oct 2026',
      size: 'PDF (1.8 MB)',
      theme: 'green',
    },
    {
      id: 3,
      title: 'DPP 09 - Matrices & Determinant Properties',
      desc: 'Board standard operations, cofactor matrices, and inverse practice problems.',
      subject: 'Mathematics',
      date: '08 Oct 2026',
      size: 'PDF (2.1 MB)',
      theme: 'amber',
    },
    {
      id: 4,
      title: 'DPP 05 - Molecular Basis of Inheritance',
      desc: 'DNA replication, transcription mechanisms and lac operon question set.',
      subject: 'Biology',
      date: '06 Oct 2026',
      size: 'PDF (1.6 MB)',
      theme: 'cyan',
    },
    {
      id: 5,
      title: 'Assignment 04 - Current Electricity Numerical Problems',
      desc: 'Circuit solving problems using KCL, KVL and Wheatstone bridge networks.',
      subject: 'Physics',
      date: '03 Oct 2026',
      size: 'PDF (3.0 MB)',
      theme: 'blue',
    },
    {
      id: 6,
      title: 'Assignment 03 - Coordination Compounds & Nomenclature',
      desc: 'IUPAC naming, crystal field theory and isomerism practice questions.',
      subject: 'Chemistry',
      date: '30 Sep 2026',
      size: 'PDF (2.2 MB)',
      theme: 'red',
    },
    {
      id: 7,
      title: 'DPP 07 - Continuity & Differentiability',
      desc: 'Limits, differentiability rules and trigonometric continuity problems.',
      subject: 'Mathematics',
      date: '25 Sep 2026',
      size: 'PDF (1.9 MB)',
      theme: 'amber',
    },
  ];

  return (
    <div className="sp-view-container sp-materials-view sp-assignments-view">
      {/* Header with Title & Current Batch */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">Assignments & DPPs</h1>
          <p className="sp-page-subtitle">Download chapter-wise DPPs, problem sets and practice papers.</p>
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
              className={`sp-filter-pill ${assignmentSubject === subj ? 'active' : ''}`}
              onClick={() => setAssignmentSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* DPP Cards List Rows */}
      <div className="sp-materials-cards-stack">
        {assignmentsData
          .filter((m) => {
            if (assignmentSubject !== 'All' && m.subject !== assignmentSubject) return false;
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

              {/* Right Action: Download DPP button */}
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
                  Download DPP
                </button>
                <button
                  className="sp-more-dots-btn"
                  onClick={() => showToast(`Options for ${item.title}: Share, Print Sheet`)}
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
