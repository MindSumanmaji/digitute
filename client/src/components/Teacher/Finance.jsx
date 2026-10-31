import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../api';

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

const Finance = ({ onNavigate, activeSubSection = 'collect' }) => {
  // Active sub-section controlled by sidebar URL route: 'collect' | 'all-payments' | 'earnings'
  const mainSubTab = activeSubSection;

  // Tab 1 (Collect Cash) Inner states
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [collectingId, setCollectingId] = useState(null);

  // Tab 2 (All Payments) states
  const [allInvoicesSearch, setAllInvoicesSearch] = useState('');
  const [allInvoicesBatch, setAllInvoicesBatch] = useState('');
  const [allInvoicesMonth, setAllInvoicesMonth] = useState('');
  const [allInvoicesYear, setAllInvoicesYear] = useState('');
  const [allInvoicesStatus, setAllInvoicesStatus] = useState('ALL');
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(null);

  // Common Feedback & Data states
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [allInvoicesLoading, setAllInvoicesLoading] = useState(false);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const [duesList, setDuesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [allInvoicesList, setAllInvoicesList] = useState([]);

  // Teacher Distribution States
  const [distBatch, setDistBatch] = useState('');
  const [distMonth, setDistMonth] = useState(() => String(new Date().getMonth() + 1));
  const [distYear, setDistYear] = useState(() => String(new Date().getFullYear()));
  const [distData, setDistData] = useState(null);
  const [distLoading, setDistLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoiceNo(text);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedInvoiceNo(null), 2000);
  };

  // 1. Fetch Dues for Collect Cash
  const fetchDues = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedBatch
        ? `/api/teacher/student-dues?batch_id=${selectedBatch}`
        : '/api/teacher/student-dues';
      const data = await apiRequest(url);
      setDuesList(data.invoices || []);
      setBatchesList(data.batches || []);
    } catch (err) {
      console.warn('Failed to load teacher student dues:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  // 2. Fetch All Invoices (Both Paid & Due) for All Payments Table
  const fetchAllInvoices = useCallback(async () => {
    try {
      setAllInvoicesLoading(true);
      const data = await apiRequest('/api/teacher/student-dues?status=ALL');
      setAllInvoicesList(data.invoices || []);
      if (!batchesList.length && data.batches) {
        setBatchesList(data.batches);
      }
    } catch (err) {
      console.warn('Failed to load all student invoices:', err.message);
    } finally {
      setAllInvoicesLoading(false);
    }
  }, [batchesList.length]);

  // 3. Fetch Batches for Teacher
  const fetchTeacherBatches = useCallback(async () => {
    try {
      const bData = await apiRequest('/api/teacher/batches');
      if (Array.isArray(bData) && bData.length) {
        setBatchesList(bData);
        setDistBatch((prev) => prev || bData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load teacher batches:', err.message);
    }
  }, []);

  // 4. Fetch Distribution Preview & Earnings for Teacher
  const fetchDistributionPreview = useCallback(async () => {
    if (!distBatch) {
      setDistData(null);
      return;
    }
    try {
      setDistLoading(true);
      const url = `/api/teacher/distribution-preview?batch_id=${distBatch}&billing_month=${distMonth}&billing_year=${distYear}`;
      const data = await apiRequest(url);
      setDistData(data);
    } catch (err) {
      console.warn('Failed to load distribution preview:', err.message);
    } finally {
      setDistLoading(false);
    }
  }, [distBatch, distMonth, distYear]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  useEffect(() => {
    if (mainSubTab === 'all-payments') {
      fetchAllInvoices();
    } else if (mainSubTab === 'earnings') {
      fetchTeacherBatches();
    }
  }, [mainSubTab, fetchAllInvoices, fetchTeacherBatches]);

  useEffect(() => {
    if (mainSubTab === 'earnings' && distBatch) {
      fetchDistributionPreview();
    }
  }, [mainSubTab, distBatch, distMonth, distYear, fetchDistributionPreview]);

  // 1-Click Collect Cash Handler
  const handleDirectCollectCash = async (item) => {
    const amt = Number(item.net_due || item.payable_amount || 0);
    if (!amt || amt <= 0) {
      showToast('No outstanding due amount found for this invoice.');
      return;
    }

    try {
      setCollectingId(item.id);
      await apiRequest('/api/teacher/collect-cash', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: item.id,
          amount: amt
        })
      });
      showToast(`₹${amt.toLocaleString('en-IN')} cash collected for ${item.student_name}. Sent to Admin for clearance.`);
      fetchDues();
      fetchAllInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to record cash collection.');
    } finally {
      setCollectingId(null);
    }
  };

  // Determine if selected batch in Collect Cash is ONE_TIME or MONTHLY
  const selectedBatchObj = useMemo(() => {
    return batchesList.find(b => b.id === selectedBatch) || null;
  }, [batchesList, selectedBatch]);

  const isOneTimeBatch = selectedBatchObj?.fee_type === 'ONE_TIME';

  // Filter dues list for Tab 1 (Collect Cash)
  const isFilterComplete = useMemo(() => {
    if (!selectedBatch) return false;
    if (isOneTimeBatch) return true;
    return Boolean(selectedMonth && selectedYear);
  }, [selectedBatch, isOneTimeBatch, selectedMonth, selectedYear]);

  const filteredDues = useMemo(() => {
    if (!isFilterComplete) {
      return [];
    }

    return duesList.filter((item) => {
      const matchesSearch =
        (item.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.batch_name || '').toLowerCase().includes(search.toLowerCase());

      const matchesBatch = item.batch_id === selectedBatch;

      let matchesMonth = true;
      let matchesYear = true;

      if (!isOneTimeBatch && item.invoice_type !== 'ONE_TIME') {
        matchesMonth = String(item.billing_month) === String(selectedMonth);
        matchesYear = String(item.billing_year) === String(selectedYear);
      }

      return matchesSearch && matchesBatch && matchesMonth && matchesYear;
    });
  }, [duesList, search, selectedBatch, selectedMonth, selectedYear, isOneTimeBatch, isFilterComplete]);

  // Determine if selected batch in All Payments is ONE_TIME or MONTHLY
  const selectedAllInvoicesBatchObj = useMemo(() => {
    return batchesList.find(b => b.id === allInvoicesBatch) || null;
  }, [batchesList, allInvoicesBatch]);

  const isAllPaymentsOneTime = selectedAllInvoicesBatchObj?.fee_type === 'ONE_TIME';

  // In All Payments: Must select batch (and if monthly, month & year) before showing invoices
  const isAllPaymentsFilterComplete = useMemo(() => {
    if (!allInvoicesBatch) return false;
    if (isAllPaymentsOneTime) return true;
    return Boolean(allInvoicesMonth && allInvoicesYear);
  }, [allInvoicesBatch, isAllPaymentsOneTime, allInvoicesMonth, allInvoicesYear]);

  // Filter all invoices for Tab 2 (All Payments)
  const filteredAllInvoices = useMemo(() => {
    if (!isAllPaymentsFilterComplete) {
      return [];
    }

    return allInvoicesList.filter((inv) => {
      const term = allInvoicesSearch.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (inv.student_name || '').toLowerCase().includes(term) ||
        (inv.invoice_number || '').toLowerCase().includes(term) ||
        (inv.student_phone || '').includes(term);

      const matchesBatch = inv.batch_id === allInvoicesBatch;

      const matchesStatus =
        allInvoicesStatus === 'ALL' ||
        (allInvoicesStatus === 'PAID' && inv.status === 'PAID') ||
        (allInvoicesStatus === 'PENDING' && inv.status === 'PENDING' && !inv.is_under_verification) ||
        (allInvoicesStatus === 'UNDER_VERIFICATION' && inv.is_under_verification);

      let matchesMonth = true;
      let matchesYear = true;

      if (!isAllPaymentsOneTime && inv.invoice_type !== 'ONE_TIME') {
        matchesMonth = String(inv.billing_month) === String(allInvoicesMonth);
        matchesYear = String(inv.billing_year) === String(allInvoicesYear);
      }

      return matchesSearch && matchesBatch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [allInvoicesList, allInvoicesSearch, allInvoicesBatch, allInvoicesStatus, allInvoicesMonth, allInvoicesYear, isAllPaymentsOneTime, isAllPaymentsFilterComplete]);

  return (
    <div className="finance-wrapper">
      <div className="finance-container" style={{ paddingTop: 16 }}>



        {/* ============================================================== */}
        {/* SUB-TAB 1: COLLECT CASH (Current Tool)                         */}
        {/* ============================================================== */}
        {mainSubTab === 'collect' && (
          <>
            {/* Strict Single Row Toolbar: Search + Batch + Month + Year all aligned horizontally together */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'nowrap',
              overflowX: 'auto',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Search Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '0 10px',
                height: 36,
                width: 220,
                flexShrink: 0,
                boxSizing: 'border-box'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search student, invoice #..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 12.5,
                    color: '#0f172a',
                    width: '100%',
                    height: '100%',
                    minHeight: 'unset',
                    padding: 0,
                    margin: 0
                  }}
                />
              </div>

              {/* Dynamic Filters aligned directly beside the search box in the same row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexShrink: 0
              }}>
                {/* Batch Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Batch:</label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedBatch(val);
                      const found = batchesList.find(b => b.id === val);
                      if (found?.fee_type === 'ONE_TIME') {
                        setSelectedMonth('');
                        setSelectedYear('');
                      }
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: 13,
                      fontWeight: selectedBatch ? 600 : 400,
                      color: selectedBatch ? '#0f172a' : '#64748b',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Batch</option>
                    {batchesList.map((b) => (
                      <option key={b.id} value={b.id} style={{ color: '#0f172a' }}>
                        {b.name} {b.fee_type === 'ONE_TIME' ? '(One-Time)' : '(Monthly)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Filter Dropdown - Blocked/Disabled if ONE_TIME */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isOneTimeBatch ? 0.45 : 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Month:</label>
                  <select
                    disabled={isOneTimeBatch}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    title={isOneTimeBatch ? 'Month filter is blocked for One-Time payment batches' : 'Select billing month'}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: isOneTimeBatch ? '#f1f5f9' : '#fff',
                      fontSize: 13,
                      fontWeight: selectedMonth ? 600 : 400,
                      color: isOneTimeBatch ? '#94a3b8' : (selectedMonth ? '#0f172a' : '#64748b'),
                      outline: 'none',
                      cursor: isOneTimeBatch ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">Select Month</option>
                    <option value="1" style={{ color: '#0f172a' }}>January</option>
                    <option value="2" style={{ color: '#0f172a' }}>February</option>
                    <option value="3" style={{ color: '#0f172a' }}>March</option>
                    <option value="4" style={{ color: '#0f172a' }}>April</option>
                    <option value="5" style={{ color: '#0f172a' }}>May</option>
                    <option value="6" style={{ color: '#0f172a' }}>June</option>
                    <option value="7" style={{ color: '#0f172a' }}>July</option>
                    <option value="8" style={{ color: '#0f172a' }}>August</option>
                    <option value="9" style={{ color: '#0f172a' }}>September</option>
                    <option value="10" style={{ color: '#0f172a' }}>October</option>
                    <option value="11" style={{ color: '#0f172a' }}>November</option>
                    <option value="12" style={{ color: '#0f172a' }}>December</option>
                  </select>
                </div>

                {/* Year Filter Dropdown - Blocked/Disabled if ONE_TIME */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isOneTimeBatch ? 0.45 : 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Year:</label>
                  <select
                    disabled={isOneTimeBatch}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    title={isOneTimeBatch ? 'Year filter is blocked for One-Time payment batches' : 'Select billing year'}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: isOneTimeBatch ? '#f1f5f9' : '#fff',
                      fontSize: 13,
                      fontWeight: selectedYear ? 600 : 400,
                      color: isOneTimeBatch ? '#94a3b8' : (selectedYear ? '#0f172a' : '#64748b'),
                      outline: 'none',
                      cursor: isOneTimeBatch ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">Select Year</option>
                    <option value="2026" style={{ color: '#0f172a' }}>2026</option>
                    <option value="2027" style={{ color: '#0f172a' }}>2027</option>
                    <option value="2025" style={{ color: '#0f172a' }}>2025</option>
                  </select>
                </div>

                {isOneTimeBatch && (
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}>
                    ℹ️ One-Time batch
                  </span>
                )}
              </div>
            </div>

            {/* Dues List Container */}
            <div className="finance-list-card" style={{ marginTop: 14 }}>
              <div className="finance-list-header">
                <div>
                  <h2 className="finance-list-title">Pending Tuition Fee Dues</h2>
                  <span style={{ fontSize: 13, color: 'var(--text-3, #64748b)' }}>
                    Enrolled students in your batches with outstanding monthly or course fees
                  </span>
                </div>
                <span className="finance-list-count">{filteredDues.length} students</span>
              </div>

              <div className="finance-records">
                {loading ? (
                  <div className="finance-empty-state">
                    <p>Loading student fee records...</p>
                  </div>
                ) : !isFilterComplete ? (
                  <div className="finance-empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
                      {!selectedBatch
                        ? 'Select a course batch from the dropdown above to view student dues and collect tuition fees.'
                        : 'Please select Month and Year to view student dues for this batch.'}
                    </p>
                  </div>
                ) : filteredDues.length === 0 ? (
                  <div className="finance-empty-state">
                    <p>No outstanding fee dues found matching the selected filters.</p>
                  </div>
                ) : (
                  filteredDues.map((item) => {
                    const isUnderVerif = item.is_under_verification;
                    const hasRejected = item.has_rejected_payment && !isUnderVerif;

                    return (
                      <div key={item.id} className="finance-record-item">
                        <div className="finance-student-avatar" aria-hidden="true">
                          {(item.student_name || 'ST').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="finance-student-info">
                          <span className="finance-student-name">{item.student_name}</span>
                          <span className="finance-student-meta">
                            <strong style={{ color: '#0d9488' }}>{item.invoice_number}</strong>
                          </span>
                          {hasRejected && (
                            <div style={{ fontSize: 11.5, color: '#e11d48', marginTop: 3, fontWeight: 600 }}>
                              ⚠️ Previous cash rejected: "{item.rejected_reason || 'Not approved by admin'}"
                            </div>
                          )}
                        </div>

                        <div className="finance-amount-block">
                          <span className="finance-amount-val">{formatINR(item.net_due)}</span>
                          <span className="finance-amount-date">
                            {item.invoice_type === 'ONE_TIME' ? 'One-Time' : 'Monthly Fee'}
                          </span>
                        </div>

                        <div className="finance-status-action">
                          {isUnderVerif ? (
                            <span style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: '#fef3c7',
                              color: '#b45309'
                            }}>
                              Under Verification
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={collectingId === item.id}
                              onClick={() => handleDirectCollectCash(item)}
                              style={{
                                background: collectingId === item.id ? '#94a3b8' : '#0d9488',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '7px 14px',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: collectingId === item.id ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <span>{collectingId === item.id ? 'Collecting...' : 'Collect Cash'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* SUB-TAB 2: ALL PAYMENTS (Batch & Student Invoices Table)        */}
        {/* ============================================================== */}
        {mainSubTab === 'all-payments' && (
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Single Row Toolbar: Search + Batches + Statuses + Counter aligned horizontally in 1 line */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'nowrap',
              overflowX: 'auto'
            }}>
              {/* Search input on the Left */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '0 10px',
                height: 36,
                width: 250,
                flexShrink: 0,
                boxSizing: 'border-box'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search student, invoice #..."
                  value={allInvoicesSearch}
                  onChange={(e) => setAllInvoicesSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 12.5,
                    color: '#0f172a',
                    width: '100%',
                    height: '100%',
                    minHeight: 'unset',
                    padding: 0,
                    margin: 0
                  }}
                />
              </div>

              {/* Dropdown Filters & Counter on the Right in the same row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0
              }}>
                {/* Batch Filter */}
                <select
                  value={allInvoicesBatch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAllInvoicesBatch(val);
                    const found = batchesList.find(b => b.id === val);
                    if (found?.fee_type === 'ONE_TIME') {
                      setAllInvoicesMonth('');
                      setAllInvoicesYear('');
                    }
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: allInvoicesBatch ? 600 : 400,
                    color: allInvoicesBatch ? '#0f172a' : '#64748b',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select Batch</option>
                  {batchesList.map(b => (
                    <option key={b.id} value={b.id} style={{ color: '#0f172a' }}>
                      {b.name} {b.fee_type === 'ONE_TIME' ? '(One-Time)' : '(Monthly)'}
                    </option>
                  ))}
                </select>

                {/* Month Filter - Blocked if ONE_TIME or no batch selected */}
                <select
                  disabled={!allInvoicesBatch || isAllPaymentsOneTime}
                  value={allInvoicesMonth}
                  onChange={(e) => setAllInvoicesMonth(e.target.value)}
                  title={
                    !allInvoicesBatch
                      ? 'Please select a batch first'
                      : isAllPaymentsOneTime
                      ? 'Month filter is blocked for One-Time payment batches'
                      : 'Select billing month'
                  }
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: (!allInvoicesBatch || isAllPaymentsOneTime) ? '#f1f5f9' : '#fff',
                    fontSize: 13,
                    fontWeight: allInvoicesMonth ? 600 : 400,
                    color: (!allInvoicesBatch || isAllPaymentsOneTime) ? '#94a3b8' : (allInvoicesMonth ? '#0f172a' : '#64748b'),
                    outline: 'none',
                    cursor: (!allInvoicesBatch || isAllPaymentsOneTime) ? 'not-allowed' : 'pointer',
                    opacity: (!allInvoicesBatch || isAllPaymentsOneTime) ? 0.5 : 1
                  }}
                >
                  <option value="">Select Month</option>
                  <option value="1" style={{ color: '#0f172a' }}>January</option>
                  <option value="2" style={{ color: '#0f172a' }}>February</option>
                  <option value="3" style={{ color: '#0f172a' }}>March</option>
                  <option value="4" style={{ color: '#0f172a' }}>April</option>
                  <option value="5" style={{ color: '#0f172a' }}>May</option>
                  <option value="6" style={{ color: '#0f172a' }}>June</option>
                  <option value="7" style={{ color: '#0f172a' }}>July</option>
                  <option value="8" style={{ color: '#0f172a' }}>August</option>
                  <option value="9" style={{ color: '#0f172a' }}>September</option>
                  <option value="10" style={{ color: '#0f172a' }}>October</option>
                  <option value="11" style={{ color: '#0f172a' }}>November</option>
                  <option value="12" style={{ color: '#0f172a' }}>December</option>
                </select>

                {/* Year Filter - Blocked if ONE_TIME or no batch selected */}
                <select
                  disabled={!allInvoicesBatch || isAllPaymentsOneTime}
                  value={allInvoicesYear}
                  onChange={(e) => setAllInvoicesYear(e.target.value)}
                  title={
                    !allInvoicesBatch
                      ? 'Please select a batch first'
                      : isAllPaymentsOneTime
                      ? 'Year filter is blocked for One-Time payment batches'
                      : 'Select billing year'
                  }
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: (!allInvoicesBatch || isAllPaymentsOneTime) ? '#f1f5f9' : '#fff',
                    fontSize: 13,
                    fontWeight: allInvoicesYear ? 600 : 400,
                    color: (!allInvoicesBatch || isAllPaymentsOneTime) ? '#94a3b8' : (allInvoicesYear ? '#0f172a' : '#64748b'),
                    outline: 'none',
                    cursor: (!allInvoicesBatch || isAllPaymentsOneTime) ? 'not-allowed' : 'pointer',
                    opacity: (!allInvoicesBatch || isAllPaymentsOneTime) ? 0.5 : 1
                  }}
                >
                  <option value="">Select Year</option>
                  <option value="2026" style={{ color: '#0f172a' }}>2026</option>
                  <option value="2027" style={{ color: '#0f172a' }}>2027</option>
                  <option value="2025" style={{ color: '#0f172a' }}>2025</option>
                </select>

                {/* Status Filter */}
                <select
                  value={allInvoicesStatus}
                  onChange={(e) => setAllInvoicesStatus(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Dues Only</option>
                  <option value="UNDER_VERIFICATION">Under Verification</option>
                  <option value="PAID">Paid Only</option>
                </select>

                <span style={{ fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                  {isAllPaymentsFilterComplete
                    ? <>Showing <strong>{filteredAllInvoices.length}</strong> invoices</>
                    : <span style={{ color: '#94a3b8' }}>Select batch & period</span>}
                </span>
              </div>
            </div>

            {/* Table Wrap */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      INVOICE
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      STUDENT NAME
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      BATCH
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PAYMENT TYPE
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      AMOUNT
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allInvoicesLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                        Loading invoices...
                      </td>
                    </tr>
                  ) : !isAllPaymentsFilterComplete ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                        <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                          {!allInvoicesBatch
                            ? 'Select a course batch from the dropdown above to view payment records.'
                            : 'Please select Month and Year to view payment records for this batch.'}
                        </p>
                      </td>
                    </tr>
                  ) : filteredAllInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                        No invoices match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAllInvoices.map((inv) => {
                      const isPaid = inv.status === 'PAID';
                      const isUnderVerif = inv.is_under_verification;
                      const isDue = !isPaid && !isUnderVerif;

                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          {/* Invoice */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0d9488', fontSize: 13 }}>
                                {inv.invoice_number}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(inv.invoice_number)}
                                title="Copy invoice number"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 2,
                                  color: copiedInvoiceNo === inv.invoice_number ? '#0d9488' : '#94a3b8'
                                }}
                              >
                                {copiedInvoiceNo === inv.invoice_number ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Student Name */}
                          <td style={{ padding: '14px 18px' }}>
                            <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                              {inv.student_name}
                            </strong>
                          </td>

                          {/* Batch */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '3px 9px',
                              borderRadius: 6
                            }}>
                              {inv.batch_name}
                            </span>
                          </td>

                          {/* Payment Type */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: inv.invoice_type === 'ONE_TIME' ? '#f0fdf4' : '#f8fafc',
                              color: inv.invoice_type === 'ONE_TIME' ? '#15803d' : '#475569',
                              border: `1px solid ${inv.invoice_type === 'ONE_TIME' ? '#bbf7d0' : '#e2e8f0'}`
                            }}>
                              {inv.invoice_type === 'ONE_TIME' ? 'One-Time' : 'Monthly'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '14px 18px' }}>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>
                              {formatINR(inv.payable_amount)}
                            </strong>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 18px' }}>
                            {isPaid && (
                              <span style={{ color: '#059669', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Paid
                              </span>
                            )}
                            {isUnderVerif && (
                              <span style={{
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '3px 9px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: 11.5
                              }}>
                                Under Verification
                              </span>
                            )}
                            {isDue && (
                              <span style={{
                                color: '#dc2626',
                                background: '#fef2f2',
                                padding: '3px 9px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: 11.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Due
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-TAB 3: MY EARNINGS / FEE DISTRIBUTION                      */}
        {/* ============================================================== */}
        {mainSubTab === 'earnings' && (
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            {/* 1) 3 Filters: Select Batch, Billing Month, Year */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 260, flex: 2 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Select Batch
                </label>
                <select
                  value={distBatch}
                  onChange={(e) => setDistBatch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 13.5,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Select Batch --</option>
                  {batchesList.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.fee_type === 'ONE_TIME' ? 'One-Time Course' : 'Monthly Fee'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 150, flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Billing Month
                </label>
                <select
                  value={distMonth}
                  onChange={(e) => setDistMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 13.5,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div style={{ minWidth: 120, flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Year
                </label>
                <select
                  value={distYear}
                  onChange={(e) => setDistYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 13.5,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </div>

            {/* Content: Cards & Table */}
            {!distBatch ? (
              <div style={{ marginTop: 24, padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#334155' }}>
                  Please select a Batch
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Choose an assigned batch from above to view batch fee collections and your revenue share breakdown.
                </div>
              </div>
            ) : distLoading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Loading revenue shares &amp; collection...</div>
              </div>
            ) : distData ? (
              <div style={{ marginTop: 22, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                {/* 2) 3 Cards: Total Collected, Total Distributed, My Earnings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                  {/* Card 1: Total Fee Collected */}
                  <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>Total Fee Collected</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                      {formatINR(distData.total_collected)}
                    </div>
                  </div>

                  {/* Card 2: Total Distributed */}
                  <div style={{
                    background: distData.already_distributed ? '#ecfdf5' : '#f8fafc',
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: distData.already_distributed ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: 12.5, color: distData.already_distributed ? '#047857' : '#64748b', fontWeight: 600 }}>
                      Total Distributed
                    </div>
                    <div style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: distData.already_distributed ? '#059669' : '#0f172a',
                      marginTop: 4
                    }}>
                      {formatINR(distData.already_distributed ? distData.total_distributed : 0)}
                    </div>
                  </div>

                  {/* Card 3: My Earnings */}
                  <div style={{
                    background: distData.already_distributed ? '#eff6ff' : '#f8fafc',
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: distData.already_distributed ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: 12.5, color: distData.already_distributed ? '#1d4ed8' : '#64748b', fontWeight: 600 }}>
                      My Earnings
                    </div>
                    <div style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: distData.already_distributed ? '#2563eb' : '#0f172a',
                      marginTop: 4
                    }}>
                      {formatINR(distData.already_distributed ? distData.my_earnings : 0)}
                    </div>
                  </div>
                </div>

                {/* 3) Table: TEACHER | SUBJECT | REVENUE SHARE % | PAYOUT AMOUNT */}
                <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '11px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>TEACHER</th>
                        <th style={{ padding: '11px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>SUBJECT</th>
                        <th style={{ padding: '11px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>REVENUE SHARE %</th>
                        <th style={{ padding: '11px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>PAYOUT AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const teachersList = distData.teachers_distribution || [];
                        if (teachersList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                No teachers or revenue share percentages configured for this batch.
                              </td>
                            </tr>
                          );
                        }
                        return teachersList.map((t, idx) => {
                          const isMe = t.teacher_id === distData.current_teacher_id;
                          return (
                            <tr key={idx} style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isMe ? '#f0fdf4' : 'transparent'
                            }}>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
                                {t.teacher_name}
                                {isMe && (
                                  <span style={{
                                    marginLeft: 8,
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: '#bbf7d0',
                                    color: '#166534',
                                    fontWeight: 700
                                  }}>
                                    You
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#334155', fontSize: 13 }}>
                                <span style={{ background: isMe ? '#dcfce7' : '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                                  {t.subject}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7', fontSize: 13.5 }}>
                                {t.share_percent}%
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669', textAlign: 'right', fontSize: 14 }}>
                                {formatINR(t.payout_amount)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* 4) Timestamp at bottom right if distributed */}
                {distData.already_distributed && distData.distributed_at && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 12,
                    fontSize: 12.5,
                    color: '#64748b'
                  }}>
                    <span>Distributed on:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {new Date(distData.distributed_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </strong>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

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
