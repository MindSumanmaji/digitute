import React, { useState, useEffect, useRef } from 'react';

export function Settings({ onNavigate, onBackToLanding, user }) {
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset avatarUrl to teacher-sudipta.png as requested by user
        parsed.avatarUrl = '/teacher-sudipta.png';
        localStorage.setItem('digitute_teacher_profile', JSON.stringify(parsed));
        return parsed;
      }
    } catch { /* ignore */ }
    return {
      name: 'Sudipta Mondal',
      username: '@sudipta',
      phone: '9734417711',
      email: 'Sudipta@digi.com',
      avatarUrl: '/teacher-sudipta.png'
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

  // Ensure /teacher-sudipta.png is synced on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('digitute_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatarUrl !== '/teacher-sudipta.png') {
          parsed.avatarUrl = '/teacher-sudipta.png';
          localStorage.setItem('digitute_teacher_profile', JSON.stringify(parsed));
          setTeacherProfile(parsed);
          window.dispatchEvent(new Event('digitute-profile-updated'));
        }
      }
    } catch { /* ignore */ }
  }, []);

  const [pushEnabled, setPushEnabled] = useState(() => {
    const saved = localStorage.getItem('digitute_push_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  // ── Modals State ──
  // null | 'changePhoto' | 'changeUsername' | 'changePassword' | 'privacy' | 'terms' | 'logoutConfirm'
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

        {/* ── Top Header (No back button) ── */}
        <div className="dt-settings-top-bar">
          <h1 className="dt-settings-header-title">Settings</h1>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           1. ACCOUNT (Change Photo, Username, Password)
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
           2. PREFERENCES (Push Notifications Only, Theme removed)
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
      {activeModal === 'changePhoto' && (
        <ChangePhotoModal
          currentAvatar={teacherProfile.avatarUrl}
          onClose={() => setActiveModal(null)}
          onSave={(url) => {
            updateProfile({ avatarUrl: url });
            setActiveModal(null);
            showToast('Profile photo updated');
          }}
        />
      )}

      {activeModal === 'changeUsername' && (
        <ChangeUsernameModal
          currentUsername={teacherProfile.username}
          onClose={() => setActiveModal(null)}
          onSave={(newUsername) => {
            updateProfile({ username: newUsername });
            setActiveModal(null);
            showToast('Username updated');
          }}
        />
      )}

      {activeModal === 'changePassword' && (
        <ChangePasswordModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            showToast('Password changed successfully');
          }}
        />
      )}

      {activeModal === 'privacy' && (
        <PrivacyPolicyModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'terms' && (
        <TermsModal onClose={() => setActiveModal(null)} />
      )}

      


      {/* Toast Feedback */}
      {toast && (
        <div className="dt-toast-notification">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function ChangePhotoModal({ currentAvatar, onClose, onSave }) {
  const [step, setStep] = useState('select'); // 'select' | 'crop' | 'preview'
  const [rawImage, setRawImage] = useState(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, pan: { x: 0, y: 0 } });
  const touchState = useRef({ startX: 0, startY: 0, initialPan: { x: 0, y: 0 }, initialDist: 0, initialZoom: 1 });

  // Fixed container dimensions & crop circle diameter
  const C_WIDTH = 320;
  const C_HEIGHT = 320;
  const C_DIAMETER = 246; // circle diameter inside container

  const clampPan = (px, py, curZoom, curBaseScale = baseScale, curImgSize = imageSize) => {
    if (!curImgSize.width || !curImgSize.height) return { x: 0, y: 0 };
    const curScale = curBaseScale * curZoom;
    const dw = curImgSize.width * curScale;
    const dh = curImgSize.height * curScale;
    const maxPx = Math.max(0, (dw - C_DIAMETER) / 2);
    const maxPy = Math.max(0, (dh - C_DIAMETER) / 2);
    return {
      x: Math.max(-maxPx, Math.min(maxPx, px)),
      y: Math.max(-maxPy, Math.min(maxPy, py))
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target.result);
      setStep('crop');
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageLoaded = (e) => {
    const img = e.target;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setImageSize({ width: nw, height: nh });
    const bScale = Math.max(C_DIAMETER / nw, C_DIAMETER / nh);
    setBaseScale(bScale);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Immediate check for cached image dimensions
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth && !imageSize.width) {
      const nw = imgRef.current.naturalWidth;
      const nh = imgRef.current.naturalHeight;
      setImageSize({ width: nw, height: nh });
      const bScale = Math.max(C_DIAMETER / nw, C_DIAMETER / nh);
      setBaseScale(bScale);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [rawImage, step, imageSize.width]);

  // Zoom handlers
  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.max(1, Math.min(3, Number(newZoom)));
    setZoom(clampedZoom);
    setPan(prev => clampPan(prev.x, prev.y, clampedZoom));
  };

  const handleZoomDelta = (delta) => {
    handleZoomChange(+(zoom + delta).toFixed(2));
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      pan: { ...pan }
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const next = clampPan(dragStart.current.pan.x + dx, dragStart.current.pan.y + dy, zoom);
      setPan(next);
    };
    const onMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, zoom, baseScale, imageSize]);

  // Touch drag and pinch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchState.current.startX = e.touches[0].clientX;
      touchState.current.startY = e.touches[0].clientY;
      touchState.current.initialPan = { ...pan };
      touchState.current.initialDist = 0;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchState.current.initialDist = dist;
      touchState.current.initialZoom = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchState.current.initialDist === 0) {
      const dx = e.touches[0].clientX - touchState.current.startX;
      const dy = e.touches[0].clientY - touchState.current.startY;
      const next = clampPan(touchState.current.initialPan.x + dx, touchState.current.initialPan.y + dy, zoom);
      setPan(next);
    } else if (e.touches.length === 2 && touchState.current.initialDist > 0) {
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = curDist / touchState.current.initialDist;
      const nz = Math.max(1, Math.min(3, +(touchState.current.initialZoom * factor).toFixed(2)));
      setZoom(nz);
      setPan(p => clampPan(p.x, p.y, nz));
    }
  };

  const handleTouchEnd = () => {
    touchState.current.initialDist = 0;
  };

  // Wheel zoom handler with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el || step !== 'crop') return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(prev => {
        const nz = Math.max(1, Math.min(3, +(prev + delta).toFixed(2)));
        setPan(p => clampPan(p.x, p.y, nz));
        return nz;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [step, baseScale, imageSize]);

  // Crop & generate preview
  const handleCropAndPreview = () => {
    const img = imgRef.current;
    if (!img || !imageSize.width || !imageSize.height) return;

    const curScale = baseScale * zoom;
    const dw = imageSize.width * curScale;
    const dh = imageSize.height * curScale;

    const clamped = clampPan(pan.x, pan.y, zoom);

    // Calculate source rect
    const sxInDisplayed = (dw - C_DIAMETER) / 2 - clamped.x;
    const syInDisplayed = (dh - C_DIAMETER) / 2 - clamped.y;

    const sourceX = sxInDisplayed / curScale;
    const sourceY = syInDisplayed / curScale;
    const sourceSize = C_DIAMETER / curScale;

    const canvas = document.createElement('canvas');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(imageSize.width - sourceX, sourceSize),
      Math.min(imageSize.height - sourceY, sourceSize),
      0,
      0,
      outputSize,
      outputSize
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCroppedDataUrl(dataUrl);
    setStep('preview');
  };

  // Upload cropped image
  const handleUpload = () => {
    if (croppedDataUrl) {
      onSave(croppedDataUrl);
    }
  };

  // Calculations for displayed image in crop box
  const curScale = baseScale * zoom;
  const dw = imageSize.width ? imageSize.width * curScale : 0;
  const dh = imageSize.height ? imageSize.height * curScale : 0;
  const imgLeft = (C_WIDTH - dw) / 2 + pan.x;
  const imgTop = (C_HEIGHT - dh) / 2 + pan.y;

  // Step 1: Crop Screen (Matching Sample Image 1)
  if (step === 'crop') {
    return (
      <div className="dt-crop-overlay-backdrop" onClick={onClose}>
        <div className="dt-crop-modal-card" onClick={(e) => e.stopPropagation()}>
          {/* Header with back arrow */}
          <div className="dt-crop-header">
            <button
              type="button"
              className="dt-crop-icon-btn"
              onClick={() => setStep('select')}
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="dt-crop-title">Crop Photo</h2>
            <div style={{ width: 42 }} />
          </div>

          <p className="dt-crop-subtitle">Drag to reposition • Pinch to zoom</p>

          {/* Viewport container */}
          <div
            className="dt-crop-viewport"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {rawImage && (
              <img
                ref={imgRef}
                src={rawImage}
                alt="Source"
                className="dt-crop-image"
                onLoad={handleImageLoaded}
                draggable={false}
                style={{
                  width: dw ? `${dw}px` : 'auto',
                  height: dh ? `${dh}px` : 'auto',
                  left: `${imgLeft}px`,
                  top: `${imgTop}px`
                }}
              />
            )}

            {/* Circular crop guide & shadow mask overlay */}
            <div className="dt-crop-circle-guide" />
          </div>

          {/* Zoom slider row */}
          <div className="dt-crop-zoom-row">
            <button
              type="button"
              className="dt-crop-zoom-btn"
              onClick={() => handleZoomDelta(-0.15)}
              aria-label="Zoom out"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => handleZoomChange(e.target.value)}
              className="dt-crop-zoom-slider"
              aria-label="Zoom control"
            />

            <button
              type="button"
              className="dt-crop-zoom-btn"
              onClick={() => handleZoomDelta(0.15)}
              aria-label="Zoom in"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>

          {/* Crop & Preview button */}
          <button
            type="button"
            className="dt-crop-preview-action-btn"
            onClick={handleCropAndPreview}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
            Crop & Preview
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Preview Screen (Matching Sample Image 2)
  if (step === 'preview') {
    return (
      <div className="dt-crop-overlay-backdrop" onClick={onClose}>
        <div className="dt-crop-modal-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <h2 className="dt-preview-title">Preview</h2>

          {/* Cropped circular avatar */}
          <div className="dt-preview-avatar-wrap">
            <img
              src={croppedDataUrl}
              alt="Cropped profile preview"
              className="dt-preview-avatar-img"
            />
          </div>

          <p className="dt-preview-subtitle">This is how your photo will look</p>

          {/* Action buttons row */}
          <div className="dt-preview-btn-row">
            <button
              type="button"
              className="dt-preview-recrop-btn"
              onClick={() => setStep('crop')}
            >
              Re-crop
            </button>

            <button
              type="button"
              className="dt-preview-upload-btn"
              onClick={handleUpload}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
          </div>

          {/* Cancel link button */}
          <button
            type="button"
            className="dt-preview-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 0: Initial select screen
  return (
    <div className="dt-crop-overlay-backdrop" onClick={onClose}>
      <div className="dt-crop-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dt-crop-header" style={{ marginBottom: 12 }}>
          <div style={{ width: 32 }} />
          <h2 className="dt-crop-title" style={{ fontSize: 19 }}>Change Profile Picture</h2>
          <button
            type="button"
            className="dt-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current Avatar in Center */}
        <div className="dt-preview-avatar-wrap" style={{ width: 160, height: 160, margin: '12px auto 12px' }}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="Current profile" className="dt-preview-avatar-img" />
          ) : (
            <div className="dt-photo-current-placeholder">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        <p className="dt-preview-subtitle" style={{ margin: '0 0 22px' }}>Current Profile Photo</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="dt-photo-file-input"
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="dt-photo-upload-btn"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{ marginBottom: 12 }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Photo
        </button>

        <button
          type="button"
          className="dt-preview-cancel-btn"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChangeUsernameModal({ currentUsername, onClose, onSave }) {
  const [uname, setUname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!uname.trim()) {
      setError('Username cannot be empty');
      return;
    }
    const clean = uname.startsWith('@') ? uname : `@${uname.trim()}`;
    onSave(clean);
  };

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dt-modal-header">
          <h3 className="dt-modal-title">Change Username</h3>
          <button type="button" className="dt-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dt-modal-form">
          {error && <div className="dt-form-alert error">{error}</div>}
          <div className="dt-form-group">
            <label className="dt-form-label">Username Handle</label>
            <input
              type="text"
              className="dt-form-input"
              value={uname}
              onChange={(e) => {
                setUname(e.target.value);
                setError('');
              }}
              placeholder="Enter new username"
              autoFocus
              required
            />
          </div>
          <div className="dt-modal-actions">
            <button type="button" className="dt-btn dt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="dt-btn dt-btn-primary">Save Username</button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
