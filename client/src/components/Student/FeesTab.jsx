import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthName(m) {
  if (!m) return '';
  const num = parseInt(m, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return MONTH_NAMES[num - 1];
  }
  return String(m);
}

function getPaymentDescription(p) {
  const inv = p.invoices;
  if (!inv) return 'Tuition Fees';
  if (inv.invoice_type === 'ONE_TIME') return 'One-Time Course Fees';
  const month = getMonthName(inv.billing_month);
  const year = inv.billing_year || (p.paid_at ? new Date(p.paid_at).getFullYear() : '');
  if (month && year) {
    return `${month} ${year} Tuition Fees`;
  } else if (month) {
    return `${month} Tuition Fees`;
  }
  return 'Tuition Fees';
}


// Helper to dynamically load official Razorpay standard checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function FeesTab({
  showToast = () => {}
}) {

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  // Fetch student invoices & payment receipts
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, pmtData] = await Promise.all([
        apiRequest('/api/student/my-invoices').catch(() => ({ invoices: [], total_outstanding: 0 })),
        apiRequest('/api/student/my-payments').catch(() => [])
      ]);

      setInvoices(invData?.invoices || []);
      setPayments(Array.isArray(pmtData) ? pmtData : []);
    } catch (err) {
      console.error('FeesTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Outstanding due invoices
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');

  // Filter payment history
  const filteredPayments = payments.filter((p) => p.status === 'SUCCESS');

  // Direct Razorpay Standard Checkout Handler (No dummy intermediate modal!)
  const handlePayDirectly = async (inv) => {
    if (!inv?.id) {
      showToast('No pending invoice found.');
      return;
    }

    setPayingInvoiceId(inv.id);

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Unable to load Razorpay SDK. Please check your internet connection.');
        setPayingInvoiceId(null);
        return;
      }

      // 2. Call server-side create-order endpoint
      const orderData = await apiRequest('/api/student/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: inv.id })
      });

      if (!orderData || !orderData.order_id) {
        throw new Error('Failed to create Razorpay payment order from server.');
      }

      // Clean contact phone
      const rawPhone = (orderData.student_phone || '').replace(/\D/g, '');
      const validPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : undefined;

      // 3. Open Official Razorpay Standard Checkout UI
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'DigiTute Institute',
        description: `Tuition Fee · Invoice #${orderData.invoice_number}`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.student_name || undefined,
          email: orderData.student_email || undefined,
          contact: validPhone
        },
        theme: {
          color: '#0d9488' // DigiTute brand teal
        },
        handler: async function (response) {
          try {
            
            const verifyRes = await apiRequest('/api/student/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                invoice_id: orderData.invoice_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            setPayingInvoiceId(null);
            fetchData();
          } catch (vErr) {
            setPayingInvoiceId(null);
            showToast(vErr.message || 'Payment signature verification failed.');
          }
        },
        modal: {
          ondismiss: function () {
            setPayingInvoiceId(null);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setPayingInvoiceId(null);
        showToast(`Payment Cancelled or Failed: ${resp.error?.description || 'Transaction failed'}`);
      });
      rzpInstance.open();
      setPayingInvoiceId(null);
    } catch (err) {
      console.error('Razorpay Launch Error:', err);
      showToast(err.message || 'Could not initiate Razorpay checkout.');
      setPayingInvoiceId(null);
    }
  };

  const handleDownloadReceipt = (pmt) => {
    const invNo = pmt.invoices?.invoice_number || 'INV-2026';
    const dateStr = pmt.paid_at
      ? new Date(pmt.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Online Verified';
    const amt = Number(pmt.amount || 0).toLocaleString('en-IN');
    const rzpId = pmt.razorpay_payment_id || 'Verified Online';

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
            .total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; margin-top: 16px; padding-top: 12px; }
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
          <div class="row"><span>Transaction Date:</span><strong>${dateStr}</strong></div>
          <div class="row"><span>Payment Mode:</span><strong>Razorpay (Online)</strong></div>
          <div class="row"><span>Razorpay Payment ID:</span><strong style="font-family:monospace;">${rzpId}</strong></div>
          <div class="row total"><span>Total Amount Paid:</span><span style="color:#0d9488;">₹${amt}</span></div>
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
    <div className="sp-view-container sp-fees-view">
      {/* Header Row */}
      <div className="sp-fees-header-row" style={{ marginBottom: 20 }}>
      </div>

      {/* SECTION: Outstanding Due Invoices (Only shown when there are pending dues) */}
      {pendingInvoices.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #0f172a)' }}>
              Due Fee Invoices ({pendingInvoices.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingInvoices.map((inv) => {
              const netDue = Math.max(0, (inv.payable_amount || 0) - (inv.amount_paid || 0));
              const isOneTime = inv.invoice_type === 'ONE_TIME';
              const billingDesc = isOneTime
                ? 'One-Time Admission / Course Fee'
                : inv.billing_month
                ? `${getMonthName(inv.billing_month)} ${inv.billing_year || ''} Tuition Fee`
                : 'Monthly Tuition Fee';

              const isThisPaying = payingInvoiceId === inv.id;

              return (
                <div key={inv.id} className="sp-due-invoice-item">
                  {/* Left Column: Details */}
                  <div className="sp-due-invoice-details">
                    <div className="sp-due-invoice-tags">
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: '#0f766e' }}>
                        {inv.invoice_number}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: isOneTime ? '#f0fdf4' : '#f1f5f9',
                          color: isOneTime ? '#15803d' : '#475569'
                        }}
                      >
                        {isOneTime ? 'One-Time' : 'Monthly'}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                      {billingDesc}
                    </h4>
                  </div>

                  {/* Right Column: Amount & Direct Razorpay Button */}
                  <div className="sp-due-invoice-action">
                    <div className="sp-due-amount-box">
                      <span className="sp-amount-label">
                        Net Payable
                      </span>
                      <div className="sp-amount-value">
                        ₹{Number(netDue).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      className="sp-due-pay-btn"
                      disabled={isThisPaying}
                      onClick={() => handlePayDirectly(inv)}
                    >
                      {isThisPaying ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Initiating
                          <span className="sp-loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </span>
                        </span>
                      ) : (
                        <>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                          </svg>
                          <span>Pay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: Payment History & Receipts (Full Width) */}
      <div className="sp-card sp-payment-history-card">
        <div className="sp-history-head-row">
          <div>
            <h3 className="sp-history-title">Payment History & Receipts</h3>
          </div>
        </div>


        <div className="sp-table-scroll-wrap">
          <table className="sp-fees-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading your fee ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => {
                  const dateStr = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Online Verified';
                  const invNo = p.invoices?.invoice_number || p.invoice_number || '—';
                  const rzpId = p.razorpay_payment_id ? ` · ${p.razorpay_payment_id}` : '';

                  return (
                    <tr key={p.id || idx}>
                      <td className="sp-date-cell">{dateStr}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#0f766e' }}>
                          {invNo}
                        </span>
                      </td>
                      <td>
                        <strong className="sp-desc-main" style={{ color: 'var(--text, #0f172a)', fontSize: '13.5px' }}>
                          {getPaymentDescription(p)}
                        </strong>
                      </td>
                      <td className="sp-amt-cell">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '13px' }}>
                          {p.status || 'SUCCESS'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sp-receipt-download-btn"
                          onClick={() => handleDownloadReceipt(p)}
                          title="Print or Download Official Receipt"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>Download</span>
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
