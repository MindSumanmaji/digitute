import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, AlertCircle, ReceiptText, MessageSquare, Download, CheckCircle2,
  Search, ArrowUpRight, ShieldCheck, Printer, Plus, Calendar, Clock3,
  Filter, Trash2, ChevronRight, X, Sparkles, RefreshCw, Copy, Check,
  Building2, Users, AlertTriangle, Layers, Eye, CreditCard
} from 'lucide-react';
import { apiRequest } from '../../api';

// Format INR currency
function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

// Convert month & year or YYYY-MM to readable month year e.g. (10, 2026) -> "October 2026"
function getMonthLabel(monthOrYyyyMm, year) {
  if (!monthOrYyyyMm && !year) return '';
  if (year && !isNaN(Number(year))) {
    const m = Number(monthOrYyyyMm) || 1;
    const y = Number(year);
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (typeof monthOrYyyyMm === 'string' && monthOrYyyyMm.includes('-')) {
    const [y, m] = monthOrYyyyMm.split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (!isNaN(Number(monthOrYyyyMm))) {
    const m = Number(monthOrYyyyMm);
    const dateObj = new Date(2026, m - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long' });
  }
  return String(monthOrYyyyMm);
}

export default function FinanceView({
  batches = [],
  students = [],
  transactions = [],
  showToast = () => {},
  onSendReminder = () => {},
  onPrintReceipt = () => {}
}) {
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('demands'); // 'demands' | 'batches' | 'queue'

  const selectedBatchObj = useMemo(() => {
    if (!selectedBatch || selectedBatch === 'ALL') return null;
    return batches.find(b => b.id === selectedBatch) || null;
  }, [batches, selectedBatch]);

  const isOneTimeBatch = selectedBatchObj?.fee_type === 'ONE_TIME';

  // Cash Verification Queue State
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [totalPendingCash, setTotalPendingCash] = useState(0);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('Cash not received at center counter');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [invoices, setInvoices] = useState([]);
  const [globalSummary, setGlobalSummary] = useState({
    total_invoices_count: 0,
    total_demanded_amount: 0,
    total_collected_amount: 0,
    total_outstanding_amount: 0,
    pending_count: 0,
    paid_count: 0,
    overdue_count: 0,
    recovery_rate_percent: 0.0
  });
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedPaidInvoice, setSelectedPaidInvoice] = useState(null);

  // Demand Modal State
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [demandTab, setDemandTab] = useState('batch'); // 'batch' | 'single'
  const [submitting, setSubmitting] = useState(false);

  // Batch Demand Form
  const [batchForm, setBatchForm] = useState({
    batch_id: 'ALL',
    billing_month: currentMonthStr
  });

  // Single Demand Form
  const [singleForm, setSingleForm] = useState({
    student_id: '',
    batch_id: '',
    billing_month: currentMonthStr,
    base_amount: '',
    discount_amount: 0
  });

  const fetchQueue = useCallback(async () => {
    try {
      const res = await apiRequest('/api/admin/payments/verification-queue');
      setVerificationQueue(res.items || []);
      setQueueCount(res.queue_count || 0);
      setTotalPendingCash(res.total_pending_cash || 0);
    } catch (err) {
      console.warn('Queue fetch error:', err.message);
    }
  }, []);

  const handleApproveCash = async (paymentId) => {
    try {
      setActionLoadingId(paymentId);
      await apiRequest(`/api/admin/payments/${paymentId}/approve`, { method: 'POST' });
      showToast('Payment Approved', 'Cash received and invoice marked as PAID. Official receipt issued.');
      fetchInvoices();
      fetchQueue();
    } catch (err) {
      showToast('Approval Failed', err.message || 'Could not approve payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectCash = async () => {
    if (!rejectModalItem) return;
    try {
      setActionLoadingId(rejectModalItem.id);
      await apiRequest(`/api/admin/payments/${rejectModalItem.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason })
      });
      showToast('Payment Rejected', `Request rejected. Note logged: "${rejectReason}"`);
      setRejectModalItem(null);
      fetchInvoices();
      fetchQueue();
    } catch (err) {
      showToast('Rejection Failed', err.message || 'Could not reject payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Load Invoices from Backend API
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (selectedBatch && selectedBatch !== 'ALL') {
        queryParams.append('batch_id', selectedBatch);
      }
      if (selectedMonth && selectedMonth !== 'ALL') {
        queryParams.append('billing_month', selectedMonth);
      }
      if (selectedYear && selectedYear !== 'ALL') {
        queryParams.append('billing_year', selectedYear);
      }
      if (selectedStatus && selectedStatus !== 'ALL') {
        queryParams.append('status', selectedStatus);
      }
      if (searchTerm && searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const res = await apiRequest(`/api/admin/invoices?${queryParams.toString()}`);
      if (res) {
        setInvoices(res.invoices || []);
        if (res.summary) {
          setGlobalSummary(res.global_summary || res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      showToast('Error', err.message || 'Could not load fee demands.');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedMonth, selectedYear, selectedStatus, searchTerm, showToast]);

  useEffect(() => {
    fetchInvoices();
    fetchQueue();
  }, [fetchInvoices, fetchQueue]);

  // Copy invoice number helper
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Demand Modal with optional pre-selected batch
  const handleOpenDemandModal = (targetBatchId = null) => {
    const defaultBatch = targetBatchId || (batches[0]?.id || 'ALL');
    setBatchForm({
      batch_id: defaultBatch,
      billing_month: currentMonthStr
    });
    setDemandTab('batch');
    setDemandModalOpen(true);
  };

  // Execute Batch Demand API
  const handleBatchDemandSubmit = async (e) => {
    e.preventDefault();
    if (!batchForm.batch_id) {
      showToast('Validation Error', 'Please select a course batch.');
      return;
    }
    setSubmitting(true);
    try {
      const selectedBatchObj = batches.find(b => b.id === batchForm.batch_id);
      const isOneTime = selectedBatchObj?.fee_type === 'ONE_TIME';
      let bMonth = null;
      let bYear = null;
      if (!isOneTime && batchForm.billing_month) {
        if (typeof batchForm.billing_month === 'string' && batchForm.billing_month.includes('-')) {
          const [y, m] = batchForm.billing_month.split('-');
          bYear = parseInt(y, 10);
          bMonth = parseInt(m, 10);
        } else {
          bMonth = parseInt(batchForm.billing_month, 10);
          bYear = new Date().getFullYear();
        }
      }
      const payload = {
        batch_id: batchForm.batch_id,
        billing_month: bMonth,
        billing_year: bYear
      };

      const res = await apiRequest('/api/admin/invoices/generate-batch', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast(
        'Fee Demands Issued',
        res.message || `Successfully created ${res.created_count} invoices.`
      );

      setDemandModalOpen(false);

      fetchInvoices();
    } catch (err) {
      console.error('Batch demand failed:', err);
      showToast('Demand Failed', err.message || 'Could not generate batch invoices.');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Single Student Demand API
  const handleSingleDemandSubmit = async (e) => {
    e.preventDefault();
    if (!singleForm.student_id) {
      showToast('Validation Error', 'Please choose a student.');
      return;
    }
    setSubmitting(true);
    try {
      const matchedBatch = batches.find(b => b.id === singleForm.batch_id);
      const isOneTime = matchedBatch?.fee_type === 'ONE_TIME';
      let bMonth = null;
      let bYear = null;
      if (!isOneTime && singleForm.billing_month) {
        if (typeof singleForm.billing_month === 'string' && singleForm.billing_month.includes('-')) {
          const [y, m] = singleForm.billing_month.split('-');
          bYear = parseInt(y, 10);
          bMonth = parseInt(m, 10);
        } else {
          bMonth = parseInt(singleForm.billing_month, 10);
          bYear = new Date().getFullYear();
        }
      }
      const payload = {
        student_id: singleForm.student_id,
        batch_id: singleForm.batch_id || null,
        billing_month: bMonth,
        billing_year: bYear,
        base_amount: singleForm.base_amount !== '' ? Number(singleForm.base_amount) : null,
        discount_amount: Number(singleForm.discount_amount) || 0
      };

      const res = await apiRequest('/api/admin/invoices/generate-single', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast(
        'Invoice Demanded',
        `Invoice ${res.invoice_number} generated for ${res.student_name}. Payable: ${formatINR(res.payable_amount)}`
      );

      setDemandModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Single demand failed:', err);
      showToast('Demand Failed', err.message || 'Could not issue student invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Cancel Invoice
  const handleDeleteInvoice = async (inv) => {
    if (!window.confirm(`Are you sure you want to cancel and delete invoice ${inv.invoice_number} for ${inv.student_name}?`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/invoices/${inv.id}`, { method: 'DELETE' });
      showToast('Invoice Cancelled', `Invoice ${inv.invoice_number} has been deleted.`);
      fetchInvoices();
    } catch (err) {
      console.error('Delete invoice failed:', err);
      showToast('Delete Failed', err.message || 'Could not cancel invoice.');
    }
  };

  // WhatsApp Due Reminder Click
  const handleSendDueAlert = (inv) => {
    const rawPhone = (inv.guardian_phone || inv.student_phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `Dear Guardian, this is an official fee reminder from DigiTute. Tuition fee invoice ${inv.invoice_number} for ${inv.student_name} (${inv.batch_name}) with payable balance ${formatINR(inv.outstanding_amount)} is pending. Kindly clear the balance online via student portal.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Batch summary calculations for "Batch Billing Status" Tab
  const batchBillingStats = useMemo(() => {
    return batches.map(b => {
      const batchStudents = students.filter(s => s.batch_id === b.id);
      const batchInvoices = invoices.filter(inv => inv.batch_id === b.id);
      const demandedTotal = batchInvoices.reduce((sum, inv) => sum + (inv.payable_amount || 0), 0);
      const collectedTotal = batchInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
      const pendingCount = batchInvoices.filter(inv => inv.status === 'PENDING').length;
      const isDemanded = batchInvoices.length > 0;

      return {
        ...b,
        enrolledCount: batchStudents.length,
        invoicesCount: batchInvoices.length,
        demandedTotal,
        collectedTotal,
        pendingCount,
        isDemanded,
        recoveryRate: demandedTotal > 0 ? Math.round((collectedTotal / demandedTotal) * 100) : 0
      };
    });
  }, [batches, students, invoices]);

  // Print official receipt for a paid invoice
  const handlePrintPaidReceipt = (inv) => {
    if (!inv) return;
    const pmts = inv.payments || [];
    const primaryPmt = pmts.find(p => p.status === 'SUCCESS') || pmts[0] || {};
    const invNo = inv.invoice_number || 'INV-2026';
    const dateStr = primaryPmt.paid_at
      ? new Date(primaryPmt.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Online Verified';
    const amt = Number(inv.amount_paid || inv.payable_amount || 0).toLocaleString('en-IN');
    const rzpId = primaryPmt.razorpay_payment_id || 'Online Verified';

    const printWin = window.open('', '_blank', 'width=650,height=750');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Receipt - ${invNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 36px; color: #1e293b; margin: 0; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 800; color: #0d9488; margin: 0; }
            .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total { font-size: 18px; font-weight: 800; border-top: 2px solid #0d9488; margin-top: 14px; padding-top: 14px; border-bottom: none; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">DigiTute Institute</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Official Tuition Fee Payment Receipt</p>
            </div>
            <span class="badge">✓ PAID & VERIFIED</span>
          </div>
          <div class="row"><span>Invoice Number:</span><strong>${invNo}</strong></div>
          <div class="row"><span>Student Name:</span><strong>${inv.student_name || 'Student'}</strong></div>
          <div class="row"><span>Course Batch:</span><strong>${inv.batch_name || 'Enrolled Batch'}</strong></div>
          <div class="row"><span>Transaction Date:</span><strong>${dateStr}</strong></div>
          <div class="row"><span>Payment Mode:</span><strong>${primaryPmt.payment_mode || 'Razorpay (Online)'}</strong></div>
          <div class="row"><span>Razorpay Payment ID:</span><strong style="font-family:monospace;">${rzpId}</strong></div>
          <div class="row total"><span>Total Amount Settled:</span><span style="color:#0d9488;">₹${amt}</span></div>
          <div class="footer">
            <p>This is a computer-generated official receipt issued by DigiTute Education Platform.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div className="module-container" style={{ animation: 'fade-in 0.25s ease' }}>
      {/* Top Header Actions */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Finance & Fee Demands
          </h1>
        </div>

        <div className="module-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            className="button-secondary"
            onClick={fetchInvoices}
            title="Refresh Invoices"
            style={{ minHeight: 36, padding: '0 12px' }}
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          </button>



          {/* Primary Action: Demand Monthly Fees Button */}
          <button
            className="button-primary"
            onClick={() => handleOpenDemandModal()}
            style={{ minHeight: 36, background: 'var(--teal-dark)' }}
          >
            <Plus size={16} /> Issue Invoice
          </button>
        </div>
      </div>

      {/* Real-time Dynamic KPI Metric Cards (100% calculated from live invoices) */}
      <div className="metrics-grid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {/* Card 1: Total Demanded */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon teal-icon"><ReceiptText size={18} /></div>
            <span className="metric-change positive">
              {globalSummary.total_invoices_count} Invoices
            </span>
          </div>
          <div className="metric-value">{formatINR(globalSummary.total_demanded_amount)}</div>
          <div className="metric-label">
            Total Demanded
          </div>
          <div className="metric-bottom">
            <span>Demanded across active enrolled students</span>
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon teal-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
            <span className="metric-change positive" style={{ color: '#059669' }}>
              {globalSummary.recovery_rate_percent}% cleared
            </span>
          </div>
          <div className="metric-value">{formatINR(globalSummary.total_collected_amount)}</div>
          <div className="metric-label">Total Fee Collected</div>
          <div className="metric-bottom">
            <span>{globalSummary.paid_count} settled · {globalSummary.pending_count} pending</span>
          </div>
        </div>

        {/* Card 3: Outstanding Unpaid Dues */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon rose-icon"><AlertCircle size={18} /></div>
            <span className="metric-change negative">
              {globalSummary.pending_count} students due
            </span>
          </div>
          <div className="metric-value" style={{ color: globalSummary.total_outstanding_amount > 0 ? '#b91c1c' : 'inherit' }}>
            {formatINR(globalSummary.total_outstanding_amount)}
          </div>
          <div className="metric-label">Outstanding Unpaid Balance</div>
          <div className="metric-bottom">
            <span>
              {globalSummary.pending_count > 0 ? (
                <strong style={{ color: '#d97706' }}>{globalSummary.pending_count} pending payment demands</strong>
              ) : (
                'All fee demands cleared'
              )}
            </span>
          </div>
        </div>


      </div>

      {/* Logical Sub-Tabs */}
      <div className="sub-tabs" style={{ marginTop: 24 }}>
        <button
          className={`sub-tab ${activeTab === 'demands' ? 'active' : ''}`}
          onClick={() => setActiveTab('demands')}
        >
          <ReceiptText size={15} />
          <span>Invoices</span>
          <span className="sub-tab-badge">{globalSummary.total_invoices_count || invoices.length}</span>
        </button>

        <button
          className={`sub-tab ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          <Layers size={15} />
          <span>Batch Billing Overview</span>
          <span className="sub-tab-badge">{batches.length}</span>
        </button>

        <button
          className={`sub-tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
          style={queueCount > 0 ? { color: '#b45309', fontWeight: 700 } : {}}
        >
          <ShieldCheck size={15} />
          <span>Cash Verification Queue</span>
          <span
            className="sub-tab-badge"
            style={queueCount > 0 ? { background: '#fef3c7', color: '#b45309', fontWeight: 800 } : {}}
          >
            {queueCount}
          </span>
        </button>
      </div>

      {/* TAB 1:INVOICES */}
      {activeTab === 'demands' && (
        <div className="data-table-card" style={{ marginTop: 12 }}>
          {/* Table Filters & Search Toolbar */}
          <div className="data-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: 12, overflowX: 'auto', padding: '12px 18px' }}>
            <div className="data-table-search" style={{ width: 250, minWidth: 200, flexShrink: 0, height: 36 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by student, invoice # or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap', flexShrink: 0 }}>
              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBatch(val);
                  const found = batches.find(b => b.id === val);
                  if (found?.fee_type === 'ONE_TIME') {
                    setSelectedMonth('ALL');
                    setSelectedYear('ALL');
                  }
                }}
                className="subtle-select"
                style={{ padding: '6px 10px', fontSize: 13, height: 36 }}
              >
                <option value="ALL">All Batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.fee_type === 'ONE_TIME' ? '(One-Time)' : ''}
                  </option>
                ))}
              </select>

              {/* Month Filter - Blocked if ONE_TIME */}
              <select
                disabled={isOneTimeBatch}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="subtle-select"
                title={isOneTimeBatch ? 'Month filter is blocked for One-Time payment batches' : 'Filter by billing month'}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  height: 36,
                  background: isOneTimeBatch ? '#f1f5f9' : '#fff',
                  cursor: isOneTimeBatch ? 'not-allowed' : 'pointer',
                  opacity: isOneTimeBatch ? 0.5 : 1
                }}
              >
                <option value="ALL">All Months</option>
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

              {/* Year Filter - Blocked if ONE_TIME */}
              <select
                disabled={isOneTimeBatch}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="subtle-select"
                title={isOneTimeBatch ? 'Year filter is blocked for One-Time payment batches' : 'Filter by billing year'}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  height: 36,
                  background: isOneTimeBatch ? '#f1f5f9' : '#fff',
                  cursor: isOneTimeBatch ? 'not-allowed' : 'pointer',
                  opacity: isOneTimeBatch ? 0.5 : 1
                }}
              >
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2025">2025</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="subtle-select"
                style={{ padding: '6px 10px', fontSize: 13, height: 36 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Dues Only</option>
                <option value="PAID">Paid Only</option>
              </select>

              <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                Showing <strong>{invoices.length}</strong> of {globalSummary.total_invoices_count} invoices
              </span>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-3)' }}>
                      <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px', color: 'var(--teal)' }} />
                      <div>Loading fee demands...</div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table" style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 420, margin: '0 auto' }}>
                        <ReceiptText size={36} style={{ color: 'var(--teal)', opacity: 0.6, marginBottom: 12 }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                          No Invoices Found
                        </h3>
                        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 16px 0' }}>
                          You have not generated fee demands yet. Click below to demand fees for your enrolled batches or an individual student.
                        </p>
                        <button
                          className="button-primary"
                          onClick={() => handleOpenDemandModal()}
                          style={{ margin: '0 auto', fontSize: 13.5 }}
                        >
                          <Plus size={15} /> Demand Monthly Fees
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => {
                        if (inv.status === 'PAID') {
                          setSelectedPaidInvoice(inv);
                        }
                      }}
                      style={{
                        cursor: inv.status === 'PAID' ? 'pointer' : 'default'
                      }}
                      title={inv.status === 'PAID' ? 'Click to view payment details' : undefined}
                    >
                      {/* Invoice */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--teal-dark)', fontSize: 13 }}>
                            {inv.invoice_number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopy(inv.invoice_number); }}
                            title="Copy Invoice #"
                            style={{ background: 'none', border: 'none', padding: 2, color: 'var(--text-3)', cursor: 'pointer' }}
                          >
                            {copiedId === inv.invoice_number ? <Check size={12} color="var(--teal)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Student Name */}
                      <td>
                        <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>
                          {inv.student_name}
                        </strong>
                      </td>

                      {/* Batch */}
                      <td>
                        <span className="batch-name" style={{ fontSize: 12.5, fontWeight: 500 }}>
                          {inv.batch_name}
                        </span>
                      </td>

                      {/* Payment Type */}
                      <td>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: inv.invoice_type === 'ONE_TIME' ? '#f0fdf4' : '#f8fafc',
                          color: inv.invoice_type === 'ONE_TIME' ? '#15803d' : '#475569',
                          border: `1px solid ${inv.invoice_type === 'ONE_TIME' ? '#bbf7d0' : '#e2e8f0'}`
                        }}>
                          {inv.invoice_type === 'ONE_TIME' ? 'One-Time' : 'Monthly'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <strong style={{ fontSize: 14, color: 'var(--text)' }}>
                          {formatINR(inv.payable_amount)}
                        </strong>
                      </td>

                      {/* Status */}
                      <td>
                        {inv.status === 'PAID' ? (
                          <span style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>
                            Paid
                          </span>
                        ) : inv.is_under_verification ? (
                          <span
                            onClick={(e) => { e.stopPropagation(); setActiveTab('queue'); }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#fef3c7',
                              color: '#b45309',
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Click to view in Cash Verification Queue"
                          >
                            <Clock3 size={12} /> Cash • Verification Pending
                          </span>
                        ) : inv.has_rejected_payment ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#fff1f2',
                              color: '#be123c',
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: 700
                            }}
                            title={inv.rejected_payment?.rejection_reason ? `Rejected: ${inv.rejected_payment.rejection_reason}` : 'Cash Rejected'}
                          >
                            ⚠️ Due • Cash Rejected
                          </span>
                        ) : (
                          <span className="status-badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fffbeb', color: '#b45309' }}>
                            <Clock3 size={12} /> Due
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BATCH BILLING STATUS OVERVIEW */}
      {activeTab === 'batches' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Batch Billing Status
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                Overview of fee demand coverage across all institute course batches.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {batchBillingStats.map(b => (
              <div
                key={b.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                        {b.name}
                      </h4>
                      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                        Standard Fee: {formatINR(b.fee_amount)}/mo
                      </span>
                    </div>

                    {b.isDemanded ? (
                      <span className="status-badge success" style={{ fontSize: 11.5 }}>
                        ✓ Invoices Issued
                      </span>
                    ) : (
                      <span className="status-badge warning" style={{ fontSize: 11.5, background: '#fffbeb', color: '#b45309' }}>
                        ⚠️ Not Demanded Yet
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '12px 0' }}>
                    <div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Enrolled Students</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                        {b.enrolledCount} students
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Demanded Invoices</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                        {b.invoicesCount} invoices
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Total Demanded</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-dark)' }}>
                        {formatINR(b.demandedTotal)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Collected</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
                        {formatINR(b.collectedTotal)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {b.isDemanded ? `${b.recoveryRate}% Recovery Rate` : 'No invoices issued'}
                  </span>

                  <button
                    className="button-primary"
                    onClick={() => handleOpenDemandModal(b.id)}
                    style={{ minHeight: 32, fontSize: 12.5, padding: '0 12px' }}
                  >
                    <Plus size={14} /> {b.isDemanded ? 'Demand More / Update' : 'Demand Fees Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CASH VERIFICATION QUEUE */}
      {activeTab === 'queue' && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Teacher Cash Handover Clearance Queue
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                Physically count cash handed over by faculty, then approve to officially settle the student's tuition fee.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Pending Handover Cash</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>
                  {formatINR(totalPendingCash)}
                </div>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={fetchQueue}
                style={{ minHeight: 36, padding: '0 12px', fontSize: 12.5 }}
                title="Refresh Queue"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="data-table-card">
            {verificationQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-3)' }}>
                <ShieldCheck size={44} style={{ color: '#059669', margin: '0 auto 12px', opacity: 0.8 }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  Verification Queue is Clear
                </h4>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  There are no pending offline cash payments awaiting admin handover.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Submission Date</th>
                      <th>Invoice No</th>
                      <th>Student</th>
                      <th>Batch</th>
                      <th>Collected By (Teacher)</th>
                      <th>Amount</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationQueue.map((item) => {
                      const dateStr = item.created_at
                        ? new Date(item.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Today';
                      const isLoading = actionLoadingId === item.id;

                      return (
                        <tr key={item.id}>
                          <td style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{dateStr}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--teal-dark)', fontSize: 13 }}>
                              {item.invoice_number}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>
                              {item.student_name}
                            </strong>
                            {item.student_phone && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                                {item.student_phone}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="batch-name" style={{ fontSize: 12, fontWeight: 500 }}>
                              {item.batch_name}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: 13, color: '#0d9488' }}>
                              👨‍🏫 {item.teacher_name}
                            </strong>
                            {item.teacher_phone && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                                {item.teacher_phone}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: 15, color: '#059669' }}>
                              {formatINR(item.amount)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8 }}>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleApproveCash(item.id)}
                                style={{
                                  background: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {isLoading ? 'Processing...' : '✓ Approve & Settle'}
                              </button>

                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => { setRejectModalItem(item); setRejectReason('Cash not received at center counter'); }}
                                style={{
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                  border: '1px solid #fecdd3',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalItem && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setRejectModalItem(null); }}>
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-heading-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2>Reject Cash Collection Request</h2>
                <p>The student and teacher will be notified with this reason.</p>
              </div>
              <button className="icon-button" onClick={() => setRejectModalItem(null)}><X size={19} /></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, fontSize: 13, border: '1px solid #e2e8f0' }}>
                <div><strong>Student:</strong> {rejectModalItem.student_name} ({rejectModalItem.invoice_number})</div>
                <div style={{ marginTop: 4 }}><strong>Collected By:</strong> {rejectModalItem.teacher_name}</div>
                <div style={{ marginTop: 4 }}><strong>Amount:</strong> {formatINR(rejectModalItem.amount)}</div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                  Select Preset Rejection Reason:
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="subtle-select"
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
                >
                  <option value="Cash not received at center counter">Cash not received at center counter</option>
                  <option value="Discrepancy in collected amount">Discrepancy in collected amount</option>
                  <option value="Selected incorrect student or batch">Selected incorrect student or batch</option>
                  <option value="Currency note issue or duplicate entry">Currency note issue or duplicate entry</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                  Or Custom Reason:
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setRejectModalItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectCash}
                  style={{
                    background: '#e11d48',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* DEMAND MONTHLY FEES INTERACTIVE MODAL */}
      {/* ============================================================================== */}
      {demandModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDemandModalOpen(false); }}
        >
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-heading-icon" style={{ background: 'var(--teal-soft)', color: 'var(--teal-dark)' }}>
                <ReceiptText size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Demand Monthly Tuition Fees</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-3)', fontSize: 13 }}>
                  Issue tuition fee invoices to enrolled students for regular batch billing.
                </p>
              </div>
              <button className="icon-button" onClick={() => setDemandModalOpen(false)}><X size={19} /></button>
            </div>

            {/* Mode Tabs: Batch vs Single */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 24px 0', borderBottom: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setDemandTab('batch')}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '8px 16px',
                  fontSize: 13.5,
                  fontWeight: demandTab === 'batch' ? 700 : 500,
                  color: demandTab === 'batch' ? 'var(--teal-dark)' : 'var(--text-3)',
                  borderBottom: demandTab === 'batch' ? '2px solid var(--teal)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Batch Bulk Demand (Recommended)
              </button>

              <button
                type="button"
                onClick={() => setDemandTab('single')}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '8px 16px',
                  fontSize: 13.5,
                  fontWeight: demandTab === 'single' ? 700 : 500,
                  color: demandTab === 'single' ? 'var(--teal-dark)' : 'var(--text-3)',
                  borderBottom: demandTab === 'single' ? '2px solid var(--teal)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Single Student Demand
              </button>
            </div>

            {/* BATCH DEMAND FORM */}
            {demandTab === 'batch' && (
              <form onSubmit={handleBatchDemandSubmit} style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Batch Select */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Target Course Batch <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      className="form-input"
                      value={batchForm.batch_id}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, batch_id: e.target.value }))}
                      required
                    >
                      <option value="ALL">All Active Course Batches</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({formatINR(b.fee_amount)}{b.fee_type === 'ONE_TIME' ? ' one-time' : '/mo'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Billing Month (for Monthly Batches) or One-Time Notice */}
                  {(() => {
                    const selBatch = batches.find(b => b.id === batchForm.batch_id);
                    const isOneTime = selBatch?.fee_type === 'ONE_TIME';
                    if (isOneTime) {
                      return (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={16} />
                          <div>
                            <strong>One-Time Course Package:</strong> Students in this batch will be billed once for the course fee ({formatINR(selBatch.fee_amount)}).
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          Billing Month <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="month"
                          className="form-input"
                          value={batchForm.billing_month}
                          onChange={(e) => setBatchForm(prev => ({ ...prev, billing_month: e.target.value }))}
                          required
                        />
                      </div>
                    );
                  })()}

                  {/* Information Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4, color: '#1e293b' }}>
                      <Sparkles size={14} color="var(--teal)" />
                      Smart Student Pricing Rules Applied:
                    </div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li>Students with a custom fee will be billed according to their override.</li>
                      <li>Scholarship or concession discounts are automatically subtracted.</li>
                      <li>Duplicate protection prevents re-billing students who already have an invoice for this course/month.</li>
                    </ul>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: 20, padding: 0 }}>
                  <button type="button" className="button-secondary" onClick={() => setDemandModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="button-primary" disabled={submitting}>
                    {submitting ? 'Generating Invoices...' : 'Generate Batch Invoices'}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* SINGLE STUDENT DEMAND FORM */}
            {demandTab === 'single' && (
              <form onSubmit={handleSingleDemandSubmit} style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Student Select */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Select Enrolled Student <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      className="form-input"
                      value={singleForm.student_id}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const st = students.find(s => s.id === sId);
                        const bId = st?.batch_id || '';
                        const matchedBatch = batches.find(b => b.id === bId);
                        const baseAmt = st?.custom_monthly_fee || matchedBatch?.fee_amount || '';
                        const discAmt = st?.discount_amount || 0;

                        setSingleForm(prev => ({
                          ...prev,
                          student_id: sId,
                          batch_id: bId,
                          base_amount: baseAmt,
                          discount_amount: discAmt
                        }));
                      }}
                      required
                    >
                      <option value="">-- Choose a Student --</option>
                      {students.map(s => {
                        const b = batches.find(batch => batch.id === s.batch_id);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({b?.name || 'No Batch'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Billing Month (if not one-time) */}
                  {(() => {
                    const st = students.find(s => s.id === singleForm.student_id);
                    const bId = singleForm.batch_id || st?.batch_id;
                    const matchedBatch = batches.find(b => b.id === bId);
                    if (matchedBatch?.fee_type === 'ONE_TIME') {
                      return (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#166534' }}>
                          <strong>One-Time Course Package:</strong> {matchedBatch.name}
                        </div>
                      );
                    }
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          Billing Month <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="month"
                          className="form-input"
                          value={singleForm.billing_month}
                          onChange={(e) => setSingleForm(prev => ({ ...prev, billing_month: e.target.value }))}
                          required
                        />
                      </div>
                    );
                  })()}

                  {/* Fee & Concession */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Base Tuition Fee (₹) <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="e.g. 3000"
                        value={singleForm.base_amount}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, base_amount: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Discount / Concession (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        value={singleForm.discount_amount}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, discount_amount: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Payable Preview */}
                  <div style={{ background: 'var(--teal-soft)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
                      Total Net Demand:
                    </span>
                    <strong style={{ fontSize: 16, color: 'var(--teal-dark)' }}>
                      {formatINR(Math.max(0, (Number(singleForm.base_amount) || 0) - (Number(singleForm.discount_amount) || 0)))}
                    </strong>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: 20, padding: 0 }}>
                  <button type="button" className="button-secondary" onClick={() => setDemandModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="button-primary" disabled={submitting}>
                    {submitting ? 'Issuing Invoice...' : 'Issue Student Invoice'}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT TRANSACTION DETAILS POPUP MODAL (LANDSCAPE 2-COLUMN VIEW) */}
      {selectedPaidInvoice && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 999 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedPaidInvoice(null);
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: 900,
              width: 'min(94vw, 900px)',
              padding: 0,
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.32)'
            }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '18px 26px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 3px 0', color: 'var(--text)' }}>
                  Payment Details
                </h3>
                <span style={{ fontSize: 13.5, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                  Invoice: {selectedPaidInvoice.invoice_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedPaidInvoice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: 2-Column Landscape Layout */}
            <div style={{ padding: '24px 26px' }}>
              {(() => {
                const pmts = selectedPaidInvoice.payments || [];
                const primaryPmt = pmts.find(p => p.status === 'SUCCESS') || pmts[0] || {};
                const pmtStatus = primaryPmt.status || selectedPaidInvoice.status || 'SUCCESS';
                const isOnline = (primaryPmt.payment_mode || '').toUpperCase().includes('RAZORPAY') || !!primaryPmt.razorpay_payment_id;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, alignItems: 'stretch' }}>
                    {/* LEFT COLUMN: Student & Fee Breakdown Information */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Student & Course Box */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.04em' }}>
                          Student Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Student Name:</span>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, marginTop: 3 }}>
                              {selectedPaidInvoice.student_name}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Contact Number:</span>
                            <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14.5, marginTop: 3 }}>
                              {selectedPaidInvoice.student_phone || selectedPaidInvoice.guardian_phone || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Enrolled Batch:</span>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, marginTop: 3 }}>
                              {selectedPaidInvoice.batch_name}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Fee Period:</span>
                            <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14.5, marginTop: 3 }}>
                              {selectedPaidInvoice.invoice_type === 'ONE_TIME' ? 'One-Time Package' : getMonthLabel(selectedPaidInvoice.billing_month, selectedPaidInvoice.billing_year)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fee Calculation Breakdown */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                          Fee Calculation Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                            <span style={{ color: 'var(--text-2)' }}>Base Tuition Fee:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatINR(selectedPaidInvoice.base_amount)}</span>
                          </div>
                          {selectedPaidInvoice.discount_amount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: 14 }}>
                              <span>Scholarship / Concession:</span>
                              <span style={{ fontWeight: 600 }}>- {formatINR(selectedPaidInvoice.discount_amount)}</span>
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 3, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15.5 }}>
                            <span style={{ color: 'var(--text)' }}>Net Settled Amount:</span>
                            <span style={{ color: '#15803d', fontWeight: 800 }}>{formatINR(selectedPaidInvoice.payable_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Payment & Gateway Audit Trail */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Transaction Audit
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Payment Mode:</span>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, marginTop: 3 }}>
                            {primaryPmt.payment_mode || (isOnline ? 'RAZORPAY (ONLINE)' : 'CASH')}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Transaction Date & Time:</span>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14.5, marginTop: 3 }}>
                            {primaryPmt.paid_at ? new Date(primaryPmt.paid_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Verified Online'}
                          </div>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Settled Amount:</span>
                          <div style={{ fontWeight: 800, color: '#15803d', fontSize: 19, marginTop: 3 }}>
                            {formatINR(primaryPmt.amount || selectedPaidInvoice.amount_paid || selectedPaidInvoice.payable_amount)}
                          </div>
                        </div>

                        {/* Razorpay Payment ID */}
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Razorpay Payment ID:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <code style={{ background: '#e2e8f0', padding: '5px 10px', borderRadius: 8, fontSize: 13.5, fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                              {primaryPmt.razorpay_payment_id || 'pay_online_verified'}
                            </code>
                            {primaryPmt.razorpay_payment_id && (
                              <button
                                type="button"
                                onClick={() => handleCopy(primaryPmt.razorpay_payment_id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                                title="Copy Payment ID"
                              >
                                {copiedId === primaryPmt.razorpay_payment_id ? <Check size={15} color="var(--teal)" /> : <Copy size={15} />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Gateway Order ID */}
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Razorpay Order ID:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <code style={{ background: '#e2e8f0', padding: '5px 10px', borderRadius: 8, fontSize: 13.5, fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                              {primaryPmt.razorpay_order_id || 'order_online_verified'}
                            </code>
                            {primaryPmt.razorpay_order_id && (
                              <button
                                type="button"
                                onClick={() => handleCopy(primaryPmt.razorpay_order_id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                                title="Copy Order ID"
                              >
                                {copiedId === primaryPmt.razorpay_order_id ? <Check size={15} color="var(--teal)" /> : <Copy size={15} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
