import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import ChangeProfilePictureModal from './ChangeProfilePictureModal';

export function Settings({ onNavigate, onBackToLanding, user }) {
  // ── Teacher Profile Data ──
  const getInitialTeacherProfile = () => {
    if (user && user.full_name) {
      return {
        name: user.full_name,
        phone: user.phone || '9734354179',
        email: user.email || 'rd@gmail.com',
        avatarUrl: user.avatar_url || '/teacher-sudipta.png'
      };
    }
    try {
      const userStr = localStorage.getItem('digitute_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'TEACHER' || u.full_name) {
          return {
            name: u.full_name || 'Sudipta Mondal',
            phone: u.phone || '9734354179',
            email: u.email || 'rd@gmail.com',
            avatarUrl: u.avatar_url || '/teacher-sudipta.png'
          };
        }
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || 'Sudipta Mondal',
          phone: parsed.phone || '9734354179',
          email: parsed.email || 'rd@gmail.com',
          avatarUrl: parsed.avatarUrl || '/teacher-sudipta.png'
        };
      }
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Mondal',
      phone: '9734354179',
      email: 'rd@gmail.com',
      avatarUrl: '/teacher-sudipta.png'
    };
  };

  const [teacherProfile, setTeacherProfile] = useState(getInitialTeacherProfile);

  // Sync profile when user prop changes
  useEffect(() => {
    if (user) {
      setTeacherProfile(prev => ({
        ...prev,
        name: user.full_name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        avatarUrl: user.avatar_url || prev.avatarUrl
      }));
    }
  }, [user]);

  // Fetch real-time profile from database on mount & listen to profile update events
  useEffect(() => {
    let mounted = true;
    const fetchLatestProfile = async () => {
      try {
        const res = await apiRequest('/api/teacher/profile');
        if (res && mounted) {
          setTeacherProfile(prev => {
            const updated = {
              ...prev,
              name: res.full_name || prev.name,
              email: res.email || prev.email,
              phone: res.phone || prev.phone,
              avatarUrl: res.avatar_url !== undefined && res.avatar_url !== null ? res.avatar_url : prev.avatarUrl
            };
            try {
              localStorage.setItem('digitute_teacher_profile', JSON.stringify(updated));
              const userStr = localStorage.getItem('digitute_user');
              if (userStr) {
                const u = JSON.parse(userStr);
                if (res.email) u.email = res.email;
                if (res.phone) u.phone = res.phone;
                if (res.avatar_url !== undefined) u.avatar_url = res.avatar_url;
                if (res.full_name) u.full_name = res.full_name;
                localStorage.setItem('digitute_user', JSON.stringify(u));
              }
            } catch { /* ignore */ }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Could not fetch teacher profile from API:', err);
      }
    };

    fetchLatestProfile();

    const handleProfileUpdate = () => {
      try {
        const saved = localStorage.getItem('digitute_teacher_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          setTeacherProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch { /* ignore */ }
    };

    window.addEventListener('digitute-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('digitute-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const [pushEnabled, setPushEnabled] = useState(() => {
    const saved = localStorage.getItem('digitute_push_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  // ── Modals State ──
  // null | 'changePhoto' | 'changeEmail' | 'changeMobile' | 'changePassword' | 'privacy' | 'terms'
  const [activeModal, setActiveModal] = useState(null);

  // ── Toast Notification ──
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const updateProfile = (fields) => {
    const updated = { ...teacherProfile, ...fields };
    setTeacherProfile(updated);
    try {
      localStorage.setItem('digitute_teacher_profile', JSON.stringify(updated));
      const rawUser = localStorage.getItem('digitute_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (fields.email) u.email = fields.email;
        if (fields.phone) u.phone = fields.phone;
        if (fields.avatarUrl !== undefined) u.avatar_url = fields.avatarUrl;
        if (fields.name) u.full_name = fields.name;
        localStorage.setItem('digitute_user', JSON.stringify(u));
      }
      window.dispatchEvent(new Event('digitute-profile-updated'));
    } catch { /* ignore */ }
  };

  const handleTogglePush = () => {
    const nextVal = !pushEnabled;
    setPushEnabled(nextVal);
    try {
      localStorage.setItem('digitute_push_notifications', String(nextVal));
    } catch { /* ignore */ }
    showToast(nextVal ? 'Push notifications enabled' : 'Push notifications muted');
  };

  return (
    <div className="dt-refined-settings-page">
      <div className="dt-refined-settings-container">

        {/* ── Top Header ── */}
        <div className="dt-settings-top-bar">
          <h1 className="dt-settings-header-title">Settings</h1>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           1. ACCOUNT (Change Photo, Change Email, Change Mobile, Change Password)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">ACCOUNT</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* Change Profile Picture */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('changePhoto')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('changePhoto')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box blue">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Change Profile Picture</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Change Email (Replaces Change Username) */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('changeEmail')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('changeEmail')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box red">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Change Email</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Change Mobile Number (Below Change Email) */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('changeMobile')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('changeMobile')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box green">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Change Mobile Number</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Change Password */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('changePassword')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('changePassword')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box purple">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Change Password</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           2. PREFERENCES (Push Notifications Only)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">PREFERENCES</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* Push Notification */}
              <div className="dt-refined-menu-item no-pointer" onClick={handleTogglePush}>
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box teal">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className="dt-menu-text-wrap">
                    <span className="dt-menu-item-text">Push Notifications</span>
                  </div>
                </div>
                <label className="dt-refined-toggle" onClick={(e) => e.stopPropagation()} aria-label="Toggle Push Notification">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={handleTogglePush}
                  />
                  <span className="dt-refined-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           3. LEGAL & POLICIES (Privacy Policy + Terms and Conditions)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">LEGAL &amp; POLICIES</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* Privacy Policy */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('privacy')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('privacy')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box blue">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Privacy Policy</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Terms and Conditions */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('terms')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('terms')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box purple">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Terms and Conditions</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODALS ── */}
      {/* 1. Change Profile Picture Modal (Exact Student Twin Workflow with Supabase Storage) */}
      <ChangeProfilePictureModal
        isOpen={activeModal === 'changePhoto'}
        onClose={() => setActiveModal(null)}
        currentPhoto={teacherProfile.avatarUrl}
        userName={teacherProfile.name}
        onUploadSuccess={(url) => {
          updateProfile({ avatarUrl: url });
          showToast('Profile picture updated successfully!');
        }}
        onRemoveSuccess={() => {
          updateProfile({ avatarUrl: '' });
          showToast('Profile picture removed successfully');
        }}
        showToast={showToast}
      />

      {/* 2. Change Email Address Modal (Matching Sample Image 1) */}
      {activeModal === 'changeEmail' && (
        <ChangeEmailModal
          currentEmail={teacherProfile.email}
          onClose={() => setActiveModal(null)}
          onSave={(newEmail) => {
            updateProfile({ email: newEmail });
            setActiveModal(null);
            showToast('Email address updated successfully!');
          }}
          showToast={showToast}
        />
      )}

      {/* 3. Change Mobile Number Modal (Matching Sample Image 2) */}
      {activeModal === 'changeMobile' && (
        <ChangeMobileModal
          currentPhone={teacherProfile.phone}
          onClose={() => setActiveModal(null)}
          onSave={(newPhone) => {
            updateProfile({ phone: newPhone });
            setActiveModal(null);
            showToast('Mobile number updated successfully!');
          }}
          showToast={showToast}
        />
      )}

      {/* 4. Change Password Modal */}
      {activeModal === 'changePassword' && (
        <ChangePasswordModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            showToast('Password changed successfully');
          }}
        />
      )}

      {/* 5. Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <PrivacyPolicyModal onClose={() => setActiveModal(null)} />
      )}

      {/* 6. Terms Modal */}
      {activeModal === 'terms' && (
        <TermsModal onClose={() => setActiveModal(null)} />
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="dt-refined-toast">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// CHANGE EMAIL ADDRESS MODAL (Exact match of Sample Image)
// ==============================================================================
function ChangeEmailModal({ currentEmail, onClose, onSave, showToast }) {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (newEmail || '').trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email format');
      return;
    }

    const curr = (currentEmail || '').trim().toLowerCase();
    if (trimmed === curr) {
      setError('New email is identical to your current email');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await apiRequest('/api/teacher/email', {
        method: 'PUT',
        body: JSON.stringify({ email: trimmed })
      });

      if (res && res.success) {
        onSave(res.email || trimmed);
      } else {
        throw new Error(res?.detail || 'Failed to update email address.');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to update email. Please try again.';
      setError(msg);
      if (showToast) showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sp-dialog-backdrop" onClick={onClose}>
      <div className="sp-dialog-box" onClick={(e) => e.stopPropagation()}>
        <h4 className="sp-dialog-title" style={{ fontSize: '20px', fontWeight: '750', color: '#0f172a', marginBottom: '8px' }}>Change Email Address</h4>
        <p className="sp-dialog-desc" style={{ marginBottom: '22px' }}>
          Current Email: <strong>{currentEmail || 'Not set'}</strong><br/>
          Enter your new email address below.
        </p>

        {error && (
          <div className="sp-avatar-modal-error-banner" style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#DC2626' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              New Email Address
            </label>
            <input 
              type="email"
              className="sp-dialog-input"
              style={{ marginBottom: '0' }}
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError('');
              }}
              placeholder="new.email@example.com"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="sp-dialog-actions">
            <button 
              type="button"
              className="sp-dialog-cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="sp-dialog-confirm-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// CHANGE MOBILE NUMBER MODAL (Exact match of Sample Image)
// ==============================================================================
function ChangeMobileModal({ currentPhone, onClose, onSave, showToast }) {
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (newPhone || '').trim();
    const digits = trimmed.replace(/[^0-9]/g, '');

    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const currentDigits = (currentPhone || '').replace(/[^0-9]/g, '');
    if (digits === currentDigits) {
      setError('New mobile number is identical to your current number');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await apiRequest('/api/teacher/phone', {
        method: 'PUT',
        body: JSON.stringify({ phone: trimmed })
      });

      if (res && res.success) {
        onSave(res.phone || trimmed);
      } else {
        throw new Error(res?.detail || 'Failed to update mobile number.');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to update mobile number. Please try again.';
      setError(msg);
      if (showToast) showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sp-dialog-backdrop" onClick={onClose}>
      <div className="sp-dialog-box" onClick={(e) => e.stopPropagation()}>
        <h4 className="sp-dialog-title" style={{ fontSize: '20px', fontWeight: '750', color: '#0f172a', marginBottom: '8px' }}>Change Mobile Number</h4>
        <p className="sp-dialog-desc" style={{ marginBottom: '22px' }}>
          Current Number: <strong>{currentPhone || 'Not set'}</strong><br/>
          Enter your new 10-digit mobile number below.
        </p>

        {error && (
          <div className="sp-avatar-modal-error-banner" style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#DC2626' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              New Mobile Number
            </label>
            <input 
              type="tel"
              className="sp-dialog-input"
              style={{ marginBottom: '0' }}
              value={newPhone}
              onChange={(e) => {
                setNewPhone(e.target.value);
                setError('');
              }}
              placeholder="e.g. 9830111222"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="sp-dialog-actions">
            <button 
              type="button"
              className="sp-dialog-cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="sp-dialog-confirm-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// CHANGE PASSWORD MODAL
// ==============================================================================
function ChangePasswordModal({ onClose, onSuccess }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    onSuccess();
  };

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Change Password</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dt-modal-form">
          {error && <div className="dt-form-alert error">{error}</div>}
          <div className="dt-form-group">
            <label className="dt-form-label">New Password</label>
            <input
              type="password"
              className="dt-form-input"
              value={newPass}
              onChange={(e) => { setNewPass(e.target.value); setError(''); }}
              placeholder="At least 6 characters"
              autoFocus
              required
            />
          </div>
          <div className="dt-form-group">
            <label className="dt-form-label">Confirm New Password</label>
            <input
              type="password"
              className="dt-form-input"
              value={confirmPass}
              onChange={(e) => { setConfirmPass(e.target.value); setError(''); }}
              placeholder="Re-enter new password"
              required
            />
          </div>
          <div className="dt-modal-actions">
            <button type="button" className="dt-btn dt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="dt-btn dt-btn-primary">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// PRIVACY POLICY MODAL
// ==============================================================================
function PrivacyPolicyModal({ onClose }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Privacy Policy</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dt-modal-body dt-terms-text">
          <h4>1. Faculty Data &amp; Account Protection</h4>
          <p>
            DigiTute is committed to safeguarding faculty and teacher data. Personal contact details, account credentials, and communication logs are encrypted and never shared with third parties.
          </p>
          <h4>2. Student Academic Privacy</h4>
          <p>
            Faculty evaluation records, student attendance marks, and internal assessment grades remain proprietary to your institution and are protected under strict educational confidentiality standards.
          </p>
          <h4>3. Security Compliance</h4>
          <p>
            All network communication, test results, and DPP management activities utilize secure token-based verification protocols to prevent unauthorized access.
          </p>
        </div>
        <div className="dt-modal-actions">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// TERMS & CONDITIONS MODAL
// ==============================================================================
function TermsModal({ onClose }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Terms &amp; Conditions</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dt-modal-body dt-terms-text">
          <h4>1. Faculty Conduct &amp; Content</h4>
          <p>Teaching materials, questions, and tests uploaded are governed by institutional curriculum guidelines.</p>
          <h4>2. Student Privacy</h4>
          <p>Student attendance, marks, and personal contact info must remain strictly confidential.</p>
          <h4>3. Portal Security</h4>
          <p>Do not share teacher credentials or session tokens with unauthorized devices.</p>
        </div>
        <div className="dt-modal-actions">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
