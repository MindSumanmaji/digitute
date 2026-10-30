import React, { useState, useEffect } from 'react';

const ACADEMIC_SUB_ITEMS = [
  {
    id: 'student-info',
    label: 'Student Info',
    route: 'student-info',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    id: 'attendance',
    label: 'Attendance',
    route: 'attendance',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'syllabus-setup',
    label: 'Syllabus Setup',
    route: 'syllabus-setup',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    )
  },
  {
    id: 'exam-evaluation',
    label: 'Exam Evaluation',
    route: 'exam-evaluation',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 17l2-5 2 5" strokeWidth="1.8" />
        <line x1="9" y1="15" x2="11" y2="15" strokeWidth="1.8" />
        <path d="M14 13h2" strokeWidth="1.8" />
        <line x1="15" y1="12" x2="15" y2="14" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'doubt-corner',
    label: 'Doubt Corner',
    route: 'doubt-corner',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="0.7" fill="currentColor" />
        <path d="M10.15 8.4a2 2 0 0 1 3.7 1c0 1.33-2 2-2 2" />
      </svg>
    )
  },
  {
    id: 'dpp-management',
    label: 'DPP Management',
    route: 'dpp-management',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <polyline points="9 12 11 14 15 10" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    )
  }
];

const FINANCE_SUB_ITEMS = [
  {
    id: 'collect-cash',
    label: 'Collect Cash',
    route: 'finance/collect-cash',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    )
  },
  {
    id: 'all-payments',
    label: 'All Payments',
    route: 'finance/all-payments',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    id: 'my-earnings',
    label: 'My Earnings',
    route: 'finance/my-earnings',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    )
  }
];

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
    id: 'routine',
    label: 'Timetable & Routine',
    route: 'routine',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="14" r="1.2" fill="currentColor" />
        <circle cx="12" cy="14" r="1.2" fill="currentColor" />
        <circle cx="16" cy="14" r="1.2" fill="currentColor" />
        <circle cx="8" cy="18" r="1.2" fill="currentColor" />
        <circle cx="12" cy="18" r="1.2" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'academics',
    label: 'Academics',
    route: 'academics',
    hasSubmenu: true,
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
    hasSubmenu: true,
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
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
];

export function Sidebar({ activeTab = 'dashboard', isOpen = false, onClose, onTabChange, onLogout }) {
  const normalize = (val) => (val || '').toLowerCase().replace(/\s+/g, '-');
  const currentTab = normalize(activeTab);

  const isAcademicTab = ACADEMIC_SUB_ITEMS.some((sub) => sub.id === currentTab) || currentTab === 'academics';
  const [academicsOpen, setAcademicsOpen] = useState(true);

  const isFinanceTab = currentTab === 'finance' || FINANCE_SUB_ITEMS.some((sub) => sub.id === currentTab || currentTab === sub.route || currentTab === `finance/${sub.id}`);
  const [financeOpen, setFinanceOpen] = useState(true);

  // Automatically ensure submenu is open whenever navigating to an academic sub-tab
  useEffect(() => {
    if (isAcademicTab) {
      setAcademicsOpen(true);
    }
  }, [currentTab, isAcademicTab]);

  useEffect(() => {
    if (isFinanceTab) {
      setFinanceOpen(true);
    }
  }, [currentTab, isFinanceTab]);

  const isItemActive = (id) => {
    if (id === 'dashboard') return currentTab === 'dashboard' || currentTab === '';
    if (id === 'routine') return currentTab === 'routine' || currentTab === 'timetable' || currentTab === 'timetable-routine';
    if (id === 'academics') return isAcademicTab;
    if (id === 'study-material') return currentTab === 'study-material' || currentTab === 'study-materials';
    if (id === 'finance') return isFinanceTab;
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

  const handleAcademicsParentClick = () => {
    if (!isAcademicTab) {
      setAcademicsOpen(true);
      handleItemClick('student-info');
    } else {
      setAcademicsOpen((prev) => !prev);
    }
  };

  const handleFinanceParentClick = () => {
    if (!isFinanceTab) {
      setFinanceOpen(true);
      handleItemClick('finance/collect-cash');
    } else {
      setFinanceOpen((prev) => !prev);
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

              if (item.hasSubmenu && item.id === 'finance') {
                return (
                  <li key={item.id} className="dt-sidebar-menu-group">
                    <button
                      type="button"
                      className={`dt-sidebar-item ${active ? 'is-active' : ''}`}
                      onClick={handleFinanceParentClick}
                      aria-expanded={financeOpen}
                    >
                      <span className="dt-sidebar-icon">
                        {item.icon}
                      </span>
                      <span className="dt-sidebar-label">{item.label}</span>
                      <span
                        className={`dt-sidebar-chevron ${financeOpen ? 'is-open' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFinanceOpen((prev) => !prev);
                        }}
                        title={financeOpen ? 'Collapse Finance' : 'Expand Finance'}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>

                    {/* Expandable Submenu for Finance */}
                    {financeOpen && (
                      <ul className="dt-sidebar-submenu" aria-label="Finance sub-menu">
                        {FINANCE_SUB_ITEMS.map((sub) => {
                          const isSubActive = currentTab === sub.id || currentTab === sub.route || (currentTab === 'finance' && sub.id === 'collect-cash');
                          return (
                            <li key={sub.id}>
                              <button
                                type="button"
                                className={`dt-sidebar-sub-item ${isSubActive ? 'is-active' : ''}`}
                                onClick={() => handleItemClick(sub.route)}
                                aria-current={isSubActive ? 'page' : undefined}
                              >
                                <span className="dt-sidebar-sub-icon">
                                  {sub.icon}
                                </span>
                                <span className="dt-sidebar-sub-label">{sub.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              if (item.hasSubmenu && item.id === 'academics') {
                return (
                  <li key={item.id} className="dt-sidebar-menu-group">
                    <button
                      type="button"
                      className={`dt-sidebar-item ${active ? 'is-active' : ''}`}
                      onClick={handleAcademicsParentClick}
                      aria-expanded={academicsOpen}
                    >
                      <span className="dt-sidebar-icon">
                        {item.icon}
                      </span>
                      <span className="dt-sidebar-label">{item.label}</span>
                      <span
                        className={`dt-sidebar-chevron ${academicsOpen ? 'is-open' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcademicsOpen((prev) => !prev);
                        }}
                        title={academicsOpen ? 'Collapse Academics' : 'Expand Academics'}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>

                    {/* Expandable Submenu for Academics */}
                    {academicsOpen && (
                      <ul className="dt-sidebar-submenu" aria-label="Academics sub-menu">
                        {ACADEMIC_SUB_ITEMS.map((sub) => {
                          const isSubActive = currentTab === sub.id;
                          return (
                            <li key={sub.id}>
                              <button
                                type="button"
                                className={`dt-sidebar-sub-item ${isSubActive ? 'is-active' : ''}`}
                                onClick={() => handleItemClick(sub.route)}
                                aria-current={isSubActive ? 'page' : undefined}
                              >
                                <span className="dt-sidebar-sub-icon">
                                  {sub.icon}
                                </span>
                                <span className="dt-sidebar-sub-label">{sub.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

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
