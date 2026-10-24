import React, { useState, useEffect } from 'react';
import MeritListPage from './MeritListPage';

export const toppersData = {
  'Unit Test 1 - Physics': [
    { rank: 1, name: 'Koyel Pandit', roll: '12-SCI-015', score: 98, total: 100, pct: '98%', badge: '1', standing: '1st Position', initial: 'K', bg: '#2563eb', color: '#ffffff', percentile: '99.8%' },
    { rank: 2, name: 'Manisha Mandal', roll: '12-SCI-008', score: 95, total: 100, pct: '95%', badge: '2', standing: '2nd Position', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', initial: 'M', bg: '#ecfdf5', color: '#059669', percentile: '98.5%' },
    { rank: 3, name: 'Kalyani Shit', roll: '12-SCI-021', score: 93, total: 100, pct: '93%', badge: '3', standing: '3rd Position', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', initial: 'K', bg: '#fce7f3', color: '#db2777', percentile: '97.8%' },
    { rank: 4, name: 'Sunanya Jana', roll: '12-SCI-023', score: 89, total: 100, pct: '89%', badge: '4', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#fef3c7', color: '#d97706', percentile: '95.0%' },
    { rank: 5, name: 'Rumpa Santra', roll: '12-SCI-031', score: 86, total: 100, pct: '86%', badge: '5', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', initial: 'R', bg: '#e0f2fe', color: '#0284c7', percentile: '92.4%' },
    { rank: 6, name: 'Suman Maji (You)', roll: '12-SCI-042', score: 84, total: 100, pct: '84%', badge: '6', standing: 'Honorable Mention', photo: '/student-avatar.jpg', initial: 'S', bg: '#eff6ff', color: '#2563eb', isMe: true, percentile: '91.2%' },
    { rank: 7, name: 'Debjit Paul', roll: '12-SCI-019', score: 82, total: 100, pct: '82%', badge: '7', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', initial: 'D', bg: '#f3e8ff', color: '#9333ea', percentile: '89.5%' },
    { rank: 8, name: 'Sneha Roy', roll: '12-SCI-004', score: 79, total: 100, pct: '79%', badge: '8', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#f1f5f9', color: '#475569', percentile: '86.2%' },
    { rank: 9, name: 'Aritra Das', roll: '12-SCI-011', score: 76, total: 100, pct: '76%', badge: '9', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', initial: 'A', bg: '#ecfdf5', color: '#10b981', percentile: '83.0%' },
    { rank: 10, name: 'Priya Karmakar', roll: '12-SCI-027', score: 73, total: 100, pct: '73%', badge: '10', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', initial: 'P', bg: '#fee2e2', color: '#ef4444', percentile: '80.1%' },
  ],
  'Chapter Test 3 - Chemistry': [
    { rank: 1, name: 'Sneha Roy', roll: '12-SCI-004', score: 96, total: 100, pct: '96%', badge: '1', standing: '1st Position', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#2563eb', color: '#ffffff', percentile: '99.6%' },
    { rank: 2, name: 'Aritra Das', roll: '12-SCI-019', score: 91, total: 100, pct: '91%', badge: '2', standing: '2nd Position', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', initial: 'A', bg: '#ecfdf5', color: '#059669', percentile: '98.1%' },
    { rank: 3, name: 'Koyel Pandit', roll: '12-SCI-015', score: 88, total: 100, pct: '88%', badge: '3', standing: '3rd Position', initial: 'K', bg: '#2563eb', color: '#ffffff', percentile: '96.5%' },
    { rank: 4, name: 'Manisha Mandal', roll: '12-SCI-008', score: 85, total: 100, pct: '85%', badge: '4', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', initial: 'M', bg: '#fef3c7', color: '#d97706', percentile: '93.8%' },
    { rank: 5, name: 'Sunanya Jana', roll: '12-SCI-023', score: 82, total: 100, pct: '82%', badge: '5', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#f3e8ff', color: '#9333ea', percentile: '91.0%' },
    { rank: 6, name: 'Rumpa Santra', roll: '12-SCI-031', score: 80, total: 100, pct: '80%', badge: '6', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', initial: 'R', bg: '#e0f2fe', color: '#0284c7', percentile: '88.4%' },
    { rank: 7, name: 'Suman Maji (You)', roll: '12-SCI-042', score: 78, total: 100, pct: '78%', badge: '7', standing: 'Top 10', photo: '/student-avatar.jpg', initial: 'S', bg: '#eff6ff', color: '#2563eb', isMe: true, percentile: '85.2%' },
    { rank: 8, name: 'Debjit Paul', roll: '12-SCI-029', score: 75, total: 100, pct: '75%', badge: '8', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', initial: 'D', bg: '#fee2e2', color: '#ef4444', percentile: '82.0%' },
  ],
  'Part Test 2 - Mathematics': [
    { rank: 1, name: 'Debjit Paul', roll: '12-SCI-031', score: 94, total: 100, pct: '94%', badge: '1', standing: '1st Position', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', initial: 'D', bg: '#2563eb', color: '#ffffff', percentile: '99.5%' },
    { rank: 2, name: 'Sourav Mondal', roll: '12-SCI-011', score: 90, total: 100, pct: '90%', badge: '2', standing: '2nd Position', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#ecfdf5', color: '#059669', percentile: '97.8%' },
    { rank: 3, name: 'Rahul Sen', roll: '12-SCI-008', score: 87, total: 100, pct: '87%', badge: '3', standing: '3rd Position', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', initial: 'R', bg: '#fce7f3', color: '#db2777', percentile: '95.4%' },
    { rank: 4, name: 'Koyel Pandit', roll: '12-SCI-015', score: 83, total: 100, pct: '83%', badge: '4', standing: 'TOP 5', initial: 'K', bg: '#2563eb', color: '#ffffff', percentile: '92.6%' },
    { rank: 5, name: 'Manisha Mandal', roll: '12-SCI-018', score: 80, total: 100, pct: '80%', badge: '5', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', initial: 'M', bg: '#f3e8ff', color: '#9333ea', percentile: '89.2%' },
    { rank: 6, name: 'Sunanya Jana', roll: '12-SCI-023', score: 76, total: 100, pct: '76%', badge: '6', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#e0f2fe', color: '#0284c7', percentile: '85.0%' },
    { rank: 12, name: 'Suman Maji (You)', roll: '12-SCI-042', score: 65, total: 100, pct: '65%', badge: '12', standing: 'Cleared', photo: '/student-avatar.jpg', initial: 'S', bg: '#eff6ff', color: '#2563eb', isMe: true, percentile: '78.5%' },
  ],
  'Unit Test 1 - Biology': [
    { rank: 1, name: 'Priya Karmakar', roll: '12-SCI-023', score: 97, total: 100, pct: '97%', badge: '1', standing: '1st Position', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', initial: 'P', bg: '#2563eb', color: '#ffffff', percentile: '99.7%' },
    { rank: 2, name: 'Sneha Roy', roll: '12-SCI-004', score: 93, total: 100, pct: '93%', badge: '2', standing: '2nd Position', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#ecfdf5', color: '#059669', percentile: '98.4%' },
    { rank: 3, name: 'Kalyani Shit', roll: '12-SCI-021', score: 90, total: 100, pct: '90%', badge: '3', standing: '3rd Position', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', initial: 'K', bg: '#fce7f3', color: '#db2777', percentile: '97.2%' },
    { rank: 4, name: 'Suman Maji (You)', roll: '12-SCI-042', score: 88, total: 100, pct: '88%', badge: '4', standing: 'TOP 5', photo: '/student-avatar.jpg', initial: 'S', bg: '#eff6ff', color: '#2563eb', isMe: true, percentile: '96.8%' },
    { rank: 5, name: 'Koyel Pandit', roll: '12-SCI-015', score: 85, total: 100, pct: '85%', badge: '5', standing: 'TOP 5', initial: 'K', bg: '#2563eb', color: '#ffffff', percentile: '93.5%' },
    { rank: 6, name: 'Manisha Mandal', roll: '12-SCI-008', score: 82, total: 100, pct: '82%', badge: '6', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', initial: 'M', bg: '#f3e8ff', color: '#9333ea', percentile: '90.2%' },
  ],
  'Chapter Test 2 - Physics': [
    { rank: 1, name: 'Koyel Pandit', roll: '12-SCI-015', score: 95, total: 100, pct: '95%', badge: '1', standing: '1st Position', initial: 'K', bg: '#2563eb', color: '#ffffff', percentile: '99.4%' },
    { rank: 2, name: 'Manisha Mandal', roll: '12-SCI-008', score: 92, total: 100, pct: '92%', badge: '2', standing: '2nd Position', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', initial: 'M', bg: '#ecfdf5', color: '#059669', percentile: '98.0%' },
    { rank: 3, name: 'Debjit Paul', roll: '12-SCI-031', score: 88, total: 100, pct: '88%', badge: '3', standing: '3rd Position', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', initial: 'D', bg: '#fce7f3', color: '#db2777', percentile: '96.2%' },
    { rank: 4, name: 'Kalyani Shit', roll: '12-SCI-021', score: 85, total: 100, pct: '85%', badge: '4', standing: 'TOP 5', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', initial: 'K', bg: '#fef3c7', color: '#d97706', percentile: '93.5%' },
    { rank: 5, name: 'Sunanya Jana', roll: '12-SCI-023', score: 81, total: 100, pct: '81%', badge: '5', standing: 'Top 10', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', initial: 'S', bg: '#f3e8ff', color: '#9333ea', percentile: '90.0%' },
    { rank: 8, name: 'Suman Maji (You)', roll: '12-SCI-042', score: 76, total: 100, pct: '76%', badge: '8', standing: 'Top 10', photo: '/student-avatar.jpg', initial: 'S', bg: '#eff6ff', color: '#2563eb', isMe: true, percentile: '87.4%' },
  ]
};

export const pastTestResults = [
  {
    date: '08 Sep 2026',
    name: 'Unit Test 1',
    subject: 'Physics',
    total: 100,
    obtained: 84,
    percentage: '84%',
    grade: 'A',
    gradeClass: 'sp-grade-green',
    rank: '6th of 28',
    correct: 42,
    incorrect: 8,
    remarks: 'Strong understanding of Coulomb’s Law and Electric Dipole derivations!'
  },
  {
    date: '02 Sep 2026',
    name: 'Chapter Test 3',
    subject: 'Chemistry',
    total: 100,
    obtained: 78,
    percentage: '78%',
    grade: 'A',
    gradeClass: 'sp-grade-blue',
    rank: '7th of 28',
    correct: 39,
    incorrect: 11,
    remarks: 'Good grasp of nomenclature; revise Aldol condensation mechanisms.'
  },
  {
    date: '28 Aug 2026',
    name: 'Part Test 2',
    subject: 'Mathematics',
    total: 100,
    obtained: 65,
    percentage: '65%',
    grade: 'B',
    gradeClass: 'sp-grade-amber',
    rank: '12th of 28',
    correct: 32,
    incorrect: 18,
    remarks: 'Practice inverse matrix calculations and determinant row operations.'
  },
  {
    date: '20 Aug 2026',
    name: 'Unit Test 1',
    subject: 'Biology',
    total: 100,
    obtained: 88,
    percentage: '88%',
    grade: 'A',
    gradeClass: 'sp-grade-blue',
    rank: '4th of 28',
    correct: 44,
    incorrect: 6,
    remarks: 'Excellent diagrams and labeling in DNA replication.'
  },
  {
    date: '10 Aug 2026',
    name: 'Chapter Test 2',
    subject: 'Physics',
    total: 100,
    obtained: 76,
    percentage: '76%',
    grade: 'A',
    gradeClass: 'sp-grade-blue',
    rank: '8th of 28',
    correct: 38,
    incorrect: 12,
    remarks: 'Strong numerical accuracy; improve theoretical descriptions.'
  }
];

export const performanceProgressionData = {
  'All Subjects': {
    subject: 'All Subjects',
    color: '#2563eb',
    avgScore: '78%',
    grade: 'Grade A',
    growth: '+14% Overall Growth',
    tests: [
      { id: 1, testName: 'Diagnostic Test', date: '15 Jul', score: 68, subject: 'Physics', rank: '12th of 28', remark: 'Initial assessment & foundation check' },
      { id: 2, testName: 'Chapter Test 1', date: '28 Jul', score: 72, subject: 'Physics', rank: '9th of 28', remark: 'Good electrostatics conceptual clarity' },
      { id: 3, testName: 'Chapter Test 2', date: '10 Aug', score: 76, subject: 'Physics', rank: '8th of 28', remark: 'Strong numerical accuracy' },
      { id: 4, testName: 'Unit Test 1', date: '20 Aug', score: 88, subject: 'Biology', rank: '4th of 28', remark: 'Excellent diagrams and labeling' },
      { id: 5, testName: 'Part Test 2', date: '28 Aug', score: 65, subject: 'Mathematics', rank: '12th of 28', remark: 'Need practice in matrix determinants' },
      { id: 6, testName: 'Chapter Test 3', date: '02 Sep', score: 78, subject: 'Chemistry', rank: '7th of 28', remark: 'Good grasp of organic nomenclature' },
      { id: 7, testName: 'Unit Test 1', date: '08 Sep', score: 84, subject: 'Physics', rank: '6th of 28', remark: 'Strong Coulomb’s Law derivation' },
      { id: 8, testName: 'Unit Test 2', date: '25 Sep', score: 92, subject: 'Biology', rank: '3rd of 28', remark: 'Top tier plant physiology score' }
    ]
  },
  'Physics': {
    subject: 'Physics',
    color: '#10b981',
    avgScore: '81%',
    grade: 'Grade A',
    growth: '+16% Since July',
    tests: [
      { id: 1, testName: 'Diagnostic Test', date: '15 Jul', score: 68, subject: 'Physics', rank: '12th of 28', remark: 'Baseline testing' },
      { id: 2, testName: 'Chapter Test 1', date: '28 Jul', score: 72, subject: 'Physics', rank: '9th of 28', remark: 'Coulomb’s Law & Fields' },
      { id: 3, testName: 'Chapter Test 2', date: '10 Aug', score: 76, subject: 'Physics', rank: '8th of 28', remark: 'Gauss Law & Flux' },
      { id: 4, testName: 'Part Test 1', date: '25 Aug', score: 80, subject: 'Physics', rank: '7th of 28', remark: 'Capacitance & Dielectrics' },
      { id: 5, testName: 'Unit Test 1', date: '08 Sep', score: 84, subject: 'Physics', rank: '6th of 28', remark: 'Current Electricity' },
      { id: 6, testName: 'Chapter Test 3', date: '28 Sep', score: 88, subject: 'Physics', rank: '4th of 28', remark: 'Kirchhoff’s Laws & Bridges' }
    ]
  },
  'Chemistry': {
    subject: 'Chemistry',
    color: '#9333ea',
    avgScore: '76%',
    grade: 'Grade A',
    growth: '+12% Since July',
    tests: [
      { id: 1, testName: 'Diagnostic Test', date: '18 Jul', score: 66, subject: 'Chemistry', rank: '14th of 28', remark: 'Basic principles evaluation' },
      { id: 2, testName: 'Chapter Test 1', date: '02 Aug', score: 70, subject: 'Chemistry', rank: '11th of 28', remark: 'Solutions & Raoult’s Law' },
      { id: 3, testName: 'Unit Test 1', date: '18 Aug', score: 74, subject: 'Chemistry', rank: '9th of 28', remark: 'Electrochemistry Galvanic Cells' },
      { id: 4, testName: 'Chapter Test 3', date: '02 Sep', score: 78, subject: 'Chemistry', rank: '7th of 28', remark: 'Chemical Kinetics & Rate Law' },
      { id: 5, testName: 'Part Test 2', date: '20 Sep', score: 82, subject: 'Chemistry', rank: '5th of 28', remark: 'Surface Chemistry & Colloids' },
      { id: 6, testName: 'Unit Test 2', date: '05 Oct', score: 85, subject: 'Chemistry', rank: '4th of 28', remark: 'Organic Mechanisms Part 1' }
    ]
  },
  'Mathematics': {
    subject: 'Mathematics',
    color: '#2563eb',
    avgScore: '72%',
    grade: 'Grade B+',
    growth: '+20% Since July',
    tests: [
      { id: 1, testName: 'Chapter Test 1', date: '20 Jul', score: 60, subject: 'Mathematics', rank: '16th of 28', remark: 'Relations & Functions' },
      { id: 2, testName: 'Unit Test 1', date: '05 Aug', score: 62, subject: 'Mathematics', rank: '15th of 28', remark: 'Inverse Trig Functions' },
      { id: 3, testName: 'Part Test 2', date: '28 Aug', score: 65, subject: 'Mathematics', rank: '12th of 28', remark: 'Matrix Determinants calculation' },
      { id: 4, testName: 'Chapter Test 2', date: '12 Sep', score: 70, subject: 'Mathematics', rank: '9th of 28', remark: 'Cramer’s Rule & Adjoints' },
      { id: 5, testName: 'Part Test 3', date: '24 Sep', score: 75, subject: 'Mathematics', rank: '7th of 28', remark: 'Linear Equations Solvers' },
      { id: 6, testName: 'Revision Test', date: '06 Oct', score: 80, subject: 'Mathematics', rank: '5th of 28', remark: 'Limits & Continuity Basics' }
    ]
  },
  'Biology': {
    subject: 'Biology',
    color: '#ea580c',
    avgScore: '89%',
    grade: 'Grade A+',
    growth: '+15% Since July',
    tests: [
      { id: 1, testName: 'Diagnostic Test', date: '22 Jul', score: 80, subject: 'Biology', rank: '8th of 28', remark: 'Cell Theory & Organelles' },
      { id: 2, testName: 'Chapter Test 1', date: '08 Aug', score: 84, subject: 'Biology', rank: '6th of 28', remark: 'Cell Membrane & Fluid Mosaic' },
      { id: 3, testName: 'Unit Test 1', date: '20 Aug', score: 88, subject: 'Biology', rank: '4th of 28', remark: 'DNA Replication & Mitosis' },
      { id: 4, testName: 'Part Test 1', date: '10 Sep', score: 90, subject: 'Biology', rank: '3rd of 28', remark: 'Biomolecules & Enzymes' },
      { id: 5, testName: 'Unit Test 2', date: '26 Sep', score: 92, subject: 'Biology', rank: '3rd of 28', remark: 'Plant Physiology Pathways' },
      { id: 6, testName: 'Pre-Board Mock 1', date: '08 Oct', score: 95, subject: 'Biology', rank: '2nd of 28', remark: 'Genetics & Evolution Mastery' }
    ]
  }
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

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
          {/* 4 Metric Cards */}
          <div className="sp-metrics-grid-4">
            <div className="sp-metric-card">
              <div className="sp-metric-circle-icon sp-circle-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <polyline points="9 13 11 15 15 11"/>
                </svg>
              </div>
              <div className="sp-metric-info">
                <span className="sp-metric-label">Scheduled Tests</span>
                <strong className="sp-metric-value">3 Upcoming</strong>
                <span className="sp-metric-sub">Next: 12 Oct 2026</span>
              </div>
            </div>

            <div className="sp-metric-card">
              <div className="sp-metric-circle-icon sp-circle-gold">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
              </div>
              <div className="sp-metric-info">
                <span className="sp-metric-label">Average Score</span>
                <strong className="sp-metric-value">78%</strong>
                <span className="sp-metric-sub sp-text-green">↑ +12% from last month</span>
              </div>
            </div>

            <div className="sp-metric-card">
              <div className="sp-metric-circle-icon sp-circle-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="sp-metric-info">
                <span className="sp-metric-label">Exam Readiness</span>
                <strong className="sp-metric-value">86%</strong>
                <span className="sp-metric-sub sp-text-green">High Accuracy Rate</span>
              </div>
            </div>

            <div className="sp-metric-card">
              <div className="sp-metric-circle-icon sp-circle-cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="sp-metric-info">
                <span className="sp-metric-label">Enrolled Subjects</span>
                <strong className="sp-metric-value">4</strong>
                <span className="sp-metric-sub">Physics, Chemistry, Maths, Bio</span>
              </div>
            </div>
          </div>

          {/* Vertical Layout: Upcoming Tests on top, Subject Performance Trend below */}
          <div className="sp-tests-vertical-layout">
            {/* 1. Upcoming Tests Schedule */}
            <div className="sp-card sp-upcoming-tests-card">
              <div className="sp-card-title-row">
                <div>
                  <h4>Upcoming Tests Schedule</h4>
                  <p className="sp-sub-card-text">Click on any test to inspect the syllabus.</p>
                </div>
                <span className="sp-classes-count-pill">3 Upcoming</span>
              </div>

              <div className="sp-upcoming-tests-list">
                <div className="sp-upcoming-test-row" onClick={() => showToast('Physics Syllabus: Electrostatics, Gauss Law & Capacitance')}>
                  <div className="sp-test-date-badge date-blue">
                    <strong>12</strong>
                    <span>Oct</span>
                  </div>
                  <div className="sp-test-info-block">
                    <h5>Physics - Chapter Test</h5>
                    <span className="sp-test-batch-label">Class XII - Science</span>
                    <div className="sp-test-submeta">
                      <span>📄 100 Marks</span>
                      <span>·</span>
                      <span>⏱ 2 Hours</span>
                      <span>·</span>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>Syllabus: Electrostatics</span>
                    </div>
                  </div>
                  <span className="sp-chevron-right">›</span>
                </div>

                <div className="sp-upcoming-test-row" onClick={() => showToast('Chemistry Syllabus: Aldehydes, Ketones & Carboxylic Acids')}>
                  <div className="sp-test-date-badge date-pink">
                    <strong>18</strong>
                    <span>Oct</span>
                  </div>
                  <div className="sp-test-info-block">
                    <h5>Chemistry - Unit Test 2</h5>
                    <span className="sp-test-batch-label">Class XII - Science</span>
                    <div className="sp-test-submeta">
                      <span>📄 100 Marks</span>
                      <span>·</span>
                      <span>⏱ 2 Hours</span>
                      <span>·</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Syllabus: Organic Part 2</span>
                    </div>
                  </div>
                  <span className="sp-chevron-right">›</span>
                </div>

                <div className="sp-upcoming-test-row" onClick={() => showToast('Mathematics Syllabus: Matrices, Determinants & System of Linear Equations')}>
                  <div className="sp-test-date-badge date-green">
                    <strong>25</strong>
                    <span>Oct</span>
                  </div>
                  <div className="sp-test-info-block">
                    <h5>Mathematics - Part Test</h5>
                    <span className="sp-test-batch-label">Class XII - Science</span>
                    <div className="sp-test-submeta">
                      <span>📄 100 Marks</span>
                      <span>·</span>
                      <span>⏱ 2.5 Hours</span>
                      <span>·</span>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Syllabus: Matrices & Determinants</span>
                    </div>
                  </div>
                  <span className="sp-chevron-right">›</span>
                </div>
              </div>
            </div>

            {/* 2. Subject-wise Performance Analysis Line Graph (Below Upcoming Tests) */}
            {(() => {
              const currentPerfData = performanceProgressionData[perfChartSubject] || performanceProgressionData['All Subjects'];
              const perfTests = currentPerfData.tests;
              const activePerfColor = currentPerfData.color;

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

              const perfPoints = perfTests.map((t, idx) => ({
                x: getPtX(idx, perfTests.length),
                y: getPtY(t.score),
                ...t
              }));

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
                        Performance progression across center tests over time
                      </p>
                    </div>
                    <span className="sp-grade-badge sp-grade-green">{currentPerfData.grade}</span>
                  </div>

                  {/* Subject Selector Filter Bar with Overall */}
                  <div className="sp-perf-filter-bar">
                    {['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subj) => {
                      const isSelected = perfChartSubject === subj;
                      return (
                        <button
                          key={subj}
                          className={`sp-perf-filter-pill ${isSelected ? 'active' : ''}`}
                          style={isSelected && subj !== 'All Subjects' ? { background: performanceProgressionData[subj]?.color, borderColor: performanceProgressionData[subj]?.color, color: '#fff' } : {}}
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
                      <span>Center Tests</span>
                      <strong>{perfTests.length} Tests</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Avg Score</span>
                      <strong style={{ color: activePerfColor }}>{currentPerfData.avgScore}</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Highest</span>
                      <strong style={{ color: '#16a34a' }}>{Math.max(...perfTests.map(t => t.score))}%</strong>
                    </div>
                    <div className="sp-pms-item">
                      <span>Trend</span>
                      <strong style={{ color: '#10b981' }}>{currentPerfData.growth}</strong>
                    </div>
                  </div>

                  {/* SVG Line Graph */}
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
                            {/* Transparent large touch hit target */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isMobile ? 18 : 12}
                              fill="transparent"
                            />
                            {/* Outer hover/tap halo */}
                            {isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isMobile ? 9 : 10}
                                fill={activePerfColor}
                                opacity="0.25"
                              />
                            )}
                            {/* White-filled point */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? (isMobile ? 5.5 : 6) : (isMobile ? 4 : 4.5)}
                              fill="#ffffff"
                              stroke={activePerfColor}
                              strokeWidth={isMobile ? "2.2" : "2.5"}
                              style={{ transition: 'all 0.15s ease' }}
                            />
                            {/* Score label above point */}
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
                            {/* X-axis date label below */}
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
                          <span>Rank: {hoveredPerfPoint.rank}</span>
                          <span style={{ color: '#cbd5e1' }}>·</span>
                          <span>{hoveredPerfPoint.remark}</span>
                        </div>
                      </div>
                    )}
                  </div>

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
                          <strong className="sp-ppdc-stat-val">{hoveredPerfPoint.rank}</strong>
                        </div>
                      </div>
                      {hoveredPerfPoint.remark && (
                        <div className="sp-ppdc-remark">
                          <span className="sp-ppdc-remark-icon">💡</span>
                          <span><strong>Teacher Feedback:</strong> {hoveredPerfPoint.remark}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tap Hint for Mobile when no point selected */}
                  {isMobile && !hoveredPerfPoint && (
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
          <div className="sp-card sp-leaderboard-hero-card" id="sp-topper-board">
            {/* Header Strip */}
            <div className="sp-lb-header-row">
              <div className="sp-lb-title-group">
                <div className="sp-lb-trophy-icon">🏆</div>
                <div>
                  <div className="sp-lb-badge-title-wrap">
                    <h3 className="sp-lb-main-title">Recent Exam Leaderboard</h3>
                    <span className="sp-lb-recent-pill">🔥 Unit Test 1 - Physics (Latest Exam)</span>
                  </div>
                  <p className="sp-lb-subtitle">
                    Top rankers and performance standings for the most recent exam.
                  </p>
                </div>
              </div>
            </div>

            {/* TOP 3 CIRCULAR PODIUM ROW */}
            <div className="sp-podium-circles-row">
              {(() => {
                const examData = toppersData['Unit Test 1 - Physics'] || [];
                const rank1 = examData.find(x => x.rank === 1);
                const rank2 = examData.find(x => x.rank === 2);
                const rank3 = examData.find(x => x.rank === 3);

                return (
                  <>
                    {/* RANK 2 */}
                    {rank2 && (
                      <div className="sp-podium-circle-col rank-2-col">
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
                      </div>
                    )}

                    {/* RANK 1 */}
                    {rank1 && (
                      <div className="sp-podium-circle-col is-rank-1">
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
                      </div>
                    )}

                    {/* RANK 3 */}
                    {rank3 && (
                      <div className="sp-podium-circle-col rank-3-col">
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
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* WHITE CARD ROWS FOR RANKS #4, #5, #6+ */}
            <div className="sp-rank-rows-stack">
              {(() => {
                const examData = toppersData['Unit Test 1 - Physics'] || [];
                const subsequentRanks = examData.filter(x => x.rank >= 4);
                const displayedRanks = showAllRecentRanks ? subsequentRanks : subsequentRanks.slice(0, 3);

                return displayedRanks.map((item) => (
                  <div 
                    key={item.rank} 
                    className={`sp-rank-row-card ${item.isMe ? 'is-me-row' : ''}`}
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
                    </div>
                  </div>
                ));
              })()}

              {/* View All / Toggle Button */}
              {(toppersData['Unit Test 1 - Physics'] || []).length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button 
                    className="sp-rrc-view-all-btn"
                    onClick={() => setShowAllRecentRanks(!showAllRecentRanks)}
                  >
                    {showAllRecentRanks 
                      ? '▲ Show Top 5 Only' 
                      : `▼ View Full Merit List (${(toppersData['Unit Test 1 - Physics'] || []).length} Students)`
                    }
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. BELOW: PAST TEST RESULTS TABLE */}
          <div className="sp-card sp-past-results-card" style={{ marginTop: '26px' }}>
            <div className="sp-results-table-head-row">
              <div>
                <h3 className="sp-results-card-title">Past Test Results</h3>
                <p className="sp-results-card-subtitle">Check your previous test scores and performance.</p>
              </div>
              <div className="sp-results-dropdowns">
                <select
                  className="sp-select-pill"
                  value={testFilterSubject}
                  onChange={(e) => setTestFilterSubject(e.target.value)}
                >
                  <option>All Subjects</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Mathematics</option>
                  <option>Biology</option>
                </select>
                <select 
                  className="sp-select-pill"
                  value={testFilterType}
                  onChange={(e) => setTestFilterType(e.target.value)}
                >
                  <option>All Tests</option>
                  <option>Unit Tests</option>
                  <option>Chapter Tests</option>
                  <option>Part Tests</option>
                </select>
              </div>
            </div>

            <div className="sp-table-scroll-wrap">
              <table className="sp-results-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Test Name</th>
                    <th>Subject</th>
                    <th>Total Marks</th>
                    <th>Obtained Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pastTestResults
                    .filter((t) => testFilterSubject === 'All Subjects' || t.subject === testFilterSubject)
                    .filter((t) => {
                      if (testFilterType === 'All Tests') return true;
                      if (testFilterType === 'Unit Tests') return t.name.includes('Unit');
                      if (testFilterType === 'Chapter Tests') return t.name.includes('Chapter');
                      if (testFilterType === 'Part Tests') return t.name.includes('Part');
                      return true;
                    })
                    .map((row, idx) => {
                      return (
                        <tr key={idx}>
                          <td className="sp-table-date-cell">{row.date}</td>
                          <td className="sp-table-name-cell">
                            <strong 
                              className="sp-test-title-link"
                              title="Click to view full exam merit list page"
                              onClick={() => setViewingMeritTest(row)}
                            >
                              {row.name}
                            </strong>
                          </td>
                          <td className="sp-table-subj-cell">{row.subject}</td>
                          <td className="sp-table-marks-cell">{row.total}</td>
                          <td className="sp-table-obt-cell">
                            <strong>{row.obtained}</strong>
                          </td>
                          <td className="sp-table-pct-cell">
                            <strong>{row.percentage}</strong>
                          </td>
                          <td className="sp-table-grade-cell">
                            <span className={`sp-grade-badge ${row.gradeClass}`}>
                              {row.grade}
                            </span>
                          </td>
                          <td className="sp-table-action-cell">
                            <button
                              className="sp-view-test-btn"
                              title="Open full merit list page"
                              onClick={() => setViewingMeritTest(row)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" x2="8" y1="13" y2="13"/>
                                <line x1="16" x2="8" y1="17" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                              </svg>
                              <span>View Merit List</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
