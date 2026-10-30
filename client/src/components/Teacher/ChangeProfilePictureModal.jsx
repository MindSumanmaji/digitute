import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ProfileAvatar from '../Student/ProfileAvatar';

/**
 * Teacher Change Profile Picture Modal with Pure Canvas Crop & Zoom
 * Supports:
 * - JPG, JPEG, PNG, WebP validation
 * - Interactive Drag & Reposition (Mouse + Touch)
 * - Pinch-to-zoom & Slider Zoom (Mobile & Desktop)
 * - Circular preview mask with Square 512x512 Canvas Export
 * - Client-side high-efficiency WebP compression
 * - Upload to /api/teacher/avatar & Remove actions with loading states
 * - Updates localStorage and triggers 'digitute-profile-updated' event
 * - React Portal rendering
 */
export default function ChangeProfilePictureModal({
  isOpen,
  onClose,
  currentPhoto,
  userName = 'Teacher',
  onUploadSuccess,
  onRemoveSuccess,
  showToast
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const touchDistanceRef = useRef(null);

  // Clean up object URLs on unmount or when image changes
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
      setSelectedFile(null);
      setImageSrc(null);
      setImageObj(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setErrorMessage('');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isUploading && !isRemoving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUploading, isRemoving, onClose]);

  // File selection & client-side validation
  const handleFileChange = (e) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid file type! Please choose a JPG, PNG, or WebP image.');
      if (showToast) showToast('Only JPG, JPEG, PNG, or WebP images are supported.');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      setSelectedFile(file);
      setImageSrc(objectUrl);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setErrorMessage('Failed to parse this image file.');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  // Redraw the interactive preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Compute scaled dimensions to fill the square crop area
    const imgAspect = imageObj.width / imageObj.height;
    let drawWidth, drawHeight;

    if (imgAspect > 1) {
      drawHeight = height * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = width * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;
    const destX = centerX - drawWidth / 2;
    const destY = centerY - drawHeight / 2;

    // Draw the image
    ctx.drawImage(imageObj, destX, destY, drawWidth, drawHeight);

    // Draw circular masking overlay with dimmed exterior
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(width / 2, height / 2, width / 2 - 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    // Circle border guideline
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }, [imageObj, zoom, offset]);

  useEffect(() => {
    if (imageObj) {
      drawPreview();
    }
  }, [imageObj, zoom, offset, drawPreview]);

  // Pointer / Mouse Drag Events
  const handleMouseDown = (e) => {
    if (!imageObj) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Events for Mobile Drag & Pinch-to-zoom
  const handleTouchStart = (e) => {
    if (!imageObj) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (!imageObj) return;
    if (e.touches.length === 1 && isDragging) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistanceRef.current;
      setZoom((prev) => Math.min(3, Math.max(1, prev * ratio)));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Export 512x512 cropped image blob with compression
  const exportCroppedBlob = async () => {
    if (!imageObj) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 512;
    exportCanvas.height = 512;
    const ctx = exportCanvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const width = 512;
    const height = 512;
    const imgAspect = imageObj.width / imageObj.height;

    let drawWidth, drawHeight;
    if (imgAspect > 1) {
      drawHeight = height * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = width * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    const scaleFactor = 512 / 280;
    const centerX = width / 2 + offset.x * scaleFactor;
    const centerY = height / 2 + offset.y * scaleFactor;
    const destX = centerX - drawWidth / 2;
    const destY = centerY - drawHeight / 2;

    ctx.drawImage(imageObj, destX, destY, drawWidth, drawHeight);

    return new Promise((resolve) => {
      exportCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            exportCanvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', 0.85);
          }
        },
        'image/webp',
        0.86
      );
    });
  };

  // Execute Upload to Supabase via /api/teacher/avatar
  const handleUpload = async () => {
    if (!imageObj) return;

    try {
      setIsUploading(true);
      setErrorMessage('');

      const blob = await exportCroppedBlob();
      if (!blob) {
        throw new Error('Failed to create compressed image blob.');
      }

      const formData = new FormData();
      formData.append('file', blob, 'avatar.webp');

      const token = localStorage.getItem('digitute_token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiBase}/api/teacher/avatar`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || 'Failed to upload profile picture.');
      }

      // Update local storage user profile
      const rawUser = localStorage.getItem('digitute_user');
      if (rawUser) {
        try {
          const userObj = JSON.parse(rawUser);
          userObj.avatar_url = data.avatar_url;
          localStorage.setItem('digitute_user', JSON.stringify(userObj));
        } catch {}
      }

      const rawTeacher = localStorage.getItem('digitute_teacher_profile');
      if (rawTeacher) {
        try {
          const tObj = JSON.parse(rawTeacher);
          tObj.avatarUrl = data.avatar_url;
          localStorage.setItem('digitute_teacher_profile', JSON.stringify(tObj));
        } catch {}
      }

      window.dispatchEvent(new Event('digitute-profile-updated'));

      if (showToast) showToast('Profile picture updated successfully!');
      if (onUploadSuccess) onUploadSuccess(data.avatar_url);
      onClose();
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Upload failed. Please try again.');
      if (showToast) showToast(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Execute Remove Photo from Supabase via DELETE /api/teacher/avatar
  const handleRemove = async () => {
    if (!currentPhoto) return;

    try {
      setIsRemoving(true);
      setErrorMessage('');

      const token = localStorage.getItem('digitute_token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiBase}/api/teacher/avatar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || 'Failed to remove profile picture.');
      }

      // Clear from local storage
      const rawUser = localStorage.getItem('digitute_user');
      if (rawUser) {
        try {
          const userObj = JSON.parse(rawUser);
          userObj.avatar_url = null;
          localStorage.setItem('digitute_user', JSON.stringify(userObj));
        } catch {}
      }

      const rawTeacher = localStorage.getItem('digitute_teacher_profile');
      if (rawTeacher) {
        try {
          const tObj = JSON.parse(rawTeacher);
          tObj.avatarUrl = null;
          localStorage.setItem('digitute_teacher_profile', JSON.stringify(tObj));
        } catch {}
      }

      window.dispatchEvent(new Event('digitute-profile-updated'));

      if (showToast) showToast('Profile picture removed.');
      if (onRemoveSuccess) onRemoveSuccess();
      onClose();
    } catch (err) {
      console.error('Avatar remove error:', err);
      setErrorMessage(err.message || 'Failed to remove picture.');
      if (showToast) showToast(err.message || 'Failed to remove photo.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="sp-avatar-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sp-avatar-modal-card"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="sp-avatar-modal-header">
          <div className="sp-avatar-modal-title-box">
            <div className="sp-avatar-modal-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div>
              <h3 className="sp-avatar-modal-title">Change Profile Photo</h3>
              <p className="sp-avatar-modal-subtitle">
                {imageObj ? 'Drag to position and use slider to zoom' : 'Upload a new picture or remove current photo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sp-avatar-modal-close-btn"
            onClick={onClose}
            disabled={isUploading || isRemoving}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="sp-avatar-modal-body">
          {errorMessage && (
            <div className="sp-avatar-modal-error-banner">
              <span>⚠️</span> {errorMessage}
            </div>
          )}

          {imageObj ? (
            /* Interactive Canvas Cropper View */
            <div className="sp-avatar-cropper-area">
              <div
                className="sp-avatar-canvas-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="sp-avatar-cropper-canvas"
                />
              </div>

              {/* Zoom Controls */}
              <div className="sp-avatar-zoom-row">
                <button
                  type="button"
                  className="sp-avatar-zoom-btn"
                  onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))))}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="sp-avatar-zoom-slider"
                  aria-label="Zoom Image"
                />
                <button
                  type="button"
                  className="sp-avatar-zoom-btn"
                  onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))))}
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            /* Current Photo Preview & Actions View */
            <div className="sp-avatar-current-preview-area">
              <div className="sp-avatar-current-badge-wrap">
                <ProfileAvatar
                  src={currentPhoto}
                  name={userName}
                  size={140}
                  className="sp-avatar-hero-display"
                />
              </div>
              <div className="sp-avatar-specs-info">
                Supported formats: <strong>JPG, PNG, WebP</strong>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="sp-avatar-modal-footer">
          {imageObj ? (
            <>
              <button
                type="button"
                className="sp-avatar-btn-secondary"
                onClick={() => {
                  if (imageSrc && imageSrc.startsWith('blob:')) {
                    URL.revokeObjectURL(imageSrc);
                  }
                  setImageObj(null);
                  setImageSrc(null);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
              >
                Choose Another
              </button>
              <div className="sp-avatar-footer-right">
                <button
                  type="button"
                  className="sp-avatar-btn-cancel"
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sp-avatar-btn-primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="sp-avatar-spinner-text">
                      <span className="sp-avatar-spinner" /> Uploading...
                    </span>
                  ) : (
                    'Save Photo'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {currentPhoto && (
                <button
                  type="button"
                  className="sp-avatar-btn-danger"
                  onClick={handleRemove}
                  disabled={isRemoving || isUploading}
                >
                  {isRemoving ? 'Removing...' : 'Remove Photo'}
                </button>
              )}
              <div className="sp-avatar-footer-right">
                <button
                  type="button"
                  className="sp-avatar-btn-cancel"
                  onClick={onClose}
                  disabled={isRemoving || isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sp-avatar-btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRemoving || isUploading}
                >
                  Choose Photo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

