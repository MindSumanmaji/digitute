import React, { useState } from 'react';
import { BookOpen, Plus, Users, Clock, Calendar, CheckCircle2, Search, Filter, Edit3, Trash2 } from 'lucide-react';

export default function BatchesView({ batches = [], teachers = [], students = [], onCreateBatch, onEditBatch, onDeleteBatch, onSelectBatch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = (batches || []).filter(b => {
    if (!b) return false;
    const nameMatch = (b.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const subjectsMatch = Array.isArray(b.subjects) && b.subjects.some(s =>
      (s?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s?.teacher || s?.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return nameMatch || subjectsMatch;
  });

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-primary" onClick={onCreateBatch}>
            <Plus size={16} /> Create new batch
          </button>
        </div>
      </div>

      <div className="data-table-toolbar" style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="data-table-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search batch name, subject or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="data-table-filters">
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{filteredBatches.length} active batches</span>
        </div>
      </div>

      {filteredBatches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px dashed var(--border)',
          marginTop: 20
        }}>
          <BookOpen size={40} style={{ color: 'var(--teal-primary)', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Batches Found</h3>
          <p style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 380, margin: '0 auto 16px' }}>
            {searchTerm ? `No batch matches "${searchTerm}". Try another search term.` : 'There are no active course batches yet. Click below to create your first batch.'}
          </p>
          <button className="button-primary" onClick={onCreateBatch} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Create new batch
          </button>
        </div>
      ) : (
        <div className="cards-grid-2">
          {filteredBatches.map((batch) => {
            const enrolledCount = (students && students.length > 0)
              ? students.filter(s => (s.batch_id === batch.id || s.batches?.name === batch.name || s.batch === batch.name) && s.is_active !== false).length
              : (batch.student_count ?? batch.studentCount ?? 0);

            return (
              <div key={batch.id} className="batch-card">
                <div className="batch-card-top">
                  <div>
                    <strong>{batch.name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--text-3)', fontSize: 14 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Users size={15} /> {enrolledCount} {enrolledCount === 1 ? 'student enrolled' : 'students enrolled'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className={`batch-status-pill ${batch.is_active !== false ? 'active' : 'inactive'}`}>
                      {batch.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      className="button-secondary btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRadius: '8px'
                      }}
                      title="Edit Batch"
                      onClick={() => onEditBatch && onEditBatch(batch)}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '8px',
                        border: '1px solid #ffd4d8',
                        background: '#fff5f6',
                        color: '#d33',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title="Delete Batch"
                      onClick={() => onDeleteBatch && onDeleteBatch({ ...batch, student_count: enrolledCount, studentCount: enrolledCount })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              <div className="batch-fee-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>{batch.fee_type === 'ONE_TIME' ? 'FULL COURSE FEE' : 'MONTHLY TUITION FEE'}</span>
                  <strong>
                    ₹{Number(batch.fee_amount || 0).toLocaleString('en-IN')}
                    <small style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginLeft: 4 }}>
                      {batch.fee_type === 'ONE_TIME' ? ' / full course' : ' / month'}
                    </small>
                  </strong>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>BILLING TYPE</span>
                  <span style={{ fontWeight: 700, color: 'var(--teal-dark)', fontSize: 14 }}>
                    {batch.fee_type === 'ONE_TIME' ? 'One-Time Enrolment' : 'Monthly Recurring'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 8 }}>
                  Subjects & Faculty Revenue Share
                </div>
                <div className="batch-subjects">
                  {(!batch.subjects || batch.subjects.length === 0) ? (
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>No subjects configured</span>
                  ) : (
                    batch.subjects.map((subj, idx) => {
                      const shareVal = subj.share_percent != null ? subj.share_percent : 35;
                      const matchedTeacher = (teachers || []).find(t => t.id === (subj.teacher_id || subj.teacherId));
                      const teacherName = subj.teacher_name || subj.teacher || matchedTeacher?.full_name || matchedTeacher?.name;
                      return (
                        <div key={idx} className="batch-subject-item">
                          <span>
                            {subj.name || 'Subject'}
                            {teacherName && (
                              <small style={{ color: 'var(--teal-dark)', fontWeight: 600, marginLeft: 6 }}>
                                · {teacherName}
                              </small>
                            )}
                          </span>
                          <span style={{ background: '#eef8f5', color: 'var(--teal-dark)', fontWeight: 700, padding: '3px 8px', borderRadius: 5, fontSize: 13 }}>
                            {shareVal}% Share
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 8 }}>
                  Class Schedule & Routine
                </div>
                <div className="batch-routine-preview">
                  {(!batch.routine || batch.routine.length === 0) ? (
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>No routine slots scheduled</span>
                  ) : (
                    batch.routine.map((r, idx) => (
                      <span key={idx} className="routine-chip">
                        {r.day}: {r.subject} ({r.time})
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
