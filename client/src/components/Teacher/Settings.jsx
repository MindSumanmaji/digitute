import React, { useState } from 'react';
import EducationIllustration from './EducationIllustration';
const Settings = ({ onNavigate, onBackToLanding }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-container">
        {/* Hero Section */}
        <section className="settings-hero-banner" aria-label="Settings Header">
          <div className="settings-hero-content">
            <span className="settings-hero-salutation">ACCOUNT &amp; PREFERENCES</span>
            <div className="settings-hero-title-group">
              <h1 className="settings-hero-title">Settings</h1>
              <div className="settings-hero-underline" aria-hidden="true" />
            </div>
            <p className="settings-hero-subtitle">Manage your profile, teaching preferences, and security</p>
          </div>
          <div className="settings-hero-art" aria-hidden="true">
            <EducationIllustration />
          </div>
        </section>

        {/* Profile Card */}
        <section className="settings-profile-card">
          <div className="settings-profile-avatar" aria-hidden="true">
            SS
          </div>
          <div className="settings-profile-meta">
            <h2 className="settings-profile-name">Sudipta Sir</h2>
            <span className="settings-profile-designation">Senior Faculty • Computer Science</span>
            <span className="settings-profile-email">sudipta.teacher@digitute.edu</span>
          </div>
          <button 
            type="button" 
            className="settings-profile-edit-btn"
            onClick={() => showToast('Profile editor opened')}
          >
            Edit
          </button>
        </section>

        {/* Settings List */}
        <div className="settings-items-group">
          {/* Notification item with Toggle */}
          <div className="settings-card-item">
            <div className="settings-item-left">
              <div className="settings-icon-circle purple" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="settings-text-meta">
                <h3 className="settings-item-heading">Push Notifications</h3>
                <p className="settings-item-caption">Receive student doubt &amp; class reminders</p>
              </div>
            </div>
            <label className="settings-toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationsEnabled} 
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Notifications enabled' : 'Notifications muted');
                }} 
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>

          {/* Academic Preferences */}
          <div 
            className="settings-card-item clickable"
            onClick={() => onNavigate && onNavigate('academics')}
            role="button"
            tabIndex={0}
          >
            <div className="settings-item-left">
              <div className="settings-icon-circle indigo" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="settings-text-meta">
                <h3 className="settings-item-heading">Academic Settings</h3>
                <p className="settings-item-caption">Configure default batches, grading &amp; attendance rules</p>
              </div>
            </div>
            <svg className="settings-chevron" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Security & Password */}
          <div 
            className="settings-card-item clickable"
            onClick={() => showToast('Security & Password settings opened')}
            role="button"
            tabIndex={0}
          >
            <div className="settings-item-left">
              <div className="settings-icon-circle green" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="settings-text-meta">
                <h3 className="settings-item-heading">Security &amp; Password</h3>
                <p className="settings-item-caption">Update password and active device sessions</p>
              </div>
            </div>
            <svg className="settings-chevron" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Help & Support */}
          <div 
            className="settings-card-item clickable"
            onClick={() => showToast('DigiTute Faculty Helpdesk: support@digitute.edu')}
            role="button"
            tabIndex={0}
          >
            <div className="settings-item-left">
              <div className="settings-icon-circle amber" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="settings-text-meta">
                <h3 className="settings-item-heading">Help &amp; Faculty Support</h3>
                <p className="settings-item-caption">Contact portal administrators and read guides</p>
              </div>
            </div>
            <svg className="settings-chevron" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Logout */}
          <div 
            className="settings-card-item clickable logout-item"
            onClick={() => {
              if (onBackToLanding) {
                onBackToLanding();
              } else {
                showToast('Session active (Single-faculty environment)');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="settings-item-left">
              <div className="settings-icon-circle red" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div className="settings-text-meta">
                <h3 className="settings-item-heading logout-text">Log Out</h3>
                <p className="settings-item-caption">Sign out from your teacher session</p>
              </div>
            </div>
            <svg className="settings-chevron" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="settings-toast" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
