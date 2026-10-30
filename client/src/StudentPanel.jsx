import React, { useState, useEffect } from 'react';
import Sidebar from './components/Student/Sidebar';
import TopHeader from './components/Student/TopHeader';
import DashboardTab from './components/Student/DashboardTab';
import ClassesTab from './components/Student/ClassesTab';
import StudyMaterialsTab from './components/Student/StudyMaterialsTab';
import AssignmentsTab from './components/Student/AssignmentsTab';
import TestsTab from './components/Student/TestsTab';
import FeesTab from './components/Student/FeesTab';
import DoubtCornerTab from './components/Student/DoubtCornerTab';
import AnnouncementsTab from './components/Student/AnnouncementsTab';
import ProfileTab from './components/Student/ProfileTab';
import StudentProfilePage from './components/Student/StudentProfilePage';
import { apiRequest } from './api';

export default function StudentPanel({ onBackToLanding }) {
  // Navigation active tab: 'dashboard' | 'classes' | 'materials' | 'assignments' | 'tests' | 'results' | 'performance' | 'fees' | 'doubts' | 'announcements' | 'settings' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testsMenuOpen, setTestsMenuOpen] = useState(false);
  const [testSubTab, setTestSubTab] = useState('performance'); // 'performance' | 'results'

  // Current logged in student user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('digitute_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Auth Guard & live profile fetch
  useEffect(() => {
    const token = localStorage.getItem('digitute_token');
    const refreshToken = localStorage.getItem('digitute_refresh_token');
    if (!token && !refreshToken) {
      if (onBackToLanding) onBackToLanding();
      return;
    }

    let isMounted = true;
    apiRequest('/api/student/my-profile')
      .then((profile) => {
        if (isMounted && profile) {
          setCurrentUser((prev) => ({ ...prev, ...profile }));
        }
      })
      .catch((err) => {
        console.warn('Student profile fetch error:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [onBackToLanding]);

  // Header popovers & feedback
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Helper to show temporary toasts
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handlePaymentSuccess = (res) => {
    setPaymentDone(prev => !prev);
    setPayModalOpen(false);
    const amt = res?.amount_paid ? `₹${Number(res.amount_paid).toLocaleString('en-IN')}` : 'fee';
    showToast(`Payment of ${amt} received successfully via Razorpay! Receipt generated.`);
  };

  const handleUpdateUser = (fields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem('digitute_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const studentProfileData = currentUser ? {
    id: currentUser.id,
    student_id: currentUser.id,
    isMe: true,
    name: currentUser.full_name || 'Ram Dey',
    batch: (Array.isArray(currentUser.batches) ? currentUser.batches[0]?.name : currentUser.batches?.name) || currentUser.batch || 'WBJEE 2027',
    session: '2026 - 2027',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    photo: currentUser.avatar_url || currentUser.photo || null
  } : undefined;

  return (
    <div className="sp-layout-root">
      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          className="sp-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        testsMenuOpen={testsMenuOpen}
        setTestsMenuOpen={setTestsMenuOpen}
        testSubTab={testSubTab}
        setTestSubTab={setTestSubTab}
        onBackToLanding={onBackToLanding}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      {/* MAIN VIEW AREA */}
      <div className="sp-main-wrapper">
        {/* TOP HEADER */}
        <TopHeader
          notificationOpen={notificationOpen}
          setNotificationOpen={setNotificationOpen}
          profileDropdownOpen={profileDropdownOpen}
          setProfileDropdownOpen={setProfileDropdownOpen}
          setActiveTab={setActiveTab}
          onBackToLanding={onBackToLanding}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          user={currentUser}
        />

        {/* TAB CONTENTS */}
        <main className="sp-content-body">
          {activeTab === 'dashboard' && (
            <DashboardTab setActiveTab={setActiveTab} user={currentUser} />
          )}

          {activeTab === 'classes' && (
            <ClassesTab showToast={showToast} />
          )}

          {activeTab === 'materials' && (
            <StudyMaterialsTab showToast={showToast} />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsTab showToast={showToast} />
          )}

          {(activeTab === 'tests' || activeTab === 'results' || activeTab === 'performance') && (
            <TestsTab
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              testSubTab={testSubTab}
              setTestSubTab={setTestSubTab}
              showToast={showToast}
            />
          )}

          {activeTab === 'fees' && (
            <FeesTab showToast={showToast} />
          )}

          {activeTab === 'doubts' && (
            <DoubtCornerTab showToast={showToast} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsTab showToast={showToast} />
          )}

          {activeTab === 'profile' && (
            <StudentProfilePage 
              studentProfile={studentProfileData}
              onBack={() => setActiveTab('dashboard')}
              onOpenSettings={() => setActiveTab('settings')}
              onLogout={onBackToLanding}
              onUpdateUser={handleUpdateUser}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <ProfileTab showToast={showToast} onBack={() => setActiveTab('dashboard')} user={currentUser} onUpdateUser={handleUpdateUser} />
          )}
        </main>
      </div>


    </div>
  );
}
