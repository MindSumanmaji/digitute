import React, { useState } from 'react';
import { Users, Plus, MessageSquare, Search, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export default function StudentsView({ students, onNewAdmission }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');

  const batches = ['All', ...new Set(students.map(s => s.batch))];

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.studentId && s.studentId.toLowerCase().includes(term)) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.address && s.address.toLowerCase().includes(term)) ||
      (s.guardianName && s.guardianName.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term));

    const matchBatch = selectedBatch === 'All' || s.batch === selectedBatch;

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
              placeholder="Search by student name, roll no, guardian, phone or email..."
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
                <th>Student Name & ID</th>
                <th>Enrolled Batch</th>
                <th>Student Contact</th>
                <th>Guardian Contact & WhatsApp</th>
                <th>Residential Address</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-table">No students found matching your search and filter criteria.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-cell">
                        <div className={`student-avatar ${student.avatarTone || 'lavender'}`}>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <strong>{student.name}</strong>
                          <small>ID: {student.studentId || student.rollNo || student.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="batch-name">{student.batch}</span>
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
                        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{student.guardianName || 'Guardian'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>{student.guardianPhone || student.phone}</span>
                          {(student.guardianWhatsapp || student.guardianPhone || student.phone) && (
                            <a
                              href={`https://wa.me/${(student.guardianWhatsapp || student.guardianPhone || student.phone).replace(/[^0-9]/g, '')}`}
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
                        <span>{student.address || 'Kolkata, West Bengal'}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span className="status-badge paid">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
