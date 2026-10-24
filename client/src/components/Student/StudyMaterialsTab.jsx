import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function StudyMaterialsTab({ showToast }) {
  const [materialSubject, setMaterialSubject] = useState('All');
  const [materials, setMaterials] = useState([]);
  const [batchName, setBatchName] = useState('My Batch');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Load student profile to display batch name
    apiRequest('/api/student/my-profile')
      .then((profile) => {
        if (!isMounted || !profile) return;
        const bName = profile.batches?.name || profile.batch_name || 'Enrolled Batch';
        setBatchName(bName);
      })
      .catch((err) => {
        console.warn('Profile fetch warning in study materials tab:', err.message);
      });

    // Load actual study materials for this student's batch
    apiRequest('/api/student/study-materials')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const formatted = data.map((item, idx) => {
            const ext = item.file_url ? item.file_url.split('.').pop()?.toLowerCase() : 'pdf';
            let fileTypeLabel = 'Document';
            let theme = 'blue';

            if (ext === 'pdf') {
              fileTypeLabel = 'PDF';
              theme = idx % 4 === 0 ? 'red' : idx % 4 === 1 ? 'green' : idx % 4 === 2 ? 'purple' : 'blue';
            } else if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
              fileTypeLabel = 'Video';
              theme = 'cyan';
            } else if (['doc', 'docx'].includes(ext)) {
              fileTypeLabel = 'Word';
              theme = 'blue';
            }

            return {
              id: item.id,
              title: item.title,
              desc: item.description || (item.users?.full_name ? `Uploaded by Prof. ${item.users.full_name}` : 'Course material and notes.'),
              subject: item.subject,
              date: item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
              size: fileTypeLabel,
              theme,
              type: fileTypeLabel,
              file_url: item.file_url,
              signed_url: item.signed_url,
            };
          });
          setMaterials(formatted);
        }
      })
      .catch((err) => {
        console.error('Failed to load student study materials:', err);
        if (showToast) showToast('⚠️ Could not load study materials from server.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    materials.forEach((m) => {
      if (m.subject) subjects.add(m.subject);
    });
    return ['All', ...Array.from(subjects)];
  }, [materials]);

  const handleDownload = async (item) => {
    try {
      if (showToast) showToast(`Preparing access for: ${item.title}...`);

      let url = item.signed_url;
      if (!url) {
        const res = await apiRequest(`/api/student/study-materials/${item.id}/access-url`);
        url = res.signed_url;
      }

      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (showToast) showToast(`✓ Opening download for ${item.title}`);
      } else {
        if (showToast) showToast('⚠️ Could not generate secure download link.');
      }
    } catch (err) {
      if (showToast) showToast(`❌ Download failed: ${err.message}`);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (materialSubject !== 'All' && m.subject !== materialSubject && m.subject !== 'Mixed') {
        return false;
      }
      return true;
    });
  }, [materials, materialSubject]);

  return (
    <div className="sp-view-container sp-materials-view">
      {/* Header with Title & Current Batch */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">Study Material</h1>
          <p className="sp-page-subtitle">Access notes, DPPs, formula sheets, reference videos and more.</p>
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
              className={`sp-filter-pill ${materialSubject === subj ? 'active' : ''}`}
              onClick={() => setMaterialSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Material Cards List Rows */}
      {isLoading ? (
        <div className="sp-card" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
          Loading your batch study materials...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="sp-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
            No study materials found
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            {materialSubject === 'All'
              ? `Your teachers have not uploaded any materials for ${batchName} yet.`
              : `No materials uploaded under '${materialSubject}' for ${batchName}.`}
          </p>
        </div>
      ) : (
        <div className="sp-materials-cards-stack">
          {filteredMaterials.map((item) => (
            <div key={item.id} className="sp-card sp-material-row-card">
              {/* File Icon */}
              <div className={`sp-pdf-icon-box sp-pdf-${item.theme}`}>
                {item.type === 'Video' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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
                  <span className="sp-meta-text">📄 {item.size}</span>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="sp-material-actions-right">
                <button
                  className="sp-download-btn"
                  onClick={() => handleDownload(item)}
                  title={`Download ${item.title}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
