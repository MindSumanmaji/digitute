import React from 'react';
import { ChartNoAxesCombined, Download, TrendingUp, Wallet, Users, Award } from 'lucide-react';

export default function ReportsView({ onExportReport }) {
  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-actions">
          <button className="button-primary" onClick={onExportReport}>
            <Download size={16} /> Export financial CSV
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon teal-icon"><TrendingUp size={18} /></div>
            <span className="metric-change positive">+18.4% YoY</span>
          </div>
          <div className="metric-value">₹28.4L</div>
          <div className="metric-label">Year-to-date revenue</div>
          <div className="metric-bottom"><span>Financial Year 2026-27</span></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon orange-icon"><Wallet size={18} /></div>
            <span className="metric-change positive">48% Online</span>
          </div>
          <div className="metric-value">52% : 48%</div>
          <div className="metric-label">Cash vs Razorpay ratio</div>
          <div className="metric-bottom"><span>Digital payment adoption growing</span></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon violet-icon"><Users size={18} /></div>
            <span className="metric-change positive">96.2%</span>
          </div>
          <div className="metric-value">180 Students</div>
          <div className="metric-label">Active enrolment retention</div>
          <div className="metric-bottom"><span>Only 4 drops this quarter</span></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon rose-icon"><Award size={18} /></div>
            <span className="metric-change positive">91.8%</span>
          </div>
          <div className="metric-value">91.8%</div>
          <div className="metric-label">Defaulter recovery rate</div>
          <div className="metric-bottom"><span>Cleared within 7 days of reminder</span></div>
        </div>
      </div>

      <div className="data-table-card">
        <div className="data-table-toolbar">
          <div>
            <strong style={{ fontSize: 15.5, fontFamily: 'Manrope, sans-serif' }}>Batch Contribution & Performance Ledger</strong>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>Breakdown of fee collections and faculty payouts by course</div>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch / Course</th>
                <th>Students</th>
                <th>Monthly Tuition</th>
                <th>Gross Revenue</th>
                <th>Teacher Share</th>
                <th>Net Margin</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Class 12 · Science (2026)</strong></td>
                <td>48 students</td>
                <td>₹2,000 / mo</td>
                <td><strong>₹96,000 / mo</strong></td>
                <td>₹38,400</td>
                <td><strong style={{ color: '#098a6a' }}>₹57,600 (60%)</strong></td>
                <td style={{ textAlign: 'right' }}><span className="status-badge paid">High Profit</span></td>
              </tr>
              <tr>
                <td><strong>JEE Foundation · Morning</strong></td>
                <td>36 students</td>
                <td>₹2,500 / mo</td>
                <td><strong>₹90,000 / mo</strong></td>
                <td>₹36,000</td>
                <td><strong style={{ color: '#098a6a' }}>₹54,000 (60%)</strong></td>
                <td style={{ textAlign: 'right' }}><span className="status-badge paid">High Profit</span></td>
              </tr>
              <tr>
                <td><strong>Class 11 · Science (2027)</strong></td>
                <td>42 students</td>
                <td>₹1,800 / mo</td>
                <td><strong>₹75,600 / mo</strong></td>
                <td>₹30,240</td>
                <td><strong style={{ color: '#098a6a' }}>₹45,360 (60%)</strong></td>
                <td style={{ textAlign: 'right' }}><span className="status-badge paid">Stable</span></td>
              </tr>
              <tr>
                <td><strong>Class 10 · Madhyamik & CBSE</strong></td>
                <td>54 students</td>
                <td>₹1,500 / mo</td>
                <td><strong>₹81,000 / mo</strong></td>
                <td>₹28,350</td>
                <td><strong style={{ color: '#098a6a' }}>₹52,650 (65%)</strong></td>
                <td style={{ textAlign: 'right' }}><span className="status-badge paid">Volume Driver</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
