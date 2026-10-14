import React from 'react';
const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: 'dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  },
  {
    id: 'academics',
    label: 'Academic',
    route: 'academics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    )
  },
  {
    id: 'study-material',
    label: 'Study Materials',
    route: 'study-material',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="16" y2="7" />
        <line x1="9" y1="11" x2="14" y2="11" />
      </svg>
    )
  },
  {
    id: 'finance',
    label: 'Finance',
    route: 'finance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
  {
    id: 'notice',
    label: 'Notice',
    route: 'notice',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    route: 'settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  }
];

export function Sidebar({ activeTab = 'dashboard', isOpen = false, onClose, onTabChange }) {
  const normalize = (val) => (val || '').toLowerCase().replace(/\s+/g, '-');
  const currentTab = normalize(activeTab);

  const isItemActive = (id) => {
    if (id === 'dashboard') return currentTab === 'dashboard' || currentTab === '';
    if (id === 'academics') return currentTab === 'academics';
    if (id === 'study-material') return currentTab === 'study-material' || currentTab === 'study-materials';
    if (id === 'finance') return currentTab === 'finance';
    if (id === 'notice') return currentTab === 'notice';
    if (id === 'settings') return currentTab === 'settings';
    return false;
  };

  const handleItemClick = (route) => {
    if (onTabChange) {
      onTabChange(route);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`dt-sidebar-backdrop ${isOpen ? 'is-open' : ''}`} 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <aside className={`dt-sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Main Sidebar Navigation">
        {/* Brand Header with official DigiTute Logo */}
        <div className="dt-sidebar-header">
          <div 
            className="dt-sidebar-brand" 
            onClick={() => handleItemClick('dashboard')}
            role="button"
            tabIndex={0}
          >
            <div className="dt-sidebar-logo-icon" aria-hidden="true">
              {/* DigiTute Logo SVG */}
              <svg
                viewBox="0 0 34 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dt-logo-svg"
              >
                {/* Book Left Page */}
                <path
                  d="M17 6 C13 3, 5.5 3, 2.5 5 L2.5 22.5 C5.5 20.5, 13 20.5, 17 23.5 Z"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#FFFFFF"
                />
                {/* Book Right Page */}
                <path
                  d="M17 6 C21 3, 28.5 3, 31.5 5 L31.5 22.5 C28.5 20.5, 21 20.5, 17 23.5 Z"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#FFFFFF"
                />
                {/* Center Spine */}
                <path d="M17 6 L17 23.5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                {/* Growth Arrow popping from pages */}
                <path
                  d="M13 15 L22 6 M22 6 L16.5 6 M22 6 L22 11.5"
                  stroke="#2563EB"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dt-sidebar-brand-info">
              <span className="dt-sidebar-brand-name">DigiTute</span>
              <span className="dt-sidebar-brand-sub">Teacher Portal</span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button 
            type="button" 
            className="dt-sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="dt-sidebar-nav-container">
          <div className="dt-sidebar-section">
            <div className="dt-sidebar-section-title">MENU</div>
            <ul className="dt-sidebar-menu">
              {MENU_ITEMS.map((item) => {
                const active = isItemActive(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`dt-sidebar-item ${active ? 'is-active' : ''}`}
                      onClick={() => handleItemClick(item.route)}
                    >
                      <span className="dt-sidebar-icon">
                        {item.icon}
                      </span>
                      <span className="dt-sidebar-label">{item.label}</span>
                      {active && <span className="dt-sidebar-active-indicator" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom User Card / Profile */}
        <div className="dt-sidebar-footer">
          <button
            type="button"
            className={`dt-sidebar-user-card ${currentTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => handleItemClick('settings')}
            title="Profile - Faculty of DigiTute"
          >
            <div className="dt-sidebar-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dt-sidebar-avatar-svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="dt-sidebar-user-details">
              <span className="dt-sidebar-user-name">Profile</span>
              <span className="dt-sidebar-user-tag">Faculty of DigiTute</span>
            </div>
            <span className="dt-sidebar-user-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
