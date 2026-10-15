import React, { useState } from 'react';
import { BookOpen, Plus, Users, Clock, Calendar, CheckCircle2, Search, Filter } from 'lucide-react';

export default function BatchesView({ batches, onCreateBatch, onSelectBatch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = batches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.subjects.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.teacher.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      <div className="cards-grid-2">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="batch-card">
            <div className="batch-card-top">
              <div>
                <strong>{batch.name}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--text-3)', fontSize: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Users size={15} /> {batch.studentCount || 0} students enrolled
                  </span>
                </div>
              </div>
              <span className="batch-status-pill active">Active</span>
            </div>

            <div className="batch-fee-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>{batch.feeType === 'ONE_TIME' ? 'FULL COURSE FEE' : 'MONTHLY TUITION FEE'}</span>
                <strong>
                  ₹{(batch.feeAmount || batch.monthlyFee || 0).toLocaleString('en-IN')}
                  <small style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginLeft: 4 }}>
                    {batch.feeType === 'ONE_TIME' ? ' / full course' : ' / month'}
                  </small>
                </strong>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>BILLING TYPE</span>
                <span style={{ fontWeight: 700, color: 'var(--teal-dark)', fontSize: 14 }}>
                  {batch.feeType === 'ONE_TIME' ? 'One-Time Enrolment' : 'Monthly Recurring'}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 8 }}>
                Subjects & Teacher Earning Share
              </div>
              <div className="batch-subjects">
                {batch.subjects.map((subj, idx) => {
                  let shareDisplay = '35% Share';
                  if (subj.sharePercent) {
                    shareDisplay = `${subj.sharePercent}% Share`;
                  } else if (typeof subj.earningModel === 'string') {
                    const match = subj.earningModel.match(/\d+%/);
                    shareDisplay = match ? `${match[0]} Share` : '35% Share';
                  }
                  return (
                    <div key={idx} className="batch-subject-item">
                      <span>{subj.name} · <small style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>{subj.teacher}</small></span>
                      <span style={{ background: '#eef8f5', color: 'var(--teal-dark)', fontWeight: 700, padding: '3px 8px', borderRadius: 5, fontSize: 13 }}>
                        {shareDisplay}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#909ca0', textTransform: 'uppercase', marginBottom: 8 }}>
                Class Schedule & Routine
              </div>
              <div className="batch-routine-preview">
                {batch.routine.map((r, idx) => (
                  <span key={idx} className="routine-chip">
                    {r.day}: {r.subject} ({r.time})
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
