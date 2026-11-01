import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, UserCog, WalletCards, ChevronRight, CalendarDays
} from 'lucide-react';
import { apiRequest } from '../../api';

function formatINR(value) {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatShortINR(val) {
  if (!val || val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${Math.round(val)}`;
}

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${String(formattedH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
};

const getSubjectColor = (subject) => {
  const s = (subject || '').toLowerCase();
  if (s.includes('phys')) return 'teal';
  if (s.includes('math') || s.includes('calc')) return 'violet';
  if (s.includes('chem')) return 'orange';
  if (s.includes('bio')) return 'rose';
  return 'teal';
};

function MetricCard({ icon: Icon, label, value, change, changeType = 'positive', note, iconClass, onClick, isInteractive = true }) {
  return (
    <div
      className={`metric-card ${isInteractive ? 'interactive-metric-card' : ''}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={isInteractive ? `Click to view ${label}` : undefined}
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="metric-card-top">
        <div className={`metric-icon ${iconClass}`}><Icon size={18} /></div>
        <span className={`metric-change ${changeType}`}>{change}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-bottom">
        <span>{note}</span>
      </div>
    </div>
  );
}

function CollectionChart() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await apiRequest('/api/admin/payments/analytics?period=Last%206%20months');
        if (isMounted && res) {
          setAnalytics(res);
          setSelectedMonthKey(null);
        }
      } catch (err) {
        console.warn('Payment analytics fetch notice:', err?.message || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAnalytics();
    return () => { isMounted = false; };
  }, []);

  const monthsData = analytics?.months || [];
  const periodTotal = analytics?.total_period_collected || 0;
  const periodOnline = analytics?.total_period_online || 0;
  const periodCash = analytics?.total_period_cash || 0;

  const selectedMonth = selectedMonthKey ? monthsData.find(m => m.key === selectedMonthKey) : null;
  const displayTotal = selectedMonth ? selectedMonth.total : periodTotal;
  const displayOnline = selectedMonth ? selectedMonth.online : periodOnline;
  const displayCash = selectedMonth ? selectedMonth.cash : periodCash;

  const rawMax = analytics?.max_month_total || 0;
  let maxScale = 10000;
  if (rawMax > 100000) maxScale = Math.ceil(rawMax / 50000) * 50000;
  else if (rawMax > 10000) maxScale = Math.ceil(rawMax / 10000) * 10000;
  else if (rawMax > 1000) maxScale = Math.ceil(rawMax / 2000) * 2000;
  else maxScale = 5000;

  const step = maxScale / 3;
  const gridLines = [
    formatShortINR(maxScale),
    formatShortINR(step * 2),
    formatShortINR(step),
    '₹0'
  ];

  return (
    <section className="panel collection-panel">
      <div className="card-header">
        <div>
          <h2>Fee Collection Overview</h2>
          <p>Cash counter vs. Razorpay online payment split</p>
        </div>
      </div>

      <div className="chart-summary">
        <strong>{formatINR(displayTotal)}</strong>
      </div>

      <div className="chart-legend">
        <span><i className="legend-dot online-dot-legend" /> Online (Razorpay)</span>
        <span><i className="legend-dot cash-dot-legend" /> Offline Cash</span>
      </div>

      <div className="bar-chart">
        <div className="chart-grid-lines">
          {gridLines.map((gl, i) => (
            <span key={i}>{gl}</span>
          ))}
        </div>
        <div className="bar-chart-area">
          {monthsData.map((d, idx) => {
            const total = d.total || 0;
            const onlineAmt = d.online || 0;
            const cashAmt = d.cash || 0;
            const pct = maxScale > 0 ? Math.min(100, (total / maxScale) * 100) : 0;
            const onlineRatio = total > 0 ? (onlineAmt / total) * 100 : 0;
            const isSelected = selectedMonthKey === d.key;
            const monthLabel = d.label || d.month;

            return (
              <div
                className={`bar-column ${isSelected ? 'selected' : ''}`}
                key={d.key || idx}
                onClick={() => setSelectedMonthKey(prev => prev === d.key ? null : d.key)}
                style={{ cursor: 'pointer' }}
                title={`${d.full_label || monthLabel}: Total ${formatINR(total)} (Online: ${formatINR(onlineAmt)}, Cash: ${formatINR(cashAmt)})`}
              >
                <div
                  className="bar-stack"
                  style={{
                    height: total > 0 ? `${Math.max(pct, 8)}%` : '0%',
                    opacity: total > 0 ? 1 : 0
                  }}
                >
                  {total > 0 && (
                    <>
                      <span className="bar-online" style={{ height: `${onlineRatio}%` }} />
                      <span className="bar-cash" style={{ height: `${100 - onlineRatio}%` }} />
                    </>
                  )}
                </div>
                <span className={isSelected || d.key === analytics?.current_month_key ? 'current-month' : ''}>
                  {monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-footnote" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><i className="tiny-dot teal-dot" /> Online (Razorpay): <strong>{formatINR(displayOnline)}</strong></span>
          <span><i className="tiny-dot orange-dot" /> Offline Cash: <strong>{formatINR(displayCash)}</strong></span>
        </div>
        {selectedMonthKey && (
          <button
            type="button"
            className="text-link"
            style={{ fontSize: 11.5, cursor: 'pointer', border: 'none', background: 'none', padding: '2px 6px' }}
            onClick={() => setSelectedMonthKey(null)}
          >
            Show full 6 months
          </button>
        )}
      </div>
    </section>
  );
}

function TodaySchedule({ onViewAll }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/admin/sessions?start_date=${todayStr}&end_date=${todayStr}`).catch(() => []);
        if (isMounted) {
          if (Array.isArray(res) && res.length > 0) {
            setSessions(res);
          } else {
            const allRes = await apiRequest('/api/admin/sessions').catch(() => []);
            if (Array.isArray(allRes) && allRes.length > 0) {
              const upcoming = allRes.filter(s => s.session_date >= todayStr);
              setSessions(upcoming.length > 0 ? upcoming.slice(0, 5) : allRes.slice(0, 5));
            } else {
              setSessions([]);
            }
          }
        }
      } catch (err) {
        console.warn('Today sessions fetch notice:', err?.message || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSessions();
    return () => { isMounted = false; };
  }, [todayStr]);

  const displayList = sessions.map((s, idx) => ({
    id: s.id || idx,
    time: formatTime12h(s.start_time),
    end: formatTime12h(s.end_time),
    subject: s.subject || 'Class Session',
    batch: s.batch_name || 'General Batch',
    teacher: s.teacher_name || 'Faculty Member',
    color: getSubjectColor(s.subject),
    status: s.status
  }));

  const visibleSchedule = displayList.slice(0, 2);

  return (
    <section className="panel schedule-panel">
      <div className="card-header">
        <div>
          <h2>Today's Class Schedule</h2>
          <p>{todayFormatted}</p>
        </div>
        <button className="text-link" onClick={onViewAll}>
          View all <ChevronRight size={13} />
        </button>
      </div>

      <div className="schedule-tabs">
        <button className="selected">
          All classes <span>{displayList.length}</span>
        </button>
      </div>

      <div className="schedule-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)' }}>
            Loading schedule...
          </div>
        ) : visibleSchedule.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-3)' }}>
            <CalendarDays size={28} style={{ margin: '0 auto 8px', opacity: 0.5, color: 'var(--teal)' }} />
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)' }}>No classes scheduled for today</p>
            <small style={{ color: 'var(--text-3)' }}>Use Routine &amp; Schedule to view or plan sessions</small>
          </div>
        ) : (
          visibleSchedule.map((item, idx) => (
            <div className="schedule-item" key={item.id || idx}>
              <div className="schedule-time">
                <strong>{item.time}</strong>
                <span>{item.end}</span>
              </div>
              <div className={`schedule-color-bar ${item.color}`} />
              <div className="schedule-info">
                <div className="schedule-title-row">
                  <strong>{item.subject}</strong>
                </div>
                <p>{item.batch}</p>
                <div className="teacher-line">
                  <span className="teacher-avatar">{(item.teacher || 'T')[0]}</span>
                  <span>{item.teacher}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function HomeView({
  onNavigate,
  students = [],
  batches = [],
  teachers = []
}) {
  const [metrics, setMetrics] = useState({
    total_students: null,
    total_batches: null,
    total_teachers: null,
    under_verification_cash: null,
    under_verification_count: null,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Fetch live metrics
  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const data = await apiRequest('/api/admin/metrics');
        if (isMounted && data) {
          setMetrics(data);
        }
      } catch (err) {
        console.warn('Dashboard metrics fetch notice:', err?.message || err);
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    }
    loadMetrics();
    return () => { isMounted = false; };
  }, []);

  const studentCount = metrics.total_students ?? students.length;
  const batchCount = metrics.total_batches ?? batches.length;
  const teacherCount = metrics.total_teachers ?? teachers.length;
  const underVerificationAmount = metrics.under_verification_cash ?? 0;
  const underVerificationCount = metrics.under_verification_count ?? 0;

  // The 4 Renovated KPI Cards
  const kpiCards = [
    {
      icon: Users,
      label: 'Total Students',
      value: studentCount.toString(),
      change: studentCount > 0 ? 'Enrolled' : 'None',
      changeType: 'positive',
      note: batchCount > 0 ? `across ${batchCount} batches` : 'no active batches',
      iconClass: 'teal-icon',
      onClick: () => onNavigate?.('Students & Admissions')
    },
    {
      icon: BookOpen,
      label: 'Total Batches',
      value: batchCount.toString(),
      change: batchCount > 0 ? 'Active' : 'None',
      changeType: 'positive',
      note: batchCount > 0 ? 'active course batches' : 'no active batches',
      iconClass: 'violet-icon',
      onClick: () => onNavigate?.('Batches & Courses')
    },
    {
      icon: UserCog,
      label: 'Total Teachers',
      value: teacherCount.toString(),
      change: 'Faculty',
      changeType: 'positive',
      note: teacherCount > 0 ? `${teacherCount} verified instructors` : 'no faculty added',
      iconClass: 'orange-icon',
      onClick: () => onNavigate?.('Teachers & Staff')
    },
    {
      icon: WalletCards,
      label: 'Cash Payment Under Verification',
      value: underVerificationCount.toString(),
      change: underVerificationAmount > 0 ? formatINR(underVerificationAmount) : 'All clear',
      changeType: underVerificationCount > 0 ? 'negative' : 'positive',
      note: underVerificationCount > 0 ? `${underVerificationCount} handovers pending` : 'handover queue clear',
      iconClass: 'rose-icon',
      onClick: () => onNavigate?.('Finance & Fees')
    }
  ];

  return (
    <div className="home-dashboard-view">
      {/* 1. TOP 4 RENOVATED KPI CARDS */}
      <div className="metrics-grid">
        {kpiCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* 2. MAIN CHARTS & SCHEDULE GRID */}
      <div className="main-grid">
        <CollectionChart />
        <TodaySchedule onViewAll={() => onNavigate?.('Routine & Schedule')} />
      </div>
    </div>
  );
}
