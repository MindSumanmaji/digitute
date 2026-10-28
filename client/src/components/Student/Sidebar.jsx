import React from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  testsMenuOpen,
  setTestsMenuOpen,
  testSubTab,
  setTestSubTab,
  onBackToLanding,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const icons = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    classes: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
    materials: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    assignments: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" x2="8" y1="13" y2="13"/>
        <line x1="16" x2="8" y1="17" y2="17"/>
        <line x1="10" x2="8" y1="9" y2="9"/>
      </svg>
    ),
    tests: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M8 17l2-5 2 5"/>
        <path d="M8.5 15.5h3"/>
        <path d="M14 14.5h2"/>
        <path d="M15 13.5v2"/>
      </svg>
    ),
    fees: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
    doubts: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" x2="12.01" y1="17" y2="17"/>
      </svg>
    ),
    announcements: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    logout: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" x2="9" y1="12" y2="12"/>
      </svg>
    )
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'classes', label: 'Classes & Attendance', icon: icons.classes },
    { id: 'materials', label: 'Study Material', icon: icons.materials },
    { id: 'assignments', label: 'Assignments / DPP', icon: icons.assignments },
    { id: 'tests', label: 'Tests & Results', icon: icons.tests, hasSubmenu: true },
    { id: 'fees', label: 'Fees & Payments', icon: icons.fees },
    { id: 'doubts', label: 'Doubt Corner', icon: icons.doubts, isDoubtBadge: true },
    { id: 'announcements', label: 'Announcements', icon: icons.announcements },
  ];

  return (
    <aside className={`sp-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sp-brand-header">
        <div 
          className="sp-brand-header-left" 
          onClick={() => {
            setActiveTab('dashboard');
            if (setMobileSidebarOpen) setMobileSidebarOpen(false);
          }}
          title="DigiTute Student Dashboard"
        >
          <div className="sp-brand-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              <line x1="17" y1="8" x2="21" y2="4"/>
              <polyline points="18 4 21 4 21 7"/>
            </svg>
          </div>
          <div className="sp-brand-titles">
            <span className="sp-brand-name">DigiTute</span>
            <span className="sp-brand-sub">Student Panel</span>
          </div>
        </div>

        {/* Mobile Close Button (shown <= 992px) */}
        <button
          className="sp-sidebar-close-btn"
          onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(false)}
          aria-label="Close menu drawer"
          title="Close Navigation Drawer"
        >
          ✕
        </button>
      </div>

      {/* Navigation Items */}
      <div className="sp-nav-menu">
        {navItems.map((item) => {
          const isActive = !item.hasSubmenu && activeTab === item.id;
          const isDoubt = item.id === 'doubts';

          return (
            <div key={item.id} className="sp-nav-group-item">
              <button
                className={`sp-nav-item ${isActive ? 'active' : ''} ${isDoubt && isActive ? 'active-doubt' : ''}`}
                onClick={() => {
                  if (item.id === 'tests') {
                    setTestsMenuOpen(!testsMenuOpen);
                  } else {
                    setActiveTab(item.id);
                    setTestsMenuOpen(false);
                    if (setMobileSidebarOpen) setMobileSidebarOpen(false);
                  }
                }}
              >
                {isActive && <div className={`sp-nav-indicator ${isDoubt ? 'indicator-red' : ''}`} />}
                <span className={`sp-nav-icon ${isDoubt && isActive ? 'icon-red-box' : ''}`}>
                  {item.icon}
                </span>
                <span className="sp-nav-label">{item.label}</span>
                {item.hasSubmenu && (
                  <span 
                    className={`sp-nav-sub-arrow ${testsMenuOpen ? 'open' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTestsMenuOpen(!testsMenuOpen);
                    }}
                    title={testsMenuOpen ? "Collapse" : "Expand"}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Submenu for Tests & Results */}
              {item.id === 'tests' && testsMenuOpen && (
                <div className="sp-nav-submenu-list">
                  <button
                    className={`sp-nav-sub-btn ${(activeTab === 'tests' && testSubTab === 'performance') || activeTab === 'performance' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('tests');
                      setTestSubTab('performance');
                      if (setMobileSidebarOpen) setMobileSidebarOpen(false);
                    }}
                  >
                    
                    <span>Test & Performance</span>
                  </button>
                  <button
                    className={`sp-nav-sub-btn ${(activeTab === 'tests' && testSubTab === 'results') || activeTab === 'results' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('tests');
                      setTestSubTab('results');
                      if (setMobileSidebarOpen) setMobileSidebarOpen(false);
                    }}
                  >
                    
                    <span>Result</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sidebar */}
      <div className="sp-sidebar-bottom">
        <button 
          className={`sp-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            setTestsMenuOpen(false);
            if (setMobileSidebarOpen) setMobileSidebarOpen(false);
          }}
        >
          {activeTab === 'settings' && <div className="sp-nav-indicator" />}
          <span className="sp-nav-icon">{icons.settings}</span>
          <span className="sp-nav-label">Settings</span>
        </button>
        
        <button 
          className="sp-nav-item sp-nav-logout"
          onClick={() => {
            if (setMobileSidebarOpen) setMobileSidebarOpen(false);
            onBackToLanding();
          }}
        >
          <span className="sp-nav-icon sp-logout-icon">{icons.logout}</span>
          <span className="sp-nav-label sp-logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
