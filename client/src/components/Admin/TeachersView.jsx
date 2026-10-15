import React, { useState } from 'react';
import { UserCog, Plus, Phone, Mail, Award, BookOpen, Wallet, CheckCircle2, Search } from 'lucide-react';

export default function TeachersView({ teachers, batches = [], onAddTeacher }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.qualification.toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="cards-grid-2">
        {filteredTeachers.map((teacher) => {
          // Identify which batches and which specific subjects this teacher teaches
          const assignments = [];
          if (batches && batches.length > 0) {
            batches.forEach((b) => {
              b.subjects?.forEach((s) => {
                if (s.teacherId === teacher.id || s.teacher?.toLowerCase() === teacher.name?.toLowerCase()) {
                  assignments.push({
                    batchName: b.name,
                    subjectName: s.name,
                  });
                }
              });
            });
          }

          // Fallback if not directly configured in batch subjects yet
          if (assignments.length === 0 && teacher.assignedBatches) {
            teacher.assignedBatches.forEach((b) => {
              assignments.push({
                batchName: b,
                subjectName: teacher.specialization?.split('&')[0]?.trim() || 'Core Subject',
              });
            });
          }

          return (
            <div key={teacher.id} className="teacher-card">
              <div className="teacher-header">
                <div className={`teacher-avatar-lg ${teacher.avatarTone}`}>
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="teacher-info" style={{ flex: 1 }}>
                  <strong>{teacher.name}</strong>
                  <span>{teacher.qualification}</span>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 14, color: 'var(--text-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={14} /> {teacher.phone}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={14} /> {teacher.email}</span>
                  </div>
                </div>
              </div>

              <div className="teacher-specialization-badge">
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>Specialization: </span>
                {teacher.specialization}
              </div>

              <div className="teacher-assignments-section">
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} /> Assigned Batches & Teaching Subjects
                </div>
                <div className="teacher-assignments-list">
                  {assignments.map((item, idx) => (
                    <div key={idx} className="teacher-assignment-row">
                      <span className="assignment-batch">{item.batchName}</span>
                      <span className="assignment-subject">{item.subjectName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
