import React from 'react';
import { Megaphone, Plus, Pin, Calendar, Users, Trash2 } from 'lucide-react';

export default function NoticeBoardView({ notices, onBroadcastNotice }) {
  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-primary" onClick={onBroadcastNotice}>
            <Plus size={16} /> Broadcast new notice
          </button>
        </div>
      </div>

      {(!notices || notices.length === 0) ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px dashed var(--border)',
          marginTop: 8
        }}>
          <Megaphone size={40} style={{ color: 'var(--teal-primary)', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Notices Published</h3>
          <p style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 380, margin: '0 auto 16px' }}>
            There are currently no active center announcements. Broadcast a new notice to inform students and faculty.
          </p>
          <button className="button-primary" onClick={onBroadcastNotice} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Broadcast new notice
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map((n) => (
            <div key={n.id} className={`notice-card ${n.isPinned ? 'pinned' : ''}`}>
              <div className="notice-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {n.isPinned && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--teal-dark)', fontSize: 13, fontWeight: 700 }}>
                      <Pin size={14} /> PINNED
                    </span>
                  )}
                  <strong style={{ fontSize: 18 }}>{n.title}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="notice-audience-pill" style={{ fontSize: 13, padding: '4px 10px' }}>
                    <Users size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                    {n.audience}
                  </span>
                  <span style={{ fontSize: 13.5, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={14} /> {n.date}
                  </span>
                </div>
              </div>

              <p className="notice-body" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
