import React from 'react';
import { Megaphone, Plus, Pin, Calendar, Users, Trash2 } from 'lucide-react';

export default function NoticeBoardView({ notices, onBroadcastNotice }) {
  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h1>Notice Board & Announcements</h1>
          <p>Broadcast alerts, holiday notifications, exam timetables and fee reminders across students and faculty portals.</p>
        </div>
        <div className="module-actions">
          <button className="button-primary" onClick={onBroadcastNotice}>
            <Plus size={16} /> Broadcast new notice
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {notices.map((n) => (
          <div key={n.id} className={`notice-card ${n.isPinned ? 'pinned' : ''}`}>
            <div className="notice-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {n.isPinned && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--teal-dark)', fontSize: 9.5, fontWeight: 700 }}>
                    <Pin size={12} /> PINNED
                  </span>
                )}
                <strong>{n.title}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="notice-audience-pill">
                  <Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {n.audience}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {n.date}
                </span>
              </div>
            </div>

            <p className="notice-body">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
