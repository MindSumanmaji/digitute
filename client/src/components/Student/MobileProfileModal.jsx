import React, { useState } from 'react';
import StudentProfileCardModal from './StudentProfileCardModal';

export default function MobileProfileModal({ 
  isOpen, 
  onClose, 
  studentProfile, 
  onOpenSettings, 
  onLogout 
}) {
  if (!isOpen) return null;

  const [darkMode, setDarkMode] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  const student = studentProfile || {
    name: 'Suman Maji',
    phone: '+91 98301 11222',
    email: 'suman.maji@digitute.app',
    photo: '/student-avatar.jpg'
  };

  return (
    <>
      <div className="sp-mobile-prof-backdrop" onClick={onClose}>
        <div 
          className="sp-mobile-prof-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Lilac/Lavender Banner */}
          <div className="sp-mp-banner">
            <button 
              className="sp-mp-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Centered Avatar positioned over the banner seam */}
          <div className="sp-mp-avatar-container">
            <img 
              src={student.photo || '/student-avatar.jpg'} 
              alt={student.name}
              className="sp-mp-avatar-img"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
              }}
            />
          </div>

          {/* Student Name */}
          <div className="sp-mp-info-head">
            <h3 className="sp-mp-name">{student.name}</h3>
            
            {/* Phone & Mail metadata rows */}
            <div className="sp-mp-meta-list">
              <div className="sp-mp-meta-row">
                <span className="sp-mp-meta-label">Phone</span>
                <span className="sp-mp-meta-val">{student.phone}</span>
              </div>
              <div className="sp-mp-meta-row">
                <span className="sp-mp-meta-label">Mail</span>
                <span className="sp-mp-meta-val">{student.email}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="sp-mp-divider" />

          {/* Menu Items matching reference image */}
          <div className="sp-mp-menu-list">
            {/* 1. Dark Mode toggle */}
            <div className="sp-mp-menu-row">
              <div className="sp-mp-row-left">
                <span className="sp-mp-row-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                  </svg>
                </span>
                <span className="sp-mp-row-label">Dark mode</span>
              </div>
              <label className="sp-ios-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={() => setDarkMode(!darkMode)}
                />
                <span className="sp-ios-slider" />
              </label>
            </div>

            {/* 2. Profile Details (Opens digital profile card modal) */}
            <div 
              className="sp-mp-menu-row clickable"
              onClick={() => {
                setProfileCardOpen(true);
              }}
            >
              <div className="sp-mp-row-left">
                <span className="sp-mp-row-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 0 0-16 0"/>
                  </svg>
                </span>
                <span className="sp-mp-row-label">Profile details</span>
              </div>
            </div>

            {/* 3. Settings (Navigates to Settings tab) */}
            <div 
              className="sp-mp-menu-row clickable"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <div className="sp-mp-row-left">
                <span className="sp-mp-row-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <span className="sp-mp-row-label">Settings</span>
              </div>
            </div>

            {/* 4. Log out */}
            <div 
              className="sp-mp-menu-row clickable"
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
            >
              <div className="sp-mp-row-left">
                <span className="sp-mp-row-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </span>
                <span className="sp-mp-row-label">Log out</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card Modal when clicking Profile Details */}
      <StudentProfileCardModal 
        isOpen={profileCardOpen} 
        onClose={() => setProfileCardOpen(false)}
        studentData={student}
      />
    </>
  );
}
