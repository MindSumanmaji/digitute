import React from 'react';

export default function NotificationPanel({
  notices = [],
  unreadCount = 0,
  onNoticeClick,
  onClearAll,
}) {
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="sp-popover-menu sp-notification-popover" onClick={(e) => e.stopPropagation()}>
      <div className="sp-popover-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4>Notifications</h4>
          {unreadCount > 0 && (
            <span className="sp-badge-count" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              {unreadCount} New
            </span>
          )}
        </div>
        {unreadCount > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
            title="Mark all notices as read"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="sp-notification-list">
        {(!notices || notices.length === 0) ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            No new notices or circulars.
          </div>
        ) : (
          notices.map((n) => {
            const isFromAdmin = n.sender_role === 'ADMIN';
            const senderTag = isFromAdmin
              ? 'Admin'
              : (n.sender_name || 'Teacher');

            return (
              <div
                key={n.id}
                className="sp-notification-item unread"
                onClick={() => onNoticeClick && onNoticeClick(n)}
                style={{
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  className="sp-notif-dot"
                  style={{
                    background: isFromAdmin ? '#D97706' : '#2563EB',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px 0', fontSize: '13px', lineHeight: 1.4 }}>
                    <strong>{n.title}</strong>
                  </p>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '12px',
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {n.body}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <small style={{ color: isFromAdmin ? '#D97706' : '#2563EB', fontWeight: 600 }}>
                      {senderTag}
                    </small>
                    <small>{formatTimeAgo(n.created_at)}</small>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
