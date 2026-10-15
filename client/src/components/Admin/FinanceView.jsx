import React, { useState } from 'react';
import { Wallet, AlertCircle, ReceiptText, MessageSquare, Download, CheckCircle2, Search, ArrowUpRight, ShieldCheck, Printer } from 'lucide-react';

export default function FinanceView({ students, transactions, onCollectFee, onSendReminder, onPrintReceipt }) {
  const [activeTab, setActiveTab] = useState('defaulters');
  const [searchTerm, setSearchTerm] = useState('');

  const dueStudents = students.filter(s => s.dueAmount > 0);
  const totalDues = dueStudents.reduce((acc, curr) => acc + curr.dueAmount, 0);
  const totalCollected = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredDueStudents = dueStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t =>
    t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-secondary" onClick={() => onSendReminder('all')}>
            <MessageSquare size={16} /> 1-Click WhatsApp Reminders
          </button>
          <button className="button-primary" onClick={() => onCollectFee(null)}>
            <ReceiptText size={16} /> Collect offline fee
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon teal-icon"><Wallet size={18} /></div>
            <span className="metric-change positive">+12.8% vs last mo</span>
          </div>
          <div className="metric-value">₹4.82L</div>
          <div className="metric-label">Total fee collected (October)</div>
          <div className="metric-bottom">
            <span>Cash: ₹2.65L · Online: ₹2.17L</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon rose-icon"><AlertCircle size={18} /></div>
            <span className="metric-change negative">{dueStudents.length} students due</span>
          </div>
          <div className="metric-value">₹{totalDues.toLocaleString('en-IN')}</div>
          <div className="metric-label">Outstanding fee balance</div>
          <div className="metric-bottom">
            <span style={{ color: '#d8696f' }}>Includes ₹350 late fines</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon orange-icon"><ReceiptText size={18} /></div>
            <span className="metric-change positive">100% verified</span>
          </div>
          <div className="metric-value">{transactions.length + 180}</div>
          <div className="metric-label">Official receipts issued</div>
          <div className="metric-bottom">
            <span>Direct to institute bank account</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon violet-icon"><ShieldCheck size={18} /></div>
            <span className="metric-change positive">Active</span>
          </div>
          <div className="metric-value">Razorpay</div>
          <div className="metric-label">Direct gateway settlement</div>
          <div className="metric-bottom">
            <span>Key ID: rzp_live_••••8921</span>
          </div>
        </div>
      </div>

      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === 'defaulters' ? 'active' : ''}`}
          onClick={() => setActiveTab('defaulters')}
        >
          <AlertCircle size={15} />
          <span>Pending Dues & Defaulter List</span>
          <span className="sub-tab-badge">{dueStudents.length}</span>
        </button>

        <button
          className={`sub-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ReceiptText size={15} />
          <span>Collection Ledger & Receipts</span>
          <span className="sub-tab-badge">{transactions.length}</span>
        </button>
      </div>

      {activeTab === 'defaulters' && (
        <div className="data-table-card">
          <div className="data-table-toolbar">
            <div className="data-table-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search defaulter by student, roll no or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="data-table-filters">
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>
                Total outstanding: <strong style={{ color: '#b96f13' }}>₹{totalDues.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student & Roll</th>
                  <th>Batch</th>
                  <th>Guardian WhatsApp</th>
                  <th>Due Date</th>
                  <th>Outstanding Due</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDueStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table">No pending fee dues! All students in this filter are cleared.</td>
                  </tr>
                ) : (
                  filteredDueStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="student-cell">
                          <div className={`student-avatar ${s.avatarTone}`}>
                            {s.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <strong>{s.name}</strong>
                            <small>Roll: {s.rollNo}</small>
                          </div>
                        </div>
                      </td>

                      <td><span className="batch-name">{s.batch}</span></td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{s.guardianPhone}</span>
                          <a
                            href={`https://wa.me/${s.guardianWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear Guardian, this is a reminder from DigiTute. Tuition fee of ₹${s.dueAmount} for ${s.name} is due on ${s.dueDate}. Kindly pay online or at the counter.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-btn"
                          >
                            <MessageSquare size={13} /> Send Due Alert
                          </a>
                        </div>
                      </td>

                      <td>
                        <span className="due-date">{s.dueDate}</span>
                      </td>

                      <td>
                        <strong className="due-amount" style={{ fontSize: 15 }}>
                          ₹{s.dueAmount.toLocaleString('en-IN')}
                        </strong>
                        {s.status === 'Overdue' && (
                          <span style={{ display: 'block', fontSize: 11.5, color: '#cf4953' }}>
                            Overdue (Includes fine)
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="button-primary"
                          style={{ minHeight: 34, fontSize: 13, padding: '0 14px' }}
                          onClick={() => onCollectFee(s)}
                        >
                          Collect Cash
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="data-table-card">
          <div className="data-table-toolbar">
            <div className="data-table-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by receipt no, student or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="data-table-filters">
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>
                Showing {filteredTransactions.length} recent settlements
              </span>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Student & Batch</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Date & Time</th>
                  <th>Collected By</th>
                  <th style={{ textAlign: 'right' }}>Official Slip</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong style={{ color: 'var(--teal-dark)', fontFamily: 'monospace', fontSize: 14.5 }}>
                        {tx.receiptNo}
                      </strong>
                    </td>

                    <td>
                      <div>
                        <strong>{tx.studentName}</strong>
                        <div style={{ fontSize: 13.5, color: 'var(--text-3)' }}>{tx.batch} · {tx.rollNo}</div>
                      </div>
                    </td>

                    <td>
                      <strong style={{ fontSize: 16, color: 'var(--text)' }}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>
                      <span className="status-badge success">
                        {tx.mode}
                      </span>
                    </td>

                    <td><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{tx.date}</span></td>

                    <td><span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>{tx.collectedBy}</span></td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="button-secondary"
                        style={{ minHeight: 36, fontSize: 14, padding: '0 14px' }}
                        onClick={() => onPrintReceipt(tx)}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
