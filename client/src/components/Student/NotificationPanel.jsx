import React from 'react';

export default function NotificationPanel() {
  return (
    <div className="sp-popover-menu sp-notification-popover">
      <div className="sp-popover-header">
        <h4>Notifications</h4>
        <span className="sp-badge-count">2 New</span>
      </div>
      <div className="sp-notification-list">
        <div className="sp-notification-item unread">
          <div className="sp-notif-dot" />
          <div>
            <p><strong>Physics Extra Class</strong> scheduled tomorrow at 07:00 AM.</p>
            <small>15 mins ago</small>
          </div>
        </div>
        <div className="sp-notification-item unread">
          <div className="sp-notif-dot" />
          <div>
            <p><strong>Pending Fee Notice:</strong> ₹600 due for September term.</p>
            <small>2 hours ago</small>
          </div>
        </div>
        <div className="sp-notification-item">
          <div>
            <p><strong>Unit Test 1 Score:</strong> You scored 92% (Grade A+).</p>
            <small>Yesterday</small>
          </div>
        </div>
      </div>
    </div>
  );
}
