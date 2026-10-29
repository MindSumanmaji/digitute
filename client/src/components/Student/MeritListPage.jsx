import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import StudentProfileCardModal from './StudentProfileCardModal';
import { apiRequest } from '../../api';

export default function MeritListPage({ test, onBack, showToast }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'scorecard'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Live state from backend
  const [meritData, setMeritData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic responsive scaling for certificate on mobile & tablets
  const certOuterRef = useRef(null);
  const certRef = useRef(null);
  const [certScale, setCertScale] = useState(1);
  const [certHeight, setCertHeight] = useState(690);

  useEffect(() => {
    const updateCertScale = () => {
      if (!certOuterRef.current) return;
      const containerWidth = certOuterRef.current.clientWidth;
      const targetWidth = containerWidth - 16;
      if (targetWidth < 980 && targetWidth > 0) {
        const scale = Math.max(0.28, Math.min(1, targetWidth / 980));
        setCertScale(scale);
      } else {
        setCertScale(1);
      }

      if (certRef.current) {
        setCertHeight(certRef.current.offsetHeight || 690);
      }
    };

    updateCertScale();
    window.addEventListener('resize', updateCertScale);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && certOuterRef.current) {
      ro = new ResizeObserver(updateCertScale);
      ro.observe(certOuterRef.current);
    }

    const timer = setTimeout(updateCertScale, 80);

    return () => {
      window.removeEventListener('resize', updateCertScale);
      if (ro) ro.disconnect();
      clearTimeout(timer);
    };
  }, [activeTab]);

  // Fetch live merit list from backend using exam ID
  useEffect(() => {
    if (!test?.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    apiRequest(`/api/student/exams/${test.id}/merit-list`)
      .then((data) => {
        if (isMounted && data) {
          setMeritData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch exam merit list:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [test?.id]);

  if (!test) return null;

  const rawList = meritData?.merit_list || [];
  
  // Strictly sort by marks obtained in descending order
  const fullMeritList = [...rawList].sort((a, b) => b.score - a.score);

  // Filter list by search query (name or roll)
  const filteredList = fullMeritList.filter(st => 
    (st.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.roll || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top1 = fullMeritList.find(x => x.rank === 1) || fullMeritList[0];
  const top2 = fullMeritList.find(x => x.rank === 2) || fullMeritList[1];
  const top3 = fullMeritList.find(x => x.rank === 3) || fullMeritList[2];

  const handleOpenStudentProfile = (st) => {
    if (!st) return;
    const cleanName = (st.name || '').replace(' (You)', '');
    setSelectedStudentForCard({
      ...st,
      student_id: st.student_id || st.id,
      name: cleanName,
      handle: '@' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      roll: st.roll || '—',
      photo: st.photo || (st.isMe ? '/student-avatar.jpg' : null),
      badge: st.rank === 1 ? 'Gold' : st.rank <= 3 ? 'Silver' : 'Bronze',
      rank: `#${st.rank} of ${fullMeritList.length}`,
      rankSub: 'Rank (Batch)',
      rankTrend: st.standing || (st.rank === 1 ? 'Batch Topper' : st.rank === 2 ? 'Runner Up' : st.rank === 3 ? 'Podium' : st.rank <= 5 ? 'TOP 5 Elite' : st.rank <= 10 ? 'Top 10' : ''),
      batch: meritData?.batch_name || 'Enrolled Batch',
      session: '2026 - 2027',
      quote: st.rank === 1 ? '"Excellence is not an act, but a habit."' : '"Consistent study today, bigger opportunities tomorrow."',
      bestScoreTest: test.name
    });
  };

  const loggedInUser = (() => {
    try {
      const s = localStorage.getItem('digitute_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const myStudentRow = fullMeritList.find(st => st.isMe);
  const studentName = (myStudentRow?.name || loggedInUser?.full_name || 'Student').replace(' (You)', '');
  const studentRoll = myStudentRow?.roll || (loggedInUser?.id ? `B-${String(loggedInUser.id).substring(0, 4).toUpperCase()}` : 'B-1779');
  const batchName = meritData?.batch_name || test.batch || 'WBJEE 2027';
  const examDate = test.date || '31 Oct 2026';
  const examName = test.name || 'Batch Merit Assessment';
  const subjectName = test.subject || 'All Subjects';
  const marksObtained = test.obtained !== undefined ? test.obtained : (myStudentRow?.score ?? 89);
  const marksTotal = test.total !== undefined ? test.total : (myStudentRow?.total ?? 100);
  const percentage = test.percentage || (myStudentRow?.pct ?? `${Math.round((marksObtained / marksTotal) * 100)}%`);
  const gradeAwarded = test.grade || 'A';
  const rankText = test.rank || (myStudentRow ? `#${myStudentRow.rank} of ${fullMeritList.length}` : '3rd of 20');

  const handleDownloadRankCardPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    try {
      if (activeTab !== 'scorecard') {
        setActiveTab('scorecard');
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      const certElement = document.getElementById('sp-rank-card-certificate');
      if (!certElement) {
        showToast?.('Certificate element could not be found.');
        setIsDownloadingPdf(false);
        return;
      }

      showToast?.('Preparing Official Rank Card PDF...');
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Temporarily clear scale transform to render crisp full-res 980px canvas
      const prevTransform = certElement.style.transform;
      certElement.style.transform = 'none';

      const canvas = await html2canvas(certElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Restore scale transform
      certElement.style.transform = prevTransform;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;
      const availWidth = pageWidth - (margin * 2);
      const availHeight = pageHeight - (margin * 2);

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);

      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;

      const posX = margin + (availWidth - renderWidth) / 2;
      const posY = margin + (availHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

      const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeExam = examName.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`${safeName}_Rank_Card_${safeExam}.pdf`);

      showToast?.('Official Rank Card downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast?.('Failed to download Rank Card PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="sp-view-container sp-merit-page">
      {/* 1. Header Navigation Bar */}
      <div className="sp-merit-page-header">
        <div className="sp-merit-header-left">
          <button 
            type="button"
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
            {test.subject} · Conducted on {test.date} · Total Marks: {test.total} · Batch: {meritData?.batch_name || 'My Batch'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="sp-merit-actions-wrap">
          <button 
            type="button"
            className="sp-btn-secondary sp-merit-download-btn"
            onClick={handleDownloadRankCardPdf}
            disabled={isDownloadingPdf}
            title="Download Official Rank Card PDF"
          >
            {isDownloadingPdf ? (
              <>
                <svg className="sp-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Download Rank Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: Merit List vs My Scorecard */}
      <div className="sp-modal-tabs-row sp-merit-tabs-row">
        <button 
          type="button"
          className={`sp-modal-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="sp-tab-label-full">🏆 1. Complete Merit List ({fullMeritList.length} Students)</span>
          <span className="sp-tab-label-mobile">🏆 Merit List ({fullMeritList.length})</span>
        </button>
        <button 
          type="button"
          className={`sp-modal-tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          <span className="sp-tab-label-full">🎓 2. My Certificate & Rank Card</span>
          <span className="sp-tab-label-mobile">🎓 Rank Card</span>
        </button>
      </div>

      {/* 3. TAB 1: COMPLETE MERIT LIST */}
      {activeTab === 'list' && (
        <div className="sp-merit-page-content">
          {loading ? (
            <div style={{ padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>
              <div className="sp-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ fontSize: '14px', margin: 0 }}>Loading batch merit list & rank standings...</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Showcase */}
              {(top1 || top2 || top3) && (
                <div className="sp-modal-podium-mini sp-merit-podium">
                  {/* Rank 2 */}
                  {top2 && (
                    <div 
                      className="sp-mp-col r2"
                      onClick={() => handleOpenStudentProfile(top2)}
                      style={{ cursor: 'pointer' }}
                      title={`View ${top2.name}'s Profile`}
                    >
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
                      <button
                        type="button"
                        className="sp-podium-view-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentProfile(top2);
                        }}
                        title={`View ${top2.name}'s Profile`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>View Profile</span>
                      </button>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {top1 && (
                    <div 
                      className="sp-mp-col r1"
                      onClick={() => handleOpenStudentProfile(top1)}
                      style={{ cursor: 'pointer' }}
                      title={`View ${top1.name}'s Profile`}
                    >
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
                      <span className="sp-mp-roll-sub sp-mp-topper-text">Batch Topper</span>
                      <button
                        type="button"
                        className="sp-podium-view-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentProfile(top1);
                        }}
                        title={`View ${top1.name}'s Profile`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>View Profile</span>
                      </button>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {top3 && (
                    <div 
                      className="sp-mp-col r3"
                      onClick={() => handleOpenStudentProfile(top3)}
                      style={{ cursor: 'pointer' }}
                      title={`View ${top3.name}'s Profile`}
                    >
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
                      <button
                        type="button"
                        className="sp-podium-view-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentProfile(top3);
                        }}
                        title={`View ${top3.name}'s Profile`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>View Profile</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User's Own Standing Summary Bar */}
              <div className="sp-merit-user-summary-bar">
                <div className="sp-mus-item">
                  <span className="sp-mus-label">Your Batch Rank</span>
                  <strong className="sp-mus-val" style={{ color: '#0f172a' }}>{test.rank || '—'}</strong>
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
                  <span className={`sp-grade-badge ${test.gradeClass || 'sp-grade-blue'}`}>{test.grade}</span>
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
                        <th>Marks Obtained</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((st, idx) => (
                        <tr 
                          key={st.student_id || idx} 
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
                          <td>
                            <strong className="sp-merit-score-val">{st.score}</strong>
                            <span className="sp-merit-score-tot"> / {st.total}</span>
                          </td>
                          <td>
                            <button 
                              type="button"
                              className="sp-merit-view-profile-btn"
                              onClick={() => handleOpenStudentProfile(st)}
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
            </>
          )}
        </div>
      )}

      {/* 4. TAB 2: MY CERTIFICATE & RANK CARD (EXACT MOCKUP MATCH) */}
      {activeTab === 'scorecard' && (
        <div className="sp-cert-page-wrapper">
          {/* Certificate Quick Actions Toolbar */}
          <div className="sp-cert-toolbar">
            <div className="sp-cert-toolbar-info">
              <span className="sp-cert-badge-pill">Official Verification Copy</span>
              <p className="sp-cert-toolbar-desc">Digitally issued and validated by DigiTute Academic Examination Board.</p>
            </div>
            <button
              type="button"
              className="sp-cert-download-action-btn"
              onClick={handleDownloadRankCardPdf}
              disabled={isDownloadingPdf}
              title="Download Certificate as PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="sp-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download Rank Card</span>
                </>
              )}
            </button>
          </div>

          {/* Authentic Printable Certificate Container */}
          <div className="sp-cert-outer-frame" ref={certOuterRef}>
            <div 
              className="sp-cert-scaler"
              style={{
                width: certScale < 1 ? `${Math.round(980 * certScale)}px` : '980px',
                height: certScale < 1 ? `${Math.round(certHeight * certScale)}px` : 'auto',
                overflow: 'hidden',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              <div 
                className="sp-cert-container" 
                id="sp-rank-card-certificate"
                ref={certRef}
                style={{
                  transform: certScale < 1 ? `scale(${certScale})` : 'none',
                  transformOrigin: 'top left',
                }}
              >
                {/* Inner Hairline Inset */}
                <div className="sp-cert-inner-hairline"></div>

              {/* 4 Corner Ornaments */}
              <div className="sp-cert-corner sp-cert-corner-tl">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V10C2 5.58 5.58 2 10 2H38" stroke="#ca8a04" strokeWidth="2" />
                  <path d="M7 38V12C7 9.24 9.24 7 12 7H38" stroke="#eab308" strokeWidth="1" opacity="0.8" />
                  <rect x="12" y="12" width="6" height="6" transform="rotate(45 15 15)" fill="#ca8a04" />
                  <circle cx="15" cy="15" r="1.5" fill="#ffffff" />
                  <line x1="17" y1="17" x2="28" y2="28" stroke="#ca8a04" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="sp-cert-corner sp-cert-corner-tr">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V10C2 5.58 5.58 2 10 2H38" stroke="#ca8a04" strokeWidth="2" />
                  <path d="M7 38V12C7 9.24 9.24 7 12 7H38" stroke="#eab308" strokeWidth="1" opacity="0.8" />
                  <rect x="12" y="12" width="6" height="6" transform="rotate(45 15 15)" fill="#ca8a04" />
                  <circle cx="15" cy="15" r="1.5" fill="#ffffff" />
                  <line x1="17" y1="17" x2="28" y2="28" stroke="#ca8a04" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="sp-cert-corner sp-cert-corner-bl">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V10C2 5.58 5.58 2 10 2H38" stroke="#ca8a04" strokeWidth="2" />
                  <path d="M7 38V12C7 9.24 9.24 7 12 7H38" stroke="#eab308" strokeWidth="1" opacity="0.8" />
                  <rect x="12" y="12" width="6" height="6" transform="rotate(45 15 15)" fill="#ca8a04" />
                  <circle cx="15" cy="15" r="1.5" fill="#ffffff" />
                  <line x1="17" y1="17" x2="28" y2="28" stroke="#ca8a04" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="sp-cert-corner sp-cert-corner-br">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V10C2 5.58 5.58 2 10 2H38" stroke="#ca8a04" strokeWidth="2" />
                  <path d="M7 38V12C7 9.24 9.24 7 12 7H38" stroke="#eab308" strokeWidth="1" opacity="0.8" />
                  <rect x="12" y="12" width="6" height="6" transform="rotate(45 15 15)" fill="#ca8a04" />
                  <circle cx="15" cy="15" r="1.5" fill="#ffffff" />
                  <line x1="17" y1="17" x2="28" y2="28" stroke="#ca8a04" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
                </svg>
              </div>

              {/* Watermark Laurel Wreaths */}
              <svg className="sp-cert-laurel-left" viewBox="0 0 100 360" fill="#b45309" xmlns="http://www.w3.org/2000/svg">
                <path d="M80 340 C35 270 20 180 35 90 C45 45 65 15 88 5 C78 28 60 65 52 110 C45 165 58 255 80 340 Z" opacity="0.5" />
                <path d="M40 35 C28 37 20 48 24 60 C32 62 42 54 44 44 Z" />
                <path d="M52 30 C62 27 72 34 70 45 C62 50 50 45 48 36 Z" />
                <path d="M28 75 C18 78 12 90 18 100 C26 102 36 94 36 84 Z" />
                <path d="M46 70 C56 67 68 74 66 85 C58 90 46 85 42 76 Z" />
                <path d="M20 120 C10 123 6 135 12 145 C21 147 30 139 30 129 Z" />
                <path d="M42 115 C52 111 64 117 64 129 C54 135 43 129 38 120 Z" />
                <path d="M18 168 C8 171 6 183 14 193 C23 194 32 186 30 176 Z" />
                <path d="M42 163 C52 159 64 165 64 177 C54 183 43 177 39 168 Z" />
                <path d="M22 218 C12 221 12 233 20 243 C30 242 38 234 36 224 Z" />
                <path d="M46 213 C57 209 68 215 68 227 C58 233 48 227 44 218 Z" />
                <path d="M30 268 C22 273 24 285 32 293 C41 290 48 282 45 272 Z" />
                <path d="M54 263 C65 259 75 266 73 277 C64 282 54 275 52 266 Z" />
              </svg>

              <svg className="sp-cert-laurel-right" viewBox="0 0 100 360" fill="#b45309" xmlns="http://www.w3.org/2000/svg">
                <path d="M80 340 C35 270 20 180 35 90 C45 45 65 15 88 5 C78 28 60 65 52 110 C45 165 58 255 80 340 Z" opacity="0.5" />
                <path d="M40 35 C28 37 20 48 24 60 C32 62 42 54 44 44 Z" />
                <path d="M52 30 C62 27 72 34 70 45 C62 50 50 45 48 36 Z" />
                <path d="M28 75 C18 78 12 90 18 100 C26 102 36 94 36 84 Z" />
                <path d="M46 70 C56 67 68 74 66 85 C58 90 46 85 42 76 Z" />
                <path d="M20 120 C10 123 6 135 12 145 C21 147 30 139 30 129 Z" />
                <path d="M42 115 C52 111 64 117 64 129 C54 135 43 129 38 120 Z" />
                <path d="M18 168 C8 171 6 183 14 193 C23 194 32 186 30 176 Z" />
                <path d="M42 163 C52 159 64 165 64 177 C54 183 43 177 39 168 Z" />
                <path d="M22 218 C12 221 12 233 20 243 C30 242 38 234 36 224 Z" />
                <path d="M46 213 C57 209 68 215 68 227 C58 233 48 227 44 218 Z" />
                <path d="M30 268 C22 273 24 285 32 293 C41 290 48 282 45 272 Z" />
                <path d="M54 263 C65 259 75 266 73 277 C64 282 54 275 52 266 Z" />
              </svg>

              {/* Faint Bottom Flourish Accent */}
              <svg className="sp-cert-bottom-wave-accent" viewBox="0 0 960 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 24 C240 6 480 34 720 12 C840 4 920 18 960 24" stroke="#d4af37" strokeWidth="1" opacity="0.25" />
                <path d="M0 30 C300 14 600 36 960 18" stroke="#ca8a04" strokeWidth="0.7" opacity="0.18" />
              </svg>

              {/* Certificate Inner Content */}
              <div className="sp-cert-inner-content">
                {/* 1. Top Bar: Logo Left, Golden Medal Center, Board Title Right */}
                <div className="sp-cert-top-bar">
                  {/* Left: DigiTute Logo */}
                  <div className="sp-cert-brand-left">
                    <div className="sp-cert-brand-logo-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                    <div className="sp-cert-brand-text">
                      <span className="sp-cert-brand-title">DigiTute</span>
                      <span className="sp-cert-brand-sub">ACADEMY OF ADVANCED LEARNING</span>
                    </div>
                  </div>

                  {/* Center: Official Star-Medal Emblem */}
                  <div className="sp-cert-top-medal">
                    <svg width="68" height="74" viewBox="0 0 64 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Ribbon Tails */}
                      <path d="M22 42L16 64L25 57L32 64L30 44" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M42 42L48 64L39 57L32 64L34 44" fill="#ca8a04" stroke="#a16207" strokeWidth="1.2" strokeLinejoin="round"/>
                      {/* Laurel / Ray border */}
                      <circle cx="32" cy="28" r="23" fill="#fef9c3" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2"/>
                      {/* Medal rim */}
                      <circle cx="32" cy="28" r="19" fill="url(#medalGradient)" stroke="#ca8a04" strokeWidth="2"/>
                      {/* Inner disc */}
                      <circle cx="32" cy="28" r="14" fill="#fffbeb" stroke="#d97706" strokeWidth="1.2"/>
                      {/* Center Golden Star */}
                      <polygon points="32,18 35,24.5 42,25 36.8,29.5 38.5,36.5 32,32.8 25.5,36.5 27.2,29.5 22,25 29,24.5" fill="#ca8a04"/>
                      <defs>
                        <linearGradient id="medalGradient" x1="16" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#fde047"/>
                          <stop offset="0.6" stopColor="#eab308"/>
                          <stop offset="1" stopColor="#ca8a04"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Right: Board Name */}
                  <div className="sp-cert-board-right">
                    <div className="sp-cert-board-text">
                      <span>BOARD OF ACADEMIC EXAMINATIONS</span>
                      <span>& STUDENT MERIT ASSESSMENT</span>
                    </div>
                    <div className="sp-cert-board-laurel-icon">
                      <svg width="20" height="26" viewBox="0 0 24 32" fill="none">
                        <path d="M12 2C12 2 10 10 10 16C10 22 12 30 12 30" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M10 8C7 7 4 9 4 12C7 12 9 10 10 8Z" fill="#ca8a04" opacity="0.85" />
                        <path d="M11 14C8 13 5 15 5 18C8 18 10 16 11 14Z" fill="#ca8a04" opacity="0.85" />
                        <path d="M12 20C9 19 6 21 6 24C9 24 11 22 12 20Z" fill="#ca8a04" opacity="0.85" />
                        <path d="M10 8C13 7 16 9 16 12C13 12 11 10 10 8Z" fill="#ca8a04" opacity="0.85" />
                        <path d="M11 14C14 13 17 15 17 18C14 18 12 16 11 14Z" fill="#ca8a04" opacity="0.85" />
                        <path d="M12 20C15 19 18 21 18 24C15 24 13 22 12 20Z" fill="#ca8a04" opacity="0.85" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 2. Main Certificate Title & Ribbon */}
                <div className="sp-cert-hero-titles" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <h1 className="sp-cert-title-primary" style={{ maxWidth: '100%', width: 'auto', textAlign: 'center', whiteSpace: 'nowrap', margin: '0 0 10px 0' }}>
                    CERTIFICATE OF ACADEMIC MERIT
                  </h1>
                  <div className="sp-cert-pill-badge" style={{ margin: '0 auto' }}>
                    OFFICIAL BATCH PERFORMANCE & RANK CARD
                  </div>
                </div>

                {/* 3. Recipient Presentation */}
                <div className="sp-cert-recipient-section">
                  <p className="sp-cert-present-lead">THIS IS PROUDLY PRESENTED TO</p>
                  <h2 className="sp-cert-recipient-name">{studentName}</h2>
                  <p className="sp-cert-statement">
                    For meritorious academic achievement and exemplary performance demonstrated in the batch assessment of <span className="sp-cert-bold-highlight">{examName} ({subjectName})</span> held on <span className="sp-cert-bold-highlight">{examDate}</span>.
                  </p>
                </div>

                {/* 4. The 4 Key Rounded Metric Cards */}
                <div className="sp-cert-cards-row">
                  {/* Card 1: Batch Rank */}
                  <div className="sp-cert-box sp-cert-box-rank">
                    <div className="sp-cert-box-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                        <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" />
                      </svg>
                    </div>
                    <span className="sp-cert-box-label">BATCH RANK</span>
                    <div className="sp-cert-box-value">{rankText}</div>
                    <span className="sp-cert-box-sub">Official Batch Position</span>
                  </div>

                  {/* Card 2: Marks Obtained */}
                  <div className="sp-cert-box sp-cert-box-score">
                    <div className="sp-cert-box-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                      </svg>
                    </div>
                    <span className="sp-cert-box-label">MARKS OBTAINED</span>
                    <div className="sp-cert-box-value">
                      {marksObtained}
                      <span className="sp-cert-box-denom"> / {marksTotal}</span>
                    </div>
                    <span className="sp-cert-box-sub">Exam Score Secured</span>
                  </div>

                  {/* Card 3: Percentage */}
                  <div className="sp-cert-box sp-cert-box-pct">
                    <div className="sp-cert-box-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    </div>
                    <span className="sp-cert-box-label">PERCENTAGE</span>
                    <div className="sp-cert-box-value">{percentage}</div>
                    <span className="sp-cert-box-sub">Aggregate Score</span>
                  </div>

                  {/* Card 4: Grade Awarded */}
                  <div className="sp-cert-box sp-cert-box-grade">
                    <div className="sp-cert-box-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#9333ea" stroke="#9333ea" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <span className="sp-cert-box-label">GRADE AWARDED</span>
                    <div className="sp-cert-box-value">{gradeAwarded}</div>
                    <span className="sp-cert-box-sub">Performance Rating</span>
                  </div>
                </div>

                {/* 5. Bottom Row: QR Ref, Gold Seal, Signature */}
                <div className="sp-cert-bottom-row">
                  {/* Left: QR Code Block */}
                  <div className="sp-cert-foot-left">
                    <div className="sp-cert-qr-frame">
                      <svg width="48" height="48" viewBox="0 0 25 25" fill="#0f172a">
                        <rect x="1" y="1" width="7" height="7" rx="0.8" fill="none" stroke="#0f172a" strokeWidth="1.2" />
                        <rect x="3" y="3" width="3" height="3" fill="#0f172a" />
                        <rect x="17" y="1" width="7" height="7" rx="0.8" fill="none" stroke="#0f172a" strokeWidth="1.2" />
                        <rect x="19" y="3" width="3" height="3" fill="#0f172a" />
                        <rect x="1" y="17" width="7" height="7" rx="0.8" fill="none" stroke="#0f172a" strokeWidth="1.2" />
                        <rect x="3" y="19" width="3" height="3" fill="#0f172a" />
                        <rect x="9" y="3" width="1.5" height="1.5" />
                        <rect x="12" y="3" width="1.5" height="1.5" />
                        <rect x="14" y="3" width="1.5" height="1.5" />
                        <rect x="3" y="9" width="1.5" height="1.5" />
                        <rect x="3" y="12" width="1.5" height="1.5" />
                        <rect x="3" y="14" width="1.5" height="1.5" />
                        <rect x="9" y="9" width="2" height="2" />
                        <rect x="12" y="9" width="1.5" height="1.5" />
                        <rect x="15" y="10" width="2" height="1.5" />
                        <rect x="10" y="13" width="2" height="2" />
                        <rect x="13" y="14" width="2" height="2" />
                        <rect x="10" y="18" width="1.5" height="1.5" />
                        <rect x="13" y="18" width="2" height="2" />
                        <rect x="18" y="10" width="2" height="2" />
                        <rect x="21" y="12" width="2" height="2" />
                        <rect x="17" y="15" width="2" height="2" />
                        <rect x="20" y="17" width="2" height="2" />
                        <rect x="18" y="21" width="3" height="2" />
                        <rect x="11" y="21" width="2" height="2" />
                      </svg>
                    </div>
                    <div className="sp-cert-ref-block">
                      <span className="sp-cert-ref-code">
                        REF : DGT-{String(test.id || '1da84d8b-eb03-47ab-9e25').slice(0, 24)}-{String(studentRoll || '1779').replace(/\D/g, '') || '1779'}
                      </span>
                      <span className="sp-cert-ref-batch">Batch: {batchName}</span>
                      <span className="sp-cert-ref-verified">
                        ✓ Digitally Verified via DigiTute
                      </span>
                    </div>
                  </div>

                  {/* Center: Official Seal of Excellence */}
                  <div className="sp-cert-foot-center">
                    <div className="sp-cert-gold-seal-medallion">
                      <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <radialGradient id="goldSealGrad" cx="42%" cy="38%" r="62%">
                            <stop offset="0%" stopColor="#fff8cc" />
                            <stop offset="30%" stopColor="#fde047" />
                            <stop offset="65%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#92400e" />
                          </radialGradient>
                          <filter id="sealShadow" x="-10%" y="-10%" width="125%" height="125%">
                            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#92400e" floodOpacity="0.35" />
                          </filter>
                        </defs>

                        {/* 28-point Gold Serrated Teeth Outer Rim */}
                        <polygon
                          points="50.00,3.00 54.76,7.77 60.46,4.18 64.04,9.88 70.39,7.65 72.61,14.01 79.30,13.25 80.05,19.95 86.75,20.70 85.99,27.39 92.35,29.61 90.12,35.96 95.82,39.54 92.23,45.24 97.00,50.00 92.23,54.76 95.82,60.46 90.12,64.04 92.35,70.39 85.99,72.61 86.75,79.30 80.05,80.05 79.30,86.75 72.61,85.99 70.39,92.35 64.04,90.12 60.46,95.82 54.76,92.23 50.00,97.00 45.24,92.23 39.54,95.82 35.96,90.12 29.61,92.35 27.39,85.99 20.70,86.75 19.95,80.05 13.25,79.30 14.01,72.61 7.65,70.39 9.88,64.04 4.18,60.46 7.77,54.76 3.00,50.00 7.77,45.24 4.18,39.54 9.88,35.96 7.65,29.61 14.01,27.39 13.25,20.70 19.95,19.95 20.70,13.25 27.39,14.01 29.61,7.65 35.96,9.88 39.54,4.18 45.24,7.77"
                          fill="url(#goldSealGrad)"
                          stroke="#b45309"
                          strokeWidth="1"
                          filter="url(#sealShadow)"
                        />

                        {/* Inner Inset Rim */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#fef08a" strokeWidth="1.2" opacity="0.9" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#78350f" strokeWidth="1" strokeDasharray="2.5 2" opacity="0.75" />

                        {/* Golden Crown Icon */}
                        <path d="M43 32 L44.5 25 L50 28.5 L55.5 25 L57 32 Z" fill="#78350f" />
                        <circle cx="44.5" cy="24" r="1.2" fill="#78350f" />
                        <circle cx="50" cy="27" r="1.2" fill="#78350f" />
                        <circle cx="55.5" cy="24" r="1.2" fill="#78350f" />

                        {/* Official Seal Text */}
                        <text x="50" y="44" fontFamily="serif" fontSize="7.2" fontWeight="900" fill="#78350f" textAnchor="middle" letterSpacing="0.8">OFFICIAL SEAL</text>
                        <text x="50" y="53" fontFamily="serif" fontSize="7.2" fontWeight="900" fill="#78350f" textAnchor="middle" letterSpacing="0.6">OF EXCELLENCE</text>

                        {/* 3 Stars */}
                        <text x="50" y="63" fontSize="8" fill="#78350f" textAnchor="middle" letterSpacing="2.5">★ ★ ★</text>
                      </svg>
                    </div>
                  </div>

                  {/* Right: Signature Block */}
                  <div className="sp-cert-foot-right">
                    <div className="sp-cert-signature-art">
                      <svg width="150" height="34" viewBox="0 0 150 34" fill="none">
                        <path d="M4 24 C20 22, 35 4, 52 22 C65 34, 80 10, 95 24 C105 32, 115 12, 128 14 C138 16, 142 22, 146 22" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
                        <path d="M22 18 C40 8, 60 18, 75 14" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="sp-cert-sig-underline"></div>
                    <span className="sp-cert-evaluator-name">{test.faculty || 'Santosh Nandi'}</span>
                    <span className="sp-cert-evaluator-role">Academic Director & Chief Evaluator</span>
                    <span className="sp-cert-evaluator-org">DigiTute Academy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile compact view hint */}
          {certScale < 1 && (
            <div className="sp-cert-mobile-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Tap <strong>Download Rank Card</strong> above to save full-resolution PDF</span>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Profile Card Modal for Viewed Student */}
      <StudentProfileCardModal 
        isOpen={Boolean(selectedStudentForCard)}
        onClose={() => setSelectedStudentForCard(null)}
        studentData={selectedStudentForCard}
        showToast={showToast}
      />
    </div>
  );
}
