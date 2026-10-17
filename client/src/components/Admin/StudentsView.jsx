import React, { useState } from 'react';
import { Users, Plus, MessageSquare, Search, CheckCircle2, Phone, Mail, MapPin, Edit3 } from 'lucide-react';

export default function StudentsView({ students = [], onNewAdmission, onEditStudent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');

  const batches = ['All', ...new Set((students || []).map(s => s.batches?.name).filter(Boolean))];

  const filteredStudents = (students || []).filter(s => {
    const term = searchTerm.toLowerCase();
    const stName = s.full_name || '';
    const stBatch = s.batches?.name || 'Unassigned';
    const matchSearch =
      stName.toLowerCase().includes(term) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.address && s.address.toLowerCase().includes(term)) ||
      (s.guardian_name && s.guardian_name.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.guardian_phone && s.guardian_phone.includes(term));

    const matchBatch = selectedBatch === 'All' || stBatch === selectedBatch;

    return matchSearch && matchBatch;
  });

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-primary" onClick={onNewAdmission}>
            <Plus size={16} /> New admission
          </button>
        </div>
      </div>

      <div className="data-table-card">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by student name, guardian, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="data-table-filters">
            <select
              className="subtle-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches' : b}</option>)}
            </select>

            <span style={{ fontSize: 14, color: 'var(--text-3)', marginLeft: 6 }}>
              {filteredStudents.length} Students
            </span>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Enrolled Batch</th>
                <th>Student Contact</th>
                <th>Guardian Contact & WhatsApp</th>
                <th>Residential Address</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table">No students found matching your search and filter criteria.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const displayName = student.full_name || 'Enrolled Student';
                  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
                  const gName = student.guardian_name || '—';
                  const gPhone = student.guardian_phone || student.phone || '';

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar lavender">
                            {initials}
                          </div>
                          <div>
                            <strong>{displayName}</strong>
                            <small>{student.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="batch-name">{student.batches?.name || 'Unassigned'}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, fontWeight: 600 }}>
                            <Phone size={13} style={{ color: 'var(--text-3)' }} />
                            <span>{student.phone}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-3)' }}>
                            <Mail size={13} />
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{gName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>{gPhone || '—'}</span>
                            {gPhone && (
                              <a
                                href={`https://wa.me/${gPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-btn"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare size={13} /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-2)' }}>
                          <MapPin size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                          <span>{student.address || '—'}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`status-badge ${student.is_active ? 'paid' : 'pending'}`}>
                          <CheckCircle2 size={13} /> {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
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
                            cursor: 'pointer'
                          }}
                          title="Edit Student"
                          onClick={() => onEditStudent && onEditStudent(student)}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
