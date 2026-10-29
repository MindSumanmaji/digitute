import React, { useState } from 'react';

/**
 * Reusable ProfileAvatar Component
 * - Displays image if avatarUrl is available and valid.
 * - Gracefully falls back to initials if image load errors or no image provided.
 * - Handles circular display with smooth loading and accessibility.
 */
export default function ProfileAvatar({
  src,
  name = 'Student',
  size = 40,
  className = '',
  alt,
  style = {}
}) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (n) => {
    if (!n) return 'S';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasValidImage = Boolean(src && !imageError);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${Math.max(12, Math.round(size * 0.38))}px`,
    fontWeight: '700',
    userSelect: 'none',
    position: 'relative',
    ...style
  };

  if (hasValidImage) {
    return (
      <div className={`sp-avatar-container ${className}`} style={containerStyle}>
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`sp-avatar-container sp-avatar-initials-fallback ${className}`}
      style={{
        ...containerStyle,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: '#ffffff',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
      }}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

