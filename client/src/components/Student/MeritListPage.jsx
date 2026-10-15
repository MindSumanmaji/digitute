import React, { useState } from 'react';
import { toppersData } from './TestsTab';

export default function MeritListPage({ test, onBack, showToast }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'scorecard'
  const [searchQuery, setSearchQuery] = useState('');

  if (!test) return null;

  const key = `${test.name} - ${test.subject}`;
  const rawList = toppersData[key] || toppersData['Unit Test 1 - Physics'] || [];
  
  // Strictly sort by marks obtained in descending order
  const fullMeritList = [...rawList].sort((a, b) => b.score - a.score);

  // Filter list by search query (name or roll)
  const filteredList = fullMeritList.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top1 = fullMeritList.find(x => x.rank === 1) || fullMeritList[0];
  const top2 = fullMeritList.find(x => x.rank === 2) || fullMeritList[1];
  const top3 = fullMeritList.find(x => x.rank === 3) || fullMeritList[2];

  return (
    <div className="sp-view-container sp-merit-page">
      {/* 1. Header Navigation Bar */}
      <div className="sp-merit-page-header">
        <div className="sp-merit-header-left">
          <button 
            className="sp-analysis-back-btn sp-merit-back-btn" 
            onClick={onBack}
            title="Return to Test Results"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Results
          </button>
          
          <h1 className="sp-page-title sp-merit-title">
            🏆 {test.name} - Batch Merit List
          </h1>
          <p className="sp-page-subtitle sp-merit-subtitle">
            {test.subject} · Conducted on {test.date} · Total Marks: {test.total} · Batch: Class XII - Science
          </p>
        </div>

        {/* Action Buttons */}
        <div className="sp-merit-actions-wrap">
          <button 
            className="sp-btn-secondary sp-merit-download-btn"
            onClick={() => showToast('Official merit list PDF generated & downloaded successfully!')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download Merit List</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: Merit List vs My Scorecard */}
      <div className="sp-modal-tabs-row sp-merit-tabs-row">
        <button 
          className={`sp-modal-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="sp-tab-label-full">🏆 1. Complete Merit List ({fullMeritList.length} Students)</span>
          <span className="sp-tab-label-mobile">🏆 Merit List ({fullMeritList.length})</span>
        </button>
        <button 
          className={`sp-modal-tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          <span className="sp-tab-label-full">📊 2. My Scorecard & Breakdown</span>
          <span className="sp-tab-label-mobile">📊 My Scorecard</span>
        </button>
      </div>

      {/* 3. TAB 1: COMPLETE MERIT LIST */}
      {activeTab === 'list' && (
        <div className="sp-merit-page-content">
          {/* Top 3 Podium Showcase */}
          <div className="sp-modal-podium-mini sp-merit-podium">
            {top2 && (
              <div className="sp-mp-col r2">
                <div className="sp-mp-avatar-wrap">
                  {top2.photo ? (
                    <img src={top2.photo} alt={top2.name} className="sp-mp-avatar-img" />
                  ) : (
                    <div className="sp-mp-fallback-avatar" style={{ background: top2.bg, color: top2.color }}>
                      {top2.initial || top2.name.charAt(0)}
                    </div>
                  )}
                  <div className="sp-mp-badge" style={{ background: '#64748b' }}>2</div>
                </div>
                <strong className="sp-mp-name">{top2.name}</strong>
                <span className="sp-mp-score">{top2.score}/{top2.total} ({top2.pct})</span>
                <span className="sp-mp-roll-sub">Roll: {top2.roll}</span>
              </div>
            )}

            {top1 && (
              <div className="sp-mp-col r1">
                <div className="sp-mp-avatar-wrap r1-wrap">
                  <div className="sp-mp-crown">⭐ 1st Position</div>
                  {top1.photo ? (
                    <img src={top1.photo} alt={top1.name} className="sp-mp-avatar-img r1-img" />
                  ) : (
                    <div className="sp-mp-fallback-avatar r1-img" style={{ background: top1.bg || '#2563eb', color: '#ffffff' }}>
                      {top1.initial || top1.name.charAt(0)}
                    </div>
                  )}
                  <div className="sp-mp-badge r1-badge" style={{ background: '#7c3aed' }}>1</div>
                </div>
                <strong className="sp-mp-name r1-name">{top1.name}</strong>
                <span className="sp-mp-score r1-score">{top1.score}/{top1.total} ({top1.pct})</span>
                <span className="sp-mp-roll-sub sp-mp-topper-text">Batch Topper · {top1.roll}</span>
              </div>
            )}

            {top3 && (
              <div className="sp-mp-col r3">
                <div className="sp-mp-avatar-wrap">
                  {top3.photo ? (
                    <img src={top3.photo} alt={top3.name} className="sp-mp-avatar-img" />
                  ) : (
                    <div className="sp-mp-fallback-avatar" style={{ background: top3.bg, color: top3.color }}>
                      {top3.initial || top3.name.charAt(0)}
                    </div>
                  )}
                  <div className="sp-mp-badge" style={{ background: '#fb7185' }}>3</div>
                </div>
                <strong className="sp-mp-name">{top3.name}</strong>
                <span className="sp-mp-score">{top3.score}/{top3.total} ({top3.pct})</span>
                <span className="sp-mp-roll-sub">Roll: {top3.roll}</span>
              </div>
            )}
          </div>

          {/* User's Own Standing Summary Bar */}
          <div className="sp-merit-user-summary-bar">
            <div className="sp-mus-item">
              <span className="sp-mus-label">Your Batch Rank</span>
              <strong className="sp-mus-val" style={{ color: '#0f172a' }}>#{test.rank}</strong>
            </div>
            <div className="sp-mus-item">
              <span className="sp-mus-label">Marks Obtained</span>
              <strong className="sp-mus-val" style={{ color: '#2563eb' }}>{test.obtained} / {test.total}</strong>
            </div>
            <div className="sp-mus-item">
              <span className="sp-mus-label">Percentage</span>
              <strong className="sp-mus-val" style={{ color: '#16a34a' }}>{test.percentage}</strong>
            </div>
            <div className="sp-mus-item">
              <span className="sp-mus-label">Grade Awarded</span>
              <span className={`sp-grade-badge ${test.gradeClass}`}>{test.grade}</span>
            </div>
          </div>

          {/* Full Merit List Table Card */}
          <div className="sp-card sp-merit-table-card">
            {/* Table Top Controls */}
            <div className="sp-merit-controls-row">
              <div className="sp-merit-title-group">
                <h3 className="sp-merit-table-heading">
                  All Students Position & Marks
                </h3>
                <p className="sp-merit-table-sub">
                  Showing {filteredList.length} of {fullMeritList.length} students ranked in this test.
                </p>
              </div>

              {/* Search Box */}
              <div className="sp-merit-search-wrap">
                <input 
                  type="text"
                  placeholder="Search student or roll ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sp-merit-search-input"
                />
                <svg 
                  className="sp-merit-search-icon"
                  width="15" 
                  height="15" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#94a3b8" 
                  strokeWidth="2.2" 
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>

            {/* Swipe Table Horizontally Hint */}
            <div className="sp-merit-swipe-hint">
              <span>👉 Swipe table horizontally to view full marks & standings</span>
            </div>

            {/* Table */}
            <div className="sp-table-scroll-wrap sp-merit-table-scroll">
              <table className="sp-merit-table">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Position</th>
                    <th>Student Name</th>
                    <th>Roll ID</th>
                    <th>Marks Obtained</th>
                    <th>Percentage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((st, idx) => (
                    <tr 
                      key={idx} 
                      className={`sp-merit-row ${st.isMe ? 'sp-merit-row-me' : ''}`}
                    >
                      <td>
                        <div className={`sp-position-pill rank-${st.rank}`}>
                          {st.rank === 1 ? '🥇 1st' : st.rank === 2 ? '🥈 2nd' : st.rank === 3 ? '🥉 3rd' : `#${st.rank}`}
                        </div>
                      </td>
                      <td>
                        <div className="sp-merit-student-cell">
                          {st.photo ? (
                            <img 
                              src={st.photo} 
                              alt={st.name} 
                              className="sp-merit-avatar-img" 
                              onError={(e) => { 
                                e.target.style.display = 'none'; 
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'; 
                              }} 
                            />
                          ) : null}
                          <div 
                            className="sp-merit-fallback-avatar" 
                            style={{ display: st.photo ? 'none' : 'grid', background: st.bg, color: st.color }}
                          >
                            {st.initial || st.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="sp-merit-student-name">{st.name}</strong>
                            {st.isMe && (
                              <span className="sp-badge-you" style={{ marginLeft: '6px' }}>You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="sp-merit-roll">{st.roll}</td>
                      <td>
                        <strong className="sp-merit-score-val">{st.score}</strong>
                        <span className="sp-merit-score-tot"> / {st.total}</span>
                      </td>
                      <td>
                        <strong className="sp-merit-pct-val">{st.pct}</strong>
                      </td>
                      <td>
                        <button 
                          type="button"
                          className="sp-merit-view-profile-btn"
                          onClick={() => {
                            if (showToast) {
                              showToast(`Viewing profile of ${st.name} (${st.roll}) will be available soon!`);
                            }
                          }}
                          title={`View ${st.name}'s Profile`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No students match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: MY SCORECARD & QUESTION BREAKDOWN */}
      {activeTab === 'scorecard' && (
        <div className="sp-card sp-scorecard-card">
          <h3 className="sp-scorecard-heading">
            Detailed Performance Scorecard - {test.name}
          </h3>

          <div className="sp-scorecard-grid">
            <div className="sp-score-stat-box">
              <span>Total Marks</span>
              <strong>{test.total}</strong>
            </div>
            <div className="sp-score-stat-box">
              <span>Marks Obtained</span>
              <strong style={{ color: '#2563eb' }}>{test.obtained}</strong>
            </div>
            <div className="sp-score-stat-box">
              <span>Percentage</span>
              <strong style={{ color: '#16a34a' }}>{test.percentage}</strong>
            </div>
            <div className="sp-score-stat-box">
              <span>Grade</span>
              <strong className={test.gradeClass}>{test.grade}</strong>
            </div>
          </div>

          <div className="sp-score-extra">
            <p className="sp-score-extra-line">
              <strong>Batch Position:</strong> #{test.rank}
            </p>
            <p className="sp-score-extra-line">
              <strong>Questions Breakdown:</strong> {test.correct} Correct, {test.incorrect} Incorrect
            </p>
            
            <div className="sp-teacher-feedback-box">
              <strong className="sp-tfb-title">Faculty Remarks & Guidance:</strong>
              <p className="sp-tfb-desc">
                {test.remarks}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
