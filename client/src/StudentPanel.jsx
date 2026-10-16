import React, { useState } from 'react';
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
import PaymentModal from './components/Student/PaymentModal';

export default function StudentPanel({ onBackToLanding }) {
  // Navigation active tab: 'dashboard' | 'classes' | 'materials' | 'assignments' | 'tests' | 'results' | 'performance' | 'fees' | 'doubts' | 'announcements' | 'settings' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testsMenuOpen, setTestsMenuOpen] = useState(true);
  const [testSubTab, setTestSubTab] = useState('performance'); // 'performance' | 'results'

  // Header popovers & feedback
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Helper to show temporary toasts
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handlePaymentSuccess = () => {
    setPaymentDone(true);
    setPayModalOpen(false);
    showToast('Payment of ₹600 received successfully! Receipt generated.');
  };

  return (
    <div className="sp-layout-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sp-floating-toast">
          <span>✓</span> {toastMessage}
        </div>
      )}



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
          onOpenMobileProfile={() => setMobileProfileOpen(true)}
        />

        {/* TAB CONTENTS */}
        <main className="sp-content-body">
          {activeTab === 'dashboard' && (
            <DashboardTab setActiveTab={setActiveTab} />
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
            <FeesTab
              paymentDone={paymentDone}
              setPayModalOpen={setPayModalOpen}
              showToast={showToast}
            />
          )}

          {activeTab === 'doubts' && (
            <DoubtCornerTab showToast={showToast} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsTab showToast={showToast} />
          )}

          {activeTab === 'profile' && (
            <StudentProfilePage 
              onBack={() => setActiveTab('dashboard')}
              onOpenSettings={() => setActiveTab('settings')}
              onLogout={onBackToLanding}
            />
          )}

          {activeTab === 'settings' && (
            <ProfileTab showToast={showToast} onBack={() => setActiveTab('dashboard')} />
          )}
        </main>
      </div>

      {/* MODAL: Fee Payment Gateway */}
      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
