import React, { useState, useEffect } from 'react';
import StudentProfileCardModal from './StudentProfileCardModal';

export default function ProfileTab({ showToast, onBack, user }) {
  // Modal state for Profile Card
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  // Profile data
  const [studentProfile, setStudentProfile] = useState(() => ({
    name: user?.full_name || 'Suman Maji',
    handle: user?.full_name ? `@${user.full_name.toLowerCase().replace(/\s+/g, '')}` : '@sumanmaji',
    batch: (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name) || user?.batch || 'Class XII - Science (Batch A)',
    institute: 'DigiTute Institute',
    session: '2026 (July - Dec)',
    photo: '/student-avatar.jpg',
    email: user?.email || 'suman.maji@digitute.app',
    phone: user?.phone || '+91 98301 11222',
    roll: '12-SCI-042',
    guardian: 'Alok Maji (+91 98301 99887)',
    campus: 'DigiTute Shyambazar Campus',
    pushEnabled: true,
    attendanceAlerts: true,
    testAlerts: true
  }));

  useEffect(() => {
    if (user) {
      setStudentProfile(prev => ({
        ...prev,
        name: user.full_name || prev.name,
        handle: user.full_name ? `@${user.full_name.toLowerCase().replace(/\s+/g, '')}` : prev.handle,
        batch: (Array.isArray(user?.batches) ? user.batches[0]?.name : user?.batches?.name) || user?.batch || prev.batch,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Modal sub-dialogs for actions
  const [activeModal, setActiveModal] = useState(null); // 'picture' | 'email' | 'password' | 'about' | 'privacy' | 'terms' | 'support'
  const [tempInput, setTempInput] = useState('');

  const handleTogglePush = () => {
    const updated = !studentProfile.pushEnabled;
    setStudentProfile(prev => ({ ...prev, pushEnabled: updated }));
    if (showToast) {
      showToast(updated ? 'Push notifications enabled!' : 'Push notifications muted.');
    }
  };

  const handleActionClick = (actionName) => {
    if (actionName === 'picture') {
      setActiveModal('picture');
    } else if (actionName === 'email') {
      setTempInput(studentProfile.email);
      setActiveModal('email');
    } else if (actionName === 'mobile') {
      setTempInput(studentProfile.phone);
      setActiveModal('mobile');
    } else if (actionName === 'password') {
      setTempInput('');
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

  const handleSaveModal = (type) => {
    if (type === 'email') {
      if (!tempInput || !tempInput.includes('@')) {
        if (showToast) showToast('Please enter a valid email address');
        return;
      }
      setStudentProfile(prev => ({ ...prev, email: tempInput }));
      if (showToast) showToast('Email updated successfully!');
      setActiveModal(null);
    } else if (type === 'mobile') {
      const cleanPhone = tempInput.trim();
      if (!cleanPhone || cleanPhone.length < 10) {
        if (showToast) showToast('Please enter a valid 10-digit mobile number');
        return;
      }
      setStudentProfile(prev => ({ ...prev, phone: cleanPhone }));
      if (showToast) showToast('Mobile number updated successfully!');
      setActiveModal(null);
    } else if (type === 'password') {
      if (!tempInput || tempInput.length < 6) {
        if (showToast) showToast('Password must be at least 6 characters');
        return;
      }
      if (showToast) showToast('Password changed securely!');
      setActiveModal(null);
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
              onClick={() => handleActionClick('picture')}
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
                <span className="sp-sr-label">Change Profile Picture</span>
              </div>
              <span className="sp-sr-chevron">›</span>
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
                <h4 className="sp-dialog-title">Update Email Address</h4>
                <p className="sp-dialog-desc">Enter your primary contact email address for official reports & notifications.</p>
                <input 
                  type="email"
                  className="sp-dialog-input"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                />
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-cancel-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="sp-dialog-confirm-btn" onClick={() => handleSaveModal('email')}>Save Email</button>
                </div>
              </>
            )}

            {activeModal === 'mobile' && (
              <>
                <h4 className="sp-dialog-title">Change Mobile Number</h4>
                <p className="sp-dialog-desc">Enter your active 10-digit mobile number for class SMS alerts & WhatsApp notices.</p>
                <input 
                  type="tel"
                  className="sp-dialog-input"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  placeholder="+91 98301 11222"
                  autoFocus
                />
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-cancel-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="sp-dialog-confirm-btn" onClick={() => handleSaveModal('mobile')}>Save Number</button>
                </div>
              </>
            )}

            {activeModal === 'password' && (
              <>
                <h4 className="sp-dialog-title">Change Password</h4>
                <p className="sp-dialog-desc">Enter a new secure password (minimum 6 characters).</p>
                <input 
                  type="password"
                  className="sp-dialog-input"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  placeholder="Enter new password"
                  autoFocus
                />
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-cancel-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="sp-dialog-confirm-btn" onClick={() => handleSaveModal('password')}>Update Password</button>
                </div>
              </>
            )}

            {activeModal === 'picture' && (
              <>
                <h4 className="sp-dialog-title">Change Profile Picture</h4>
                <p className="sp-dialog-desc">Upload a new photo from your device or choose an avatar.</p>
                <div className="sp-dialog-photo-picker">
                  <img src={studentProfile.photo} alt="Current" className="sp-dpp-current" />
                  <label className="sp-dpp-upload-btn">
                    <span>📁 Choose File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            setStudentProfile(prev => ({ ...prev, photo: uploadEvent.target.result }));
                            handleSaveModal('picture');
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="sp-dialog-actions">
                  <button className="sp-dialog-cancel-btn" onClick={() => setActiveModal(null)}>Close</button>
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
    </div>
  );
}
