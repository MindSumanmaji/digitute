import React, { useState } from 'react';

export default function DoubtCornerTab({ showToast }) {
  const [doubtFilter, setDoubtFilter] = useState('All');
  const [doubtSubjectFilter, setDoubtSubjectFilter] = useState('All Subjects');
  const [newDoubtSubject, setNewDoubtSubject] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [doubtsList, setDoubtsList] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      title: 'Derivative of a Composite Function',
      time: '8 Oct 2026 · 4:15 PM',
      status: 'Answered',
      comments: 2,
      saved: true,
      color: '#9333ea',
      bg: '#f3e8ff',
      icon: 'book',
      author: 'Suman Maji'
    },
    {
      id: 2,
      subject: 'Physics',
      title: 'Why electric field inside a conductor is zero?',
      time: '7 Oct 2026 · 7:20 PM',
      status: 'Pending',
      comments: 5,
      saved: false,
      color: '#0284c7',
      bg: '#e0f2fe',
      icon: 'flask',
      author: 'Suman Maji'
    },
    {
      id: 3,
      subject: 'DBMS',
      title: 'What is Normalization in DBMS?',
      time: '3 Oct 2026 · 6:40 PM',
      status: 'Answered',
      comments: 1,
      saved: false,
      color: '#ef4444',
      bg: '#fee2e2',
      icon: 'book',
      author: 'Suman Maji'
    },
    {
      id: 4,
      subject: 'Computer Network',
      title: 'Difference between LAN and WAN',
      time: '1 Oct 2026 · 5:30 PM',
      status: 'Answered',
      comments: 4,
      saved: true,
      color: '#16a34a',
      bg: '#dcfce7',
      icon: 'desktop',
      author: 'Suman Maji'
    }
  ]);

  const handlePostDoubt = (e) => {
    e.preventDefault();
    if (!newDoubtQuestion.trim()) {
      showToast('Please type your question before submitting.');
      return;
    }
    const subj = newDoubtSubject || 'General';
    const newEntry = {
      id: Date.now(),
      subject: subj,
      title: newDoubtQuestion,
      time: 'Just now · Today',
      status: 'Pending',
      comments: 0,
      saved: false,
      color: subj === 'Physics' ? '#0284c7' : subj === 'Chemistry' ? '#16a34a' : subj === 'Mathematics' ? '#9333ea' : '#ef4444',
      bg: subj === 'Physics' ? '#e0f2fe' : subj === 'Chemistry' ? '#dcfce7' : subj === 'Mathematics' ? '#f3e8ff' : '#fee2e2',
      icon: 'flask',
      author: 'Suman Maji'
    };
    setDoubtsList([newEntry, ...doubtsList]);
    setNewDoubtQuestion('');
    setNewDoubtSubject('');
    setAttachedFiles([]);
    showToast('Your doubt has been submitted to teachers!');
  };

  return (
    <div className="sp-view-container sp-doubts-view">
      {/* Header Card with Red Badge & Graphic */}
      <div className="sp-card sp-doubt-header-banner">
        <div className="sp-doubt-header-left">
          <div className="sp-doubt-red-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="sp-page-title">Doubt Corner</h1>
            <p className="sp-page-subtitle">Ask your doubts and get answers from your teachers.</p>
          </div>
        </div>

        {/* 3D Illustrated Graphic */}
        <div className="sp-doubt-illustration">
          <svg width="120" height="90" viewBox="0 0 140 100" fill="none">
            <circle cx="85" cy="50" r="42" fill="#eff6ff" />
            <path d="M30 65 C45 60, 65 62, 70 75 C75 62, 95 60, 110 65 L110 40 C95 35, 75 37, 70 50 C65 37, 45 35, 30 40 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
            <line x1="70" y1="50" x2="70" y2="75" stroke="#2563eb" strokeWidth="2.5" />
            <line x1="42" y1="48" x2="60" y2="46" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="42" y1="55" x2="58" y2="53" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="46" x2="98" y2="48" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="82" y1="53" x2="98" y2="55" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <g transform="translate(68, 5)">
              <rect width="40" height="32" rx="10" fill="#f87171" opacity="0.9" />
              <path d="M8 32 L3 40 L16 32 Z" fill="#f87171" opacity="0.9" />
              <text x="20" y="22" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">?</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Filters Row */}
      <div className="sp-doubt-filters-row">
        <div className="sp-pills-group">
          {['All', 'My Doubts', 'Answered', 'Pending', 'Saved'].map((pill) => (
            <button
              key={pill}
              className={`sp-filter-pill ${doubtFilter === pill ? 'active' : ''}`}
              onClick={() => setDoubtFilter(pill)}
            >
              {pill}
            </button>
          ))}
        </div>

        <div className="sp-filter-dropdown-wrap">
          <select
            className="sp-select-pill"
            value={doubtSubjectFilter}
            onChange={(e) => setDoubtSubjectFilter(e.target.value)}
          >
            <option>All Subjects</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>Mathematics</option>
            <option>DBMS</option>
            <option>Computer Network</option>
          </select>
        </div>
      </div>

      {/* 2-Column Grid: Left Doubts Feed, Right Ask a New Doubt */}
      <div className="sp-grid-2col-65-35">
        {/* Doubts List */}
        <div className="sp-doubts-feed-list">
          {doubtsList
            .filter((d) => {
              if (doubtFilter === 'Answered') return d.status === 'Answered';
              if (doubtFilter === 'Pending') return d.status === 'Pending';
              if (doubtFilter === 'Saved') return d.saved;
              return true;
            })
            .filter((d) => {
              if (doubtSubjectFilter === 'All Subjects') return true;
              return d.subject === doubtSubjectFilter;
            })
            .map((item) => (
              <div key={item.id} className="sp-card sp-doubt-card-item">
                {/* Subject Icon */}
                <div className="sp-doubt-item-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                  {item.icon === 'flask' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 2v7.31L4 19a2 2 0 0 0 1.66 3h12.68A2 2 0 0 0 20 19l-6-9.69V2"/>
                      <path d="M8.5 2h7"/>
                      <path d="M14 9.3 8.5 18"/>
                    </svg>
                  ) : item.icon === 'desktop' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="3" rx="2"/>
                      <line x1="8" x2="16" y1="21" y2="21"/>
                      <line x1="12" x2="12" y1="17" y2="21"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  )}
                </div>

                {/* Title and Metadata */}
                <div className="sp-doubt-info-col">
                  <span className="sp-subject-tag-pill">{item.subject}</span>
                  <h4 className="sp-doubt-question-title">{item.title}</h4>
                  <span className="sp-doubt-meta-date">{item.time}</span>
                </div>

                {/* Status, Comments, Bookmark, Arrow */}
                <div className="sp-doubt-actions-right">
                  <span className={item.status === 'Answered' ? 'sp-badge-answered' : 'sp-badge-pending'}>
                    {item.status}
                  </span>
                  <div className="sp-comment-count-chip">
                    <span>💬</span> {item.comments}
                  </div>
                  <button
                    className={`sp-bookmark-btn ${item.saved ? 'saved' : ''}`}
                    onClick={() => {
                      item.saved = !item.saved;
                      setDoubtsList([...doubtsList]);
                      showToast(item.saved ? 'Doubt saved to bookmarks' : 'Doubt removed from bookmarks');
                    }}
                    title="Bookmark"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={item.saved ? '#2563eb' : 'none'} stroke={item.saved ? '#2563eb' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                  <span className="sp-chevron-right">›</span>
                </div>
              </div>
            ))}
        </div>

        {/* Right: Ask a New Doubt Card */}
        <div className="sp-card sp-ask-doubt-card">
          <div className="sp-ask-doubt-head">
            <div className="sp-ask-mini-badge">?</div>
            <h3>Ask a New Doubt</h3>
          </div>

          <form onSubmit={handlePostDoubt} className="sp-ask-form">
            {/* Subject Selector */}
            <div className="sp-input-icon-field">
              <span className="sp-field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </span>
              <select
                className="sp-form-select"
                value={newDoubtSubject}
                onChange={(e) => setNewDoubtSubject(e.target.value)}
                required
              >
                <option value="">Select Subject</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="DBMS">DBMS</option>
                <option value="Computer Network">Computer Network</option>
              </select>
            </div>

            {/* Question Textarea */}
            <textarea
              className="sp-form-textarea"
              placeholder="Type your question here..."
              rows={5}
              value={newDoubtQuestion}
              onChange={(e) => setNewDoubtQuestion(e.target.value)}
            />

            {/* Attachment Buttons */}
            <div className="sp-attach-buttons-row">
              <label className="sp-attach-btn">
                <span>📷</span> Add Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setAttachedFiles([...attachedFiles, e.target.files[0].name]);
                      showToast(`Attached image: ${e.target.files[0].name}`);
                    }
                  }}
                />
              </label>
              <label className="sp-attach-btn">
                <span>📎</span> Add PDF
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setAttachedFiles([...attachedFiles, e.target.files[0].name]);
                      showToast(`Attached file: ${e.target.files[0].name}`);
                    }
                  }}
                />
              </label>
            </div>

            {/* Attached files chips */}
            {attachedFiles.length > 0 && (
              <div className="sp-attached-chips-row">
                {attachedFiles.map((f, i) => (
                  <span key={i} className="sp-attached-chip">📎 {f}</span>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="sp-primary-submit-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Submit Question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
