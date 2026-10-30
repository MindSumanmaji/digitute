import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Teacher/Header';
import Sidebar from './components/Teacher/Sidebar';
import BottomNav from './components/Teacher/BottomNav';
import Dashboard from './components/Teacher/Dashboard';
import StudyMaterial from './components/Teacher/StudyMaterial';
import Finance from './components/Teacher/Finance';
import Notice from './components/Teacher/Notice';
import Settings from './components/Teacher/Settings';
import Profile from './components/Teacher/Profile';
import TimetableRoutine from './components/Teacher/TimetableRoutine';

// Direct Academic Sub-Pages
import StudentInfo from './components/Teacher/StudentInfo';
import Attendance from './components/Teacher/Attendance';
import SyllabusSetup from './components/Teacher/SyllabusSetup';
import ExamEvaluation from './components/Teacher/ExamEvaluation';
import DoubtCorner from './components/Teacher/DoubtCorner';
import DppManagement from './components/Teacher/DppManagement';

const tabToRoute = {
  dashboard: '/',
  routine: '/routine',
  'timetable-routine': '/routine',
  timetable: '/routine',
  academics: '/academics/student-info',
  'student-info': '/academics/student-info',
  attendance: '/academics/attendance',
  'syllabus-setup': '/academics/syllabus-setup',
  syllabus: '/academics/syllabus-setup',
  'exam-evaluation': '/academics/exam-evaluation',
  exams: '/academics/exam-evaluation',
  'doubt-corner': '/academics/doubt-corner',
  'dpp-management': '/academics/dpp-management',
  'study-material': '/study-material',
  finance: '/finance',
  notice: '/notice',
  settings: '/settings',
  profile: '/profile',
};

const routeToTab = {
  '/': 'dashboard',
  '/routine': 'routine',
  '/timetable': 'routine',
  '/timetable-routine': 'routine',
  '/academics': 'student-info',
  '/academics/students': 'student-info',
  '/academics/student-info': 'student-info',
  '/academics/attendance': 'attendance',
  '/academics/syllabus': 'syllabus-setup',
  '/academics/syllabus-setup': 'syllabus-setup',
  '/academics/exams': 'exam-evaluation',
  '/academics/exam-evaluation': 'exam-evaluation',
  '/academics/doubt-corner': 'doubt-corner',
  '/academics/dpp-management': 'dpp-management',
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
    let targetTab = tab;
    if (tab === 'academics') {
      targetTab = state?.section || 'student-info';
    }
    const route = tabToRoute[targetTab] || tabToRoute[tab];
    if (route) {
      navigate(route, { state });
    }
  };

  const navParams = location.state || {};

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
            <Route path="/routine" element={<TimetableRoutine onNavigate={handleTabChange} user={currentUser} />} />
            <Route path="/timetable" element={<Navigate to="/routine" replace />} />
            <Route path="/timetable-routine" element={<Navigate to="/routine" replace />} />

            {/* Direct Academic Sub-Routes */}
            <Route path="/academics" element={<Navigate to="/academics/student-info" replace />} />
            <Route path="/academics/students" element={<Navigate to="/academics/student-info" replace />} />
            <Route path="/academics/syllabus" element={<Navigate to="/academics/syllabus-setup" replace />} />
            <Route path="/academics/exams" element={<Navigate to="/academics/exam-evaluation" replace />} />

            <Route 
              path="/academics/student-info" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <StudentInfo onBack={() => handleTabChange('dashboard')} />
                </div>
              } 
            />
            <Route 
              path="/academics/attendance" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <Attendance 
                    onBack={() => handleTabChange('dashboard')} 
                    onNavigate={handleTabChange} 
                    initialBatch={navParams.batch} 
                    initialSubject={navParams.subject} 
                  />
                </div>
              } 
            />
            <Route 
              path="/academics/syllabus-setup" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <SyllabusSetup onBack={() => handleTabChange('dashboard')} />
                </div>
              } 
            />
            <Route 
              path="/academics/exam-evaluation" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <ExamEvaluation 
                    onBack={() => handleTabChange('dashboard')} 
                    onNavigateToStudentInfo={() => handleTabChange('student-info')} 
                  />
                </div>
              } 
            />
            <Route 
              path="/academics/doubt-corner" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <DoubtCorner 
                    onBack={() => handleTabChange('dashboard')} 
                    initialBatch={navParams.batch} 
                    initialSubject={navParams.subject} 
                  />
                </div>
              } 
            />
            <Route 
              path="/academics/dpp-management" 
              element={
                <div className="dt-academics-page dt-subpage">
                  <DppManagement 
                    onBack={() => handleTabChange('dashboard')} 
                    initialBatch={navParams.batch} 
                    initialSubject={navParams.subject} 
                  />
                </div>
              } 
            />

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
