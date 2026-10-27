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

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('demands'); // 'demands' | 'batches'
  const [searchTerm, setSearchTerm] = useState('');

  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
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

  // Load Invoices from Backend API
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedMonth && selectedMonth !== 'ALL') {
        if (selectedMonth.includes('-')) {
          const [y, m] = selectedMonth.split('-');
          queryParams.append('billing_year', y);
          queryParams.append('billing_month', m);
        } else {
          queryParams.append('billing_month', selectedMonth);
        }
      }
      if (selectedBatch && selectedBatch !== 'ALL') {
        queryParams.append('batch_id', selectedBatch);
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
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      showToast('Error', err.message || 'Could not load fee demands.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedBatch, selectedStatus, searchTerm, showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
      billing_month: selectedMonth || currentMonthStr
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
      if (batchForm.billing_month && !isOneTime) {
        setSelectedMonth(batchForm.billing_month);
      }
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

  // Month selector options
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      opts.push({
        value: val,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }
    return opts;
  }, []);

  return (
    <div className="module-container" style={{ animation: 'fade-in 0.25s ease' }}>
      {/* Top Header Actions */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Finance & Fee Demands
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-3)', fontSize: 13.5 }}>
            Issue monthly tuition fee demands, monitor batch billing coverage and track student online settlements.
          </p>
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

          {/* Month Selector Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
            <Calendar size={15} style={{ color: 'var(--text-3)' }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: 13, color: 'var(--text)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">All Billing Months</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Primary Action: Demand Monthly Fees Button */}
          <button
            className="button-primary"
            onClick={() => handleOpenDemandModal()}
            style={{ minHeight: 36, background: 'var(--teal-dark)' }}
          >
            <Plus size={16} /> Demand Monthly Fees
          </button>
        </div>
      </div>

      {/* Real-time Dynamic KPI Metric Cards (100% calculated from live invoices) */}
      <div className="metrics-grid" style={{ marginTop: 8 }}>
        {/* Card 1: Total Demanded */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon teal-icon"><ReceiptText size={18} /></div>
            <span className="metric-change positive">
              {summary.total_invoices_count} Invoices
            </span>
          </div>
          <div className="metric-value">{formatINR(summary.total_demanded_amount)}</div>
          <div className="metric-label">
            Total Demanded ({selectedMonth === 'ALL' ? 'All Months' : getMonthLabel(selectedMonth)})
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
              {summary.recovery_rate_percent}% cleared
            </span>
          </div>
          <div className="metric-value">{formatINR(summary.total_collected_amount)}</div>
          <div className="metric-label">Total Fee Collected</div>
          <div className="metric-bottom">
            <span>{summary.paid_count} settled · {summary.pending_count} pending</span>
          </div>
        </div>

        {/* Card 3: Outstanding Unpaid Dues */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon rose-icon"><AlertCircle size={18} /></div>
            <span className="metric-change negative">
              {summary.pending_count} students due
            </span>
          </div>
          <div className="metric-value" style={{ color: summary.total_outstanding_amount > 0 ? '#b91c1c' : 'inherit' }}>
            {formatINR(summary.total_outstanding_amount)}
          </div>
          <div className="metric-label">Outstanding Unpaid Balance</div>
          <div className="metric-bottom">
            <span>
              {summary.pending_count > 0 ? (
                <strong style={{ color: '#d97706' }}>{summary.pending_count} pending payment demands</strong>
              ) : (
                'All fee demands cleared'
              )}
            </span>
          </div>
        </div>

        {/* Card 4: Demands & Batch Coverage */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon violet-icon"><Building2 size={18} /></div>
            <span className="metric-change positive">{batches.length} Batches</span>
          </div>
          <div className="metric-value">
            {batchBillingStats.filter(b => b.isDemanded).length} / {batches.length}
          </div>
          <div className="metric-label">Batches Invoiced ({getMonthLabel(selectedMonth) || 'Selected'})</div>
          <div className="metric-bottom">
            <span>
              {batchBillingStats.filter(b => !b.isDemanded).length > 0
                ? `${batchBillingStats.filter(b => !b.isDemanded).length} batches not demanded yet`
                : 'All batches invoiced'}
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
          <span>Fee Demands & Invoices</span>
          <span className="sub-tab-badge">{invoices.length}</span>
        </button>

        <button
          className={`sub-tab ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          <Layers size={15} />
          <span>Batch Billing Overview</span>
          <span className="sub-tab-badge">{batches.length}</span>
        </button>
      </div>

      {/* TAB 1: ALL FEE DEMANDS & INVOICES */}
      {activeTab === 'demands' && (
        <div className="data-table-card" style={{ marginTop: 12 }}>
          {/* Table Filters & Search Toolbar */}
          <div className="data-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div className="data-table-search" style={{ minWidth: 280 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by student, invoice # or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="subtle-select"
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="ALL">All Batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="subtle-select"
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Dues Only</option>
                <option value="PAID">Paid Only</option>
              </select>

              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Showing <strong>{invoices.length}</strong> invoices
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
                          No Invoices Demanded for {selectedMonth === 'ALL' ? 'this filter' : getMonthLabel(selectedMonth)}
                        </h3>
                        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 16px 0' }}>
                          You have not generated fee demands yet. Click below to demand fees for your enrolled batches or an individual student.
                        </p>
                        <button
                          className="button-primary"
                          onClick={() => handleOpenDemandModal()}
                          style={{ margin: '0 auto', fontSize: 13.5 }}
                        >
                          <Plus size={15} /> Demand Fees for {getMonthLabel(selectedMonth) || 'This Month'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      {/* Invoice */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--teal-dark)', fontSize: 13 }}>
                            {inv.invoice_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(inv.invoice_number)}
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
                          <button
                            type="button"
                            onClick={() => setSelectedPaidInvoice(inv)}
                            title="Click to view payment details"
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer'
                            }}
                          >
                            <CheckCircle2 size={13} /> Paid • Details
                          </button>
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
                Batch Billing Status ({selectedMonth === 'ALL' ? 'All Months' : getMonthLabel(selectedMonth)})
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

      {/* PAYMENT TRANSACTION DETAILS MODAL */}
      {selectedPaidInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedPaidInvoice(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, borderRadius: 16, overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 20px', background: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Payment Details</h3>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace', marginLeft: 36 }}>
                  Invoice #{selectedPaidInvoice.invoice_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedPaidInvoice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Paid Amount Highlight Card */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', marginBottom: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Fee Paid
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d', margin: '4px 0 2px' }}>
                  {formatINR(selectedPaidInvoice.amount_paid || selectedPaidInvoice.payable_amount)}
                </div>
                <div style={{ fontSize: 12, color: '#166534' }}>
                  Status: <strong>PAID & SETTLED</strong>
                </div>
              </div>

              {/* Student & Course Information */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.03em' }}>
                  Student & Course
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>Student Name:</span>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedPaidInvoice.student_name}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>Contact:</span>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{selectedPaidInvoice.student_phone || selectedPaidInvoice.guardian_phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>Batch:</span>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedPaidInvoice.batch_name}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>Fee Type & Period:</span>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                      {selectedPaidInvoice.invoice_type === 'ONE_TIME' ? 'One-Time Package' : getMonthLabel(selectedPaidInvoice.billing_month, selectedPaidInvoice.billing_year)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.03em' }}>
                  Fee Calculation Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Base Tuition Fee:</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(selectedPaidInvoice.base_amount)}</span>
                  </div>
                  {selectedPaidInvoice.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Scholarship / Concession Discount:</span>
                      <span style={{ fontWeight: 600 }}>- {formatINR(selectedPaidInvoice.discount_amount)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                    <span>Net Settled Amount:</span>
                    <span style={{ color: '#15803d' }}>{formatINR(selectedPaidInvoice.payable_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Gateway & Transaction Logs */}
              {(() => {
                const pmts = selectedPaidInvoice.payments || [];
                const primaryPmt = pmts.find(p => p.status === 'SUCCESS') || pmts[0] || {};
                return (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.03em' }}>
                      Transaction & Gateway Audit
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                      <div>
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Payment Mode:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {primaryPmt.payment_mode || 'RAZORPAY (ONLINE)'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Transaction Date:</span>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                          {primaryPmt.paid_at ? new Date(primaryPmt.paid_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Verified Online'}
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Razorpay Payment ID:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <code style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>
                            {primaryPmt.razorpay_payment_id || 'pay_online_verified'}
                          </code>
                          {primaryPmt.razorpay_payment_id && (
                            <button
                              onClick={() => handleCopy(primaryPmt.razorpay_payment_id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)' }}
                              title="Copy ID"
                            >
                              {copiedId === primaryPmt.razorpay_payment_id ? <Check size={13} color="var(--teal)" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '14px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setSelectedPaidInvoice(null)}
                style={{ minHeight: 34, fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
