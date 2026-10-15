import React, { useState, useRef, useEffect } from 'react';

export function Header({
  activePage = 'dashboard',
  hasNotifications = true,
  onToggleSidebar,
  onNotificationClick,
  onProfileClick,
  onLogout
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'academics':
        return 'Academics';
      case 'study-material':
        return 'Study Materials';
      case 'finance':
        return 'Finance';
      case 'notice':
        return 'Notice Board';
      case 'settings':
        return 'Settings';
      default:
        return 'Teacher Portal';
    }
  };

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('digitute_active_view');
      window.location.hash = '#landing';
      window.location.reload();
    }
  };

  return (
    <header className="dt-header" role="banner">
      <div className="dt-header-container">
        {/* Left: Mobile = DigiTute Logo & Name | PC = Active Page Title */}
        <div className="dt-header-left-group">
          {/* Mobile-only: DigiTute brand logo + name */}
          <div className="dt-header-mobile-brand" aria-hidden="false">
            <div className="dt-header-logo-icon">
              <svg className="dt-logo-svg" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="40" height="34" rx="8" fill="#2563EB"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="800" fontFamily="system-ui,sans-serif">DT</text>
              </svg>
            </div>
            <span className="dt-header-brand-title">DigiTute</span>
          </div>
          {/* PC-only: current active page title */}
          <h1 className="dt-header-page-title">{getPageTitle(activePage)}</h1>
        </div>

        {/* Right: Actions (Notification bell, Profile dropdown) */}
        <div className="dt-header-actions">
          {/* Notifications Button */}
          <button
            type="button"
            className="dt-header-icon-btn"
            onClick={onNotificationClick}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasNotifications && <span className="dt-header-badge-dot" aria-label="New notifications" />}
          </button>

          {/* Profile Dropdown Container */}
          <div className="dt-header-profile-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`dt-header-icon-btn profile-btn ${profileDropdownOpen ? 'is-open' : ''}`}
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              aria-label="Teacher Profile Menu"
              aria-expanded={profileDropdownOpen}
              title="Teacher Profile"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E293B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Desktop Teacher Tag */}
            <div 
              className="dt-header-teacher-meta" 
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <span className="dt-header-teacher-name">Sudipta Sir</span>
              <span className="dt-header-teacher-status">Faculty of DigiTute</span>
            </div>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="dt-header-dropdown-menu" role="menu">
                <div className="dt-header-dropdown-header">
                  <div className="dt-dropdown-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="dt-dropdown-user-info">
                    <strong className="dt-dropdown-user-name">Sudipta Sir</strong>
                    <span className="dt-dropdown-user-role">Faculty of DigiTute</span>
                  </div>
                </div>

                <div className="dt-dropdown-divider" />

                <button
                  type="button"
                  className="dt-dropdown-item logout-item"
                  onClick={handleLogoutClick}
                  role="menuitem"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
