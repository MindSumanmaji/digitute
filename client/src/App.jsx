import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import StudentPanel from './StudentPanel';
import TeacherPanel from './TeacherPanel';
import AdminPanel from './AdminPanel';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#landing') return 'landing';
      if (hash === '#student') return 'student';
      if (hash === '#teacher') return 'teacher';
      if (hash === '#admin') return 'admin';
      const saved = localStorage.getItem('digitute_active_view');
      if (saved) return saved;
    }
    return 'landing'; // Default to landing page
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [roleNotice, setRoleNotice] = useState(null);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    setEnquirySubmitted(true);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEnquiryModalOpen(false);
        setLoginModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If in student panel mode, render the StudentPanel directly
  if (currentView === 'student') {
    return (
      <StudentPanel 
        onBackToLanding={() => {
          setCurrentView('landing');
          localStorage.setItem('digitute_active_view', 'landing');
        }} 
      />
    );
  }

  // If in teacher panel mode, render the TeacherPanel directly wrapped in Router
  if (currentView === 'teacher') {
    return (
      <Router>
        <TeacherPanel 
          onBackToLanding={() => {
            setCurrentView('landing');
            localStorage.setItem('digitute_active_view', 'landing');
          }} 
        />
      </Router>
    );
  }

  // If in admin panel mode, render the AdminPanel directly
  if (currentView === 'admin') {
    return (
      <AdminPanel 
        onBackToLanding={() => {
          setCurrentView('landing');
          localStorage.setItem('digitute_active_view', 'landing');
        }} 
      />
    );
  }

  return (
    <div className="digitute-landing-page">
      {/* Header */}
      <header className="landing-header">
        <nav className="wrap" aria-label="Main navigation">
          <a className="brand" href="#home" aria-label="DigiTute home">
            <span className="brand-mark">D</span>
            <span>
              DigiTute<small>OFFLINE. CONNECTED.</small>
            </span>
          </a>

          <div className="navlinks">
            <a href="#support">What we offer</a>
            <a href="#team">Our teachers</a>
            <a href="#approach">Why DigiTute</a>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="home">
        {/* Hero Section */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy-block">
              <span className="eyebrow">Face-to-face coaching · Made more transparent</span>
              <h1>Real teachers.<br /><em>Real progress.</em></h1>
              <p className="hero-copy">
                Strong learning starts in the classroom: with a teacher at the board, questions welcomed, and every student known by name. DigiTute brings families clear updates on the work happening there.
              </p>
              <div className="hero-actions">
                <button 
                  type="button"
                  className="button button-primary" 
                  onClick={() => {
                    setRoleNotice(null);
                    setLoginModalOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Enter into the class <span>→</span>
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <img 
                className="hero-photo" 
                src="/hero-classroom.png" 
                alt="A teacher explains a physics problem on the chalkboard as students work at classroom desks" 
              />
              <div className="hero-photo-shade"></div>
              <div className="visual-tag">
                <span className="tag-icon">⌂</span>
                <span>
                  <b>Small, focused batches</b>
                  <small>Room for questions and attention</small>
                </span>
              </div>
              <div className="photo-caption">
                <span>Learning happens here</span>
                <strong>One board. Many questions.<br />A teacher who knows you.</strong>
                <small>In-person classes supported by DigiTute</small>
              </div>
            </div>
          </div>
        </section>

        {/* Proof Strip */}
        <div className="proof-strip">
          <div className="wrap proof-grid">
            <div className="proof-item">
              <span className="proof-num">01</span>
              <span>
                <b>Face-to-face lessons</b>
                <small>Board work and live discussion</small>
              </span>
            </div>
            <div className="proof-item">
              <span className="proof-num">24–28</span>
              <span>
                <b>Capped classroom capacity</b>
                <small>Small groups, personal attention</small>
              </span>
            </div>
            <div className="proof-item">
              <span className="proof-num">↗</span>
              <span>
                <b>Families kept informed</b>
                <small>Clear records beyond the classroom</small>
              </span>
            </div>
          </div>
        </div>

        {/* Learning Experience Section (Enhanced UI) */}
        <section className="learning-experience-section" id="support">
          <div className="wrap">
            {/* Top Split: Left Content, Right Visual */}
            <div className="learning-top-grid">
              <div className="learning-copy-col">
                <div className="learning-pill-badge">
                  <svg className="badge-cap-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                  </svg>
                  <span>LEARNING AT DIGITUTE</span>
                </div>

                <h2 className="learning-main-heading">
                  A stronger learning<br />
                  experience,<br />
                  <span className="learning-highlight-text">in and beyond class</span>
                </h2>
              </div>

              <div className="learning-visual-col">
                {/* Organic wavy/soft backdrop */}
                <div className="learning-visual-backdrop"></div>

                {/* Student Image */}
                <div className="learning-photo-wrap">
                  <img 
                    src="/learning-student.jpg" 
                    alt="Student studying with notebook and laptop" 
                    className="learning-student-img" 
                  />
                </div>

                {/* Floating Card 1: Learn */}
                <div className="learning-float-badge badge-learn">
                  <div className="float-icon-box icon-learn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <div className="float-text">
                    <strong>Learn</strong>
                    <small>With expert teachers</small>
                  </div>
                </div>

                {/* Floating Card 2: Practice */}
                <div className="learning-float-badge badge-practice">
                  <div className="float-icon-box icon-practice">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                  </div>
                  <div className="float-text">
                    <strong>Practice</strong>
                    <small>Build confidence every day</small>
                  </div>
                  <span className="sparkle-accent">✦</span>
                </div>

                {/* Floating Card 3: Grow */}
                <div className="learning-float-badge badge-grow">
                  <div className="float-icon-box icon-grow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="float-text">
                    <strong>Grow</strong>
                    <small>In and beyond class</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 6 Pastel Feature Cards */}
            <div className="learning-cards-grid">
              {/* Card 01 - Blue */}
              <article className="learning-card card-theme-blue">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">01</span>
                    <h3 className="card-title">Face-to-face subject teaching</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Learn directly with teachers at the board, with room for live questions and discussion.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>

              {/* Card 02 - Amber */}
              <article className="learning-card card-theme-amber">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">02</span>
                    <h3 className="card-title">Focused batch learning</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Smaller learning groups help teachers give students more attention and guidance.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>

              {/* Card 03 - Green */}
              <article className="learning-card card-theme-green">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">03</span>
                    <h3 className="card-title">Regular written tests</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Paper-and-pen practice helps students build confidence for school and board exams.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>

              {/* Card 04 - Rose */}
              <article className="learning-card card-theme-rose">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">04</span>
                    <h3 className="card-title">Doubt solving with teachers</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Ask questions during class and follow up when a topic needs another explanation.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>

              {/* Card 05 - Purple */}
              <article className="learning-card card-theme-purple">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">05</span>
                    <h3 className="card-title">Notes & practice sheets</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Revise with classroom notes, formula sheets, and daily practice problems.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>

              {/* Card 06 - Sky */}
              <article className="learning-card card-theme-sky">
                <div className="card-header-group">
                  <div className="card-icon-squircle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <div className="card-header-meta">
                    <span className="card-step-num">06</span>
                    <h3 className="card-title">Clear progress for families</h3>
                  </div>
                </div>
                <div className="card-footer-group">
                  <p className="card-desc">
                    Attendance, fee records, test results, and chapter progress are easier to follow.
                  </p>
                  <div className="card-arrow-circle">→</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section" id="team">
          <div className="wrap">
            <div className="team-heading">
              <div>
                <span className="eyebrow">Meet the people at DigiTute</span>
                <h2>Good teaching starts with the right guidance.</h2>
                <p>Our teachers lead every lesson in person and help students build understanding one topic at a time.</p>
              </div>
              <div className="team-stamp">
                TEACHER-LED<br />IN-PERSON
              </div>
            </div>

            <div className="team-layout">
              <figure className="center-photo">
                <img src="/hero-classroom.png" alt="Sample classroom scene showing face-to-face teaching" />
                <figcaption>
                  <span>The DigiTute classroom</span>
                  Learning happens together, face to face.
                </figcaption>
              </figure>

              <div className="faculty-grid">
                <article className="faculty-card">
                  <img src="/sample-physics-teacher.png" alt="Portrait of Physics teacher Arindam Sen" />
                  <span className="sample-label">Sample profile</span>
                  <div className="faculty-details">
                    <span className="faculty-subject">Physics · Sample</span>
                    <h3>Arindam Sen</h3>
                    <p>M.Sc. Physics · B.Ed.</p>
                  </div>
                </article>

                <article className="faculty-card">
                  <img src="/sample-chemistry-teacher.png" alt="Portrait of Chemistry teacher Madhumita Das" />
                  <span className="sample-label">Sample profile</span>
                  <div className="faculty-details">
                    <span className="faculty-subject">Chemistry · Sample</span>
                    <h3>Madhumita Das</h3>
                    <p>M.Sc. Chemistry · B.Ed.</p>
                  </div>
                </article>

                <article className="faculty-card">
                  <img src="/sample-mathematics-teacher.png" alt="Portrait of Mathematics teacher Sourav Banerjee" />
                  <span className="sample-label">Sample profile</span>
                  <div className="faculty-details">
                    <span className="faculty-subject">Mathematics · Sample</span>
                    <h3>Sourav Banerjee</h3>
                    <p>M.Sc. Mathematics · B.Ed.</p>
                  </div>
                </article>
              </div>
            </div>

            <p className="sample-note">
              Teacher names, qualifications, and portraits shown here are sample placeholders. Replace them with the center's verified faculty details.
            </p>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="comparison-section" id="approach">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">The DigiTute Edge · 1 Step Extra Facility</span>
              <h2>What changes when offline coaching goes <em>1 step further?</em></h2>
              <p>
                Teaching remains 100% face-to-face at the board. But through our dedicated digital campus platform, DigiTute provides powerful extra facilities and real-time clarity that traditional paper-based centers simply cannot offer.
              </p>
            </div>

            <div className="compare-preamble">
              <b>↗</b>
              <span><strong>In-person teaching + 1 step extra digital facility.</strong> See how DigiTute solves the everyday limitations of conventional offline coaching.</span>
            </div>

            <div className="compare-shell" role="table" aria-label="Comparison of standard offline coaching workflows with DigiTute extra facilities">
              <div className="compare-head" role="row">
                <div role="columnheader">Everyday Facility</div>
                <div role="columnheader">
                  <strong>Standard Offline Coaching</strong>
                  <small>Manual paper registers & delayed updates</small>
                </div>
                <div role="columnheader">
                  <strong>DigiTute-Powered Campus</strong>
                  <small>Face-to-face coaching + 1 step digital edge</small>
                </div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">Daily Attendance & Safety</div>
                <div role="cell"><span className="compare-mark">•</span>Paper roll calls waste 10–15 mins; parents uninformed if class is bunked</div>
                <div role="cell"><span className="compare-mark">✓</span>5-second 1-tap roll call + instant automated notification to parents</div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">After-Class Doubt Desk</div>
                <div role="cell"><span className="compare-mark">•</span>Doubt solving ends with the bell; shy students get stuck at home</div>
                <div role="cell"><span className="compare-mark">✓</span>24/7 Photo Doubt Desk: upload book questions from home for class resolution</div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">Syllabus Progress Tracker</div>
                <div role="cell"><span className="compare-mark">•</span>Zero syllabus visibility for families until sudden pre-exam panic</div>
                <div role="cell"><span className="compare-mark">✓</span>Live milestone tracker (⌛ In-Progress → ✓ Completed) accessible on phone</div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">Pen-Paper Tests & Analytics</div>
                <div role="cell"><span className="compare-mark">•</span>Marks on loose paper sheets; no performance streaks or progress trend</div>
                <div role="cell"><span className="compare-mark">✓</span>Physical written tests paired with digital scorecards & streak reports</div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">Fee Ledger & Receipts</div>
                <div role="cell"><span className="compare-mark">•</span>Lost paper receipts, manual due calculations, awkward follow-ups</div>
                <div role="cell"><span className="compare-mark">✓</span>1-click UPI payments, automated invoices & transparent mobile ledger</div>
              </div>

              <div className="compare-row" role="row">
                <div role="rowheader">Notes & Daily Practice (DPP)</div>
                <div role="cell"><span className="compare-mark">•</span>Photocopied sheets easily misplaced; absent students miss lessons</div>
                <div role="cell"><span className="compare-mark">✓</span>Organized digital archive of teacher notes, formula sheets & DPPs</div>
              </div>
            </div>

            <p className="compare-note">
              DigiTute is built specifically for offline coaching: keeping teaching personal and focused in small batches, while empowering students and parents with modern digital facilities.
            </p>
          </div>
        </section>

        {/* Center Details Section */}
        <section className="center-details" id="contact">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Visit & contact DigiTute</span>
              <h2>Center information</h2>
              <p>Planning a visit or looking for batch details? Find the center's contact information here, or send a question to the teaching team.</p>
            </div>

            <div className="center-details-grid">
              <div className="center-info-card">
                <div className="center-info-heading">
                  <h3>Center Information</h3>
                  <span className="center-status">Offline coaching center</span>
                </div>

                <div className="contact-list">
                  <div className="contact-item">
                    <span className="contact-icon" aria-hidden="true">⌖</span>
                    <div>
                      <b>Address</b>
                      <p>Block EP & GP, Sector V, Salt Lake City, Kolkata - 700091</p>
                      <small>Near College More, Beside Wipro Circle (Metro walkable)</small>
                    </div>
                  </div>

                  <div className="contact-item">
                    <span className="contact-icon" aria-hidden="true">⌕</span>
                    <div>
                      <b>Direct helpline</b>
                      <p>+91 98301 23456 / WhatsApp: +91 98301 23456</p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <span className="contact-icon" aria-hidden="true">✉</span>
                    <div>
                      <b>Official email</b>
                      <p>contact@digitute.app</p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <span className="contact-icon" aria-hidden="true">◷</span>
                    <div>
                      <b>Office visiting hours</b>
                      <p>Mon – Sat: 9:00 AM – 7:30 PM | Sun: 9:00 AM – 1:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="contact-aside">
                <span className="eyebrow">Admissions & guidance</span>
                <h3>Talk with the teaching team.</h3>
                <p>Ask about subjects, current batches, class routines, or fee details. Our team can help you find the right next step.</p>
                <button 
                  type="button" 
                  className="button" 
                  onClick={() => setEnquiryModalOpen(true)}
                >
                  Send an enquiry <span>→</span>
                </button>
                <div className="offline-note">
                  <span>✓</span> In-person learning at DigiTute
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap footer-row">
          <div className="footer-brand-col">
            <a className="brand" href="#home">
              <span className="brand-mark">D</span>
              <span>
                DigiTute<small>OFFLINE. CONNECTED.</small>
              </span>
            </a>
            <p className="footer-copy">© {new Date().getFullYear()} DigiTute · Digital support for in-person learning</p>
          </div>
          <div className="footer-links">
            <a href="#support">What we offer</a>
            <a href="#team">Our teachers</a>
            <a href="#approach">Why DigiTute</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>

      {/* Admission Enquiry Modal */}
      <div 
        className={`modal-backdrop ${enquiryModalOpen ? 'open' : ''}`} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        onClick={(e) => {
          if (e.target.classList.contains('modal-backdrop')) setEnquiryModalOpen(false);
        }}
      >
        <div className="modal">
          <div className="modal-top">
            <span className="eyebrow">Admission enquiry</span>
            <button className="close" aria-label="Close dialog" onClick={() => setEnquiryModalOpen(false)}>
              ×
            </button>
          </div>
          <h2 id="modal-title">Let's get in touch</h2>
          <p>Share your details and our teaching team can tell you about batches and available seats.</p>

          <form className="form-grid" onSubmit={handleEnquirySubmit}>
            <label>
              Student's name
              <input required name="name" placeholder="Your name" />
            </label>
            <label>
              Parent or guardian phone
              <input required name="phone" type="tel" inputmode="tel" placeholder="Number we can reach you on" />
            </label>
            <label>
              Class or subject
              <select name="interest" required>
                <option value="">Choose one</option>
                <option>Class 10 (Madhyamik & CBSE)</option>
                <option>Class 11 Science (Foundation)</option>
                <option>Class 12 Science (Board + NEET/JEE)</option>
                <option>Dropper / NEET Special</option>
              </select>
            </label>
            <button className="button button-primary" type="submit">
              {enquirySubmitted ? 'Ready to connect ✓' : 'Send enquiry →'}
            </button>
            {enquirySubmitted && (
              <div className="success" style={{ display: 'block' }} role="status">
                Enquiry received! Our academic coordinator will call or WhatsApp you shortly.
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Unified Portal Role Gateway Modal */}
      <div 
        className={`modal-backdrop ${loginModalOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => {
          if (e.target.classList.contains('modal-backdrop')) {
            setLoginModalOpen(false);
            setRoleNotice(null);
          }
        }}
      >
        <div className="modal portal-login-modal">
          <div className="modal-top">
            <span className="eyebrow">DIGITUTE CAMPUS GATEWAY</span>
            <button 
              className="close" 
              aria-label="Close dialog" 
              onClick={() => {
                setLoginModalOpen(false);
                setRoleNotice(null);
              }}
            >
              ×
            </button>
          </div>

          <h2 id="login-modal-title">Enter Classroom Workspace</h2>
          <p>Select your portal role to continue to the respective dashboard:</p>

          {/* 3 Default Role Buttons: Admin, Teacher, Student */}
          <div className="portal-role-list">
            {/* Student Role Button */}
            <button
              type="button"
              className="portal-role-card role-student"
              onClick={() => {
                setRoleNotice(null);
                setLoginModalOpen(false);
                setCurrentView('student');
                localStorage.setItem('digitute_active_view', 'student');
              }}
            >
              <div className="portal-role-icon-box icon-student">
                <span>🎓</span>
              </div>
              <div className="portal-role-info">
                <div className="portal-role-title-row">
                  <h4 className="portal-role-name">Student Portal</h4>
                  <span className="portal-role-status-badge badge-active">Active</span>
                </div>
                <p className="portal-role-desc">
                  Track attendance, syllabus, study materials, tests & pay fees
                </p>
              </div>
              <span className="portal-role-arrow">→</span>
            </button>

            {/* Teacher Role Button */}
            <button
              type="button"
              className="portal-role-card role-teacher"
              onClick={() => {
                setRoleNotice(null);
                setLoginModalOpen(false);
                setCurrentView('teacher');
                localStorage.setItem('digitute_active_view', 'teacher');
              }}
            >
              <div className="portal-role-icon-box icon-teacher">
                <span>👨‍🏫</span>
              </div>
              <div className="portal-role-info">
                <div className="portal-role-title-row">
                  <h4 className="portal-role-name">Teacher Portal</h4>
                  <span className="portal-role-status-badge badge-active">Active</span>
                </div>
                <p className="portal-role-desc">
                  Manage class batches, roll call, DPPs & answer student doubts
                </p>
              </div>
              <span className="portal-role-arrow">→</span>
            </button>

            {/* Admin Role Button */}
            <button
              type="button"
              className="portal-role-card role-admin"
              onClick={() => {
                setRoleNotice(null);
                setLoginModalOpen(false);
                setCurrentView('admin');
                localStorage.setItem('digitute_active_view', 'admin');
              }}
            >
              <div className="portal-role-icon-box icon-admin">
                <span>🛡️</span>
              </div>
              <div className="portal-role-info">
                <div className="portal-role-title-row">
                  <h4 className="portal-role-name">Admin Portal</h4>
                  <span className="portal-role-status-badge badge-active">Active</span>
                </div>
                <p className="portal-role-desc">
                  Institute-wide admissions, staff allocation & financial ledger
                </p>
              </div>
              <span className="portal-role-arrow">→</span>
            </button>
          </div>

          {/* Role Notice banner if Teacher or Admin is clicked */}
          {roleNotice && (
            <div className="portal-role-notice-banner">
              <span className="notice-icon">ℹ️</span>
              <div className="notice-text">
                <strong>{roleNotice.role} Portal:</strong> {roleNotice.message}
              </div>
              <button 
                type="button" 
                className="notice-dismiss-btn"
                onClick={() => setRoleNotice(null)}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <div className="portal-modal-footer">
            <span className="portal-security-badge">
              🔒 256-Bit SSL Encrypted Campus Gateway
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
