import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function AssignmentsTab({ showToast }) {
  const [assignmentSubject, setAssignmentSubject] = useState('All');
  const [assignments, setAssignments] = useState([]);
  const [batchName, setBatchName] = useState('My Batch');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingQuestionsDpp, setViewingQuestionsDpp] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Load student profile to display current batch name
    apiRequest('/api/student/my-profile')
      .then((profile) => {
        if (!isMounted || !profile) return;
        const bName = profile.batches?.name || profile.batch_name || 'Enrolled Batch';
        setBatchName(bName);
      })
      .catch((err) => {
        console.warn('Profile fetch warning in assignments tab:', err.message);
      });

    // Load actual DPPs for this student's batch from backend
    apiRequest('/api/student/dpps')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const formatted = data.map((item, idx) => {
            const isManual = item.content_type === 'MANUAL' || (!item.file_url && item.questions);
            const ext = item.file_url ? item.file_url.split('.').pop()?.toLowerCase() : '';
            let fileTypeLabel = isManual ? 'Questions' : 'Document';
            let theme = isManual ? 'purple' : 'blue';

            if (!isManual) {
              if (ext === 'pdf') {
                fileTypeLabel = 'PDF';
                theme = idx % 4 === 0 ? 'red' : idx % 4 === 1 ? 'green' : idx % 4 === 2 ? 'purple' : 'blue';
              } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                fileTypeLabel = 'Image';
                theme = 'cyan';
              } else if (['doc', 'docx'].includes(ext)) {
                fileTypeLabel = 'Word';
                theme = 'blue';
              }
            }

            return {
              id: item.id,
              title: item.title,
              desc: item.users?.full_name ? `Assigned by Prof. ${item.users.full_name}` : 'Daily practice problem set.',
              subject: item.subject,
              contentType: item.content_type || (item.file_url ? 'FILE' : 'MANUAL'),
              questions: item.questions,
              date: item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
              size: isManual ? 'In-App Questions' : fileTypeLabel,
              theme,
              type: fileTypeLabel,
              file_url: item.file_url,
              signed_url: item.signed_url,
            };
          });
          setAssignments(formatted);
        } else {
          setAssignments([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not load DPPs from server:', err);
        setAssignments([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    assignments.forEach((m) => {
      if (m.subject) subjects.add(m.subject);
    });
    return ['All', ...Array.from(subjects)];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((m) => {
      if (assignmentSubject !== 'All' && m.subject !== assignmentSubject) return false;
      return true;
    });
  }, [assignments, assignmentSubject]);

  const handleItemAction = async (item) => {
    if (item.contentType === 'MANUAL' || (!item.file_url && item.questions)) {
      setViewingQuestionsDpp(item);
      return;
    }

    try {
      if (showToast) showToast(`Opening ${item.title}...`);
      const url = item.signed_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        if (showToast) showToast('⚠️ Unable to access document (link not available).');
      }
    } catch (err) {
      if (showToast) showToast(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="sp-view-container sp-materials-view sp-assignments-view">
      {/* Header with Title & Current Batch */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">Assignments & DPPs</h1>
          <p className="sp-page-subtitle">Access daily practice problems, worksheets, and problem sets.</p>
        </div>
        <div className="sp-batch-pill-card">
          <div className="sp-batch-pill-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="sp-batch-pill-texts">
            <small>Current Batch:</small>
            <strong>{batchName}</strong>
          </div>
          <span className="sp-batch-chevron">⌵</span>
        </div>
      </div>

      {/* Filters Row: Subject pills only */}
      <div className="sp-materials-filter-row">
        <div className="sp-pills-group">
          {uniqueSubjects.map((subj) => (
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
      {isLoading ? (
        <div className="sp-card" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
          Loading daily practice problems...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="sp-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
            No DPPs Found
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            {assignmentSubject === 'All'
              ? `Your teachers have not uploaded or assigned any DPPs for ${batchName} yet.`
              : `No DPPs found under '${assignmentSubject}' for ${batchName}.`}
          </p>
        </div>
      ) : (
        <div className="sp-materials-cards-stack">
          {filteredAssignments.map((item) => (
            <div key={item.id} className="sp-card sp-material-row-card">
              {/* Type Coded Icon */}
              <div className={`sp-pdf-icon-box sp-pdf-${item.theme}`}>
                {item.contentType === 'MANUAL' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15h1a1.5 1.5 0 0 0 0-3H9v6" />
                  </svg>
                )}
              </div>

              {/* Content details */}
              <div className="sp-material-text-block">
                <h4 className="sp-material-title">{item.title}</h4>
                <p className="sp-material-desc">{item.desc}</p>
                <div className="sp-material-meta-row">
                  <span className={`sp-subject-tag-pill tag-${item.subject.toLowerCase()}`}>
                    {item.subject}
                  </span>
                  {item.date && (
                    <>
                      <span className="sp-meta-sep-dot">·</span>
                      <span className="sp-meta-text">📅 {item.date}</span>
                    </>
                  )}
                  <span className="sp-meta-sep-dot">·</span>
                  <span className="sp-meta-text">
                    {item.contentType === 'MANUAL' ? '✍️ In-App Practice' : `📄 ${item.size}`}
                  </span>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="sp-material-actions-right">
                <button
                  className="sp-download-btn"
                  onClick={() => handleItemAction(item)}
                >
                  {item.contentType === 'MANUAL' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View Questions
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Download DPP
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STUDENT IN-APP QUESTIONS VIEWER MODAL
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
            style={{ maxWidth: '680px', width: '92%', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dpp-modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="dpp-modal-icon-wrap" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                ✍️
              </div>
              <div className="dpp-modal-title-wrap">
                <h3 className="dpp-modal-title" style={{ fontSize: '1.15rem' }}>{viewingQuestionsDpp.title}</h3>
                <span className="dpp-modal-subtitle">
                  {viewingQuestionsDpp.subject} • Practice Questions
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

            <div className="dpp-modal-body" style={{ maxHeight: '62vh', overflowY: 'auto', padding: '20px 24px' }}>
              {(() => {
                const q = viewingQuestionsDpp.questions;
                if (!q) {
                  return <p style={{ color: '#64748b' }}>No question text available for this DPP.</p>;
                }
                const items = Array.isArray(q.items)
                  ? q.items
                  : Array.isArray(q)
                  ? q
                  : q.raw_text
                  ? q.raw_text.split(/\n{2,}/).filter(Boolean)
                  : [typeof q === 'string' ? q : JSON.stringify(q, null, 2)];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px 16px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          QUESTION {idx + 1}
                        </div>
                        <div style={{ fontSize: '0.925rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="dpp-modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="dpp-btn-preview"
                onClick={() => {
                  const q = viewingQuestionsDpp.questions;
                  const text = q?.raw_text || JSON.stringify(q, null, 2);
                  navigator.clipboard.writeText(text);
                  if (showToast) showToast('📋 Questions copied to clipboard!');
                }}
              >
                📋 Copy Questions
              </button>
              <button
                type="button"
                className="dpp-btn-submit"
                onClick={() => setViewingQuestionsDpp(null)}
              >
                Close Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
