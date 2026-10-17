import React, { useState } from 'react';
import { UserCog, Plus, Phone, Mail, Award, BookOpen, Wallet, CheckCircle2, Search, Edit3 } from 'lucide-react';

export default function TeachersView({ teachers, batches = [], onAddTeacher, onEditTeacher }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = (teachers || []).filter(t =>
    (t.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.qualification || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-primary" onClick={onAddTeacher}>
            <Plus size={16} /> Add new teacher
          </button>
        </div>
      </div>

      <div className="data-table-toolbar" style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="data-table-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search teacher name, specialization or qualification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="data-table-filters">
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{filteredTeachers.length} verified faculty members</span>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px dashed var(--border)',
          marginTop: 20
        }}>
          <UserCog size={40} style={{ color: 'var(--teal-primary)', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Teachers Found</h3>
          <p style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 380, margin: '0 auto 16px' }}>
            {searchTerm ? `No faculty matches "${searchTerm}".` : 'There are no faculty members registered yet. Click below to add a teacher.'}
          </p>
          <button className="button-primary" onClick={onAddTeacher} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Add new teacher
          </button>
        </div>
      ) : (
        <div className="cards-grid-2">
        {filteredTeachers.map((teacher) => {
          // Identify which batches and which specific subjects this teacher genuinely teaches
          const assignments = [];
          const tId = teacher.id;
          const tName = (teacher.full_name || '').toLowerCase().trim();

          if (batches && batches.length > 0) {
            batches.forEach((b) => {
              b.subjects?.forEach((s) => {
                const sTeacherId = s.teacher_id || s.teacherId;
                const sTeacherName = (s.teacher_name || s.teacher || '').toLowerCase().trim();
                if ((tId && sTeacherId && sTeacherId === tId) || (tName && sTeacherName && sTeacherName === tName)) {
                  assignments.push({
                    batchName: b.name,
                    subjectName: s.name,
                  });
                }
              });
            });
          }

          const teacherDisplayName = teacher.full_name || 'Faculty Member';
          const initials = teacherDisplayName
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'FC';

          return (
            <div key={teacher.id} className="teacher-card">
              <div className="teacher-header">
                <div className="teacher-avatar-lg teal">
                  {initials}
                </div>
                <div className="teacher-info" style={{ flex: 1 }}>
                  <strong>{teacherDisplayName}</strong>
                  <span>{teacher.qualification || 'Faculty Member'}</span>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 14, color: 'var(--text-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={14} /> {teacher.phone}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={14} /> {teacher.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="button-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                  title="Edit Faculty Member"
                  onClick={() => onEditTeacher && onEditTeacher(teacher)}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="teacher-specialization-badge">
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>Specialization: </span>
                {teacher.specialization || 'General'}
              </div>

              <div className="teacher-assignments-section">
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} /> Assigned Batches & Teaching Subjects
                </div>
                {assignments.length > 0 ? (
                  <div className="teacher-assignments-list">
                    {assignments.map((item, idx) => (
                      <div key={idx} className="teacher-assignment-row">
                        <span className="assignment-batch">{item.batchName}</span>
                        <span className="assignment-subject">{item.subjectName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--surface-2, #f5f8f7)',
                    color: 'var(--text-3, #788a85)',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>No batches assigned yet. Assign in <strong>Batches & Courses</strong>.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
