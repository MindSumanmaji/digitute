import React from 'react';
import NotificationPanel from './NotificationPanel';

export default function TopHeader({
  notificationOpen,
  setNotificationOpen,
  profileDropdownOpen,
  setProfileDropdownOpen,
  setActiveTab,
  onBackToLanding,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  onOpenMobileProfile,
}) {
  return (
    <header className="sp-top-header">
      {/* Mobile Drawer Hamburger & Institute Logo */}
      <div className="sp-header-left">
        <button
          className="sp-mobile-hamburger-btn"
          onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle navigation menu"
          title="Open Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="sp-mobile-brand-box" onClick={() => setActiveTab('dashboard')} title="DigiTute Dashboard">
          <div className="sp-mobile-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span className="sp-mobile-brand-name">DigiTute</span>
        </div>
      </div>

      <div className="sp-header-right">
        {/* Notification Bell */}
        <div className="sp-notification-wrapper">
          <button 
            className="sp-bell-btn" 
            onClick={() => setNotificationOpen(!notificationOpen)}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="sp-bell-badge-dot" />
          </button>

          {notificationOpen && <NotificationPanel />}
        </div>

        {/* Student Profile Pill */}
        <div className="sp-profile-wrapper">
          <div 
            className="sp-profile-chip" 
            onClick={() => {
              if (window.innerWidth <= 768) {
                setActiveTab('profile');
              } else {
                setProfileDropdownOpen(!profileDropdownOpen);
              }
            }}
          >
            <img 
              src="/student-avatar.jpg" 
              alt="Suman Maji" 
              className="sp-avatar-img"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
              }}
            />
            <div className="sp-profile-text">
              <span className="sp-profile-name">Suman Maji</span>
              <span className="sp-profile-role">Class XII - Science</span>
            </div>
            <span className="sp-profile-chevron">⌵</span>
          </div>

          {profileDropdownOpen && (
            <div className="sp-popover-menu sp-profile-menu">
              <div className="sp-profile-menu-head">
                <div className="sp-pm-name-badge">
                  <strong>Suman Maji</strong>
                  <span className="sp-pm-online-pill">Active</span>
                </div>
                <span className="sp-pm-roll">Roll: 12-SCI-042</span>
              </div>
              <div className="sp-profile-menu-body">
                <button 
                  className="sp-pm-item"
                  onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                >
                  <span className="sp-pm-item-icon blue">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <span className="sp-pm-item-text">View Full Profile</span>
                </button>
                <button 
                  className="sp-pm-item"
                  onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                >
                  <span className="sp-pm-item-icon teal">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </span>
                  <span className="sp-pm-item-text">Help & Support</span>
                </button>
                <div className="sp-menu-divider" />
                <button 
                  className="sp-pm-item sp-menu-logout" 
                  onClick={onBackToLanding}
                >
                  <span className="sp-pm-item-icon red">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </span>
                  <span className="sp-pm-item-text">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
