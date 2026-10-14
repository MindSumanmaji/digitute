import React from 'react';
export function StatCard({
  icon,
  iconBg,
  label = 'Metric',
  value = '0',
  onClick,
  hasArrow = false
}) {
  const isClickable = typeof onClick === 'function';
  const showArrow = hasArrow || (isClickable && hasArrow !== false);

  const iconStyle = iconBg ? { backgroundColor: iconBg } : undefined;

  const content = (
    <>
      <div className="dt-stat-icon-wrapper" style={iconStyle} aria-hidden="true">
        {icon || '📊'}
      </div>

      <div className="dt-stat-info">
        <span className="dt-stat-label">{label}</span>
        <span className="dt-stat-value">{value}</span>
      </div>

      {showArrow && (
        <div className="dt-stat-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className="dt-stat-card is-clickable"
        onClick={onClick}
        aria-label={`${label}: ${value}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="dt-stat-card">
      {content}
    </div>
  );
}

export default StatCard;
