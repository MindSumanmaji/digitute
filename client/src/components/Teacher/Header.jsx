import React, { useState, useEffect } from 'react';

export function Header({
  activePage = 'dashboard',
  hasNotifications = true,
  onToggleSidebar,
  onNotificationClick,
  onProfileClick,
  onTabChange,
  user
}) {
  const getStoredTeacher = () => {
    if (user && user.full_name) {
      return {
        name: user.full_name,
        username: user.email ? `@${user.email.split('@')[0]}` : '@sudipta',
        avatarUrl: user.avatar_url || '',
        role: user.specialization ? `${user.specialization} Faculty` : 'Faculty of DigiTute'
      };
    }
    try {
      const userStr = localStorage.getItem('digitute_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'TEACHER' || u.full_name) {
          return {
            name: u.full_name || 'Sudipta Sir',
            username: u.email ? `@${u.email.split('@')[0]}` : '@sudipta',
            avatarUrl: u.avatar_url || '',
            role: u.specialization ? `${u.specialization} Faculty` : 'Faculty of DigiTute'
          };
        }
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || 'Sudipta Mondal',
          username: parsed.username || '@sudipta',
          avatarUrl: parsed.avatarUrl || '/teacher-sudipta.png',
          role: parsed.role || 'Teacher'
        };
      }
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Mondal',
      username: '@sudipta',
      avatarUrl: '/teacher-sudipta.png',
      role: 'Teacher'
    };
  };

  const [teacher, setTeacher] = useState(getStoredTeacher);

  // Sync teacher info when user prop changes or profile is updated in Settings
  useEffect(() => {
    setTeacher(getStoredTeacher());
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setTeacher(getStoredTeacher());
    };
    window.addEventListener('digitute-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('digitute-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [user]);

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'routine':
      case 'timetable':
      case 'timetable-routine':
        return 'Timetable & Routine';
      case 'academics':
        return 'Academics';
      case 'student-info':
        return 'Student Info';
      case 'attendance':
        return 'Attendance';
      case 'syllabus-setup':
        return 'Syllabus Setup';
      case 'exam-evaluation':
        return 'Exam Evaluation';
      case 'doubt-corner':
        return 'Doubt Corner';
      case 'dpp-management':
        return 'DPP Management';
      case 'study-material':
        return 'Study Materials';
      case 'finance':
        return 'Finance';
      case 'notice':
        return 'Notice Board';
      case 'profile':
        return 'My Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Teacher Portal';
    }
  };

  // Direct Profile Page navigation
  const handleOpenProfile = () => {
    if (onProfileClick) {
      onProfileClick();
    } else if (onTabChange) {
      onTabChange('profile');
    }
  };

  const isProfileActive = activePage === 'profile';

  return (
    <header className="dt-header" role="banner">
      <div className="dt-header-container">
        {/* Left: Mobile Hamburger (3 dashes) | PC Active Page Title */}
        <div className="dt-header-left-group">
          {/* Mobile-only Hamburger toggle button */}
          <button
            type="button"
            className="dt-header-hamburger-btn"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* PC-only: current active page title */}
          <h1 className="dt-header-page-title">{getPageTitle(activePage)}</h1>
        </div>

        {/* Right: Notification Bell & Profile Avatar */}
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

          {/* Profile Button with Teacher Photo */}
          <div
            className={`dt-header-profile-wrapper ${isProfileActive ? 'active' : ''}`}
            onClick={handleOpenProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenProfile()}
            aria-label="Open Profile Page"
            title="Open Profile Page"
          >
            <button
              type="button"
              className={`dt-header-icon-btn profile-btn ${isProfileActive ? 'active' : ''}`}
              aria-label="Teacher Profile"
              title="Teacher Profile"
              tabIndex={-1}
            >
              <img
                src="/teacher-sudipta.png"
                alt="Teacher Profile"
                className="dt-header-avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/student-avatar.jpg';
                }}
              />
            </button>

            {/* Desktop Teacher Tag */}
            <div className="dt-header-teacher-meta">
              <span className="dt-header-teacher-name">{teacher.name}</span>
              <span className="dt-header-teacher-status">{teacher.role || 'Teacher'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
