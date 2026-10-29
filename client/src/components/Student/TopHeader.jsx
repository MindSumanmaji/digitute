import React, { useRef, useEffect } from 'react';
import NotificationPanel from './NotificationPanel';
import ProfileAvatar from './ProfileAvatar';

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
  user,
}) {
  const displayName = user?.full_name || 'Suman Maji';
  const avatarUrl = user?.avatar_url || user?.photo;

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(displayName);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen, setProfileDropdownOpen]);

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

        {/* Student Profile Pill: Desktop only shows photo or initials avatar */}
        <div className="sp-profile-wrapper" ref={profileRef}>
          <div 
            className="sp-profile-chip sp-avatar-only-chip" 
            onClick={() => {
              if (window.innerWidth <= 768) {
                setActiveTab('profile');
              } else {
                setProfileDropdownOpen(!profileDropdownOpen);
              }
            }}
            title={displayName}
            role="button"
            tabIndex={0}
          >
            <ProfileAvatar
              src={avatarUrl}
              name={displayName}
              size={38}
              className="sp-avatar-img"
            />
          </div>

          {profileDropdownOpen && (
            <div className="sp-popover-menu sp-profile-menu">
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
                  <span className="sp-pm-item-text">View profile</span>
                </button>
                <button 
                  className="sp-pm-item"
                  onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                >
                  <span className="sp-pm-item-icon teal">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </span>
                  <span className="sp-pm-item-text">Settings</span>
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
