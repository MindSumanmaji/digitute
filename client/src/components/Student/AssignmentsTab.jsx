import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function AssignmentsTab({ showToast }) {
  const [assignmentSubject, setAssignmentSubject] = useState('All');
  const [assignments, setAssignments] = useState([]);
  const [batchName, setBatchName] = useState('My Batch');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDppId, setExpandedDppId] = useState(null);

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
      // Toggle accordion open / close
      setExpandedDppId((prev) => (prev === item.id ? null : item.id));
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

  const copyQuestionsText = (item) => {
    const q = item.questions;
    const text = q?.raw_text || (Array.isArray(q?.items) ? q.items.join('\n\n') : JSON.stringify(q, null, 2));
    navigator.clipboard.writeText(text);
    if (showToast) showToast('📋 Questions copied to clipboard!');
  };

  return (
    <div className="sp-view-container sp-materials-view sp-assignments-view">
      {/* Header with Title */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">Assignments & DPPs</h1>
          <p className="sp-page-subtitle">Access daily practice problems, worksheets, and problem sets.</p>
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
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
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
          {filteredAssignments.map((item) => {
            const isExpanded = expandedDppId === item.id;
            const isManual = item.contentType === 'MANUAL' || (!item.file_url && item.questions);

            const q = item.questions;
            const items = q
              ? Array.isArray(q.items)
                ? q.items
                : Array.isArray(q)
                ? q
                : q.raw_text
                ? q.raw_text.split(/\n{2,}/).filter(Boolean)
                : [typeof q === 'string' ? q : JSON.stringify(q, null, 2)]
              : [];

            return (
              <div key={item.id} className="sp-dpp-wrapper">
                <div className={`sp-card sp-material-row-card ${isExpanded ? 'is-expanded' : ''}`}>
                  {/* Type Coded Icon */}
                  <div className={`sp-pdf-icon-box sp-pdf-${item.theme}`}>
                    {isManual ? (
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
                        {isManual ? '✍️ In-App Practice' : `📄 ${item.size}`}
                      </span>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div className="sp-material-actions-right">
                    <button
                      className={`sp-download-btn ${isExpanded ? 'btn-view-active' : ''}`}
                      onClick={() => handleItemAction(item)}
                    >
                      {isManual ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? '#7c3aed' : '#7c3aed'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {isExpanded ? 'Hide Questions' : 'View Questions'}
                          <span style={{ fontSize: '11px', marginLeft: '3px' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
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

                {/* Inline Questions Expandable Accordion Drawer */}
                {isManual && isExpanded && (
                  <div className="sp-dpp-accordion-drawer">
                    <div className="sp-dpp-drawer-header">
                      <span className="sp-dpp-drawer-tag">
                        <span>📝</span>
                        <span>Practice Questions ({items.length || 1})</span>
                      </span>
                      <button
                        type="button"
                        className="sp-dpp-copy-btn"
                        onClick={() => copyQuestionsText(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Questions
                      </button>
                    </div>

                    <div className="sp-dpp-drawer-body">
                      {items.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                          No question text available for this DPP.
                        </p>
                      ) : (
                        items.map((qItem, idx) => (
                          <div key={idx} className="sp-dpp-question-item">
                            <div className="sp-dpp-q-badge">
                              <span>📌</span>
                              <span>QUESTION {idx + 1}</span>
                            </div>
                            <div className="sp-dpp-q-content">
                              {typeof qItem === 'object' ? JSON.stringify(qItem, null, 2) : qItem}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
