import React from 'react';
import { toppersData } from './TestsTab';

export default function MeritListModal({
  selectedScorecard,
  onClose,
  scorecardModalTab,
  setScorecardModalTab,
  showToast
}) {
  if (!selectedScorecard) return null;

  const key = `${selectedScorecard.name} - ${selectedScorecard.subject}`;
  const rawList = toppersData[key] || toppersData['Unit Test 1 - Physics'] || [];
  // Strictly sort by marks obtained in descending order
  const meritList = [...rawList].sort((a, b) => b.score - a.score);
  const top1 = meritList.find(x => x.rank === 1) || meritList[0];
  const top2 = meritList.find(x => x.rank === 2) || meritList[1];
  const top3 = meritList.find(x => x.rank === 3) || meritList[2];

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal-card sp-merit-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-head">
          <div>
            <h3>🏆 {selectedScorecard.name} - Exam Result & Merit List</h3>
            <p>{selectedScorecard.subject} · Conducted on {selectedScorecard.date} · Total Marks: {selectedScorecard.total}</p>
          </div>
          <button className="sp-modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Modal Tabs: Position List vs My Scorecard */}
        <div className="sp-modal-tabs-row">
          <button 
            className={`sp-modal-tab-btn ${scorecardModalTab === 'list' ? 'active' : ''}`}
            onClick={() => setScorecardModalTab('list')}
          >
            🏆 1. Complete Merit List (All Students Position)
          </button>
          <button 
            className={`sp-modal-tab-btn ${scorecardModalTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setScorecardModalTab('breakdown')}
          >
            📊 2. My Scorecard & Question Breakdown
          </button>
        </div>

        {scorecardModalTab === 'list' ? (
          <div className="sp-merit-modal-body">
            {/* Mini Podium for this Test's Top 3 Scorers */}
            <div className="sp-modal-podium-mini">
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
                </div>
              )}

              {top1 && (
                <div className="sp-mp-col r1">
                  <div className="sp-mp-avatar-wrap r1-wrap">
                    <div className="sp-mp-crown">⭐ 1st</div>
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
                </div>
              )}
            </div>

            {/* User's Own Standing Summary Bar */}
            <div className="sp-merit-user-summary-bar">
              <div className="sp-mus-item">
                <span className="sp-mus-label">Your Batch Rank</span>
                <strong className="sp-mus-val" style={{ color: '#0f172a' }}>#{selectedScorecard.rank}</strong>
              </div>
              <div className="sp-mus-item">
                <span className="sp-mus-label">Marks Obtained</span>
                <strong className="sp-mus-val" style={{ color: '#2563eb' }}>{selectedScorecard.obtained} / {selectedScorecard.total}</strong>
              </div>
              <div className="sp-mus-item">
                <span className="sp-mus-label">Percentage</span>
                <strong className="sp-mus-val" style={{ color: '#16a34a' }}>{selectedScorecard.percentage}</strong>
              </div>
              <div className="sp-mus-item">
                <span className="sp-mus-label">Grade</span>
                <span className={`sp-grade-badge ${selectedScorecard.gradeClass}`}>{selectedScorecard.grade}</span>
              </div>
            </div>

            {/* Number-wise Position List Table (Sorted by Marks Descending) */}
            <div className="sp-table-scroll-wrap" style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table className="sp-merit-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Position</th>
                    <th>Student Name</th>
                    <th>Roll ID</th>
                    <th>Marks Obtained</th>
                    <th>Percentage</th>
                    <th>Percentile</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {meritList.map((st, idx) => (
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
                      <td className="sp-merit-percentile-cell">{st.percentile}</td>
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
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: MY SCORECARD DETAILS */
          <div className="sp-modal-scorecard-view">
            <div className="sp-scorecard-grid">
              <div className="sp-score-stat-box">
                <span>Total Marks</span>
                <strong>{selectedScorecard.total}</strong>
              </div>
              <div className="sp-score-stat-box">
                <span>Marks Obtained</span>
                <strong style={{ color: '#2563eb' }}>{selectedScorecard.obtained}</strong>
              </div>
              <div className="sp-score-stat-box">
                <span>Percentage</span>
                <strong style={{ color: '#16a34a' }}>{selectedScorecard.percentage}</strong>
              </div>
              <div className="sp-score-stat-box">
                <span>Grade</span>
                <strong className={selectedScorecard.gradeClass}>{selectedScorecard.grade}</strong>
              </div>
            </div>

            <div className="sp-score-extra">
              <p><strong>Batch Rank:</strong> {selectedScorecard.rank}</p>
              <p><strong>Questions Breakdown:</strong> {selectedScorecard.correct} Correct, {selectedScorecard.incorrect} Incorrect</p>
              <div className="sp-teacher-feedback-box">
                <strong>Faculty Remarks:</strong>
                <p>{selectedScorecard.remarks}</p>
              </div>
            </div>
          </div>
        )}

        <div className="sp-modal-footer">
          <button className="sp-download-btn" onClick={() => showToast('Full Merit List downloaded as PDF')}>
            📥 Download Merit List (PDF)
          </button>
          <button className="sp-download-btn" onClick={() => showToast('Full answer key with solutions downloaded')}>
            📄 Download Solution Key
          </button>
          <button className="sp-primary-submit-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
