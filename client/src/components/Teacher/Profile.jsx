import React, { useState, useEffect } from 'react';

export function Profile({ onNavigate, onBackToLanding }) {
  // ── 1. Teacher Profile Data (loaded from real local storage / account) ──
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Sir',
      username: '@sudipta',
      phone: '+91 98765 43210',
      email: 'sudipta.teacher@digitute.edu',
      avatarUrl: ''
    };
  });

  // ── 2. Dark Mode Toggle (Visual state only, per requirement: "আপাতত এটি কাজ করার প্রয়োজন নেই") ──
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('digitute_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // ── 3. Modals State ──
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync state if localStorage changes elsewhere
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('digitute_teacher_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('digitute-profile-updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('digitute-profile-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Handle Dark Mode Toggle
  const handleToggleDarkMode = (e) => {
    e.stopPropagation();
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    try {
      localStorage.setItem('digitute_theme', nextVal ? 'dark' : 'light');
    } catch { /* ignore */ }
    showToast(nextVal ? 'Dark mode enabled (Preview)' : 'Light mode enabled');
  };

  // Direct Settings navigation (Opens the full Settings page)
  const handleOpenSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Logout action (Requirement 5: "Logout বাটনটি সম্পূর্ণ কার্যকর হতে হবে। ক্লিক করলে ইউজারের অ্যাকাউন্ট থেকে লগআউট হবে এবং Login Page-এ ফিরে যাবে।")
  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    try {
      localStorage.removeItem('digitute_active_view');
    } catch { /* ignore */ }
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      window.location.hash = '#landing';
      window.location.reload();
    }
  };

  // Initials for avatar fallback
  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SS';

  return (
    <div className="dt-profile-page-wrapper">
      {/* ── Main Profile Card matching Reference Image ── */}
      <div className="dt-profile-card">
        {/* 1. Top Soft Lavender/Purple Banner */}
        <div className="dt-profile-banner" aria-hidden="true" />

        {/* 2. Round Profile Avatar overlapping Banner */}
        <div className="dt-profile-avatar-wrapper">
          <div className="dt-profile-avatar-circle">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="dt-profile-avatar-img"
              />
            ) : (
              <span className="dt-profile-avatar-initials">{initials}</span>
            )}
          </div>
        </div>

        {/* 3. Teacher Full Name */}
        <h2 className="dt-profile-name">{profile.name}</h2>

        {/* 4. Phone and Mail Info Rows (clean minimal style matching image) */}
        <div className="dt-profile-contacts-box">
          <div className="dt-profile-contact-row">
            <span className="dt-profile-contact-label">Phone</span>
            <span className="dt-profile-contact-val">{profile.phone || '+91 98765 43210'}</span>
          </div>

          <div className="dt-profile-contact-row">
            <span className="dt-profile-contact-label">Mail</span>
            <span className="dt-profile-contact-val">{profile.email || 'sudipta.teacher@digitute.edu'}</span>
          </div>
        </div>

        {/* 5. Clean Divider Line */}
        <div className="dt-profile-divider" />

        {/* 6. Action / Settings Menu Items */}
        <div className="dt-profile-menu-list">
          {/* Item 1: Dark Mode */}
          <div className="dt-profile-menu-item no-pointer" onClick={handleToggleDarkMode}>
            <div className="dt-profile-item-left">
              <span className="dt-profile-item-icon" aria-hidden="true">
                {/* Crescent Moon Icon */}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span className="dt-profile-item-label">Dark mode</span>
            </div>

            <label className="dt-profile-toggle" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleToggleDarkMode}
                aria-label="Toggle Dark Mode"
              />
              <span className="dt-profile-slider" />
            </label>
          </div>

          {/* Item 2: Settings (Directly navigates to the Settings page) */}
          <div
            className="dt-profile-menu-item"
            onClick={handleOpenSettings}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenSettings()}
          >
            <div className="dt-profile-item-left">
              <span className="dt-profile-item-icon" aria-hidden="true">
                {/* Sliders / Adjustment Tune Icon matching Reference */}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </span>
              <span className="dt-profile-item-label">Settings</span>
            </div>

            <span className="dt-profile-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>

          {/* Item 3: Log out */}
          <div
            className="dt-profile-menu-item dt-profile-logout-item"
            onClick={() => setLogoutModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLogoutModalOpen(true)}
          >
            <div className="dt-profile-item-left">
              <span className="dt-profile-item-icon logout" aria-hidden="true">
                {/* Logout Bracket with Right Arrow Icon matching Reference */}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="dt-profile-item-label">Log out</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logout Confirmation Dialog ── */}
      {logoutModalOpen && (
        <div className="dt-modal-overlay" onClick={() => setLogoutModalOpen(false)}>
          <div className="dt-modal-sheet dt-modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dt-dialog-icon red">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div className="dt-dialog-content">
              <h3 className="dt-dialog-title">Log Out</h3>
              <p className="dt-dialog-message">Are you sure you want to log out of your DigiTute teacher account?</p>
            </div>
            <div className="dt-dialog-actions">
              <button
                type="button"
                className="dt-btn dt-btn-secondary"
                onClick={() => setLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dt-btn dt-btn-destructive"
                onClick={handleConfirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="dt-refined-toast" role="status">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default Profile;
