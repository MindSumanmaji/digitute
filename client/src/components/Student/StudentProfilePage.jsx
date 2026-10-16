import React, { useState } from 'react';
import StudentProfileCardModal from './StudentProfileCardModal';

export default function StudentProfilePage({ 
  studentProfile, 
  onBack, 
  onOpenSettings, 
  onLogout 
}) {
  const [activeModal, setActiveModal] = useState(null); // 'support' | 'about'
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  const student = studentProfile || {
    name: 'Suman Maji',
    batch: 'Class XII - Science (Batch A)',
    session: '2026 (July - Dec)',
    phone: '+91 98301 11222',
    email: 'suman.maji@digitute.app',
    photo: '/student-avatar.jpg'
  };

  return (
    <div className="sp-student-full-profile-page">
      {/* Top Banner with refined gradient aesthetic & soft pattern */}
      <div className="sp-sfp-banner">
        <div className="sp-sfp-banner-mesh" />
        {onBack && (
          <button 
            type="button"
            className="sp-sfp-back-btn"
            onClick={onBack}
            aria-label="Back to Dashboard"
            title="Back to Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
      </div>

      <div className="sp-sfp-body-container">
        {/* Centered Avatar with refined border and glow */}
        <div className="sp-sfp-avatar-wrap">
          <div className="sp-sfp-avatar-bg-glow" />
          <img 
            src={student.photo || '/student-avatar.jpg'} 
            alt={student.name}
            className="sp-sfp-avatar-img"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
            }}
          />
        </div>

        {/* Student Name */}
        <div className="sp-sfp-info-header">
          <h2 className="sp-sfp-name">{student.name}</h2>
          
          {/* Metadata list: Batch Name, Academic Session, Mobile No, Email */}
          <div className="sp-sfp-meta-list">
            <div className="sp-sfp-meta-row">
              <span className="sp-sfp-meta-label">Batch</span>
              <span className="sp-sfp-meta-val">{student.batch || 'Class XII - Science (Batch A)'}</span>
            </div>
            <div className="sp-sfp-meta-row">
              <span className="sp-sfp-meta-label">Session</span>
              <span className="sp-sfp-meta-val">{student.session || '2026 (July - Dec)'}</span>
            </div>
            <div className="sp-sfp-meta-row">
              <span className="sp-sfp-meta-label">Phone</span>
              <span className="sp-sfp-meta-val">{student.phone}</span>
            </div>
            <div className="sp-sfp-meta-row">
              <span className="sp-sfp-meta-label">Mail</span>
              <span className="sp-sfp-meta-val">{student.email}</span>
            </div>
          </div>

          {/* View Profile Card Action Button */}
          <div className="sp-sfp-card-btn-wrap">
            <button 
              type="button"
              className="sp-sfp-view-card-btn"
              onClick={() => setProfileCardOpen(true)}
              id="sp-sfp-btn-view-card"
            >
              <span className="sp-sfp-vc-icon">🪪</span>
              <span className="sp-sfp-vc-text">View Profile Card</span>
              <span className="sp-sfp-vc-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Full width divider line */}
        <div className="sp-sfp-divider" />

        {/* Action Menu List in exact sequence: Settings -> Help & Support -> About DigiTute -> Logout */}
        <div className="sp-sfp-menu-list">
          {/* 1. Settings */}
          <div 
            className="sp-sfp-menu-row clickable"
            onClick={() => onOpenSettings && onOpenSettings()}
            role="button"
            tabIndex={0}
          >
            <div className="sp-sfp-row-left">
              <span className="sp-sfp-row-icon purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"/>
                  <line x1="4" y1="10" x2="4" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="3"/>
                  <line x1="20" y1="21" x2="20" y2="16"/>
                  <line x1="20" y1="12" x2="20" y2="3"/>
                  <line x1="1" y1="14" x2="7" y2="14"/>
                  <line x1="9" y1="8" x2="15" y2="8"/>
                  <line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
              </span>
              <span className="sp-sfp-row-label">Settings</span>
            </div>
            <span className="sp-sfp-row-arrow">›</span>
          </div>

          {/* 2. Help & Support */}
          <div 
            className="sp-sfp-menu-row clickable"
            onClick={() => setActiveModal('support')}
            role="button"
            tabIndex={0}
          >
            <div className="sp-sfp-row-left">
              <span className="sp-sfp-row-icon cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                </svg>
              </span>
              <span className="sp-sfp-row-label">Help & Support</span>
            </div>
            <span className="sp-sfp-row-arrow">›</span>
          </div>

          {/* 3. About DigiTute */}
          <div 
            className="sp-sfp-menu-row clickable"
            onClick={() => setActiveModal('about')}
            role="button"
            tabIndex={0}
          >
            <div className="sp-sfp-row-left">
              <span className="sp-sfp-row-icon blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </span>
              <span className="sp-sfp-row-label">About DigiTute</span>
            </div>
            <span className="sp-sfp-row-arrow">›</span>
          </div>

          {/* 4. Log out */}
          <div 
            className="sp-sfp-menu-row clickable logout"
            onClick={() => onLogout && onLogout()}
            role="button"
            tabIndex={0}
          >
            <div className="sp-sfp-row-left">
              <span className="sp-sfp-row-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
              <span className="sp-sfp-row-label">Log out</span>
            </div>
            <span className="sp-sfp-row-arrow">›</span>
          </div>
        </div>
      </div>

      {/* Sub Modals for Help & Support and About DigiTute */}
      {activeModal && (
        <div className="sp-dialog-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-dialog-box" onClick={(e) => e.stopPropagation()}>
            {activeModal === 'support' && (
              <>
                <h4 className="sp-dialog-title">Help & Support</h4>
                <div className="sp-dialog-info-content">
                  <p><strong>Campus Helpline:</strong> +91 98301 00000</p>
                  <p><strong>Student Support Email:</strong> support@digitute.app</p>
                  <p><strong>Academic Office Hours:</strong> Mon - Sat (9:00 AM - 7:00 PM)</p>
                  <p>For urgent doubt clarifications, class schedules or fee ledger discrepancies, please contact your batch coordinator.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Got It</button>
                </div>
              </>
            )}

            {activeModal === 'about' && (
              <>
                <h4 className="sp-dialog-title">About DigiTute</h4>
                <div className="sp-dialog-info-content">
                  <p><strong>DigiTute Learning Platform</strong></p>
                  <p>Version: 2.4.0 (2026 Edition)</p>
                  <p>Comprehensive Hybrid Classroom & Coaching Management Suite designed for excellence in secondary and competitive exam preparation.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile Card Modal when clicking View Profile Card */}
      <StudentProfileCardModal 
        isOpen={profileCardOpen} 
        onClose={() => setProfileCardOpen(false)}
        studentData={student}
      />
    </div>
  );
}
