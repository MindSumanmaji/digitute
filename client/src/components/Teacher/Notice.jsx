import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function Notice() {
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [publishedNotices, setPublishedNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterBatch, setFilterBatch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load teacher's assigned batches and notices from live API
  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, noticesRes] = await Promise.all([
        apiRequest('/api/teacher/my-batches').catch(err => {
          console.warn('Teacher batches load error:', err.message);
          return [];
        }),
        apiRequest('/api/teacher/notices').catch(err => {
          console.warn('Teacher notices load error:', err.message);
          return [];
        })
      ]);

      const batches = Array.isArray(batchesRes) ? batchesRes : [];
      setAssignedBatches(batches);

      // If only 1 batch assigned, automatically select it
      if (batches.length === 1 && selectedBatchIds.length === 0) {
        setSelectedBatchIds([batches[0].batch_id]);
      }

      setPublishedNotices(Array.isArray(noticesRes) ? noticesRes : []);
    } catch (err) {
      console.error('Failed to load notice board data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleBatchSelection = (batchId) => {
    setFormError('');
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const selectAllBatches = () => {
    setFormError('');
    if (selectedBatchIds.length === assignedBatches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(assignedBatches.map(b => b.batch_id));
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const cleanTitle = noticeTitle.trim();
    const cleanBody = noticeBody.trim();

    if (!cleanTitle) {
      setFormError('Please provide a descriptive title for this notice.');
      return;
    }
    if (!cleanBody) {
      setFormError('Notice body message cannot be empty.');
      return;
    }
    if (selectedBatchIds.length === 0) {
      setFormError('Please select at least one of your assigned batches.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await apiRequest('/api/teacher/notices', {
        method: 'POST',
        body: {
          title: cleanTitle,
          body: cleanBody,
          batch_ids: selectedBatchIds
        }
      });

      showToast('Notice published successfully to your selected batch(es)!');
      setNoticeTitle('');
      setNoticeBody('');
      // Reload notices list
      const updatedNotices = await apiRequest('/api/teacher/notices').catch(() => []);
      setPublishedNotices(updatedNotices);
    } catch (err) {
      console.error('Failed to publish notice:', err);
      setFormError(err.message || 'Failed to publish notice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      await apiRequest(`/api/teacher/notices/${id}`, { method: 'DELETE' });
      setPublishedNotices(prev => prev.filter(n => n.id !== id));
      showToast('Notice removed from the board.');
    } catch (err) {
      console.error('Failed to delete notice:', err);
      showToast(err.message || 'Could not delete notice.');
    }
  };

  const filteredList = useMemo(() => {
    return publishedNotices.filter(n => {
      // Filter by Batch
      let matchBatch = true;
      if (filterBatch !== 'All') {
        const bNames = n.batch_names || [];
        matchBatch = bNames.includes(filterBatch) || n.target_audience !== 'BATCH';
      }

      // Filter by Search Query
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.sender_name && n.sender_name.toLowerCase().includes(q));

      return matchBatch && matchQuery;
    });
  }, [publishedNotices, filterBatch, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="notice-page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="notice-toast" role="alert">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <header className="notice-header">
        <div className="notice-title-row">
          <div className="notice-hero-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h1 className="notice-page-title">Notice Board</h1>
            <p className="notice-page-subtitle">
              Publish notices directly to your assigned student batches and view official center updates.
            </p>
          </div>
        </div>

        <div className="notice-stats-strip">
          <div className="notice-stat-pill">
            <span className="notice-stat-label">Total Notices:</span>
            <span className="notice-stat-val">{publishedNotices.length}</span>
          </div>
          <div className="notice-stat-pill indigo">
            <span className="notice-stat-label">My Assigned Batches:</span>
            <span className="notice-stat-val">{assignedBatches.length}</span>
          </div>
          <div className="notice-stat-pill green">
            <span className="notice-stat-dot" />
            <span>Portal Broadcast Active</span>
          </div>
        </div>
      </header>

      <div className="notice-layout-grid">
        {/* COMPOSER CARD (Left / Main) */}
        <section className="notice-composer-card">
          <div className="notice-card-header">
            <div className="notice-composer-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Publish New Notice</span>
            </div>
            <span className="notice-word-badge" style={{ background: '#F1F5F9', color: '#475569' }}>
              Faculty Authorization
            </span>
          </div>

          <form onSubmit={handlePublish} className="notice-form">
            {/* Target Batch Selector (Multi-Select from Assigned Batches) */}
            <div className="notice-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="notice-field-label" style={{ margin: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Target Batches (Select One or More) <b>*</b></span>
                </label>

                {assignedBatches.length > 1 && (
                  <button
                    type="button"
                    onClick={selectAllBatches}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--teal-primary, #0D9488)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {selectedBatchIds.length === assignedBatches.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {assignedBatches.length === 0 ? (
                <div style={{
                  padding: '12px 14px',
                  background: '#F8FAFC',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#64748B',
                  border: '1px solid #E2E8F0'
                }}>
                  No batches currently assigned to you. Notices can only be sent to batches where you are assigned.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 4
                }}>
                  {assignedBatches.map(b => {
                    const isSelected = selectedBatchIds.includes(b.batch_id);
                    return (
                      <button
                        key={b.batch_id}
                        type="button"
                        onClick={() => toggleBatchSelection(b.batch_id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          border: isSelected ? '1.5px solid var(--teal-primary, #0D9488)' : '1px solid #CBD5E1',
                          background: isSelected ? '#F0FDFA' : '#FFFFFF',
                          color: isSelected ? 'var(--teal-primary, #0D9488)' : '#334155'
                        }}
                      >
                        <span style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          border: isSelected ? '1px solid var(--teal-primary, #0D9488)' : '1px solid #94A3B8',
                          background: isSelected ? 'var(--teal-primary, #0D9488)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: 10
                        }}>
                          {isSelected && '✓'}
                        </span>
                        {b.batch_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notice Title */}
            <div className="notice-field-group">
              <label htmlFor="notice-title-input" className="notice-field-label">
                <span>Notice Title <b>*</b></span>
              </label>
              <input
                id="notice-title-input"
                type="text"
                className="notice-input-title"
                placeholder="e.g. Extra Problem-Solving Class on Thermodynamics"
                value={noticeTitle}
                onChange={(e) => {
                  setNoticeTitle(e.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>

            {/* Notice Body */}
            <div className="notice-field-group">
              <label htmlFor="notice-body-box" className="notice-field-label">
                <span>Notice Body <b>*</b></span>
              </label>
              <textarea
                id="notice-body-box"
                className="notice-textarea"
                rows={5}
                placeholder="Write the notice details here. Include timings, instructions, requirements, or agenda..."
                value={noticeBody}
                onChange={(e) => {
                  setNoticeBody(e.target.value);
                  if (formError) setFormError('');
                }}
              />
              {formError && <p className="notice-err-msg">{formError}</p>}
            </div>

            {/* Publish Action Bar */}
            <div className="notice-actions-strip">
              <div className="notice-target-indicator">
                <span>Publishing to: </span>
                <span className="notice-target-badge">
                  {selectedBatchIds.length === 0
                    ? 'No batch selected'
                    : assignedBatches
                        .filter(b => selectedBatchIds.includes(b.batch_id))
                        .map(b => b.batch_name)
                        .join(', ')}
                </span>
              </div>

              <div className="notice-btn-group">
                <button
                  type="button"
                  className="notice-clear-btn"
                  onClick={() => {
                    setNoticeTitle('');
                    setNoticeBody('');
                    setFormError('');
                  }}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="notice-publish-btn"
                  disabled={submitting || !noticeTitle.trim() || !noticeBody.trim() || selectedBatchIds.length === 0}
                >
                  <span>{submitting ? 'Publishing...' : 'Publish Notice'}</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* PUBLISHED NOTICES HISTORY (Right / Below) */}
        <section className="notice-history-section">
          <div className="notice-history-header">
            <div>
              <h2 className="notice-history-title">Recent Notice Board</h2>
              <p className="notice-history-sub">Center broadcasts and your published notices</p>
            </div>

            {/* Filter by Batch */}
            <div className="notice-history-filters">
              <select
                className="notice-mini-filter"
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                aria-label="Filter notices by batch"
              >
                <option value="All">All Batches</option>
                {assignedBatches.map(b => (
                  <option key={b.batch_id} value={b.batch_name}>{b.batch_name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
              Loading notices...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="notice-empty-state">
              <div className="notice-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h4>No Notices Found</h4>
              <p>There are currently no notices matching the selected filter.</p>
            </div>
          ) : (
            <div className="notice-cards-list">
              {filteredList.map((item) => {
                const isFromAdmin = item.sender_role === 'ADMIN';
                const senderLabel = isFromAdmin
                  ? `Sent by ${item.sender_name || 'Admin'} – Admin`
                  : `Sent by ${item.sender_name || 'Teacher'} – Teacher`;

                const targetLabel = item.target_audience === 'BATCH'
                  ? (item.batch_names && item.batch_names.length > 0 ? item.batch_names.join(', ') : 'Assigned Batch')
                  : (item.target_audience === 'ALL' ? 'Teachers & Students' : 'Teachers Only');

                return (
                  <article key={item.id} className="notice-feed-card">
                    <div className="notice-feed-top">
                      <div className="notice-pill-tags">
                        <span className="notice-batch-tag">{targetLabel}</span>
                        {isFromAdmin && (
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: '#FEF3C7',
                            color: '#92400E'
                          }}>
                            OFFICIAL ADMIN NOTICE
                          </span>
                        )}
                      </div>
                      <span className="notice-date-stamp">{formatDate(item.created_at)}</span>
                    </div>

                    <h3 className="notice-feed-title">{item.title}</h3>
                    <p className="notice-feed-body">{item.body}</p>

                    <div className="notice-feed-footer">
                      <span className="notice-author-sign" style={{ fontWeight: 600, color: isFromAdmin ? '#92400E' : '#334155' }}>
                        {senderLabel}
                      </span>
                      {item.is_mine && (
                        <button
                          type="button"
                          className="notice-del-btn"
                          onClick={() => handleDeleteNotice(item.id)}
                          title="Delete this notice"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
