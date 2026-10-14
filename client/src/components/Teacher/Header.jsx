import React from 'react';
export function Header({
  activePage = 'dashboard',
  hasNotifications = true,
  onToggleSidebar,
  onHomeClick,
  onNotificationClick,
  onProfileClick,
  onLogoClick
}) {
  const isDashboard = typeof activePage === 'string' && activePage.toLowerCase() === 'dashboard';

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard':
        return 'Teacher Dashboard';
      case 'academics':
        return 'Academic & Batches';
      case 'study-material':
        return 'Study Materials';
      case 'finance':
        return 'Finance & Payments';
      case 'notice':
        return 'Notice Board';
      case 'settings':
        return 'Settings & Profile';
      default:
        return 'Teacher Portal';
    }
  };

  return (
    <header className="dt-header" role="banner">
      <div className="dt-header-container">
        {/* Left: Brand Logo & Title (Navigation handled by BottomNav on mobile) */}
        <div className="dt-header-left-group">

          {/* Brand Logo & Title */}
          <div 
            className="dt-header-left" 
            onClick={onLogoClick || onHomeClick} 
            role="button" 
            tabIndex={0}
          >
            <div className="dt-header-logo-icon" aria-hidden="true">
              <svg
                viewBox="0 0 34 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dt-logo-svg"
              >
                <path
                  d="M17 6 C13 3, 5.5 3, 2.5 5 L2.5 22.5 C5.5 20.5, 13 20.5, 17 23.5 Z"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#FFFFFF"
                />
                <path
                  d="M17 6 C21 3, 28.5 3, 31.5 5 L31.5 22.5 C28.5 20.5, 21 20.5, 17 23.5 Z"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#FFFFFF"
                />
                <path d="M17 6 L17 23.5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M13 15 L22 6 M22 6 L16.5 6 M22 6 L22 11.5"
                  stroke="#2563EB"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dt-header-brand-title">DigiTute</div>
            <span className="dt-header-role-badge">Teacher Portal</span>
          </div>

          {/* Desktop Breadcrumb/Page Indicator */}
          <div className="dt-header-desktop-title" aria-hidden="true">
            <span className="dt-header-divider-slash">/</span>
            <span className="dt-header-active-page-title">{getPageTitle(activePage)}</span>
          </div>
        </div>

        {/* Right: Actions (Notification bell, Profile, Teacher status) */}
        <div className="dt-header-actions">
          {/* Quick Home / Dashboard Button */}
          <button
            type="button"
            className={`dt-header-icon-btn home-btn ${isDashboard ? 'is-active' : ''}`}
            onClick={onHomeClick}
            aria-label="Dashboard"
            title="Dashboard"
          >
            <svg
              viewBox="0 0 24 24"
              fill={isDashboard ? "#2563EB" : "none"}
              stroke={isDashboard ? "#2563EB" : "#1E293B"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

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

          {/* Profile Button */}
          <button
            type="button"
            className="dt-header-icon-btn profile-btn"
            onClick={onProfileClick}
            aria-label="Teacher Profile"
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
          <div className="dt-header-teacher-meta">
            <span className="dt-header-teacher-name">Sudipta Sir</span>
            <span className="dt-header-teacher-status">Faculty of DigiTute</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
