import React, { useState } from 'react';

export default function FeesTab({ paymentDone, setPayModalOpen, showToast }) {
  const [feeYearFilter, setFeeYearFilter] = useState('2026');
  const [feeMonthFilter, setFeeMonthFilter] = useState('All Months');
  const [currentBatchDropdown, setCurrentBatchDropdown] = useState(false);
  const [selectedFeeBatch, setSelectedFeeBatch] = useState('Class XII - Science (2026)');

  return (
    <div className="sp-view-container sp-fees-view">
      {/* Header Row */}
      <div className="sp-fees-header-row">
        <div>
          <h1 className="sp-page-title">Fees & Payments</h1>
          <p className="sp-page-subtitle">Track your payments, check due amount and download receipts.</p>
        </div>
      </div>

      {/* Top 2 Hero Cards Grid */}
      <div className="sp-fees-hero-grid">
        {/* Left: Due Amount Card */}
        <div className="sp-due-amount-card">
          <div className="sp-due-left-info">
            <span className="sp-due-tag">DUE AMOUNT</span>
            <h2 className="sp-due-amount-val">{paymentDone ? '₹0' : '₹600'}</h2>
            <span className="sp-due-for-text">{paymentDone ? 'Dues cleared for September 2026' : 'for September 2026'}</span>
            
            <div className="sp-due-status-row">
              {!paymentDone ? (
                <span className="sp-badge-pending-pill">
                  <span className="sp-badge-excl-circle">!</span>
                  Payment Pending
                </span>
              ) : (
                <span className="sp-badge-paid-pill">
                  ✓ No Dues Pending
                </span>
              )}
            </div>

            <span className="sp-due-last-payment">
              {paymentDone ? 'Last payment: Today' : 'Last payment: 8 Aug 2026'}
            </span>
          </div>

          {/* Red Calendar Circle Icon on top right */}
          <div className="sp-due-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
        </div>

        {/* Right: Make a Payment Card */}
        <div className="sp-card sp-make-payment-card">
          <div className="sp-make-pay-top">
            <h3 className="sp-make-pay-title">Make a Payment</h3>
            <p className="sp-make-pay-sub">Pay your tuition fee securely online.</p>

            <button 
              className="sp-pay-now-btn"
              disabled={paymentDone}
              onClick={() => {
                if (!paymentDone) setPayModalOpen(true);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>{paymentDone ? 'All Fees Paid ✓' : 'Pay Now →'}</span>
            </button>
          </div>

          {/* Secure powered by strip */}
          <div className="sp-payment-trust-strip">
            <div className="sp-trust-badge-left">
              <div className="sp-shield-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div>
                <strong className="sp-trust-title">Secure payments powered by Razorpay</strong>
                <span className="sp-trust-sub">UPI, NetBanking, Cards & more</span>
              </div>
            </div>

            <div className="sp-payment-brands">
              <span className="sp-brand-chip brand-gpay" title="Google Pay / UPI">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" fill="#4285F4" opacity="0.15"/>
                  <path d="M7 12l3 3 7-7" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="sp-brand-chip brand-phonepe" title="PhonePe">
                <span style={{ color: '#6739b7', fontWeight: 800, fontSize: '13px' }}>पे</span>
              </span>
              <span className="sp-brand-chip brand-paytm" title="Paytm">
                <span style={{ color: '#00baf2', fontWeight: 800, fontSize: '10px', letterSpacing: '-0.5px' }}>paytm</span>
              </span>
              <span className="sp-brand-chip brand-card" title="Credit / Debit Card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History & Receipts (Full Width) */}
      <div className="sp-card sp-payment-history-card">
        <div className="sp-history-head-row">
          <div>
            <h3 className="sp-history-title">Payment History & Receipts</h3>
            <p className="sp-history-sub">View all your past payments and download receipts.</p>
          </div>

          {/* Year & Month Filters */}
          <div className="sp-history-filters-group">
            {/* Year Filter */}
            <div className="sp-filter-select-wrap">
              <span className="sp-filter-label">Year:</span>
              <select 
                className="sp-history-select" 
                value={feeYearFilter} 
                onChange={(e) => setFeeYearFilter(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="All Years">All Years</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="sp-filter-select-wrap">
              <span className="sp-filter-label">Month:</span>
              <select 
                className="sp-history-select" 
                value={feeMonthFilter} 
                onChange={(e) => setFeeMonthFilter(e.target.value)}
              >
                <option value="All Months">All Months</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sp-table-scroll-wrap">
          <table className="sp-fees-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allTransactions = [
                  ...(paymentDone ? [{ date: 'Today', month: 'September', year: '2026', desc: 'Tuition Fee - September 2026', sub: selectedFeeBatch, amt: '₹600', isNew: true }] : []),
                  { date: '08 Aug 2026', month: 'August', year: '2026', desc: 'Tuition Fee - August 2026', sub: selectedFeeBatch, amt: '₹600' },
                  { date: '08 Jul 2026', month: 'July', year: '2026', desc: 'Tuition Fee - July 2026', sub: selectedFeeBatch, amt: '₹600' },
                  { date: '08 Jun 2026', month: 'June', year: '2026', desc: 'Tuition Fee - June 2026', sub: selectedFeeBatch, amt: '₹600' },
                  { date: '08 May 2026', month: 'May', year: '2026', desc: 'Tuition Fee - May 2026', sub: selectedFeeBatch, amt: '₹600' },
                  { date: '08 Apr 2026', month: 'April', year: '2026', desc: 'Tuition Fee - April 2026', sub: selectedFeeBatch, amt: '₹600' },
                  { date: '10 Dec 2025', month: 'December', year: '2025', desc: 'Tuition Fee - December 2025', sub: 'Class XI - Science', amt: '₹600' },
                  { date: '10 Nov 2025', month: 'November', year: '2025', desc: 'Tuition Fee - November 2025', sub: 'Class XI - Science', amt: '₹600' },
                ];

                const filtered = allTransactions.filter((item) => {
                  const matchYear = feeYearFilter === 'All Years' || item.year === feeYearFilter;
                  const matchMonth = feeMonthFilter === 'All Months' || item.month === feeMonthFilter;
                  return matchYear && matchMonth;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No payment receipts found for {feeMonthFilter !== 'All Months' ? feeMonthFilter : ''} {feeYearFilter !== 'All Years' ? feeYearFilter : ''}.
                      </td>
                    </tr>
                  );
                }

                return filtered.map((item, idx) => (
                  <tr key={idx} className={item.isNew ? 'sp-row-highlight' : ''}>
                    <td className="sp-date-cell">{item.date}</td>
                    <td>
                      <strong className="sp-desc-main">{item.desc}</strong>
                      <span className="sp-desc-sub">{item.sub}</span>
                    </td>
                    <td className="sp-amt-cell">{item.amt}</td>
                    <td>
                      <span className="sp-paid-tag">PAID</span>
                    </td>
                    <td>
                      <button 
                        className="sp-receipt-download-btn"
                        onClick={() => showToast(`Receipt for ${item.desc} downloaded`)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
