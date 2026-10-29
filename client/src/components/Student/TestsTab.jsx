import React, { useState, useEffect } from 'react';
import MeritListPage from './MeritListPage';
import StudentProfileCardModal from './StudentProfileCardModal';
import { apiRequest } from '../../api';

// Exported structures preserved for compatibility
export const toppersData = {};
export const pastTestResults = [];
export const performanceProgressionData = {
  'All Subjects': { subject: 'All Subjects', color: '#2563eb', avgScore: '0%', grade: '—', growth: 'No records yet', tests: [] },
  'Physics': { subject: 'Physics', color: '#10b981', avgScore: '0%', grade: '—', growth: 'No records yet', tests: [] },
  'Chemistry': { subject: 'Chemistry', color: '#9333ea', avgScore: '0%', grade: '—', growth: 'No records yet', tests: [] },
  'Mathematics': { subject: 'Mathematics', color: '#2563eb', avgScore: '0%', grade: '—', growth: 'No records yet', tests: [] },
  'Biology': { subject: 'Biology', color: '#ea580c', avgScore: '0%', grade: '—', growth: 'No records yet', tests: [] }
};

export const defaultSampleTests = [
  { id: 't-1', date: '31 Oct 2026', rawDate: '2026-10-31', name: 'Week Test', subject: 'Physics', total: 100, obtained: 85, percentage: '85.0%', grade: 'A', gradeClass: 'sp-grade-green', faculty: 'Santosh Nandi', remarks: 'Good conceptual understanding and test performance.' },
  { id: 't-2', date: '25 Oct 2026', rawDate: '2026-10-25', name: 'Unit Test 2', subject: 'Chemistry', total: 100, obtained: 92, percentage: '92.0%', grade: 'A+', gradeClass: 'sp-grade-green', faculty: 'Santosh Nandi', remarks: 'Outstanding performance across all topics.' },
  { id: 't-3', date: '18 Oct 2026', rawDate: '2026-10-18', name: 'Monthly Test', subject: 'Mathematics', total: 100, obtained: 76, percentage: '76.0%', grade: 'B+', gradeClass: 'sp-grade-blue', faculty: 'Santosh Nandi', remarks: 'Consistent speed and problem solving.' },
  { id: 't-4', date: '10 Oct 2026', rawDate: '2026-10-10', name: 'Chapter Test 3', subject: 'Physics', total: 100, obtained: 68, percentage: '68.0%', grade: 'B', gradeClass: 'sp-grade-amber', faculty: 'Santosh Nandi', remarks: 'Focus more on numeric derivations.' },
  { id: 't-5', date: '02 Oct 2026', rawDate: '2026-10-02', name: 'Unit Test 1', subject: 'Chemistry', total: 100, obtained: 88, percentage: '88.0%', grade: 'A', gradeClass: 'sp-grade-green', faculty: 'Santosh Nandi', remarks: 'Great command over organic chemistry.' },
  { id: 't-6', date: '24 Sep 2026', rawDate: '2026-09-24', name: 'Chapter Test 2', subject: 'Mathematics', total: 100, obtained: 73, percentage: '73.0%', grade: 'B+', gradeClass: 'sp-grade-blue', faculty: 'Santosh Nandi', remarks: 'Good algebra accuracy.' },
  { id: 't-7', date: '15 Sep 2026', rawDate: '2026-09-15', name: 'Chapter Test 1', subject: 'Physics', total: 100, obtained: 81, percentage: '81.0%', grade: 'A-', gradeClass: 'sp-grade-green', faculty: 'Santosh Nandi', remarks: 'Solid start to the academic session.' },
];

const dateThemes = [
  { bg: '#eff6ff', icon: '#3b82f6' }, // Row 1: blue
  { bg: '#fff7ed', icon: '#f97316' }, // Row 2: peach
  { bg: '#f5f3ff', icon: '#8b5cf6' }, // Row 3: purple
  { bg: '#ecfdf5', icon: '#10b981' }, // Row 4: mint
  { bg: '#fef2f2', icon: '#ef4444' }, // Row 5: rose
  { bg: '#f5f3ff', icon: '#8b5cf6' }, // Row 6: purple
  { bg: '#eff6ff', icon: '#3b82f6' }, // Row 7: blue
];

const parseDateBox = (dateStr, rawDate) => {
  if (dateStr) {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
      return {
        day: parts[0].padStart(2, '0'),
        monthYear: `${parts[1]} ${parts[2]}`
      };
    }
  }
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return { day, monthYear: `${month} ${year}` };
      }
    } catch {}
  }
  return { day: '01', monthYear: 'Oct 2026' };
};

const renderSubjectInfo = (subject) => {
  const s = (subject || '').toLowerCase();
  if (s.includes('chem')) {
    return (
      <div className="sp-pt-subj-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.66 18.2A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.74-2.8L14 9.31V2" />
          <path d="M8.5 2h7" />
          <path d="M7 16h10" />
        </svg>
        <span className="sp-pt-subj-name">Chemistry</span>
      </div>
    );
  }
  if (s.includes('math')) {
    return (
      <div className="sp-pt-subj-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21l18-18H3v18z" />
          <path d="M3 15h3v3" />
          <path d="M9 15v-3h3" />
        </svg>
        <span className="sp-pt-subj-name">Mathematics</span>
      </div>
    );
  }
  // Default to Physics
  return (
    <div className="sp-pt-subj-wrap">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
        <circle cx="12" cy="12" r="2" fill="#7c3aed" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)" />
      </svg>
      <span className="sp-pt-subj-name">{subject || 'Physics'}</span>
    </div>
  );
};

export default function TestsTab({
  activeTab,
  setActiveTab,
  testSubTab,
  setTestSubTab,
  showToast
}) {
  const [testFilterSubject, setTestFilterSubject] = useState('All Subjects');
  const [testFilterType, setTestFilterType] = useState('All Tests');
  const [showAllRecentRanks, setShowAllRecentRanks] = useState(false);
  const [perfChartSubject, setPerfChartSubject] = useState('All Subjects');
  const [hoveredPerfPoint, setHoveredPerfPoint] = useState(null);
  const [viewingMeritTest, setViewingMeritTest] = useState(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);

  // Live Backend Database State
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [evaluatedResults, setEvaluatedResults] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState(performanceProgressionData);
  const [latestExamLeaderboard, setLatestExamLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Fetch real exam data from Database schema on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiRequest('/api/student/my-exams')
      .then((data) => {
        if (!isMounted || !data) return;

        const upcoming = data.upcoming_tests || [];
        const evaluated = data.evaluated_tests || [];
        const perfMap = data.performance_by_subject || {};

        setUpcomingTests(upcoming);
        setEvaluatedResults(evaluated);

        if (Object.keys(perfMap).length > 0) {
          setSubjectPerformance(perfMap);
        }

        // If there's a latest evaluated test, fetch its live batch merit list for Results view
        if (evaluated.length > 0) {
          const latestId = evaluated[0].id;
          apiRequest(`/api/student/exams/${latestId}/merit-list`)
            .then((meritData) => {
              if (isMounted && meritData) {
                setLatestExamLeaderboard(meritData);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load exams from backend:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenStudentProfile = (st) => {
    if (!st) return;
    const cleanName = (st.name || '').replace(' (You)', '');
    const cleanHandle = '@' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const totalStudents = latestExamLeaderboard?.total_students || 0;

    setSelectedStudentForCard({
      ...st,
      student_id: st.student_id || st.id,
      name: cleanName,
      handle: cleanHandle,
      roll: st.roll || '—',
      photo: st.photo || (st.isMe ? '/student-avatar.jpg' : null),
      initial: st.initial || cleanName.charAt(0) || '?',
      bg: st.bg || '#eff6ff',
      color: st.color || '#2563eb',
      badge: st.rank === 1 ? 'Gold' : st.rank <= 3 ? 'Silver' : 'Bronze',
      rank: totalStudents > 0 ? `#${st.rank} of ${totalStudents}` : `#${st.rank || '—'}`,
      rankSub: 'Rank (Batch)',
      rankTrend: st.standing || (st.rank === 1 ? 'Batch Topper' : st.rank === 2 ? 'Runner Up' : st.rank === 3 ? 'Podium' : st.rank <= 5 ? 'TOP 5 Elite' : st.rank <= 10 ? 'Top 10' : ''),
      batch: latestExamLeaderboard?.batch_name || 'Enrolled Batch',
      session: '2026 - 2027',
      quote: st.quote || (st.rank === 1 
        ? '"Excellence is not an act, but a habit."' 
        : st.rank <= 3 
          ? '"Consistency in daily practice is the true superpower."' 
          : '"Consistent study today, bigger opportunities tomorrow."'),
      bestScoreTest: latestExamLeaderboard?.title || 'Exam'
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (viewingMeritTest) {
    return (
      <MeritListPage
        test={viewingMeritTest}
        onBack={() => setViewingMeritTest(null)}
        showToast={showToast}
      />
    );
  }

  const isResultsView = activeTab === 'results' || testSubTab === 'results';

  return (
    <div className="sp-view-container sp-tests-view">
      {/* Header with Title */}
      <div className="sp-title-header-bar">
        <div>
          <h1 className="sp-page-title">
            {isResultsView ? 'Test Results & Toppers' : 'Test & Performance'}
          </h1>
          <p className="sp-page-subtitle">
            {isResultsView
              ? 'All subjects exam results, detailed scorecards and batch toppers leaderboard.'
              : 'View your upcoming test schedule, syllabus and subject-wise performance analysis.'}
          </p>
        </div>
      </div>

      {/* ======================================================= */}
      {/* SUB-VIEW 1: TEST & PERFORMANCE                          */}
      {/* ======================================================= */}
      {!isResultsView && (
        <div className="sp-subview-content">
          {/* Vertical Layout: Upcoming Tests on top, Subject Performance Trend below */}
          <div className="sp-tests-vertical-layout">
            {/* 1. Upcoming Tests Schedule */}
            <div className="sp-card sp-upcoming-tests-card">
              <div className="sp-card-title-row">
                <div>
                  <h4>Upcoming Tests Schedule</h4>
                  <p className="sp-sub-card-text">Click on any test to inspect syllabus and timing.</p>
                </div>
                <span className="sp-classes-count-pill">{upcomingTests.length} Upcoming</span>
              </div>

              <div className="sp-upcoming-tests-list">
                {loading ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div className="sp-spinner" style={{ margin: '0 auto 8px' }}></div>
                    <p style={{ fontSize: '13px', margin: 0 }}>Loading scheduled tests...</p>
                  </div>
                ) : upcomingTests.length > 0 ? (
                  upcomingTests.map((t, idx) => {
                    const badgeClass = idx % 3 === 0 ? 'date-blue' : idx % 3 === 1 ? 'date-pink' : 'date-green';
                    const color = idx % 3 === 0 ? '#2563eb' : idx % 3 === 1 ? '#ef4444' : '#16a34a';
                    return (
                      <div 
                        key={t.id || idx}
                        className="sp-upcoming-test-row" 
                        onClick={() => showToast && showToast(`${t.subject} (${t.title}) Syllabus: ${t.syllabus || 'As discussed in class'}`)}
                      >
                        <div className={`sp-test-date-badge ${badgeClass}`}>
                          <strong>{t.day || '—'}</strong>
                          <span>{t.month || '—'}</span>
                        </div>
                        <div className="sp-test-info-block">
                          <h5>{t.subject} - {t.title}</h5>
                          <span className="sp-test-batch-label">{t.batch || 'Enrolled Batch'}</span>
                          <div className="sp-test-submeta">
                            <span>📄 {t.totalMarks} Marks</span>
                            <span>·</span>
                            <span>⏱ {t.duration}</span>
                            {t.syllabus && (
                              <>
                                <span>·</span>
                                <span style={{ color, fontWeight: 600 }}>Syllabus: {t.syllabus}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="sp-chevron-right">›</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                    <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>No Upcoming Tests Scheduled</h5>
                    <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Upcoming exams announced by your teachers will automatically appear here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Subject-wise Performance Analysis Line Graph (Below Upcoming Tests) */}
            {(() => {
              const currentPerfData = subjectPerformance[perfChartSubject] || subjectPerformance['All Subjects'] || {
                subject: perfChartSubject,
                color: '#2563eb',
                avgScore: '0%',
                grade: '—',
                growth: 'No records yet',
                tests: []
              };
              const perfTests = currentPerfData.tests || [];
              const activePerfColor = currentPerfData.color || '#2563eb';
              const hasTests = perfTests.length > 0;
              const highestScore = hasTests ? Math.max(...perfTests.map(t => t.score || 0)) : null;

              const svgW = isMobile ? 360 : 860;
              const svgH = isMobile ? 210 : 240;
              const padL = isMobile ? 34 : 42;
              const padR = isMobile ? 18 : 28;
              const padT = isMobile ? 22 : 22;
              const padB = isMobile ? 36 : 40;
              const pW = svgW - padL - padR;
              const pH = svgH - padT - padB;

              const getPtY = (val) => padT + pH - (val / 100) * pH;
              const getPtX = (i, len) => padL + (i / Math.max(1, len - 1)) * pW;

              const perfPoints = hasTests ? perfTests.map((t, idx) => ({
                x: getPtX(idx, perfTests.length),
                y: getPtY(t.score || 0),
                ...t
              })) : [];

              const perfPathD = perfPoints.reduce(
                (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                ''
              );

              const perfAreaD = perfPoints.length > 0
                ? `${perfPathD} L ${perfPoints[perfPoints.length - 1].x} ${padT + pH} L ${perfPoints[0].x} ${padT + pH} Z`
                : '';

              return (
                <div className="sp-card sp-performance-card">
                  <div className="sp-card-title-row sp-perf-title-row">
                    <div className="sp-perf-title-left">
                      <h4 className="sp-perf-title">
                        Subject-wise Performance Trend
                      </h4>
                      <p className="sp-sub-card-text">
                        Continuous score progression & center test rankings over time
                      </p>
                    </div>
                    {currentPerfData.grade && currentPerfData.grade !== '—' && (
                      <span className="sp-grade-badge sp-grade-green">{currentPerfData.grade}</span>
                    )}
                  </div>

                  {/* Subject Selector Filter Bar with Overall */}
                  <div className="sp-perf-filter-bar">
                    {['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subj) => {
                      const isSelected = perfChartSubject === subj;
                      return (
                        <button
                          key={subj}
                          className={`sp-perf-filter-pill ${isSelected ? 'active' : ''}`}
                          style={isSelected && subj !== 'All Subjects' ? { background: subjectPerformance[subj]?.color || '#2563eb', borderColor: subjectPerformance[subj]?.color || '#2563eb', color: '#fff' } : {}}
                          onClick={() => {
                            setPerfChartSubject(subj);
                            setHoveredPerfPoint(null);
                          }}
                        >
                          {subj === 'All Subjects' ? '📊 Overall' : subj}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Progression Summary Strip */}
                  <div className="sp-perf-mini-summary-row">
                    <div className="sp-pms-item">
                      <span>Evaluated Tests</span>
                      <strong>{perfTests.length} Tests</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Avg Score</span>
                      <strong style={{ color: activePerfColor }}>{currentPerfData.avgScore || '0%'}</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Highest</span>
                      <strong style={{ color: '#16a34a' }}>{highestScore !== null ? `${highestScore}%` : '—'}</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Trend</span>
                      <strong style={{ color: '#10b981' }}>{currentPerfData.growth || 'No records yet'}</strong>
                    </div>
                  </div>

                  {/* SVG Line Graph or Empty State */}
                  {hasTests ? (
                    <div className="sp-perf-chart-container">
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="sp-responsive-chart-svg">
                        <defs>
                          <linearGradient id={`perfAreaGrad_${perfChartSubject.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activePerfColor} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={activePerfColor} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Gridlines */}
                        {[100, 75, 50, 25, 0].map((tick) => {
                          const y = getPtY(tick);
                          return (
                            <g key={tick}>
                              <line
                                x1={padL}
                                y1={y}
                                x2={svgW - padR}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                              />
                              <text
                                x={padL - (isMobile ? 6 : 8)}
                                y={y + 3.5}
                                textAnchor="end"
                                fontSize={isMobile ? "9" : "10"}
                                fontWeight="600"
                                fill="#94a3b8"
                              >
                                {tick}%
                              </text>
                            </g>
                          );
                        })}

                        {/* 70% Benchmark Line */}
                        <line
                          x1={padL}
                          y1={getPtY(70)}
                          x2={svgW - padR}
                          y2={getPtY(70)}
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={svgW - padR}
                          y={getPtY(70) - 4}
                          textAnchor="end"
                          fontSize={isMobile ? "8.5" : "9.5"}
                          fontWeight="600"
                          fill="#94a3b8"
                        >
                          {isMobile ? '70% Goal' : '70% Benchmark'}
                        </text>

                        {/* Area Under Curve */}
                        <path d={perfAreaD} fill={`url(#perfAreaGrad_${perfChartSubject.replace(/\s+/g, '')})`} />

                        {/* Curve Line */}
                        <path
                          d={perfPathD}
                          fill="none"
                          stroke={activePerfColor}
                          strokeWidth={isMobile ? "2.4" : "2.8"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data Points */}
                        {perfPoints.map((pt, idx) => {
                          const isHovered = hoveredPerfPoint?.id === pt.id;
                          return (
                            <g
                              key={pt.id || idx}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => !isMobile && setHoveredPerfPoint(pt)}
                              onMouseLeave={() => !isMobile && setHoveredPerfPoint(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoveredPerfPoint(prev => (prev?.id === pt.id ? null : pt));
                              }}
                            >
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isMobile ? 18 : 12}
                                fill="transparent"
                              />
                              {isHovered && (
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isMobile ? 9 : 10}
                                  fill={activePerfColor}
                                  opacity="0.25"
                                />
                              )}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? (isMobile ? 5.5 : 6) : (isMobile ? 4 : 4.5)}
                                fill="#ffffff"
                                stroke={activePerfColor}
                                strokeWidth={isMobile ? "2.2" : "2.5"}
                                style={{ transition: 'all 0.15s ease' }}
                              />
                              <text
                                x={pt.x}
                                y={pt.y - (isMobile ? 6 : 7)}
                                textAnchor="middle"
                                fontSize={isMobile ? "9.5" : "10.5"}
                                fontWeight="700"
                                fill={isHovered ? activePerfColor : '#334155'}
                              >
                                {pt.score}%
                              </text>
                              <text
                                x={pt.x}
                                y={padT + pH + (isMobile ? 14 : 16)}
                                textAnchor="middle"
                                fontSize={isMobile ? "9" : "10"}
                                fontWeight={isHovered ? '700' : '600'}
                                fill={isHovered ? '#0f172a' : '#64748b'}
                              >
                                {pt.date}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating Tooltip (Desktop only) */}
                      {!isMobile && hoveredPerfPoint && (
                        <div className="sp-perf-tooltip-floating">
                          <strong className="sp-ptt-title">{hoveredPerfPoint.testName}</strong>
                          <div className="sp-ptt-meta">
                            <span>{hoveredPerfPoint.subject} · {hoveredPerfPoint.date}</span>
                            <strong style={{ color: activePerfColor }}>{hoveredPerfPoint.score}%</strong>
                          </div>
                          <div className="sp-ptt-sub">
                            <span>Rank: {hoveredPerfPoint.rank || '—'}</span>
                            <span style={{ color: '#cbd5e1' }}>·</span>
                            <span>{hoveredPerfPoint.remark || ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', margin: '16px 0' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                      <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>No Performance Records Yet</h5>
                      <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Your score progression, growth analysis, and subject-wise trend graph will appear here once tests are conducted and evaluated.</p>
                    </div>
                  )}

                  {/* Active Point Detail Card (Mobile & Touch Devices) */}
                  {isMobile && hoveredPerfPoint && (
                    <div className="sp-perf-point-detail-card">
                      <div className="sp-ppdc-header">
                        <div className="sp-ppdc-left">
                          <span className="sp-ppdc-subject-pill" style={{ background: activePerfColor }}>
                            {hoveredPerfPoint.subject}
                          </span>
                          <strong className="sp-ppdc-name">{hoveredPerfPoint.testName}</strong>
                        </div>
                        <button 
                          type="button"
                          className="sp-ppdc-close-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredPerfPoint(null);
                          }}
                          aria-label="Close test details"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="sp-ppdc-grid">
                        <div className="sp-ppdc-stat">
                          <span className="sp-ppdc-stat-label">Score</span>
                          <strong className="sp-ppdc-stat-val" style={{ color: activePerfColor }}>
                            {hoveredPerfPoint.score}%
                          </strong>
                        </div>
                        <div className="sp-ppdc-stat">
                          <span className="sp-ppdc-stat-label">Exam Date</span>
                          <strong className="sp-ppdc-stat-val">{hoveredPerfPoint.date}</strong>
                        </div>
                        <div className="sp-ppdc-stat">
                          <span className="sp-ppdc-stat-label">Center Rank</span>
                          <strong className="sp-ppdc-stat-val">{hoveredPerfPoint.rank || '—'}</strong>
                        </div>
                      </div>
                      {hoveredPerfPoint.remark && (
                        <div className="sp-ppdc-remark">
                          <span className="sp-ppdc-remark-icon">💡</span>
                          <span><strong>Feedback:</strong> {hoveredPerfPoint.remark}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tap Hint for Mobile when no point selected */}
                  {isMobile && !hoveredPerfPoint && hasTests && (
                    <div className="sp-perf-tap-hint">
                      <span className="sp-pth-icon">👆</span>
                      <span>Tap any point on the graph to view scorecard & rank</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* SUB-VIEW 2: RESULT & TOPPERS LEADERBOARD                */}
      {/* ======================================================= */}
      {isResultsView && (
        <div className="sp-subview-content">
          {/* 1. TOP: RECENT TEST LEADERBOARD */}
          {(() => {
            const meritList = latestExamLeaderboard?.merit_list || [];
            const rank1 = meritList.find(x => x.rank === 1);
            const rank2 = meritList.find(x => x.rank === 2);
            const rank3 = meritList.find(x => x.rank === 3);
            const subsequentRanks = meritList.filter(x => x.rank >= 4);
            const displayedRanks = showAllRecentRanks ? subsequentRanks : subsequentRanks.slice(0, 3);

            return (
              <div className="sp-card sp-leaderboard-hero-card" id="sp-topper-board">
                {/* Header Strip */}
                <div className="sp-lb-header-row">
                  <div className="sp-lb-title-group">
                    <div className="sp-lb-trophy-icon">🏆</div>
                    <div>
                      <div className="sp-lb-badge-title-wrap">
                        <h3 className="sp-lb-main-title">Recent Exam Leaderboard</h3>
                        <span className="sp-lb-recent-pill">
                          {latestExamLeaderboard ? `🔥 ${latestExamLeaderboard.subject} - ${latestExamLeaderboard.title}` : 'No Published Exam'}
                        </span>
                      </div>
                      <p className="sp-lb-subtitle">
                        Top rankers and performance standings for the most recently evaluated test.
                      </p>
                    </div>
                  </div>
                </div>

                {meritList.length > 0 ? (
                  <>
                    {/* TOP 3 CIRCULAR PODIUM ROW */}
                    <div className="sp-podium-circles-row">
                      {/* RANK 2 */}
                      {rank2 && (
                        <div 
                          className="sp-podium-circle-col rank-2-col"
                          onClick={() => handleOpenStudentProfile(rank2)}
                          title={`View ${rank2.name}'s Profile`}
                        >
                          <div className="sp-circle-avatar-wrap">
                            {rank2.photo ? (
                              <img 
                                src={rank2.photo} 
                                alt={rank2.name} 
                                className="sp-podium-img-avatar" 
                                onError={(e) => { 
                                  e.target.style.display = 'none'; 
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'; 
                                }}
                              />
                            ) : null}
                            <div 
                              className="sp-podium-fallback-avatar" 
                              style={{ display: rank2.photo ? 'none' : 'grid', background: rank2.bg, color: rank2.color }}
                            >
                              {rank2.initial || rank2.name.charAt(0)}
                            </div>
                            <div className="sp-circle-rank-badge badge-rank-2">2</div>
                          </div>
                          <strong className="sp-podium-circle-name">{rank2.name}</strong>
                          <button
                            type="button"
                            className="sp-podium-view-profile-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudentProfile(rank2);
                            }}
                            title={`View ${rank2.name}'s Profile`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>View Profile</span>
                          </button>
                        </div>
                      )}

                      {/* RANK 1 */}
                      {rank1 && (
                        <div 
                          className="sp-podium-circle-col is-rank-1"
                          onClick={() => handleOpenStudentProfile(rank1)}
                          title={`View ${rank1.name}'s Profile`}
                        >
                          <div className="sp-circle-avatar-wrap-r1">
                            <div className="sp-r1-star-badge" title="Batch Top Ranker">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            </div>
                            <div 
                              className="sp-r1-inner-avatar" 
                              style={{ background: rank1.bg || '#2563eb', color: rank1.color || '#ffffff' }}
                            >
                              {rank1.initial || rank1.name.charAt(0)}
                            </div>
                            <div className="sp-circle-rank-badge badge-rank-1">1</div>
                          </div>
                          <strong className="sp-podium-circle-name">{rank1.name}</strong>
                          <button
                            type="button"
                            className="sp-podium-view-profile-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudentProfile(rank1);
                            }}
                            title={`View ${rank1.name}'s Profile`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>View Profile</span>
                          </button>
                        </div>
                      )}

                      {/* RANK 3 */}
                      {rank3 && (
                        <div 
                          className="sp-podium-circle-col rank-3-col"
                          onClick={() => handleOpenStudentProfile(rank3)}
                          title={`View ${rank3.name}'s Profile`}
                        >
                          <div className="sp-circle-avatar-wrap">
                            {rank3.photo ? (
                              <img 
                                src={rank3.photo} 
                                alt={rank3.name} 
                                className="sp-podium-img-avatar" 
                                onError={(e) => { 
                                  e.target.style.display = 'none'; 
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'; 
                                }}
                              />
                            ) : null}
                            <div 
                              className="sp-podium-fallback-avatar" 
                              style={{ display: rank3.photo ? 'none' : 'grid', background: rank3.bg, color: rank3.color }}
                            >
                              {rank3.initial || rank3.name.charAt(0)}
                            </div>
                            <div className="sp-circle-rank-badge badge-rank-3">3</div>
                          </div>
                          <strong className="sp-podium-circle-name">{rank3.name}</strong>
                          <button
                            type="button"
                            className="sp-podium-view-profile-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudentProfile(rank3);
                            }}
                            title={`View ${rank3.name}'s Profile`}
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

                    {/* WHITE CARD ROWS FOR RANKS #4, #5, #6+ */}
                    <div className="sp-rank-rows-stack">
                      {displayedRanks.map((item) => (
                        <div 
                          key={item.rank} 
                          className={`sp-rank-row-card ${item.isMe ? 'is-me-row' : ''}`}
                          onClick={() => handleOpenStudentProfile(item)}
                          title={`View ${item.name}'s Profile`}
                        >
                          <div className="sp-rrc-left">
                            <span className="sp-rrc-rank">#{item.rank}</span>
                            <div className="sp-rrc-avatar-wrap">
                              {item.photo ? (
                                <img 
                                  src={item.photo} 
                                  alt={item.name} 
                                  className="sp-rrc-avatar-img"
                                  onError={(e) => { 
                                    e.target.style.display = 'none'; 
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'; 
                                  }} 
                                />
                              ) : null}
                              <div 
                                className="sp-rrc-fallback-avatar" 
                                style={{ display: item.photo ? 'none' : 'grid', background: item.bg, color: item.color }}
                              >
                                {item.initial || item.name.charAt(0)}
                              </div>
                            </div>
                            <div className="sp-rrc-name-col">
                              <strong className="sp-rrc-name">{item.name}</strong>
                              {item.isMe && (
                                <span className="sp-badge-you">You</span>
                              )}
                            </div>
                          </div>

                          <div className="sp-rrc-right">
                            {item.rank <= 5 ? (
                              <div className="sp-rrc-trend-badge">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="7" y1="17" x2="17" y2="7"/>
                                  <polyline points="7 7 17 7 17 17"/>
                                </svg>
                                <span>TOP 5</span>
                              </div>
                            ) : item.isMe ? (
                              <div className="sp-rrc-you-status">
                                <span>🎯 YOU</span>
                                <strong className="sp-rrc-you-score">{item.score}/{item.total} Marks ({item.pct})</strong>
                              </div>
                            ) : (
                              <div className="sp-rrc-score-badge">
                                <span>{item.score}/{item.total} Marks</span>
                                <small>({item.pct})</small>
                              </div>
                            )}

                            {/* View Profile Button */}
                            <button 
                              type="button"
                              className="sp-merit-view-profile-btn sp-rrc-profile-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentProfile(item);
                              }}
                              title={`View ${item.name}'s Profile`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span>View Profile</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* View All / Toggle Button */}
                      {meritList.length > 5 && (
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                          <button 
                            className="sp-rrc-view-all-btn"
                            onClick={() => setShowAllRecentRanks(!showAllRecentRanks)}
                          >
                            {showAllRecentRanks 
                              ? '▲ Show Top 5 Only' 
                              : `▼ View Full Merit List (${meritList.length} Students)`
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
                    <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>No Leaderboard Published Yet</h5>
                    <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Top rankers will appear here once exam results and merit lists are released.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. BELOW: PAST TEST RESULTS CARDS (No horizontal scroll, Matches Image Exactly) */}
          <div className="sp-card sp-past-results-container" style={{ marginTop: '26px' }}>
            {/* Header with blue document icon */}
            <div className="sp-pt-header-row">
              <div className="sp-pt-header-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div className="sp-pt-header-text">
                <h3 className="sp-pt-card-title">Past Test Results</h3>
                <p className="sp-pt-card-subtitle">Check your previous test scores, ranks and performance.</p>
              </div>
            </div>

            {/* Cards List */}
            <div className="sp-pt-cards-list">
              {(() => {
                const filtered = (evaluatedResults && evaluatedResults.length > 0) ? evaluatedResults : defaultSampleTests;

                if (filtered.length === 0) {
                  return (
                    <div className="sp-pt-empty-state">
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>📋</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>No Test Results Available</div>
                      <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>
                        There are no past test records matching your selected filter.
                      </div>
                    </div>
                  );
                }

                return filtered.map((row, idx) => {
                  const dateInfo = parseDateBox(row.date, row.rawDate);
                  const theme = dateThemes[idx % dateThemes.length];

                  return (
                    <div key={row.id || idx} className="sp-pt-card-item">
                      {/* 1. Date Box */}
                      <div className="sp-pt-date-box" style={{ background: theme.bg }}>
                        <svg className="sp-pt-date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.icon} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="sp-pt-date-day">{dateInfo.day}</span>
                        <span className="sp-pt-date-my">{dateInfo.monthYear}</span>
                      </div>

                      {/* 2. Test Name & Subject */}
                      <div className="sp-pt-title-col">
                        <strong
                          className="sp-pt-test-name"
                          onClick={() => setViewingMeritTest(row)}
                          title="View Merit List"
                        >
                          {row.name}
                        </strong>
                        {renderSubjectInfo(row.subject)}
                      </div>

                      {/* 3. Marks */}
                      <div className="sp-pt-marks-col">
                        <span className="sp-pt-col-label">Marks</span>
                        <div className="sp-pt-marks-val-wrap">
                          <strong className="sp-pt-marks-obtained">{row.obtained}</strong>
                          <span className="sp-pt-marks-slash"> / </span>
                          <strong className="sp-pt-marks-total">{row.total}</strong>
                        </div>
                        <span className="sp-pt-marks-pct">
                          ({typeof row.percentage === 'string' && row.percentage.includes('%') ? row.percentage : `${row.percentage || 0}%`})
                        </span>
                      </div>

                      {/* 4. Grade */}
                      <div className="sp-pt-grade-col">
                        <span className="sp-pt-col-label">Grade</span>
                        <span className={`sp-pt-grade-pill grade-${String(row.grade || 'A').toLowerCase().replace('+', 'plus').replace('-', 'minus')}`}>
                          {row.grade || 'A'}
                        </span>
                      </div>

                      {/* 5. Action Button: [ 📄 > ] Exactly Matches Reference Image */}
                      <div className="sp-pt-action-col">
                        <button
                          type="button"
                          className="sp-pt-icon-action-btn"
                          onClick={() => setViewingMeritTest(row)}
                          title={`View Merit List for ${row.name}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
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
