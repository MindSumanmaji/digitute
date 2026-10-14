import React, { useState, useEffect, useMemo } from 'react';
import { BATCHES } from '../../data/academicData';
const DEFAULT_NOTICES = [
  {
    id: 'notif-1',
    title: 'Semester End Project Submission Guidelines',
    batch: 'B.Sc 6th Sem',
    category: 'Academic',
    content: 'All final year students must submit their complete Computer Network laboratory documentation along with code repositories by Friday 5:00 PM. Late submissions will attract 10% penalty.',
    date: '14 Oct 2026, 02:30 PM',
    wordCount: 31,
    priority: 'high'
  },
  {
    id: 'notif-2',
    title: 'Guest Lecture on Cloud Microservices Architecture',
    batch: 'MCA 2nd Sem',
    category: 'Workshop',
    content: 'Special industry seminar on Distributed Architecture and Docker Containers is scheduled for tomorrow at 11:00 AM in Seminar Hall 1. Attendance is mandatory for all students.',
    date: '13 Oct 2026, 04:15 PM',
    wordCount: 30,
    priority: 'normal'
  },
  {
    id: 'notif-3',
    title: 'Departmental Holiday on Durga Puja Festival',
    batch: 'All Batches',
    category: 'Holiday',
    content: 'The DigiTute department will remain closed for festive celebrations from 19th October to 24th October. Online portal access for notes and assignment submission remains active 24x7.',
    date: '12 Oct 2026, 10:00 AM',
    wordCount: 29,
    priority: 'info'
  }
];

const countWords = (str = '') => {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

export default function Notice() {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Academic');
  const [noticeBody, setNoticeBody] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [publishedNotices, setPublishedNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('digitute_published_notices');
      return saved ? JSON.parse(saved) : DEFAULT_NOTICES;
    } catch {
      return DEFAULT_NOTICES;
    }
  });

  const [filterBatch, setFilterBatch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const wordCount = countWords(noticeBody);

  useEffect(() => {
    try {
      localStorage.setItem('digitute_published_notices', JSON.stringify(publishedNotices));
    } catch {
      // localStorage may fail in some environments
    }
  }, [publishedNotices]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!noticeTitle.trim()) {
      setFormError('Please provide a descriptive title for this notice.');
      return;
    }
    if (!noticeBody.trim()) {
      setFormError('Notice body content cannot be empty.');
      return;
    }
    if (wordCount > 200) {
      setFormError('Notice body cannot exceed 200 words. Please shorten your message.');
      return;
    }

    const newNotice = {
      id: 'notif-' + Date.now(),
      title: noticeTitle.trim(),
      batch: selectedBatch,
      category: noticeCategory,
      content: noticeBody.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      wordCount,
      priority: noticeCategory === 'Urgent' ? 'high' : 'normal'
    };

    setPublishedNotices([newNotice, ...publishedNotices]);
    window.dispatchEvent(new CustomEvent('digitute_notice_published', { detail: newNotice }));

    setNoticeTitle('');
    setNoticeBody('');
    setNoticeCategory('Academic');
    setFormError('');
    showToast(`Notice published successfully to ${selectedBatch}!`);
  };

  const handleDeleteNotice = (id) => {
    setPublishedNotices(prev => prev.filter(n => n.id !== id));
    showToast('Notice removed from the board.');
  };

  const filteredList = useMemo(() => {
    return publishedNotices.filter(n => {
      const matchBatch = filterBatch === 'All' || n.batch === filterBatch || n.batch === 'All Batches';
      const matchQuery = !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBatch && matchQuery;
    });
  }, [publishedNotices, filterBatch, searchQuery]);

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
              Publish and broadcast notices to student batches.
            </p>
          </div>
        </div>

        <div className="notice-stats-strip">
          <div className="notice-stat-pill">
            <span className="notice-stat-label">Total Notices:</span>
            <span className="notice-stat-val">{publishedNotices.length}</span>
          </div>
          <div className="notice-stat-pill indigo">
            <span className="notice-stat-label">Active Batches:</span>
            <span className="notice-stat-val">{BATCHES.length}</span>
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
            <span className="notice-word-badge">Max 200 Words</span>
          </div>

          <form onSubmit={handlePublish} className="notice-form">
            {/* Batch Select and Category Selection Row */}
            <div className="notice-top-selectors">
              {/* Batch Select */}
              <div className="notice-field-group">
                <label htmlFor="notice-batch-select" className="notice-field-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Select Target Batch</span>
                </label>
                <div className="notice-select-wrap">
                  <select
                    id="notice-batch-select"
                    className="notice-select"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    <option value="All Batches">All Batches (General Broadcast)</option>
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="notice-select-caret" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Category / Tag */}
              <div className="notice-field-group">
                <label htmlFor="notice-category-select" className="notice-field-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Notice Category</span>
                </label>
                <div className="notice-select-wrap">
                  <select
                    id="notice-category-select"
                    className="notice-select"
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                  >
                    <option value="Academic">Academic / Syllabus</option>
                    <option value="Exam">Class Test &amp; Exams</option>
                    <option value="Urgent">Urgent Alert</option>
                    <option value="Holiday">Holiday &amp; Recess</option>
                    <option value="Workshop">Workshop &amp; Lab</option>
                    <option value="General">General Notice</option>
                  </select>
                  <div className="notice-select-caret" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice Title */}
            <div className="notice-field-group">
              <label htmlFor="notice-title-input" className="notice-field-label">
                <span>Notice Subject / Title</span>
              </label>
              <input
                id="notice-title-input"
                type="text"
                className="notice-input-title"
                placeholder="e.g. Rescheduled Lab Session for Computer Networks"
                value={noticeTitle}
                onChange={(e) => {
                  setNoticeTitle(e.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>

            {/* 200 Word Notice Box */}
            <div className="notice-field-group">
              <div className="notice-box-label-row">
                <label htmlFor="notice-body-box" className="notice-field-label">
                  <span>Notice Message Body</span>
                </label>
                <div className={`notice-word-counter ${wordCount > 200 ? 'over-limit' : ''} ${wordCount >= 180 && wordCount <= 200 ? 'near-limit' : ''}`}>
                  <strong>{wordCount}</strong> / 200 words
                </div>
              </div>

              <textarea
                id="notice-body-box"
                className={`notice-textarea ${wordCount > 200 ? 'has-error' : ''}`}
                rows={6}
                placeholder="Write the notice details here (maximum 200 words). Include timings, instructions, requirements, or agenda..."
                value={noticeBody}
                onChange={(e) => {
                  setNoticeBody(e.target.value);
                  if (formError) setFormError('');
                }}
              />

              {wordCount > 200 && (
                <p className="notice-err-msg">
                  Notice body exceeds 200 words! Please trim by {wordCount - 200} words.
                </p>
              )}

              {formError && <p className="notice-err-msg">{formError}</p>}
            </div>

            {/* Publish Action Bar */}
            <div className="notice-actions-strip">
              <div className="notice-target-indicator">
                <span>Publishing to: </span>
                <span className="notice-target-badge">{selectedBatch}</span>
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
                  disabled={wordCount > 200 || !noticeTitle.trim() || !noticeBody.trim()}
                >
                  <span>Publish Notice</span>
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
              <h2 className="notice-history-title">Recent Broadcasts</h2>
              <p className="notice-history-sub">Track published notices across student portals</p>
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
                {BATCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="notice-empty-state">
              <div className="notice-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h4>No Notices Found</h4>
              <p>No notices matching the selected filter.</p>
            </div>
          ) : (
            <div className="notice-cards-list">
              {filteredList.map((item) => (
                <article key={item.id} className="notice-feed-card">
                  <div className="notice-feed-top">
                    <div className="notice-pill-tags">
                      <span className="notice-batch-tag">{item.batch}</span>
                      <span className={`notice-cat-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                    </div>
                    <span className="notice-date-stamp">{item.date}</span>
                  </div>

                  <h3 className="notice-feed-title">{item.title}</h3>
                  <p className="notice-feed-body">{item.content}</p>

                  <div className="notice-feed-footer">
                    <span className="notice-author-sign">Faculty of DigiTute</span>
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
