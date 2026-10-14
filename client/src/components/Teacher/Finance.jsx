import React, { useState } from 'react';
import EducationIllustration from './EducationIllustration';
const MOCK_TRANSACTIONS = [
  { id: 'tx-1', student: 'Aarav Sharma', roll: 'CS-01', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: '11 Oct 2026', status: 'Paid', method: 'UPI' },
  { id: 'tx-2', student: 'Priya Sen', roll: 'CS-04', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: '10 Oct 2026', status: 'Paid', method: 'Net Banking' },
  { id: 'tx-3', student: 'Rahul Das', roll: 'CS-07', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: 'Due 05 Oct', status: 'Pending', method: 'Unpaid' },
  { id: 'tx-4', student: 'Ananya Roy', roll: 'CS-09', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: '08 Oct 2026', status: 'Paid', method: 'Cash' },
  { id: 'tx-5', student: 'Sourav Mukherjee', roll: 'CS-14', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: 'Due 01 Oct', status: 'Pending', method: 'Unpaid' },
  { id: 'tx-6', student: 'Sneha Paul', roll: 'CS-18', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: '02 Oct 2026', status: 'Paid', method: 'UPI' },
  { id: 'tx-7', student: 'Vikram Ghosh', roll: 'CS-22', batch: 'B.Sc 6th Sem', amount: '₹3,500', date: 'Due 25 Sep', status: 'Pending', method: 'Unpaid' }
];

const Finance = ({ onNavigate }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredData = MOCK_TRANSACTIONS.filter((item) => {
    const matchesFilter = filter === 'all' || item.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = item.student.toLowerCase().includes(search.toLowerCase()) || item.roll.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="finance-wrapper">
      <div className="finance-container">
        {/* Hero Section */}
        <section className="finance-hero-banner" aria-label="Finance Header">
          <div className="finance-hero-content">
            <span className="finance-hero-salutation">FINANCE &amp; FEES</span>
            <div className="finance-hero-title-group">
              <h1 className="finance-hero-title">Fee Management</h1>
              <div className="finance-hero-underline" aria-hidden="true" />
            </div>
            <p className="finance-hero-subtitle">Track collections, student dues, and fee receipts</p>
          </div>
          <div className="finance-hero-art" aria-hidden="true">
            <EducationIllustration />
          </div>
        </section>

        {/* Financial Metrics Cards */}
        <section className="finance-metrics-grid" aria-label="Fee Overview">
          <div className="finance-metric-card">
            <div className="finance-metric-icon collection-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="8" ry="2.6" />
                <path d="M4 5v14c0 1.44 3.58 2.6 8 2.6s8-1.16 8-2.6V5" />
                <path d="M4 12c0 1.44 3.58 2.6 8 2.6s8-1.16 8-2.6" />
              </svg>
            </div>
            <div className="finance-metric-data">
              <span className="finance-metric-label">Total Collected</span>
              <span className="finance-metric-value">₹1,42,000</span>
              <span className="finance-metric-sub green">88% of target</span>
            </div>
          </div>

          <div className="finance-metric-card">
            <div className="finance-metric-icon dues-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="finance-metric-data">
              <span className="finance-metric-label">Pending Dues</span>
              <span className="finance-metric-value">₹18,500</span>
              <span className="finance-metric-sub red">12% pending</span>
            </div>
          </div>

          <div className="finance-metric-card">
            <div className="finance-metric-icon defaulters-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="finance-metric-data">
              <span className="finance-metric-label">Due Defaulters</span>
              <span className="finance-metric-value">5 Students</span>
              <span className="finance-metric-sub indigo">Notice sent</span>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="finance-controls-card">
          <div className="finance-search-wrap">
            <svg className="finance-search-icon" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search student or roll number..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="finance-search-input"
            />
          </div>

          <div className="finance-filter-pills">
            <button 
              type="button" 
              className={`finance-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Records
            </button>
            <button 
              type="button" 
              className={`finance-pill ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
            <button 
              type="button" 
              className={`finance-pill ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="finance-list-card">
          <div className="finance-list-header">
            <h2 className="finance-list-title">Student Fee Records</h2>
            <span className="finance-list-count">{filteredData.length} records</span>
          </div>

          <div className="finance-records">
            {filteredData.length === 0 ? (
              <div className="finance-empty-state">
                <p>No student fee records found matching your filters.</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <div key={item.id} className="finance-record-item">
                  <div className="finance-student-avatar" aria-hidden="true">
                    {item.student.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="finance-student-info">
                    <span className="finance-student-name">{item.student}</span>
                    <span className="finance-student-meta">{item.roll} • {item.batch}</span>
                  </div>

                  <div className="finance-amount-block">
                    <span className="finance-amount-val">{item.amount}</span>
                    <span className="finance-amount-date">{item.date}</span>
                  </div>

                  <div className="finance-status-action">
                    <span className={`finance-status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                    {item.status === 'Paid' ? (
                      <button 
                        type="button" 
                        className="finance-action-btn"
                        onClick={() => showToast(`Receipt generated for ${item.student}`)}
                        title="Download Receipt"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="finance-action-btn reminder-btn"
                        onClick={() => showToast(`Payment reminder sent to ${item.student}`)}
                        title="Send Reminder"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="finance-toast" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
