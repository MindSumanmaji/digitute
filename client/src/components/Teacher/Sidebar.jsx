import React from 'react';

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: 'dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: 'academics',
    label: 'Academics',
    route: 'academics',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  },
  {
    id: 'study-material',
    label: 'Study Materials',
    route: 'study-material',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <polyline points="10 2 10 10 13 8 16 10 16 2" />
      </svg>
    )
  },
  {
    id: 'finance',
    label: 'Finance',
    route: 'finance',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
  {
    id: 'notice',
    label: 'Notice Board',
    route: 'notice',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  }
];

export function Sidebar({ activeTab = 'dashboard', isOpen = false, onClose, onTabChange, onLogout }) {
  const normalize = (val) => (val || '').toLowerCase().replace(/\s+/g, '-');
  const currentTab = normalize(activeTab);

  const isItemActive = (id) => {
    if (id === 'dashboard') return currentTab === 'dashboard' || currentTab === '';
    if (id === 'academics') return currentTab === 'academics';
    if (id === 'study-material') return currentTab === 'study-material' || currentTab === 'study-materials';
    if (id === 'finance') return currentTab === 'finance';
    if (id === 'notice') return currentTab === 'notice' || currentTab === 'notice-board';
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

  const handleLogoutClick = () => {
    if (onClose) {
      onClose();
    }
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('digitute_active_view');
      window.location.hash = '#landing';
      window.location.reload();
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
        {/* Brand Header with DigiTute Logo and Close Button */}
        <div className="dt-sidebar-header">
          <div 
            className="dt-sidebar-brand" 
            onClick={() => handleItemClick('dashboard')}
            role="button"
            tabIndex={0}
          >
            <div className="dt-sidebar-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="dt-sidebar-brand-info">
              <span className="dt-sidebar-brand-name">DigiTute</span>
              <span className="dt-sidebar-brand-sub">TEACHER PORTAL</span>
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
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="dt-sidebar-nav-container">
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
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Logout Button */}
        <div className="dt-sidebar-footer">
          <button
            type="button"
            className="dt-sidebar-logout-btn"
            onClick={handleLogoutClick}
            aria-label="Log Out"
          >
            <span className="dt-sidebar-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="dt-sidebar-label">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
