import { apiRequest } from '../../api';
import React, { useState, useEffect } from 'react';
import StudentProfileCardModal from './StudentProfileCardModal';
import ChangeProfilePictureModal from './ChangeProfilePictureModal';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileTab({ showToast, onBack, user, onUpdateUser }) {
  // Modal state for Profile Card
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [changePhotoModalOpen, setChangePhotoModalOpen] = useState(false);

  // Profile data
  const [studentProfile, setStudentProfile] = useState(() => ({
    id: user?.id,
    student_id: user?.id,
    isMe: true,
    name: user?.full_name || 'Ram Dey',
    handle: user?.full_name ? `@${user.full_name.toLowerCase().replace(/\s+/g, '')}` : '@ramdey',
    batch: (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name) || user?.batch || 'WBJEE 2027',
    institute: 'DigiTute Institute',
    session: '2026 - 2027',
    photo: user?.avatar_url || user?.photo || null,
    email: user?.email || '',
    phone: user?.phone || '',
    roll: 'B-1779',
    guardian: 'Parent / Guardian',
    campus: 'DigiTute Main Campus',
    pushEnabled: true,
    attendanceAlerts: true,
    testAlerts: true
  }));

  useEffect(() => {
    if (user) {
      setStudentProfile(prev => ({
        ...prev,
        id: user.id || prev.id,
        student_id: user.id || prev.student_id,
        isMe: true,
        name: user.full_name || prev.name,
        handle: user.full_name ? `@${user.full_name.toLowerCase().replace(/\s+/g, '')}` : prev.handle,
        batch: (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name) || user?.batch || prev.batch,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        photo: user.avatar_url || user.photo || prev.photo,
      }));
    }
  }, [user]);

  // Modal sub-dialogs for actions
  const [activeModal, setActiveModal] = useState(null); // 'picture' | 'email' | 'password' | 'about' | 'privacy' | 'terms' | 'support'
  const [tempInput, setTempInput] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [newMobileInput, setNewMobileInput] = useState('');
  const [isUpdatingMobile, setIsUpdatingMobile] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleTogglePush = () => {
    const updated = !studentProfile.pushEnabled;
    setStudentProfile(prev => ({ ...prev, pushEnabled: updated }));
    if (showToast) {
      showToast(updated ? 'Push notifications enabled!' : 'Push notifications muted.');
    }
  };

  const handleActionClick = (actionName) => {
    if (actionName === 'picture') {
      setChangePhotoModalOpen(true);
    } else if (actionName === 'email') {
      setNewEmailInput('');
      setEmailError('');
      setActiveModal('email');
    } else if (actionName === 'mobile') {
      setNewMobileInput('');
      setMobileError('');
      setActiveModal('mobile');
    } else if (actionName === 'password') {
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordError('');
      setActiveModal('password');
    } else if (actionName === 'support') {
      setActiveModal('support');
    } else if (actionName === 'about') {
      setActiveModal('about');
    } else if (actionName === 'privacy') {
      setActiveModal('privacy');
    } else if (actionName === 'terms') {
      setActiveModal('terms');
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError('');
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    const cleanNew = newEmailInput.trim().toLowerCase();

    if (!cleanNew) {
      setEmailError('Please enter your new email address.');
      return;
    }

    if (!emailRegex.test(cleanNew)) {
      setEmailError('Please enter a valid email format (e.g. name@example.com).');
      return;
    }

    if (cleanNew === (studentProfile.email || '').trim().toLowerCase()) {
      setEmailError('New email is identical to your current email address.');
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const res = await apiRequest('/api/student/email', {
        method: 'PUT',
        body: JSON.stringify({
          email: cleanNew
        })
      });

      if (res?.success) {
        setStudentProfile(prev => ({ ...prev, email: res.email }));
        if (onUpdateUser) {
          onUpdateUser({ email: res.email });
        }
        if (showToast) {
          showToast('Email address updated successfully in database!');
        }
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Update email failed:', err);
      setEmailError(err.message || 'Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdateMobile = async () => {
    setMobileError('');
    const cleanPhone = newMobileInput.trim();
    const digits = cleanPhone.replace(/\D/g, '');

    if (!cleanPhone) {
      setMobileError('Please enter your new mobile number.');
      return;
    }

    if (digits.length < 10) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const currentDigits = (studentProfile.phone || '').replace(/\D/g, '');
    if (digits === currentDigits) {
      setMobileError('New mobile number is identical to your current number.');
      return;
    }

    try {
      setIsUpdatingMobile(true);
      const res = await apiRequest('/api/student/phone', {
        method: 'PUT',
        body: JSON.stringify({
          phone: cleanPhone
        })
      });

      if (res?.success) {
        setStudentProfile(prev => ({ ...prev, phone: res.phone }));
        if (onUpdateUser) {
          onUpdateUser({ phone: res.phone });
        }
        if (showToast) {
          showToast('Mobile number updated successfully in database!');
        }
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Update mobile failed:', err);
      setMobileError(err.message || 'Failed to update mobile number. Please try again.');
    } finally {
      setIsUpdatingMobile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    const cleanNew = newPasswordInput.trim();
    const cleanConfirm = confirmPasswordInput.trim();

    if (!cleanNew) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (cleanNew.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (!cleanConfirm) {
      setPasswordError('Please confirm your new password.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await apiRequest('/api/student/password', {
        method: 'PUT',
        body: JSON.stringify({
          new_password: cleanNew,
          confirm_password: cleanConfirm
        })
      });

      if (res?.success) {
        if (showToast) {
          showToast('Password updated successfully in database! Use it for your next login.');
        }
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Update password failed:', err);
      setPasswordError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveModal = (type) => {
    if (type === 'email') {
      handleUpdateEmail();
    } else if (type === 'mobile') {
      handleUpdateMobile();
    } else if (type === 'password') {
      handleUpdatePassword();
    } else if (type === 'picture') {
      if (showToast) showToast('Profile picture updated successfully!');
      setActiveModal(null);
    }
  };

  return (
    <div className="sp-view-container sp-profile-settings-page">
      {/* 1. Top Header Navigation */}
      <div className="sp-settings-top-nav">
        {onBack && (
          <button 
            type="button"
            className="sp-settings-back-btn"
            onClick={onBack}
            title="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <h2 className="sp-settings-header-title">Settings</h2>
      </div>

      <div className="sp-settings-main-wrapper">


        {/* 3. Grouped Settings Section 1: Account */}
        <div className="sp-settings-group">
          <h4 className="sp-settings-group-title">Account</h4>
          <div className="sp-settings-card-stack">
            {/* Change Profile Picture */}
            <div 
              className="sp-setting-row"
              onClick={() => setChangePhotoModalOpen(true)}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box green">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Change Profile Photo</span>
              </div>
              <div className="sp-setting-photo-pill">
                <ProfileAvatar
                  src={studentProfile.photo}
                  name={studentProfile.name}
                  size={32}
                  className="sp-setting-photo-thumb"
                />
                <span className="sp-sr-chevron">›</span>
              </div>
            </div>

            {/* Change Email */}
            <div 
              className="sp-setting-row"
              onClick={() => handleActionClick('email')}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box red">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Change Email</span>
              </div>
              <span className="sp-sr-chevron">›</span>
            </div>

            {/* Change Mobile */}
            <div 
              className="sp-setting-row"
              onClick={() => handleActionClick('mobile')}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box green" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Change Mobile</span>
              </div>
              <span className="sp-sr-chevron">›</span>
            </div>

            {/* Change Password */}
            <div 
              className="sp-setting-row"
              onClick={() => handleActionClick('password')}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box blue">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Change Password</span>
              </div>
              <span className="sp-sr-chevron">›</span>
            </div>
          </div>
        </div>

        {/* 4. Grouped Settings Section 2: Preferences */}
        <div className="sp-settings-group">
          <h4 className="sp-settings-group-title">Preferences</h4>
          <div className="sp-settings-card-stack">
            {/* Push Notifications Toggle */}
            <div className="sp-setting-row no-hover">
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box blue">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Push Notifications</span>
              </div>
              <label className="sp-ios-switch">
                <input 
                  type="checkbox" 
                  checked={studentProfile.pushEnabled} 
                  onChange={handleTogglePush}
                />
                <span className="sp-ios-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* 5. Grouped Settings Section 3: Legal & Policies */}
        <div className="sp-settings-group">
          <h4 className="sp-settings-group-title">Legal & Policies</h4>
          <div className="sp-settings-card-stack">
            {/* Privacy Policy */}
            <div 
              className="sp-setting-row"
              onClick={() => handleActionClick('privacy')}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box blue">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Privacy Policy</span>
              </div>
              <span className="sp-sr-chevron">›</span>
            </div>

            {/* Terms & Conditions */}
            <div 
              className="sp-setting-row"
              onClick={() => handleActionClick('terms')}
              role="button"
              tabIndex={0}
            >
              <div className="sp-sr-left">
                <div className="sp-sr-icon-box blue">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <span className="sp-sr-label">Terms & Conditions</span>
              </div>
              <span className="sp-sr-chevron">›</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Action Dialog / Modal Popups for settings */}
      {activeModal && (
        <div className="sp-dialog-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-dialog-box" onClick={(e) => e.stopPropagation()}>
            {activeModal === 'email' && (
              <>
                <h4 className="sp-dialog-title">Change Email Address</h4>
                <p className="sp-dialog-desc">
                  Current Email: <strong>{studentProfile.email}</strong><br/>
                  Enter your new email address below.
                </p>

                {emailError && (
                  <div className="sp-avatar-modal-error-banner" style={{ margin: '0 0 14px 0', fontSize: '0.82rem' }}>
                    <span>⚠️</span> {emailError}
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    New Email Address
                  </label>
                  <input 
                    type="email"
                    className="sp-dialog-input"
                    style={{ marginBottom: '0' }}
                    value={newEmailInput}
                    onChange={(e) => {
                      setNewEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="new.email@example.com"
                    autoFocus
                    disabled={isUpdatingEmail}
                  />
                </div>

                <div className="sp-dialog-actions">
                  <button 
                    className="sp-dialog-cancel-btn" 
                    onClick={() => setActiveModal(null)}
                    disabled={isUpdatingEmail}
                  >
                    Cancel
                  </button>
                  <button 
                    className="sp-dialog-confirm-btn" 
                    onClick={handleUpdateEmail}
                    disabled={isUpdatingEmail}
                  >
                    {isUpdatingEmail ? 'Updating DB...' : 'Update Email'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'mobile' && (
              <>
                <h4 className="sp-dialog-title">Change Mobile Number</h4>
                <p className="sp-dialog-desc">
                  Current Number: <strong>{studentProfile.phone}</strong><br/>
                  Enter your new 10-digit mobile number below.
                </p>

                {mobileError && (
                  <div className="sp-avatar-modal-error-banner" style={{ margin: '0 0 14px 0', fontSize: '0.82rem' }}>
                    <span>⚠️</span> {mobileError}
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    New Mobile Number
                  </label>
                  <input 
                    type="tel"
                    className="sp-dialog-input"
                    style={{ marginBottom: '0' }}
                    value={newMobileInput}
                    onChange={(e) => {
                      setNewMobileInput(e.target.value);
                      setMobileError('');
                    }}
                    placeholder="e.g. 9830111222"
                    autoFocus
                    disabled={isUpdatingMobile}
                  />
                </div>

                <div className="sp-dialog-actions">
                  <button 
                    className="sp-dialog-cancel-btn" 
                    onClick={() => setActiveModal(null)}
                    disabled={isUpdatingMobile}
                  >
                    Cancel
                  </button>
                  <button 
                    className="sp-dialog-confirm-btn" 
                    onClick={handleUpdateMobile}
                    disabled={isUpdatingMobile}
                  >
                    {isUpdatingMobile ? 'Updating DB...' : 'Update Number'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'password' && (
              <>
                <h4 className="sp-dialog-title">Change Password</h4>
                <p className="sp-dialog-desc">
                  Create a secure new password (minimum 6 characters).<br/>
                  Enter and confirm your new password below.
                </p>

                {passwordError && (
                  <div className="sp-avatar-modal-error-banner" style={{ margin: '0 0 14px 0', fontSize: '0.82rem' }}>
                    <span>⚠️</span> {passwordError}
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    1. Enter New Password
                  </label>
                  <input 
                    type="password"
                    className="sp-dialog-input"
                    style={{ marginBottom: '0' }}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter at least 6 characters"
                    autoFocus
                    disabled={isUpdatingPassword}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    2. Confirm New Password
                  </label>
                  <input 
                    type="password"
                    className="sp-dialog-input"
                    style={{ marginBottom: '0' }}
                    value={confirmPasswordInput}
                    onChange={(e) => {
                      setConfirmPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Re-enter new password"
                    disabled={isUpdatingPassword}
                  />
                </div>

                <div className="sp-dialog-actions">
                  <button 
                    className="sp-dialog-cancel-btn" 
                    onClick={() => setActiveModal(null)}
                    disabled={isUpdatingPassword}
                  >
                    Cancel
                  </button>
                  <button 
                    className="sp-dialog-confirm-btn" 
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? 'Updating DB...' : 'Confirm & Update Password'}
                  </button>
                </div>
              </>
            )}



            {activeModal === 'support' && (
              <>
                <h4 className="sp-dialog-title">Help & Support</h4>
                <div className="sp-dialog-info-content">
                  <p><strong>Campus Helpline:</strong> +91 98301 00000</p>
                  <p><strong>Student Support Email:</strong> support@digitute.app</p>
                  <p><strong>Academic Office Hours:</strong> Mon - Sat (9:00 AM - 7:00 PM)</p>
                  <p>For urgent doubt clarifications or fee ledger discrepancies, please contact your batch coordinator.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Got It</button>
                </div>
              </>
            )}

            {activeModal === 'about' && (
              <>
                <h4 className="sp-dialog-title">About DigiTute</h4>
                <div className="sp-dialog-info-content">
                  <p><strong>DigiTute Learning Platform</strong></p>
                  <p>Version: 2.4.0 (2026 Edition)</p>
                  <p>Comprehensive Hybrid Classroom & Coaching Management Suite designed for excellence in secondary and competitive exam preparation.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Close</button>
                </div>
              </>
            )}

            {activeModal === 'privacy' && (
              <>
                <h4 className="sp-dialog-title">Privacy Policy</h4>
                <div className="sp-dialog-info-content">
                  <p>Your academic records, test scores, and attendance are strictly private and accessible only to authorized faculty and your registered guardian.</p>
                  <p>DigiTute adheres to industry-standard data protection guidelines.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Understood</button>
                </div>
              </>
            )}

            {activeModal === 'terms' && (
              <>
                <h4 className="sp-dialog-title">Terms & Conditions</h4>
                <div className="sp-dialog-info-content">
                  <p>Access to study materials, recorded sessions, and batch tests is granted solely for registered students of Class XII - Science batch.</p>
                  <p>Redistribution of institute materials is strictly prohibited.</p>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-confirm-btn" onClick={() => setActiveModal(null)}>Accept</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 7. Student Profile Card Modal (Directly displays the card from the screenshot) */}
      <StudentProfileCardModal 
        isOpen={profileCardOpen}
        onClose={() => setProfileCardOpen(false)}
        studentData={studentProfile}
        showToast={showToast}
      />

      {/* Change Profile Photo Modal */}
      <ChangeProfilePictureModal
        isOpen={changePhotoModalOpen}
        onClose={() => setChangePhotoModalOpen(false)}
        currentPhoto={studentProfile.photo}
        userName={studentProfile.name}
        showToast={showToast}
        onUploadSuccess={(newAvatarUrl) => {
          setStudentProfile(prev => ({ ...prev, photo: newAvatarUrl }));
          if (onUpdateUser) onUpdateUser({ avatar_url: newAvatarUrl });
        }}
        onRemoveSuccess={() => {
          setStudentProfile(prev => ({ ...prev, photo: null }));
          if (onUpdateUser) onUpdateUser({ avatar_url: null });
        }}
      />
    </div>
  );
}
