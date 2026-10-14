import React from 'react';

export default function ProfileTab({ showToast }) {
  return (
    <div className="sp-view-container sp-profile-view">
      <div className="sp-welcome-row">
        <h1 className="sp-page-title">Profile & Student Details</h1>
        <p className="sp-page-subtitle">Manage personal information and notification preferences.</p>
      </div>

      <div className="sp-grid-2col-50-50">
        <div className="sp-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <img 
              src="/student-avatar.jpg" 
              alt="Suman Maji" 
              className="sp-avatar-img" 
              style={{ width: '68px', height: '68px', borderRadius: '50%' }}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
              }}
            />
            <div>
              <h3 style={{ margin: 0 }}>Suman Maji</h3>
              <p style={{ margin: '2px 0 0 0', color: '#64748b' }}>Roll ID: 12-SCI-042</p>
              <span className="sp-badge-present" style={{ marginTop: '6px', display: 'inline-block' }}>Enrolled & Verified</span>
            </div>
          </div>

          <ul className="sp-details-list">
            <li><span>Current Batch:</span> <strong>Class XII - Science (2026)</strong></li>
            <li><span>Registered Mobile:</span> <strong>+91 98301 11222</strong></li>
            <li><span>Registered Email:</span> <strong>suman.maji@digitute.app</strong></li>
            <li><span>Guardian Name:</span> <strong>Alok Maji (+91 98301 99887)</strong></li>
            <li><span>Center Campus:</span> <strong>DigiTute Shyambazar Campus</strong></li>
          </ul>
        </div>

        <div className="sp-card">
          <h4>Notification & Alert Settings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SMS Daily Attendance Alerts to Parents</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>WhatsApp Homework & DPP Reminders</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Test Score Card Notifications</span>
              <input type="checkbox" defaultChecked />
            </label>
            <button className="sp-primary-submit-btn" style={{ marginTop: '14px' }} onClick={() => showToast('Preferences updated!')}>
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
