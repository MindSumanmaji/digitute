import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EducationIllustration from './EducationIllustration';
import StudentInfo from './StudentInfo';
import SyllabusSetup from './SyllabusSetup';
import Attendance from './Attendance';
import ExamEvaluation from './ExamEvaluation';
import DppManagement from './DppManagement';
import DoubtCorner from './DoubtCorner';
import ClassTestNotice from './ClassTestNotice';
/**
 * 6 Academics feature cards configuration matching the design mockup:
 * 1. Student Info - 👥 Purple circle (#7C3AED, bg #EDE9FE), Pink underline (#EC4899)
 * 2. Attendance - ✅ Pink circle (#EC4899, bg #FCE7F3), Pink underline (#EC4899)
 * 3. Syllabus Setup - 📖 Purple circle (#7C3AED, bg #EDE9FE), Purple underline (#7C3AED)
 * 4. Exam Evaluation - A+ Orange circle (#F59E0B, bg #FEF3C7), Orange underline (#F59E0B)
 * 5. Doubt Corner - ❓ Red circle (#EF4444, bg #FEE2E2), Red underline (#EF4444)
 * 6. DPP Management - 📋 Green circle (#10B981, bg #D1FAE5), Green underline (#10B981)
 */
const ACADEMICS_CARDS = [
  {
    id: 'student-info',
    title: 'Student Info',
    className: 'student-info',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    route: '/academics/students'
  },
  {
    id: 'attendance',
    title: 'Attendance',
    className: 'attendance',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" strokeWidth="2.5" />
      </svg>
    ),
    route: '/academics/attendance'
  },
  {
    id: 'syllabus-setup',
    title: 'Syllabus Setup',
    className: 'syllabus-setup',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    route: '/academics/syllabus'
  },
  {
    id: 'exam-evaluation',
    title: 'Exam Evaluation',
    className: 'exam-evaluation',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 17l2-5 2 5" strokeWidth="2" />
        <line x1="9" y1="15" x2="11" y2="15" strokeWidth="2" />
        <path d="M14 13h2" strokeWidth="2" />
        <line x1="15" y1="12" x2="15" y2="14" strokeWidth="2" />
      </svg>
    ),
    route: '/academics/exams'
  },
  {
    id: 'doubt-corner',
    title: 'Doubt Corner',
    className: 'doubt-corner',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="0.7" fill="currentColor" />
        <path d="M10.15 8.4a2 2 0 0 1 3.7 1c0 1.33-2 2-2 2" />
      </svg>
    ),
    route: '/academics/doubt-corner'
  },
  {
    id: 'dpp-management',
    title: 'DPP Management',
    className: 'dpp-management',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <polyline points="9 12 11 14 15 10" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
    route: '/academics/dpp-management'
  },
  {
    id: 'class-test-notice',
    title: 'Class Test Notice',
    className: 'class-test-notice',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" strokeWidth="3" />
        <path d="M12 14h.01" strokeWidth="3" />
        <path d="M16 14h.01" strokeWidth="3" />
      </svg>
    ),
    route: '/academics/class-test-notice'
  }
];


export function Academics({ onNavigate, onCardClick }) {
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState('');
  const [activeSection, setActiveSection] = useState(
    location.state?.section || null
  ); // null = grid, 'student-info' = StudentInfo, 'attendance' = Attendance, 'exam-evaluation' = ExamEvaluation
  const [navParams, setNavParams] = useState(location.state || null);

  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
      setNavParams(location.state);
    }
  }, [location.state]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCardPress = (card) => {
    if (card.id === 'student-info') {
      setActiveSection('student-info');
      return;
    }
    if (card.id === 'syllabus-setup') {
      setActiveSection('syllabus-setup');
      return;
    }
    if (card.id === 'attendance') {
      setActiveSection('attendance');
      return;
    }
    if (card.id === 'exam-evaluation') {
      setActiveSection('exam-evaluation');
      return;
    }
    if (card.id === 'dpp-management') {
      setActiveSection('dpp-management');
      return;
    }
    if (card.id === 'doubt-corner') {
      setActiveSection('doubt-corner');
      return;
    }
    if (card.id === 'class-test-notice') {
      setActiveSection('class-test-notice');
      return;
    }
    if (onCardClick) {
      onCardClick(card);
    } else {
      showToast(`Opening ${card.title}...`);
    }
  };

    /* ── Student Info Sub-Page ── */
  if (activeSection === 'student-info') {
    return (
      <div className="dt-academics-page dt-subpage">
        <StudentInfo onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  /* ── Syllabus Setup Sub-Page ── */
  if (activeSection === 'syllabus-setup') {
    return (
      <div className="dt-academics-page dt-subpage">
        <SyllabusSetup onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  /* ── Smart Attendance Sub-Page ── */
  if (activeSection === 'attendance') {
    return (
      <div className="dt-academics-page dt-subpage">
        <Attendance
          onBack={() => setActiveSection(null)}
          onNavigate={onNavigate}
          initialBatch={navParams?.batch}
          initialSubject={navParams?.subject}
        />
      </div>
    );
  }

  /* ── Exam Evaluation Sub-Page ── */
  if (activeSection === 'exam-evaluation') {
    return (
      <div className="dt-academics-page dt-subpage">
        <ExamEvaluation
          onBack={() => setActiveSection(null)}
          onNavigateToStudentInfo={() => setActiveSection('student-info')}
        />
      </div>
    );
  }

  /* ── DPP Management Sub-Page ── */
  if (activeSection === 'dpp-management') {
    return (
      <div className="dt-academics-page dt-subpage">
        <DppManagement
          onBack={() => setActiveSection(null)}
          initialBatch={navParams?.batch}
          initialSubject={navParams?.subject}
        />
      </div>
    );
  }

  /* ── Doubt Corner Sub-Page ── */
  if (activeSection === 'doubt-corner') {
    return (
      <div className="dt-academics-page dt-subpage">
        <DoubtCorner
          onBack={() => setActiveSection(null)}
          initialBatch={navParams?.batch}
          initialSubject={navParams?.subject}
        />
      </div>
    );
  }

  /* ── Class Test Notice Sub-Page ── */
  if (activeSection === 'class-test-notice') {
    return (
      <div className="dt-academics-page dt-subpage">
        <ClassTestNotice onBack={() => setActiveSection(null)} />
      </div>
    );
  }

/* ── Main Academics Grid ── */
  return (
    <div className="dt-academics-page">
      <div className="dt-academics-content">
        {/* Hero Section */}
        <section className="dt-academics-hero" aria-label="Academics overview">
          <div className="dt-academics-hero-left">
            <span className="dt-academics-hero-tag">ACADEMICS</span>
            <div className="dt-academics-hero-title-group">
              <h1 className="dt-academics-hero-title">Academics</h1>
              <div className="dt-academics-hero-underline" />
            </div>
            <p className="dt-academics-hero-subtitle">
              Manage your teaching journey
            </p>
          </div>

          {/* Realistic Educational Illustration */}
          <div className="dt-academics-hero-illustration" aria-hidden="true">
            <EducationIllustration />
          </div>
        </section>

        {/* 6 Feature Cards (2x3 Grid) */}
        <section className="dt-academics-grid" aria-label="Academic features">
          {ACADEMICS_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`dt-feature-card ${card.className}`}
              onClick={() => handleCardPress(card)}
              aria-label={`Open ${card.title}`}
            >
              {/* Card Top: Large icon in pastel colored circle */}
              <div className="dt-feature-card-top">
                <div className="dt-feature-icon-circle">
                  {card.icon}
                </div>
              </div>

              {/* Card Body: Feature title & colored underline bar */}
              <div className="dt-feature-card-body">
                <h2 className="dt-feature-title">{card.title}</h2>
                <div className="dt-feature-underline" />
              </div>

              {/* Card Bottom: Right Arrow → */}
              <div className="dt-feature-card-bottom">
                <div className="dt-feature-arrow" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-dark, #1E1E2D)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          role="status"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Academics;

