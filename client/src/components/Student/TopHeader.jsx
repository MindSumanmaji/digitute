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
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
                <strong>Suman Maji</strong>
                <span>Roll: 12-SCI-042</span>
              </div>
              <button onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}>
                👤 View Full Profile
              </button>
              <button onClick={() => { setActiveTab('classes'); setProfileDropdownOpen(false); }}>
                📅 Class Schedule & Attendance
              </button>
              <button onClick={() => { setActiveTab('fees'); setProfileDropdownOpen(false); }}>
                💳 Fee Ledger & Receipts
              </button>
              <div className="sp-menu-divider" />
              <button className="sp-menu-logout" onClick={onBackToLanding}>
                🚪 Logout to Website
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
