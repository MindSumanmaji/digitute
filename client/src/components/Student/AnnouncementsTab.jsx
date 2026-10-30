import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';

export default function AnnouncementsTab({ showToast = () => {} }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notices from live backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchNotices() {
      setLoading(true);
      try {
        const data = await apiRequest('/api/student/notices');
        if (isMounted) {
          setNotices(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Student notices fetch error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchNotices();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const handleCopyNotice = (item) => {
    const textToCopy = `${item.title}\n\n${item.body}\n\n${item.sender_role === 'ADMIN' ? 'Sent by Admin – Admin' : `Sent by ${item.sender_name} – Teacher`}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      showToast('Notice copied to clipboard!');
    }
  };

  return (
    <div className="sp-view-container sp-announcements-view">
      {/* 1. Header Title & Subtitle */}
      <div className="sp-title-header-bar" style={{ marginBottom: '18px' }}>
        <div>
          <h1 className="sp-page-title">Campus Announcements</h1>
          <p className="sp-page-subtitle">
            Official circulars, batch updates, and institute notices for your enrolled curriculum.
          </p>
        </div>
      </div>

      {/* 2. Stats Pill Bar */}
      <div className="sp-announcements-filter-bar" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#475569', background: '#F1F5F9', padding: '6px 14px', borderRadius: '16px' }}>
          📢 Total Notices: {notices.length}
        </span>
      </div>

      {/* 3. Announcements Stack */}
      <div className="sp-announcements-stack">
        {loading ? (
          <div className="sp-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>Loading announcements from your batch...</p>
          </div>
        ) : notices.map((item) => {
          const isFromAdmin = item.sender_role === 'ADMIN';
          const senderLabel = isFromAdmin
            ? `Sent by ${item.sender_name || 'Admin'} – Admin`
            : `Sent by ${item.sender_name || 'Teacher'} – Teacher`;

          return (
            <div key={item.id} className="sp-card sp-announcement-card" style={{
              borderLeft: isFromAdmin ? '4px solid #0D9488' : '4px solid #3B82F6'
            }}>
              {/* Top Row: Sender Badge & Timestamp */}
              <div className="sp-ann-top-row">
                <div className="sp-ann-badges-left">
                  <div className={`sp-ann-icon-box ${isFromAdmin ? 'sp-ann-icon-amber' : 'sp-ann-icon-blue'}`}>
                    <span>{isFromAdmin ? '🏛️' : '📢'}</span>
                  </div>
                  <span className={`sp-ann-badge ${isFromAdmin ? 'sp-ann-tag-amber' : 'sp-ann-tag-blue'}`}>
                    {isFromAdmin ? 'Admin Notice' : 'Batch Notice'}
                  </span>
                </div>

                <span className="sp-ann-date">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatDate(item.created_at)}
                </span>
              </div>

              {/* Title */}
              <h4 className="sp-ann-title" style={{ fontSize: '17px', margin: '10px 0 6px' }}>{item.title}</h4>

              {/* Body */}
              <p className="sp-ann-desc" style={{ fontSize: '14.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {item.body}
              </p>

              {/* Bottom Meta & Action Row */}
              <div className="sp-ann-bottom-row" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="sp-ann-meta-tags" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="sp-ann-author-tag" style={{ fontWeight: 600, color: isFromAdmin ? '#92400E' : '#1E40AF' }}>
                    👤 {senderLabel}
                  </span>
                  <span className="sp-ann-sep">·</span>
                  <span className="sp-ann-target-tag" style={{ color: '#64748B' }}>
                    🎯 {item.target_label || 'Enrolled Batch'}
                  </span>
                </div>

                <div className="sp-ann-actions-group">
                  <button
                    className="sp-ann-share-btn"
                    onClick={() => handleCopyNotice(item)}
                    title="Copy announcement"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && notices.length === 0 && (
          <div className="sp-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>No announcements published for your batch at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
