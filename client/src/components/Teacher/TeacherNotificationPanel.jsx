import React from 'react';

export default function TeacherNotificationPanel({
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
    <div 
      className="sp-popover-menu sp-notification-popover teacher-notification-popover" 
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: '320px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
        zIndex: 1050,
        overflow: 'hidden',
        animation: 'spSlideIn 0.15s ease',
      }}
    >
      <div className="sp-popover-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: '1px solid #F1F5F9',
        background: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Notifications</h4>
          {unreadCount > 0 && (
            <span 
              className="sp-badge-count" 
              style={{ 
                background: '#FEE2E2', 
                color: '#DC2626',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
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

      <div className="sp-notification-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {(!notices || notices.length === 0) ? (
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            No new notices or announcements.
          </div>
        ) : (
          notices.map((n) => {
            const isFromAdmin = n.sender_role === 'ADMIN' || n.target_audience === 'TEACHERS_ONLY' || n.target_audience === 'ALL';
            const senderTag = isFromAdmin ? 'Admin Notice' : (n.sender_name || 'Teacher Circular');

            return (
              <div
                key={n.id}
                className="sp-notification-item unread"
                onClick={() => onNoticeClick && onNoticeClick(n)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F8FAFC',
                  display: 'flex',
                  gap: 10,
                  cursor: 'pointer',
                  background: '#FAFCFF',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFCFF'; }}
              >
                <div
                  className="sp-notif-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isFromAdmin ? '#D97706' : '#2563EB',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ margin: '0 0 3px 0', fontSize: '12.5px', lineHeight: 1.4, color: '#1E293B' }}>
                    <strong style={{ fontWeight: 650 }}>{n.title}</strong>
                  </p>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '11.5px',
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {n.body}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <small style={{ color: isFromAdmin ? '#D97706' : '#2563EB', fontWeight: 650, fontSize: '10.5px' }}>
                      {senderTag}
                    </small>
                    <small style={{ color: '#94A3B8', fontSize: '10.5px' }}>{formatTimeAgo(n.created_at)}</small>
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

