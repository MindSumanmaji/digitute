import React, { useState, useEffect, useRef } from 'react';

export function Profile({ onNavigate, onBackToLanding, user }) {
  // Modal states: null | 'helpSupport' | 'about' | 'logoutConfirm'
  const [activeModal, setActiveModal] = useState(null);

  const getStoredAvatar = () => {
    try {
      const userStr = localStorage.getItem('digitute_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.avatar_url) return u.avatar_url;
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatarUrl) return parsed.avatarUrl;
      }
    } catch { /* ignore */ }
    return '/teacher-sudipta.png';
  };

  const [avatar, setAvatar] = useState(getStoredAvatar);

  useEffect(() => {
    const handleUpdate = () => {
      setAvatar(getStoredAvatar());
    };
    window.addEventListener('digitute-profile-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('digitute-profile-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const getInitialTeacher = () => {
    if (user && user.full_name) {
      return {
        name: user.full_name,
        role: user.role === 'TEACHER' ? 'Teacher' : (user.specialization || 'Teacher'),
        phone: user.phone || '9734417711',
        email: user.email || 'Sudipta@digi.com',
        qualification: user.specialization || 'M.Sc. (Computer Science), B.Ed.'
      };
    }
    try {
      const userStr = localStorage.getItem('digitute_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'TEACHER' || u.full_name) {
          return {
            name: u.full_name || 'Sudipta Mondal',
            role: 'Teacher',
            phone: u.phone || '9734417711',
            email: u.email || 'Sudipta@digi.com',
            qualification: u.specialization || 'M.Sc. (Computer Science), B.Ed.'
          };
        }
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return {
          name: p.name || 'Sudipta Mondal',
          role: p.role || 'Teacher',
          phone: p.phone || '9734417711',
          email: p.email || 'Sudipta@digi.com',
          qualification: p.qualification || 'M.Sc. (Computer Science), B.Ed.'
        };
      }
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Mondal',
      role: 'Teacher',
      phone: '9734417711',
      email: 'Sudipta@digi.com',
      qualification: 'M.Sc. (Computer Science), B.Ed.'
    };
  };

  const [teacherInfo, setTeacherInfo] = useState(getInitialTeacher);

  useEffect(() => {
    if (user) {
      setTeacherInfo(getInitialTeacher());
    }
  }, [user]);

  const teacherData = {
    ...teacherInfo,
    avatar: avatar
  };

  const handleLogout = () => {
    setActiveModal(null);
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      localStorage.removeItem('digitute_active_view');
      window.location.hash = '#landing';
      window.location.reload();
    }
  };

  return (
    <div className="dt-profile-page">
      <div className="dt-profile-container">



        {/* ── Hero Card with Wavy Background & Avatar ── */}
        <div className="dt-profile-hero-card">
          {/* Subtle wavy gradient banner */}
          <div className="dt-profile-wave-banner" aria-hidden="true">
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="dt-profile-wave-svg">
              <path d="M0,25 C150,70 320,10 500,45 L500,0 L0,0 Z" fill="#DCEFFE" opacity="0.8" />
              <path d="M0,45 C180,85 300,25 500,60 L500,0 L0,0 Z" fill="#EFF6FF" opacity="0.95" />
            </svg>
          </div>

          {/* Avatar Container */}
          <div className="dt-profile-avatar-box">
            <img
              src={teacherData.avatar}
              alt={teacherData.name}
              className="dt-profile-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/student-avatar.jpg';
              }}
            />
          </div>

          {/* Name & Role Badge */}
          <h2 className="dt-profile-user-name">{teacherData.name}</h2>
          <div className="dt-profile-role-pill">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6D28D9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>{teacherData.role}</span>
          </div>

          {/* ── Teacher Info Card ── */}
          <div className="dt-profile-details-card">
            {/* Phone */}
            <div className="dt-profile-detail-row">
              <div className="dt-profile-icon-square icon-blue">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="dt-profile-detail-text">
                <span className="dt-profile-detail-label">Phone</span>
                <span className="dt-profile-detail-value">{teacherData.phone}</span>
              </div>
            </div>

            <div className="dt-profile-divider-line" />

            {/* Email */}
            <div className="dt-profile-detail-row">
              <div className="dt-profile-icon-square icon-purple">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="dt-profile-detail-text">
                <span className="dt-profile-detail-label">Email</span>
                <span className="dt-profile-detail-value">{teacherData.email}</span>
              </div>
            </div>

            <div className="dt-profile-divider-line" />

            {/* Qualification */}
            <div className="dt-profile-detail-row">
              <div className="dt-profile-icon-square icon-green">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="dt-profile-detail-text">
                <span className="dt-profile-detail-label">Qualification</span>
                <span className="dt-profile-detail-value">{teacherData.qualification}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions Card (Settings, Help & Support, About DigiTute) ── */}
        <div className="dt-profile-nav-card">
          {/* Settings */}
          <div
            className="dt-profile-nav-row"
            onClick={() => onNavigate && onNavigate('settings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate && onNavigate('settings')}
          >
            <div className="dt-profile-nav-left">
              <div className="dt-profile-icon-square icon-blue">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94-1.543 .826-3.31 2.37-2.37c1 .608 2.296 .07 2.572-1.065z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="dt-profile-nav-title">Settings</span>
            </div>
            <svg className="dt-profile-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="dt-profile-divider-line" />

          {/* Help & Support */}
          <div
            className="dt-profile-nav-row"
            onClick={() => setActiveModal('helpSupport')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('helpSupport')}
          >
            <div className="dt-profile-nav-left">
              <div className="dt-profile-icon-square icon-green">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="dt-profile-nav-title">Help &amp; Support</span>
            </div>
            <svg className="dt-profile-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="dt-profile-divider-line" />

          {/* About DigiTute */}
          <div
            className="dt-profile-nav-row"
            onClick={() => setActiveModal('about')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('about')}
          >
            <div className="dt-profile-nav-left">
              <div className="dt-profile-icon-square icon-orange">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <span className="dt-profile-nav-title">About DigiTute</span>
            </div>
            <svg className="dt-profile-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* ── Centered Logout Button at Bottom ── */}
        <div className="dt-profile-logout-wrap">
          <button
            type="button"
            className="dt-profile-logout-btn"
            onClick={() => setActiveModal('logoutConfirm')}
            aria-label="Log out from Teacher Portal"
          >
            <div className="dt-profile-logout-icon-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <polyline points="15 7 20 12 15 17" />
              </svg>
            </div>
            <span className="dt-profile-logout-text">Log out</span>
          </button>
        </div>

      </div>

      {/* ── Modals ── */}
      {activeModal === 'helpSupport' && (
        <HelpSupportModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'about' && (
        <AboutModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'logoutConfirm' && (
        <LogoutDialog
          onClose={() => setActiveModal(null)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

function HelpSupportModal({ onClose }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Help &amp; Support</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dt-modal-body">
          <p className="dt-modal-desc">
            For technical assistance, batch adjustments, or account help, contact the DigiTute Administration team:
          </p>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Admin Desk Phone</span>
              <strong className="dt-contact-value">+91 97344 17711</strong>
            </div>
            <a href="tel:+919734417711" className="dt-btn dt-btn-secondary dt-btn-sm">Call</a>
          </div>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Admin Email</span>
              <strong className="dt-contact-value">support@digitute.com</strong>
            </div>
            <a href="mailto:support@digitute.com" className="dt-btn dt-btn-secondary dt-btn-sm">Email</a>
          </div>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Support Window</span>
              <strong className="dt-contact-value">Monday – Saturday (9:00 AM – 7:00 PM)</strong>
            </div>
          </div>
        </div>
        <div className="dt-modal-actions">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function AboutModal({ onClose }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">About DigiTute</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dt-modal-body dt-about-content">
          <div className="dt-about-badge">DigiTute Education Operating System</div>
          <p>
            DigiTute is an integrated modern education management ecosystem connecting classroom operations, faculty workflows, attendance, and student academic progress.
          </p>
          <p>
            <strong>Version:</strong> v2.4.0 (Build 2026.10)
          </p>
          <p>
            <strong>Portal:</strong> Faculty &amp; Teacher Portal
          </p>
        </div>
        <div className="dt-modal-actions">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function LogoutDialog({ onClose, onConfirm }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet dt-modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dt-dialog-icon red">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <div className="dt-dialog-content">
          <h3 className="dt-dialog-title">Log Out</h3>
          <p className="dt-dialog-message">Are you sure you want to log out of your DigiTute teacher account?</p>
        </div>
        <div className="dt-dialog-actions">
          <button type="button" className="dt-btn dt-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="dt-btn dt-btn-destructive" onClick={onConfirm}>Log Out</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
