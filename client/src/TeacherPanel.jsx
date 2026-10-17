import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Teacher/Header';
import Sidebar from './components/Teacher/Sidebar';
import BottomNav from './components/Teacher/BottomNav';
import Dashboard from './components/Teacher/Dashboard';
import Academics from './components/Teacher/Academics';
import StudyMaterial from './components/Teacher/StudyMaterial';
import Finance from './components/Teacher/Finance';
import Notice from './components/Teacher/Notice';
import Settings from './components/Teacher/Settings';
import Profile from './components/Teacher/Profile';

const tabToRoute = {
  dashboard: '/',
  academics: '/academics',
  'study-material': '/study-material',
  finance: '/finance',
  notice: '/notice',
  settings: '/settings',
  profile: '/profile',
};

const routeToTab = {
  '/': 'dashboard',
  '/academics': 'academics',
  '/study-material': 'study-material',
  '/finance': 'finance',
  '/notice': 'notice',
  '/settings': 'settings',
  '/profile': 'profile',
};

export function TeacherPanel({ onBackToLanding }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = routeToTab[location.pathname] || 'dashboard';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Current logged in teacher user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('digitute_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem('digitute_token');
    const refreshToken = localStorage.getItem('digitute_refresh_token');
    if (!token && !refreshToken) {
      if (onBackToLanding) onBackToLanding();
      return;
    }
    try {
      const stored = localStorage.getItem('digitute_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role && u.role !== 'TEACHER' && u.role !== 'ADMIN') {
          if (onBackToLanding) onBackToLanding();
        }
      }
    } catch (e) {}
  }, [onBackToLanding]);

  const handleTabChange = (tab, state = null) => {
    setIsSidebarOpen(false);
    const route = tabToRoute[tab];
    if (route) {
      navigate(route, { state });
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation: Fixed on Desktop, Drawer on Mobile via Hamburger */}
      <Sidebar 
        activeTab={activeTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onTabChange={handleTabChange}
        onLogout={onBackToLanding}
      />

      {/* Main Column Layout */}
      <div className="app-main-layout">
        {/* Top Header with Hamburger Toggle for Mobile */}
        <Header 
          activePage={activeTab} 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onHomeClick={() => handleTabChange('dashboard')} 
          onLogoClick={() => handleTabChange('dashboard')}
          onNotificationClick={() => handleTabChange('settings')}
          onProfileClick={() => handleTabChange('profile')}
          onTabChange={handleTabChange}
          user={currentUser}
        />

        {/* Page Content */}
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={handleTabChange} user={currentUser} />} />
            <Route path="/academics" element={<Academics onNavigate={handleTabChange} />} />
            <Route path="/study-material" element={<StudyMaterial onNavigate={handleTabChange} />} />
            <Route path="/finance" element={<Finance onNavigate={handleTabChange} />} />
            <Route path="/notice" element={<Notice onNavigate={handleTabChange} />} />
            <Route path="/profile" element={<Profile onNavigate={handleTabChange} onBackToLanding={onBackToLanding} user={currentUser} />} />
            <Route path="/settings" element={<Settings onNavigate={handleTabChange} onBackToLanding={onBackToLanding} user={currentUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Fixed Mobile Bottom Nav Bar (Hidden on desktop >= 768px) */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}

export default TeacherPanel;
