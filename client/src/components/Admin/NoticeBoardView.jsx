import React from 'react';
import { Megaphone, Plus, Calendar, Users, Trash2, UserCheck, CheckCircle2 } from 'lucide-react';

export default function NoticeBoardView({ notices = [], onBroadcastNotice, onDeleteNotice }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="module-container">
      <div className="module-header" style={{ marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0F172A' }}>Notice Board & Campus Broadcasts</h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
            Monitor all faculty circulars and broadcast institute-wide announcements to students and teachers.
          </p>
        </div>
        <div className="module-actions">
          <button className="button-primary" onClick={onBroadcastNotice} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Broadcast new notice
          </button>
        </div>
      </div>

      {(!notices || notices.length === 0) ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--surface, #FFFFFF)',
          borderRadius: 16,
          border: '1px dashed var(--border, #CBD5E1)',
          marginTop: 8
        }}>
          <Megaphone size={40} style={{ color: 'var(--teal-primary, #0D9488)', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Notices Published</h3>
          <p style={{ color: 'var(--text-3, #64748B)', fontSize: 14, maxWidth: 380, margin: '0 auto 16px' }}>
            There are currently no active center announcements. Broadcast a new notice to inform students and faculty.
          </p>
          <button className="button-primary" onClick={onBroadcastNotice} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Broadcast new notice
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map((n) => {
            const isFromAdmin = n.sender_role === 'ADMIN';
            const senderLabel = isFromAdmin
              ? `Sent by ${n.sender_name || 'Admin'} – Admin`
              : `Sent by ${n.sender_name || 'Teacher'} – Teacher`;

            const audienceText = n.target_audience === 'BATCH'
              ? (n.batch_names && n.batch_names.length > 0 ? n.batch_names.join(', ') : 'Assigned Batch')
              : (n.audience_label || (n.target_audience === 'STUDENTS_ONLY' ? 'Students Only' : n.target_audience === 'TEACHERS_ONLY' ? 'Teachers Only' : 'Teachers & Students'));

            return (
              <div
                key={n.id}
                className="notice-card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: isFromAdmin ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div className="notice-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isFromAdmin && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#0F766E',
                          background: '#CCFBF1',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          ADMIN NOTICE
                        </span>
                      )}
                      <strong style={{ fontSize: 17, color: '#0F172A' }}>{n.title}</strong>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 600, color: isFromAdmin ? '#0F766E' : '#334155' }}>
                      {senderLabel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="notice-audience-pill" style={{
                      fontSize: 12.5,
                      padding: '4px 10px',
                      background: '#F1F5F9',
                      borderRadius: 16,
                      color: '#475569',
                      fontWeight: 600
                    }}>
                      <Users size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                      {audienceText}
                    </span>
                    <span style={{ fontSize: 13, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} /> {formatDate(n.created_at)}
                    </span>
                    {onDeleteNotice && (
                      <button
                        type="button"
                        onClick={() => onDeleteNotice(n.id)}
                        title="Delete notice"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="notice-body" style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: '#334155',
                  marginTop: 12,
                  marginBottom: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {n.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
