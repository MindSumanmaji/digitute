import React, { useState, useEffect } from 'react';

export function Settings({ onNavigate: _onNavigate, onBackToLanding, user }) {
  // ── Teacher Profile Data ──
  const getInitialTeacherProfile = () => {
    if (user && user.full_name) {
      return {
        name: user.full_name,
        username: user.email ? `@${user.email.split('@')[0]}` : '@sudipta',
        phone: user.phone || '+91 98765 43210',
        email: user.email || 'sudipta.teacher@digitute.edu',
        avatarUrl: user.avatar_url || ''
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
            phone: u.phone || '+91 98765 43210',
            email: u.email || 'sudipta.teacher@digitute.edu',
            avatarUrl: u.avatar_url || ''
          };
        }
      }
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Sir',
      username: '@sudipta',
      phone: '+91 98765 43210',
      email: 'sudipta.teacher@digitute.edu',
      avatarUrl: ''
    };
  };

  const [teacherProfile, setTeacherProfile] = useState(getInitialTeacherProfile);

  useEffect(() => {
    if (user) {
      setTeacherProfile(prev => ({
        ...prev,
        name: user.full_name || prev.name,
        username: user.email ? `@${user.email.split('@')[0]}` : prev.username,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        avatarUrl: user.avatar_url || prev.avatarUrl
      }));
    }
  }, [user]);

  // ── Preferences State ──
  const [themeDark, setThemeDark] = useState(() => {
    return localStorage.getItem('digitute_theme') === 'dark';
  });

  const [pushEnabled, setPushEnabled] = useState(() => {
    const saved = localStorage.getItem('digitute_push_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  // ── Modals State ──
  // null | 'changePhoto' | 'changeUsername' | 'changePassword' | 'contactAdmin' | 'about' | 'terms' | 'logoutConfirm'
  const [activeModal, setActiveModal] = useState(null);

  // ── Toast Notification ──
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateProfile = (fields) => {
    const updated = { ...teacherProfile, ...fields };
    setTeacherProfile(updated);
    try {
      localStorage.setItem('digitute_teacher_profile', JSON.stringify(updated));
      window.dispatchEvent(new Event('digitute-profile-updated'));
    } catch { /* ignore */ }
  };

  const handleToggleTheme = () => {
    const nextVal = !themeDark;
    setThemeDark(nextVal);
    const mode = nextVal ? 'dark' : 'light';
    try {
      localStorage.setItem('digitute_theme', mode);
      if (nextVal) {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch { /* ignore */ }
    showToast(`App theme set to ${nextVal ? 'Dark mode' : 'Light mode'}`);
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

        {/* ════════════════════════════════════════════════════════════════════
           1. ACCOUNT (Left-aligned Heading, includes Change Password)
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

              {/* Change Username */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('changeUsername')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('changeUsername')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box indigo">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Change Username</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Change Password (Moved inside Account per instruction 2) */}
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
           2. PREFERENCES (Left-aligned Heading, Styled like 2nd Image)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">PREFERENCES</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* App Theme */}
              <div className="dt-refined-menu-item no-pointer" onClick={handleToggleTheme}>
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box teal">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </div>
                  <div className="dt-menu-text-wrap">
                    <span className="dt-menu-item-text">Theme</span>
                    <span className="dt-menu-item-sub">{themeDark ? 'Dark mode' : 'Light mode'}</span>
                  </div>
                </div>
                <label className="dt-refined-toggle" onClick={(e) => e.stopPropagation()} aria-label="Toggle App Theme">
                  <input
                    type="checkbox"
                    checked={themeDark}
                    onChange={handleToggleTheme}
                  />
                  <span className="dt-refined-slider" />
                </label>
              </div>

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
           3. HELP & SUPPORT (FAQ removed per instruction 3)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">HELP &amp; SUPPORT</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* Contact Institute Admin */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('contactAdmin')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('contactAdmin')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box amber">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">Contact Institute Admin</span>
                </div>
                <svg className="dt-menu-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           4. APP INFORMATION (Left-aligned Heading)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="dt-settings-group">
          <span className="dt-settings-group-label">APP INFORMATION</span>
          <div className="dt-refined-card">
            <div className="dt-refined-menu-list">
              {/* About DigiTute */}
              <div
                className="dt-refined-menu-item"
                onClick={() => setActiveModal('about')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('about')}
              >
                <div className="dt-menu-item-left">
                  <div className="dt-menu-icon-box blue">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <span className="dt-menu-item-text">About DigiTute</span>
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

        {/* ════════════════════════════════════════════════════════════════════
           BOTTOM: LOG OUT BUTTON
           ════════════════════════════════════════════════════════════════════ */}
        <button
          type="button"
          className="dt-refined-logout-btn"
          onClick={() => setActiveModal('logoutConfirm')}
          aria-label="Log Out from Teacher Portal"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log Out</span>
        </button>

      </div>

      {/* ════════════════════════════════════════════════════════════════════
         MODALS
         ════════════════════════════════════════════════════════════════════ */}

      {/* 1. Change Profile Picture Modal */}
      {activeModal === 'changePhoto' && (
        <ChangePhotoModal
          currentAvatar={teacherProfile.avatarUrl}
          teacherName={teacherProfile.name}
          onClose={() => setActiveModal(null)}
          onSave={(newUrl) => {
            updateProfile({ avatarUrl: newUrl });
            setActiveModal(null);
            showToast('Profile picture updated');
          }}
        />
      )}

      {/* 2. Change Username Modal */}
      {activeModal === 'changeUsername' && (
        <ChangeUsernameModal
          currentUsername={teacherProfile.username}
          onClose={() => setActiveModal(null)}
          onSave={(newUsername) => {
            updateProfile({ username: newUsername });
            setActiveModal(null);
            showToast('Username updated successfully');
          }}
        />
      )}

      {/* 3. Change Password Modal */}
      {activeModal === 'changePassword' && (
        <ChangePasswordModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            showToast('Password changed successfully');
          }}
        />
      )}

      {/* 4. Contact Admin Modal */}
      {activeModal === 'contactAdmin' && (
        <ContactAdminModal onClose={() => setActiveModal(null)} />
      )}

      {/* 5. About DigiTute Modal */}
      {activeModal === 'about' && (
        <AboutModal onClose={() => setActiveModal(null)} />
      )}

      {/* 6. Terms and Conditions Modal */}
      {activeModal === 'terms' && (
        <TermsModal onClose={() => setActiveModal(null)} />
      )}

      {/* 7. Logout Confirmation Dialog */}
      {activeModal === 'logoutConfirm' && (
        <LogoutDialog
          onClose={() => setActiveModal(null)}
          onConfirm={() => {
            setActiveModal(null);
            try {
              localStorage.removeItem('digitute_active_view');
            } catch { /* ignore */ }
            if (onBackToLanding) {
              onBackToLanding();
            } else {
              window.location.hash = '#landing';
              window.location.reload();
            }
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="dt-refined-toast" role="status">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Sub-components for Modals ──

function ChangePhotoModal({ currentAvatar, teacherName, onClose, onSave }) {
  const [photoUrl, setPhotoUrl] = useState(currentAvatar || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(photoUrl.trim());
  };

  const handleClear = () => {
    onSave('');
  };

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Change Profile Picture</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dt-modal-form">
          <div className="dt-photo-preview-box">
            {photoUrl ? (
              <img src={photoUrl} alt="Preview" className="dt-photo-preview-img" />
            ) : (
              <div className="dt-photo-preview-placeholder">
                {teacherName ? teacherName.slice(0, 2).toUpperCase() : 'SS'}
              </div>
            )}
          </div>
          <div className="dt-form-group">
            <label className="dt-form-label">Image URL</label>
            <input
              type="url"
              className="dt-form-input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              autoFocus
            />
            <span className="dt-form-help">Enter a public direct image link (HTTPS).</span>
          </div>
          <div className="dt-modal-actions">
            {currentAvatar && (
              <button type="button" className="dt-btn dt-btn-destructive dt-btn-sm" onClick={handleClear}>
                Remove Photo
              </button>
            )}
            <button type="button" className="dt-btn dt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="dt-btn dt-btn-primary">Save Picture</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeUsernameModal({ currentUsername, onClose, onSave }) {
  const [username, setUsername] = useState(currentUsername ? currentUsername.replace(/^@/, '') : '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setError('Username cannot be empty');
      return;
    }
    if (!/^[a-z0-9_.-]+$/.test(clean)) {
      setError('Only letters, numbers, dot, underscore, hyphen are allowed');
      return;
    }
    onSave(`@${clean}`);
  };

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Change Username</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dt-modal-form">
          <div className="dt-form-group">
            <label className="dt-form-label">New Username</label>
            <div className="dt-username-input-wrap">
              <span className="dt-username-prefix">@</span>
              <input
                type="text"
                className="dt-form-input dt-username-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="sudipta"
                autoFocus
                required
              />
            </div>
            {error ? (
              <span className="dt-form-error">{error}</span>
            ) : (
              <span className="dt-form-help">Unique handle for your teacher account.</span>
            )}
          </div>
          <div className="dt-modal-actions">
            <button type="button" className="dt-btn dt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="dt-btn dt-btn-primary">Update Username</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!currentPass) {
      setError('Please enter your current password');
      return;
    }
    if (newPass.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setError('New passwords do not match');
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
            <label className="dt-form-label">Current Password</label>
            <input
              type="password"
              className="dt-form-input"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>
          <div className="dt-form-group">
            <label className="dt-form-label">New Password</label>
            <input
              type="password"
              className="dt-form-input"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div className="dt-form-group">
            <label className="dt-form-label">Confirm New Password</label>
            <input
              type="password"
              className="dt-form-input"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
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

function ContactAdminModal({ onClose }) {
  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Contact Institute Admin</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dt-modal-body">
          <p className="dt-modal-desc">
            Reach out to your institute administration for account privileges, batch allocations, or technical escalation.
          </p>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Admin Desk Phone</span>
              <strong className="dt-contact-value">+91 98300 12345</strong>
            </div>
            <a href="tel:+919830012345" className="dt-btn dt-btn-secondary dt-btn-sm">Call</a>
          </div>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Admin Email</span>
              <strong className="dt-contact-value">admin@digitute.edu</strong>
            </div>
            <a href="mailto:admin@digitute.edu" className="dt-btn dt-btn-secondary dt-btn-sm">Email</a>
          </div>
          <div className="dt-contact-row">
            <div>
              <span className="dt-contact-type">Support Hours</span>
              <strong className="dt-contact-value">Mon - Sat (9:00 AM - 7:00 PM)</strong>
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
            <strong>Architecture:</strong> Offline-first connected workspace for high-efficiency teaching.
          </p>
        </div>
        <div className="dt-modal-actions">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

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

export default Settings;
