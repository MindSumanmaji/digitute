import React from 'react';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-head">
          <div>
            <h3>Secure Fee Gateway</h3>
            <p>DigiTute Institute Shyambazar · 256-Bit SSL</p>
          </div>
          <button className="sp-modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Amount to Pay</span>
          <h2 style={{ fontSize: '32px', color: '#0f172a', margin: '4px 0 16px 0' }}>₹600.00</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>September Term Practice Lab & Test Series Access</p>
        </div>

        <div className="sp-pay-options-list">
          <div className="sp-pay-option active">
            <span>⚡ Instant UPI (Google Pay, PhonePe, Paytm)</span>
            <input type="radio" checked readOnly />
          </div>
          <div className="sp-pay-option">
            <span>💳 Debit / Credit Card (Visa, MasterCard, RuPay)</span>
            <input type="radio" />
          </div>
          <div className="sp-pay-option">
            <span>🏛️ Net Banking (SBI, HDFC, ICICI, Axis)</span>
            <input type="radio" />
          </div>
        </div>

        <div className="sp-modal-footer">
          <button className="sp-download-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sp-primary-submit-btn"
            onClick={onSuccess}
          >
            Pay ₹600 via UPI ↗
          </button>
        </div>
      </div>
    </div>
  );
}
