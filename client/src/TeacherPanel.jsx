import React, { useState } from 'react';
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

const tabToRoute = {
  dashboard: '/',
  academics: '/academics',
  'study-material': '/study-material',
  finance: '/finance',
  notice: '/notice',
  settings: '/settings',
};

const routeToTab = {
  '/': 'dashboard',
  '/academics': 'academics',
  '/study-material': 'study-material',
  '/finance': 'finance',
  '/notice': 'notice',
  '/settings': 'settings',
};

export function TeacherPanel({ onBackToLanding }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = routeToTab[location.pathname] || 'dashboard';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          onProfileClick={() => handleTabChange('settings')}
          onTabChange={handleTabChange}
          onLogout={onBackToLanding}
        />

        {/* Page Content */}
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={handleTabChange} />} />
            <Route path="/academics" element={<Academics onNavigate={handleTabChange} />} />
            <Route path="/study-material" element={<StudyMaterial onNavigate={handleTabChange} />} />
            <Route path="/finance" element={<Finance onNavigate={handleTabChange} />} />
            <Route path="/notice" element={<Notice onNavigate={handleTabChange} />} />
            <Route path="/settings" element={<Settings onNavigate={handleTabChange} onBackToLanding={onBackToLanding} />} />
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
