import React, { useState } from 'react';

const announcementsData = [
  {
    id: 1,
    title: 'Special Physics Problem-Solving Session this Sunday',
    desc: 'R. Sharma Sir will conduct an intensive 2-hour problem session on Gauss’s Law and Electrostatic Potential this Sunday from 08:30 AM to 10:30 AM in Classroom 204. Students are advised to bring their HC Verma Volume 2 textbooks.',
    category: 'Academic',
    categoryTheme: 'blue',
    icon: '📢',
    badge: 'Special Session',
    badgeClass: 'sp-ann-tag-blue',
    isNew: true,
    date: 'Yesterday · 04:30 PM',
    author: 'R. Sharma (HOD Physics)',
    target: 'Class XII - Science (Batch A & B)'
  },
  {
    id: 2,
    title: 'Upcoming Unit Test 2 Schedule & Syllabus Released',
    desc: 'Please check the Tests & Results dashboard for your upcoming dates: Physics Chapter Test (12 Oct), Chemistry Unit Test 2 (18 Oct), and Mathematics Part Test (25 Oct). Please report to the examination hall 15 minutes before scheduled start time.',
    category: 'Exams',
    categoryTheme: 'green',
    icon: '🗓️',
    badge: 'Exam Alert',
    badgeClass: 'sp-ann-tag-green',
    isNew: true,
    date: '5 Oct 2026 · 11:15 AM',
    author: 'Examination Cell',
    target: 'All Class XII Batches'
  },
  {
    id: 3,
    title: 'Diwali & Kali Puja Institute Vacation Notice',
    desc: 'Classes will remain suspended from 29th October to 3rd November 2026 on account of Diwali & Kali Puja. Regular offline classes and routine doubt solving counters will resume from 4th November 2026.',
    category: 'Notices',
    categoryTheme: 'amber',
    icon: '🪔',
    badge: 'Holiday Notice',
    badgeClass: 'sp-ann-tag-amber',
    isNew: false,
    date: '3 Oct 2026 · 02:00 PM',
    author: 'Administrative Office',
    target: 'All Students & Staff'
  },
  {
    id: 4,
    title: 'Mathematics Advanced Problem Solving & DPP Clearing',
    desc: 'Special one-on-one doubt clearing sessions for Determinants & Matrix Inversions with S. Roy Sir will be held daily from 04:00 PM to 06:00 PM in Faculty Room 101. Pre-book your slot in the Doubt Corner.',
    category: 'Academic',
    categoryTheme: 'purple',
    icon: '📐',
    badge: 'Doubt Clearing',
    badgeClass: 'sp-ann-tag-purple',
    isNew: false,
    date: '1 Oct 2026 · 05:45 PM',
    author: 'S. Roy (Dept of Mathematics)',
    target: 'Class XII - Science'
  }
];

export default function AnnouncementsTab({ showToast = () => {} }) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [acknowledgedIds, setAcknowledgedIds] = useState([]);

  const toggleAcknowledge = (id) => {
    if (acknowledgedIds.includes(id)) {
      setAcknowledgedIds(acknowledgedIds.filter((item) => item !== id));
      showToast('Announcement marked as unread.');
    } else {
      setAcknowledgedIds([...acknowledgedIds, id]);
      showToast('Notice acknowledged & marked as read ✓');
    }
  };

  const filteredAnnouncements = announcementsData.filter((item) => {
    if (filterCategory !== 'All' && item.category !== filterCategory) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="sp-view-container sp-announcements-view">
      {/* 1. Header Title & Subtitle */}
      <div className="sp-title-header-bar" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="sp-page-title">Campus Announcements</h1>
          <p className="sp-page-subtitle">
            Official notifications, academic circulars, and exam alerts from DigiTute.
          </p>
        </div>
      </div>

      {/* 2. Filter Pills & Search Bar */}
      <div className="sp-announcements-filter-bar">
        <div className="sp-ann-filter-pills">
          {['All', 'Academic', 'Exams', 'Notices'].map((cat) => {
            const count =
              cat === 'All'
                ? announcementsData.length
                : announcementsData.filter((a) => a.category === cat).length;
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                className={`sp-perf-filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'All' ? '📢 All' : cat === 'Academic' ? '📚 Academic' : cat === 'Exams' ? '🗓️ Exams' : '🔔 Notices'} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Announcements Stack: Each Announcement in Its OWN Distinct Box Card */}
      <div className="sp-announcements-stack">
        {filteredAnnouncements.map((item) => {
          const isAcknowledged = acknowledgedIds.includes(item.id);
          return (
            <div key={item.id} className="sp-card sp-announcement-card">
              {/* Top Row: Icon, Category Badge, Priority Badge & Timestamp */}
              <div className="sp-ann-top-row">
                <div className="sp-ann-badges-left">
                  <div className={`sp-ann-icon-box sp-ann-icon-${item.categoryTheme}`}>
                    <span>{item.icon}</span>
                  </div>
                  <span className={`sp-ann-badge ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  {item.isNew && (
                    <span className="sp-ann-badge-new">
                      NEW
                    </span>
                  )}
                </div>

                <span className="sp-ann-date">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {item.date}
                </span>
              </div>

              {/* Title */}
              <h4 className="sp-ann-title">{item.title}</h4>

              {/* Description Body */}
              <p className="sp-ann-desc">{item.desc}</p>

              {/* Bottom Meta & Action Row */}
              <div className="sp-ann-bottom-row">
                <div className="sp-ann-meta-tags">
                  <span className="sp-ann-author-tag">
                    👤 {item.author}
                  </span>
                  <span className="sp-ann-sep">·</span>
                  <span className="sp-ann-target-tag">
                    🎯 {item.target}
                  </span>
                </div>

                <div className="sp-ann-actions-group">
                  <button
                    className={`sp-ann-ack-btn ${isAcknowledged ? 'acknowledged' : ''}`}
                    onClick={() => toggleAcknowledge(item.id)}
                    title="Click to acknowledge this circular"
                  >
                    {isAcknowledged ? '✓ Acknowledged' : 'Mark as Read'}
                  </button>
                  <button
                    className="sp-ann-share-btn"
                    onClick={() => showToast(`Copied notice link for: ${item.title}`)}
                    title="Copy announcement"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="sp-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>No announcements match your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
