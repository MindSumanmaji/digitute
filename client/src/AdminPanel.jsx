import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Bell, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, Clock3, Command, CreditCard, Download, Ellipsis,
  FileText, GraduationCap, Home, LifeBuoy, LogOut, Menu, Moon,
  MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Users, Wallet, X, Megaphone, Building2, UserRoundPlus,
  BookMarked, CalendarCheck, ChartNoAxesCombined, ClipboardList, PanelLeftClose,
  PanelLeftOpen, ReceiptText, TrendingUp, UserCheck, UserCog, WalletCards,
  CircleHelp, Filter, CheckCheck, Printer, MessageSquare, Copy, Link2, Trash2, Edit3
} from 'lucide-react';

import { apiRequest, clearAuthSession } from './api';

import BatchesView from './components/Admin/BatchesView';
import RoutineScheduleView from './components/Admin/RoutineScheduleView';
import TeachersView from './components/Admin/TeachersView';
import StudentsView from './components/Admin/StudentsView';
import FinanceView from './components/Admin/FinanceView';
import NoticeBoardView from './components/Admin/NoticeBoardView';
import ReportsView from './components/Admin/ReportsView';

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Batches & Courses', icon: BookOpen },
  { label: 'Routine & Schedule', icon: CalendarDays },
  { label: 'Teachers & Staff', icon: UserCog },
  { label: 'Students & Admissions', icon: Users },
  { label: 'Finance & Fees', icon: WalletCards },
  { label: 'Notice Board', icon: Megaphone },
  { label: 'Reports & Analytics', icon: ChartNoAxesCombined },
];

const monthData = [
  { month: 'May', cash: 35, online: 24 },
  { month: 'Jun', cash: 46, online: 30 },
  { month: 'Jul', cash: 40, online: 39 },
  { month: 'Aug', cash: 52, online: 32 },
  { month: 'Sep', cash: 48, online: 43 },
  { month: 'Oct', cash: 61, online: 36 },
];

const schedule = [
  { time: '04:00 PM', end: '05:30 PM', subject: 'Physics', batch: 'Class 12 · Science', teacher: 'Arindam Roy', room: 'Room 02', color: 'teal' },
  { time: '04:30 PM', end: '06:00 PM', subject: 'Mathematics', batch: 'JEE Foundation', teacher: 'S. Mukherjee', room: 'Room 01', color: 'violet' },
  { time: '05:30 PM', end: '07:00 PM', subject: 'Chemistry', batch: 'Class 11 · Science', teacher: 'Debjani Paul', room: 'Room 03', color: 'orange' },
];

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function Brand({ collapsed }) {
  return (
    <div className={`brand ${collapsed ? 'brand-collapsed' : ''}`}>
      <div className="brand-mark"><GraduationCap size={21} strokeWidth={2.4} /></div>
      {!collapsed && <div className="brand-copy"><span>DigiTute</span><small>ADMIN WORKSPACE</small></div>}
    </div>
  );
}

function Sidebar({ activePage, onNavigate, collapsed, setCollapsed, mobileOpen, setMobileOpen, onSignOut }) {
  return (
    <>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-top">
          <Brand collapsed={collapsed} />
          <button className="icon-button sidebar-collapse" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;
            return (
              <button
                key={item.label}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => { onNavigate(item.label); setMobileOpen(false); }}
              >
                <Icon size={18} />
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
                {collapsed && <span className="nav-tooltip">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            className="nav-item sidebar-logout-btn"
            onClick={onSignOut}
            title="Log out"
          >
            <LogOut size={18} />
            {!collapsed && <span className="nav-item-label">Log out</span>}
            {collapsed && <span className="nav-tooltip">Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ user, searchQuery, setSearchQuery, onMobileMenu, darkMode, setDarkMode, onQuickAction, onNavigate }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userName = user?.full_name || 'Admin';
  const userEmail = user?.email || '';
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={onMobileMenu}>
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <button
          className="icon-button theme-toggle"
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="popover-wrap">
          <button
            className={`icon-button notification-button ${notifOpen ? 'icon-active' : ''}`}
            aria-label="Notifications"
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          {notifOpen && (
            <div className="floating-popover">
              <div className="popover-heading">
                <strong>Notifications</strong>
                <button onClick={() => setNotifOpen(false)}>Mark read</button>
              </div>
              <div className="notification-row">
                <div className="notification-icon orange-soft"><Wallet size={16} /></div>
                <div>
                  <strong>₹2,000 received via Razorpay</strong>
                  <p>Priyanka Roy (Class 12) paid October tuition fees.</p>
                  <small>Today, 11:24 AM</small>
                </div>
              </div>
              <div className="notification-row">
                <div className="notification-icon blue-soft"><Users size={16} /></div>
                <div>
                  <strong>1-Click Reminder sent</strong>
                  <p>Due reminders sent to 4 parents on WhatsApp.</p>
                  <small>Yesterday, 04:00 PM</small>
                </div>
              </div>
              <button className="popover-footer" onClick={() => { setNotifOpen(false); onNavigate('Finance & Fees'); }}>
                View complete ledger <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="topbar-separator" />

        <div className="popover-wrap">
          <button
            className="top-profile"
            aria-label="User Profile"
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          >
            <div className="top-profile-avatar">{userInitials}</div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {profileOpen && (
            <div className="floating-popover profile-menu">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div className="top-profile-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{userInitials}</div>
                <div>
                  <strong style={{ display: 'block', lineHeight: 1.2 }}>{userName}</strong>
                  <span style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 700 }}>{userRole}</span>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', wordBreak: 'break-all', marginBottom: '10px' }}>{userEmail}</span>
              <button 
                onClick={() => { setProfileOpen(false); onQuickAction('Sign out'); }} 
                style={{ cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, change, changeType = 'positive', note, iconClass, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <div className={`metric-icon ${iconClass}`}><Icon size={18} /></div>
        <span className={`metric-change ${changeType}`}>{change}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-bottom">
        <span>{note}</span>
        <div className="mini-sparkline">
          {trend.map((h, i) => (
            <i key={i} style={{ height: `${Math.max(4, (h / 100) * 22)}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionChart({ period, setPeriod }) {
  return (
    <section className="panel collection-panel">
      <div className="card-header">
        <div>
          <h2>Fee Collection Overview</h2>
          <p>Cash counter vs. Razorpay online payment split</p>
        </div>
        <div className="card-actions">
          <select className="subtle-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Last 6 months</option>
            <option>This semester</option>
            <option>Current academic year</option>
          </select>
        </div>
      </div>

      <div className="chart-summary">
        <strong>₹4,82,500</strong>
        <span className="summary-positive"><ArrowUpRight size={13} /> +12.8%</span>
        <span className="chart-summary-note">collected in October 2026</span>
      </div>

      <div className="chart-legend">
        <span><i className="legend-dot online-dot-legend" /> Online (Razorpay)</span>
        <span><i className="legend-dot cash-dot-legend" /> Offline Cash</span>
      </div>

      <div className="bar-chart">
        <div className="chart-grid-lines">
          <span>₹6L</span><span>₹4L</span><span>₹2L</span><span>₹0</span>
        </div>
        <div className="bar-chart-area">
          {monthData.map((d) => {
            const total = d.cash + d.online;
            const pct = Math.min(100, (total / 100) * 100);
            const onlineRatio = (d.online / total) * 100;
            return (
              <div className="bar-column" key={d.month}>
                <div className="bar-stack" style={{ height: `${pct}%` }}>
                  <span className="bar-online" style={{ height: `${onlineRatio}%` }} />
                  <span className="bar-cash" style={{ height: `${100 - onlineRatio}%` }} />
                </div>
                <span className={d.month === 'Oct' ? 'current-month' : ''}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-footnote">
        <span><i className="tiny-dot teal-dot" /> Razorpay: <strong>₹2,17,000</strong></span>
        <span><i className="tiny-dot orange-dot" /> Cash: <strong>₹2,65,500</strong></span>
      </div>
    </section>
  );
}

function TodaySchedule({ onViewAll }) {
  return (
    <section className="panel schedule-panel">
      <div className="card-header">
        <div>
          <h2>Today's Class Schedule</h2>
          <p>Tuesday, 13 October 2026</p>
        </div>
        <button className="text-link" onClick={onViewAll}>
          View all <ChevronRight size={13} />
        </button>
      </div>

      <div className="schedule-tabs">
        <button className="selected">All classes <span>3</span></button>
        <button>Morning</button>
        <button>Evening</button>
      </div>

      <div className="schedule-list">
        {schedule.map((item, idx) => (
          <div className="schedule-item" key={idx}>
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
                <span className="teacher-avatar">{item.teacher[0]}</span>
                <span>{item.teacher}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeView({ searchQuery, onQuickAction, onNavigate, onCollect, students }) {
  const [period, setPeriod] = useState('This month');
  const dueList = students.filter(s => s.dueAmount > 0);

  const metrics = [
    { icon: Users, label: 'Active students', value: '180', change: '+12 new', note: 'across 4 batches', iconClass: 'teal-icon', trend: [30, 50, 42, 65, 56, 84, 76, 100] },
    { icon: BookOpen, label: 'Active batches', value: '4', change: '100% active', note: 'running smoothly', iconClass: 'violet-icon', trend: [35, 35, 45, 45, 60, 60, 83, 83] },
    { icon: Wallet, label: 'Fee collected', value: '₹4.82L', change: '+12.8%', note: 'this month', iconClass: 'orange-icon', trend: [24, 43, 34, 62, 51, 75, 69, 100] },
    { icon: AlertCircle, label: 'Pending dues', value: '₹7,400', change: '4 students', changeType: 'negative', note: 'due by 10th Oct', iconClass: 'rose-icon', trend: [80, 64, 73, 52, 58, 42, 30, 22] },
  ];

  return (
    <>
      <div className="metrics-grid">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>

      <div className="main-grid">
        <CollectionChart period={period} setPeriod={setPeriod} />
        <TodaySchedule onViewAll={() => onNavigate('Routine & Schedule')} />
      </div>

      <div className="bottom-grid">
        <section className="panel dues-panel">
          <div className="card-header">
            <div>
              <h2>Pending Dues & Defaulter Alerts</h2>
              <p>{dueList.length} students have pending tuition fees</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('Finance & Fees')}>View all <ChevronRight size={13} /></button>
          </div>

          <div className="dues-table-wrap">
            <table className="dues-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Collect</th>
                </tr>
              </thead>
              <tbody>
                {dueList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-3)' }}>
                      No pending fee dues. All student accounts are clear.
                    </td>
                  </tr>
                ) : (
                  dueList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="student-cell">
                          <div className={`student-avatar ${s.avatarTone}`}>{s.name[0]}</div>
                          <div><strong>{s.name}</strong><small>{s.studentId || s.id}</small></div>
                        </div>
                      </td>
                      <td><span className="batch-name">{s.batch}</span></td>
                      <td><strong className="due-amount">₹{s.dueAmount.toLocaleString('en-IN')}</strong></td>
                      <td><span className="due-date">{s.dueDate}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="collect-row-button" onClick={() => onCollect(s)}>Collect</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel notice-panel">
          <div className="card-header">
            <div>
              <h2>Recent Notice Board</h2>
              <p>Active center announcements</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('Notice Board')}>View all <ChevronRight size={13} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <div style={{ padding: 14, borderRadius: 10, background: '#f8fbfb', border: '1px solid #ebf2f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>Kali Puja & Diwali Vacation</strong>
                <span className="notice-audience-pill" style={{ fontSize: 13 }}>All Students</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>Classes suspended from 28th Oct to 3rd Nov 2026.</p>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: '#f8fbfb', border: '1px solid #ebf2f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>October Fee Due Reminder</strong>
                <span className="notice-audience-pill" style={{ fontSize: 13 }}>Pending Dues</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>Kindly clear dues by 10th Oct to avoid late fines.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Modal({ modal, onClose, onSubmit, selectedItem, batches, teachers }) {
  const isAdmission = modal === 'New admission';
  const isEditStudent = modal === 'Edit student';
  const isBatch = modal === 'Create batch' || modal === 'Edit batch';
  const isEditBatch = modal === 'Edit batch';
  const isDeleteBatch = modal === 'Delete batch';
  const isTeacher = modal === 'Add teacher' || modal === 'Edit teacher';
  const isEditTeacher = modal === 'Edit teacher';
  const isCollect = modal === 'Collect cash' || modal === 'Collect fee' || (typeof modal === 'string' && modal.startsWith('Collect for '));
  const isReceipt = typeof modal === 'string' && modal.startsWith('Receipt: ');
  const isNotice = modal === 'Broadcast notice' || modal === 'Send fee reminders';
  const isExport = modal === 'Export report';

  const [form, setForm] = useState({
    name: selectedItem?.full_name || selectedItem?.name || '',
    email: selectedItem?.email || '',
    phone: selectedItem?.phone || '',
    batch: selectedItem?.batches?.name || selectedItem?.batch || (batches[0]?.name || ''),
    guardianName: selectedItem?.guardian_name || selectedItem?.guardianName || '',
    guardianPhone: selectedItem?.guardian_phone || selectedItem?.guardianPhone || '',
    guardianWhatsapp: selectedItem?.guardian_phone || selectedItem?.guardianWhatsapp || '',
    address: selectedItem?.address || '',
    discountAmount: selectedItem?.discount_amount != null ? selectedItem.discount_amount : (selectedItem?.discountAmount || ''),
    customMonthlyFee: selectedItem?.custom_monthly_fee != null ? selectedItem.custom_monthly_fee : (selectedItem?.customMonthlyFee || ''),
    isActive: selectedItem?.is_active !== undefined ? selectedItem.is_active : true,
    amount: selectedItem?.feeAmount || selectedItem?.fee_amount || selectedItem?.monthlyFee || selectedItem?.dueAmount || '',
    feeType: selectedItem?.feeType || selectedItem?.fee_type || 'MONTHLY',
    mode: 'Cash',
    title: selectedItem?.name || '',
    duration: selectedItem?.duration || '1 Year',
    dueDay: '10',
    lateFine: '100',
    qualification: selectedItem?.qualification || '',
    specialization: selectedItem?.specialization || '',
    payoutModel: 'Fixed Monthly (₹6,000/mo)',
    audience: 'All Students & Teachers',
    message: '',
  });

  const [batchSubjects, setBatchSubjects] = useState(() => {
    if (selectedItem?.subjects && Array.isArray(selectedItem.subjects) && selectedItem.subjects.length > 0) {
      return selectedItem.subjects.map(s => ({
        name: s.name || '',
        teacherId: s.teacherId || s.teacher_id || '',
        teacher: s.teacher || s.teacher_name || '',
        sharePercent: s.sharePercent != null ? s.sharePercent : (s.share_percent != null ? s.share_percent : 35)
      }));
    }
    return [
      {
        name: '',
        teacherId: teachers?.[0]?.id || '',
        teacher: teachers?.[0]?.name || '',
        sharePercent: ''
      }
    ];
  });

  if (!modal) return null;

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSubject = () => {
    const defaultTeacher = teachers?.[0] || { id: '', name: '' };
    setBatchSubjects(prev => [
      ...prev,
      {
        name: '',
        teacherId: defaultTeacher.id || '',
        teacher: defaultTeacher.name || defaultTeacher.full_name || '',
        sharePercent: ''
      }
    ]);
  };

  const removeSubject = (index) => {
    if (batchSubjects.length <= 1) {
      setBatchSubjects([{ name: '', teacherId: '', teacher: '', sharePercent: '' }]);
      return;
    }
    setBatchSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    setBatchSubjects(prev => {
      const copy = [...prev];
      if (field === 'teacherId') {
        const found = teachers.find(t => t.id === value);
        copy[index] = { ...copy[index], teacherId: value, teacher: found ? (found.full_name || found.name) : '' };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const totalShare = batchSubjects.reduce((sum, s) => sum + (Number(s.sharePercent) || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (isBatch) {
      onSubmit({
        type: modal,
        form: {
          ...form,
          subjects: batchSubjects
        }
      });
    } else {
      onSubmit({ type: modal, form });
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-card ${isBatch || isTeacher ? 'modal-card-lg' : ''}`}>
        <div className="modal-header">
          <div className="modal-heading-icon" style={isDeleteBatch ? { background: '#fff1f2', color: '#e11d48' } : {}}>
            {isDeleteBatch ? <Trash2 size={19} /> : (isEditStudent || isEditTeacher) ? <Edit3 size={19} /> : <Sparkles size={19} />}
          </div>
          <div>
            <h2>
              {isAdmission ? 'New Student Admission' :
                isEditStudent ? `Edit Student: ${selectedItem?.full_name || selectedItem?.name || ''}` :
                isDeleteBatch ? 'Delete Course Batch' :
                isEditBatch ? `Edit Batch: ${selectedItem?.name || ''}` :
                  isBatch ? 'Create New Course Batch' :
                    isEditTeacher ? `Edit Faculty: ${selectedItem?.full_name || selectedItem?.name || ''}` :
                    isTeacher ? 'Add Faculty Member' :
                      isCollect ? ((typeof modal === 'string' && modal.startsWith('Collect for ')) ? modal : 'Collect Tuition Fee') :
                        isReceipt ? 'Official Payment Receipt' :
                          isNotice ? 'Broadcast Announcement' :
                            isExport ? 'Export Institute Report' : modal}
            </h2>
            <p>
              {isAdmission ? 'Enter student and guardian contact details for batch enrolment. Default password is #{initials}@123.' :
                isEditStudent ? 'Update student profile, enrolled batch, contact numbers and scholarship discount.' :
                isDeleteBatch ? 'Confirm permanent removal of this course batch from database.' :
                isEditBatch ? 'Update batch fee model, course fee and faculty revenue sharing.' :
                  isBatch ? 'Configure batch name, tuition fee model and faculty revenue sharing.' :
                    isEditTeacher ? 'Update faculty contact info, qualifications and academic specialization.' :
                    isTeacher ? 'Onboard teacher with qualification, subjects and payout model. Default password is #{initials}@123.' :
                      isCollect ? 'Record counter cash payment and issue digital receipt slip.' :
                        isReceipt ? 'Official money voucher with institute seal.' :
                          isNotice ? 'Publish notification to student and faculty portals.' : 'Confirm action.'}
            </p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        {isDeleteBatch ? (
          <div>
            <div style={{ padding: '16px 8px 24px', textAlign: 'center' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fff1f2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid #ffe4e6'
              }}>
                <Trash2 size={26} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
                Delete "{selectedItem?.name || 'this batch'}"?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 420, margin: '0 auto 12px', lineHeight: 1.5 }}>
                Are you sure you want to delete this course batch? This will remove the batch offering, its subject allocations, and unassign any enrolled students.
              </p>
              {(selectedItem?.studentCount || selectedItem?.student_count) > 0 && (
                <div style={{
                  background: '#fff8e6',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  maxWidth: 420,
                  margin: '12px auto 0',
                  textAlign: 'left'
                }}>
                  ⚠️ <strong>Warning:</strong> {selectedItem?.studentCount || selectedItem?.student_count} student(s) currently enrolled will be unassigned from this batch.
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                style={{ background: '#e11d48', borderColor: '#e11d48', color: '#fff' }}
                onClick={() => onSubmit({ type: 'Delete batch', form: selectedItem })}
              >
                <Trash2 size={15} /> Yes, Delete Batch
              </button>
            </div>
          </div>
        ) : isReceipt ? (
          <div>
            <div style={{ border: '1px dashed #cedbd7', borderRadius: 12, padding: 18, background: '#f8fbfb', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e1e9e7', paddingBottom: 10, marginBottom: 12 }}>
                <strong style={{ font: '800 16px Manrope, sans-serif', color: 'var(--teal-dark)' }}>DIGITUTE COACHING INSTITUTE</strong>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Salt Lake Sector V, Kolkata | Phone: +91 98300 12345</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Receipt No:</span> <strong style={{ fontFamily: 'monospace' }}>{selectedItem?.receiptNo || 'REC-2026-0185'}</strong></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Date & Time:</span> <strong>{selectedItem?.date || '13 Oct, 2026'}</strong></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Student:</span> <strong>{selectedItem?.studentName || form.name}</strong></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Batch:</span> <strong>{selectedItem?.batch || form.batch}</strong></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Payment Mode:</span> <strong>{selectedItem?.mode || form.mode}</strong></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>Status:</span> <strong style={{ color: '#0f8a65' }}>SUCCESS / VERIFIED</strong></div>
              </div>
              <div style={{ borderTop: '1px solid #e1e9e7', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Total Amount Paid:</span>
                <strong style={{ font: '800 18px Manrope, sans-serif', color: 'var(--teal-dark)' }}>
                  ₹{(selectedItem?.amount || Number(form.amount) || 2000).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={onClose}>Close</button>
              <button className="button-primary" onClick={() => window.print()}><Printer size={15} /> Print official receipt</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {(isAdmission || isEditStudent) && (
              <>
                <div className="form-row">
                  <label className="form-field">
                    <span>Student Full Name <b>*</b></span>
                    <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Rahul Sharma" />
                  </label>
                  {isAdmission ? (
                    <label className="form-field">
                      <span>Email Address (Mandatory for Login) <b>*</b></span>
                      <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="rahul.sharma@gmail.com" />
                    </label>
                  ) : (
                    <label className="form-field">
                      <span>Email Address (Login Identity · Read-only)</span>
                      <input type="email" value={form.email} disabled readOnly style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-card)' }} />
                    </label>
                  )}
                </div>
                <div className="form-row">
                  <label className="form-field">
                    <span>Student Phone <b>*</b></span>
                    <input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
                  </label>
                  <label className="form-field">
                    <span>Assign Batch <b>*</b></span>
                    <select required value={form.batch} onChange={(e) => update('batch', e.target.value)}>
                      {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-field">
                    <span>Guardian Name <b>*</b></span>
                    <input required value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} placeholder="e.g. Subir Sharma (Father)" />
                  </label>
                  <label className="form-field">
                    <span>Guardian WhatsApp No. <b>*</b></span>
                    <input required type="tel" value={form.guardianWhatsapp} onChange={(e) => update('guardianWhatsapp', e.target.value)} placeholder="+91 98741 99887" />
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-field">
                    <span>Scholarship / Discount (₹/mo)</span>
                    <input type="number" min="0" value={form.discountAmount} onChange={(e) => update('discountAmount', e.target.value)} placeholder="0 for regular fee" />
                  </label>
                  <label className="form-field">
                    <span>Residential Address (Optional)</span>
                    <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Student can fill later after login" />
                  </label>
                </div>
                {isEditStudent && (
                  <div className="form-row">
                    <label className="form-field">
                      <span>Enrolment Status</span>
                      <select value={form.isActive ? 'true' : 'false'} onChange={(e) => update('isActive', e.target.value === 'true')}>
                        <option value="true">Active (Enrolled)</option>
                        <option value="false">Inactive (Suspended / Left)</option>
                      </select>
                    </label>
                  </div>
                )}
              </>
            )}

            {isBatch && (
              <>
                <div className="batch-form-section">
                  <div className="batch-section-header">
                    <span>1. Basic Batch & Fee Model</span>
                  </div>
                  <label className="form-field">
                    <span>Batch / Course Name <b>*</b></span>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                      placeholder="e.g. Class 12 Science 2026"
                    />
                  </label>
                  <div className="form-row">
                    <label className="form-field">
                      <span>Payment Model (Fee Type) <b>*</b></span>
                      <select value={form.feeType || 'MONTHLY'} onChange={(e) => update('feeType', e.target.value)}>
                        <option value="MONTHLY">Monthly Recurring Tuition</option>
                        <option value="ONE_TIME">One-Time Full Course Fee</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>{form.feeType === 'ONE_TIME' ? 'Full Course Fee (₹)' : 'Monthly Tuition Fee (₹)'} <b>*</b></span>
                      <input
                        required
                        type="number"
                        min="100"
                        value={form.amount}
                        onChange={(e) => update('amount', e.target.value)}
                        placeholder="2000"
                      />
                    </label>
                  </div>
                </div>

                <div className="batch-form-section">
                  <div className="batch-section-header">
                    <div>
                      <span>2. Subjects, Faculty & Earning Share</span>
                      <small>Define batch subjects, assigned teachers and their % share of fee revenue</small>
                    </div>
                    <button type="button" className="button-secondary btn-sm" onClick={addSubject}>
                      <Plus size={13} /> Add Subject
                    </button>
                  </div>

                  <div className="batch-dynamic-list">
                    {batchSubjects.map((subj, idx) => (
                      <div key={idx} className="batch-dynamic-row">
                        <label className="form-field flex-2">
                          <span style={{ fontSize: 9.5 }}>Subject Name <b>*</b></span>
                          <input
                            required
                            placeholder="e.g. Physics"
                            value={subj.name}
                            onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                          />
                        </label>
                        <label className="form-field flex-3">
                          <span style={{ fontSize: 9.5 }}>Assigned Teacher <b>*</b></span>
                          <select
                            value={subj.teacherId || ''}
                            onChange={(e) => updateSubject(idx, 'teacherId', e.target.value)}
                          >
                            <option value="">{teachers.length > 0 ? 'Select Assigned Faculty' : 'No Faculty Available'}</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.full_name || t.name} ({t.specialization || 'Faculty'})
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field flex-1">
                          <span style={{ fontSize: 9.5 }}>Share (%) <b>*</b></span>
                          <input
                            required
                            type="number"
                            min="0"
                            max="100"
                            placeholder="35"
                            value={subj.sharePercent}
                            onChange={(e) => updateSubject(idx, 'sharePercent', e.target.value)}
                          />
                        </label>
                        {batchSubjects.length > 1 && (
                          <button
                            type="button"
                            className="btn-trash"
                            title="Remove Subject"
                            onClick={() => removeSubject(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="batch-share-summary">
                    <span>
                      Faculty Share Total: <strong>{totalShare}%</strong>
                      {' · '}
                      Institute Retains: <strong>{Math.max(0, 100 - totalShare)}%</strong>
                    </span>
                    {totalShare > 100 && (
                      <span style={{ color: '#d33', fontWeight: 700 }}>⚠️ Exceeds 100%</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {isTeacher && (
              <>
                <div className="form-row">
                  <label className="form-field">
                    <span>Faculty Full Name <b>*</b></span>
                    <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Arindam Roy" />
                  </label>
                  {isEditTeacher ? (
                    <label className="form-field">
                      <span>Email Address (Login Identity · Read-only)</span>
                      <input type="email" value={form.email} disabled readOnly style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-card)' }} />
                    </label>
                  ) : (
                    <label className="form-field">
                      <span>Email Address (Mandatory for Login) <b>*</b></span>
                      <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="arindam.roy@digitute.app" />
                    </label>
                  )}
                </div>
                <div className="form-row">
                  <label className="form-field">
                    <span>Phone Number <b>*</b></span>
                    <input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98301 23456" />
                  </label>
                  <label className="form-field">
                    <span>Qualification <b>*</b></span>
                    <input required value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder="e.g. M.Sc (Physics), B.Ed" />
                  </label>
                </div>
                <label className="form-field">
                  <span>Subject Specialization <b>*</b></span>
                  <input required value={form.specialization} onChange={(e) => update('specialization', e.target.value)} placeholder="e.g. Mechanics & Optics" />
                </label>
                {isEditTeacher && (
                  <div className="form-row">
                    <label className="form-field">
                      <span>Faculty Status</span>
                      <select value={form.isActive ? 'true' : 'false'} onChange={(e) => update('isActive', e.target.value === 'true')}>
                        <option value="true">Active (Teaching)</option>
                        <option value="false">Inactive (On Leave / Relieved)</option>
                      </select>
                    </label>
                  </div>
                )}
                <div style={{
                  marginTop: 6,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--surface-2, #f3f7f6)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  lineHeight: 1.5
                }}>
                  <BookOpen size={16} style={{ color: 'var(--teal-primary)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-1)' }}>Course & Subject Assignment:</strong>
                    <div style={{ marginTop: 2, color: 'var(--text-3)' }}>
                      Assign this faculty member to specific batch subjects & revenue share % from the <strong>Batches & Courses</strong> tab.
                    </div>
                  </div>
                </div>
              </>
            )}

            {isCollect && (
              <>
                <div className="form-row">
                  <label className="form-field">
                    <span>Student / Roll Number <b>*</b></span>
                    <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Search student name or roll" />
                  </label>
                  <label className="form-field">
                    <span>Amount Received (₹) <b>*</b></span>
                    <input required type="number" min="1" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="2000" />
                  </label>
                </div>
                <label className="form-field">
                  <span>Payment Mode</span>
                  <select value={form.mode} onChange={(e) => update('mode', e.target.value)}>
                    <option>Cash (Counter)</option>
                    <option>Offline UPI (QR Code)</option>
                    <option>Direct Bank Transfer</option>
                  </select>
                </label>
                <div className="form-info">
                  <ShieldCheck size={16} />
                  <span>Submitting will record this transaction, clear the student's monthly due and generate an official printable receipt.</span>
                </div>
              </>
            )}

            {isNotice && (
              <>
                <label className="form-field">
                  <span>Notice Title <b>*</b></span>
                  <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Upcoming Exam & Vacation Notice" />
                </label>
                <label className="form-field">
                  <span>Target Audience</span>
                  <select value={form.audience} onChange={(e) => update('audience', e.target.value)}>
                    <option>All Students & Teachers</option>
                    <option>Students Only</option>
                    <option>Teachers Only</option>
                    <option>Students with Pending Dues</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Announcement Message <b>*</b></span>
                  <textarea required rows={4} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Write the notice details here..." />
                </label>
              </>
            )}

            {isExport && (
              <div className="export-preview">
                <FileText size={23} />
                <div>
                  <strong>DigiTute Complete Academic & Finance Ledger.csv</strong>
                  <span>Includes batch revenues, student fee dues, teacher shares and attendance logs.</span>
                </div>
                <CheckCircle2 size={17} className="success-icon" />
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="button-primary">
                {isAdmission ? 'Complete Admission' :
                  isEditStudent ? 'Save Student Changes' :
                  isEditTeacher ? 'Save Faculty Changes' :
                  isEditBatch ? 'Update Batch' :
                    isBatch ? 'Create Batch' :
                      isTeacher ? 'Add Faculty' :
                        isCollect ? 'Confirm & Issue Receipt' :
                          isNotice ? 'Publish Notice' :
                            isExport ? 'Download CSV' : 'Submit'}
                <ChevronRight size={15} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="toast-message">
      <span className="toast-check"><Check size={16} /></span>
      <div>
        <strong>{toast.title}</strong>
        <span>{toast.message}</span>
      </div>
      <button className="icon-button" aria-label="Dismiss" onClick={onClose}><X size={16} /></button>
    </div>
  );
}

export default function AdminPanel({ onBackToLanding }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('digitute_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Auth Guard: if not authenticated, redirect back to landing
  useEffect(() => {
    const token = localStorage.getItem('digitute_token');
    const refreshToken = localStorage.getItem('digitute_refresh_token');
    if (!token && !refreshToken) {
      if (onBackToLanding) onBackToLanding();
    }
  }, [onBackToLanding]);

  const [activePage, setActivePage] = useState('Home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Core States
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notices, setNotices] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [exams, setExams] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Load live course batches and faculty from API
  useEffect(() => {
    let isMounted = true;
    async function fetchInitialData() {
      try {
        const [batchData, teacherData, studentData] = await Promise.all([
          apiRequest('/api/admin/batches').catch(err => {
            console.warn('API batches fetch notice:', err?.message || err);
            return [];
          }),
          apiRequest('/api/admin/teachers').catch(err => {
            console.warn('API teachers fetch notice:', err?.message || err);
            return [];
          }),
          apiRequest('/api/admin/students').catch(err => {
            console.warn('API students fetch notice:', err?.message || err);
            return [];
          })
        ]);
        if (isMounted) {
          if (Array.isArray(batchData)) setBatches(batchData);
          if (Array.isArray(teacherData)) setTeachers(teacherData);
          if (Array.isArray(studentData)) setStudents(studentData);
        }
      } catch (err) {
        console.warn('API initial data fetch notice:', err?.message || err);
      }
    }
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  function showToast(title, message) {
    setToast({ title, message });
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(null), 4500);
  }

  function handleSignOut() {
    clearAuthSession(false);
    if (onBackToLanding) {
      onBackToLanding();
    }
  }

  function openAction(action, item = null) {
    if (action === 'Sign out') {
      handleSignOut();
      return;
    }
    setModalItem(item);
    setModal(action);
  }

  function handleCollectFee(student) {
    if (student) {
      setModalItem(student);
      setModal(`Collect for ${student.name}`);
    } else {
      setModalItem(null);
      setModal('Collect fee');
    }
  }

  function handleSendReminder(target = 'all') {
    showToast('1-Click WhatsApp Reminders Sent', 'Automated fee due notifications delivered to parents on WhatsApp.');
  }

  function handlePrintReceipt(tx) {
    setModalItem(tx);
    setModal(`Receipt: ${tx.receiptNo}`);
  }

  async function submitModal(payload) {
    const { type, form } = payload;

    if (type === 'New admission') {
      const selectedBatch = batches.find(b => b.name === form.batch || b.id === form.batchId || b.id === form.batch) || batches[0];
      const batchId = selectedBatch?.id || null;
      const batchName = selectedBatch?.name || form.batch || 'Unassigned';

      const payload = {
        full_name: (form.name || '').trim(),
        email: (form.email || '').trim().toLowerCase(),
        phone: (form.phone || '').trim(),
        batch_id: batchId,
        guardian_name: (form.guardianName || '').trim() || null,
        guardian_phone: (form.guardianWhatsapp || form.guardianPhone || form.phone || '').trim() || null,
        address: (form.address || '').trim() || null,
        discount_amount: Number(form.discountAmount) || 0.0,
      };

      try {
        const res = await apiRequest('/api/admin/students/admit', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const createdStudent = res.student;
        setStudents(prev => [createdStudent, ...prev]);
        if (batchId || batchName) {
          setBatches(prev => prev.map(b => (b.id === batchId || b.name === batchName) ? {
            ...b,
            student_count: (b.student_count || 0) + 1,
            studentCount: (b.studentCount || b.student_count || 0) + 1
          } : b));
        }
        showToast('Student Enrolled', `${createdStudent.full_name} admitted to ${batchName}. Default password: ${res.default_password || 'assigned'}`);
      } catch (err) {
        console.error('Failed to admit student on server:', err);
        showToast('Admission Failed', err.message || 'Could not register student.');
      }
    } else if (type === 'Edit student') {
      const selectedBatch = batches.find(b => b.name === form.batch || b.id === form.batchId || b.id === form.batch);
      const batchId = selectedBatch?.id || null;
      const batchName = selectedBatch?.name || form.batch || 'Unassigned';
      const studentId = modalItem?.id;

      if (!studentId) {
        showToast('Error', 'Student identifier missing.');
        setModal(null);
        return;
      }

      const editPayload = {
        full_name: (form.name || '').trim(),
        phone: (form.phone || '').trim(),
        batch_id: batchId,
        guardian_name: (form.guardianName || '').trim() || null,
        guardian_phone: (form.guardianWhatsapp || form.guardianPhone || form.phone || '').trim() || null,
        address: (form.address || '').trim() || null,
        discount_amount: Number(form.discountAmount) || 0.0,
        is_active: Boolean(form.isActive)
      };

      try {
        const res = await apiRequest(`/api/admin/students/${studentId}`, {
          method: 'PUT',
          body: JSON.stringify(editPayload)
        });
        const updatedStudent = res.student || res;
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updatedStudent, batches: { name: batchName } } : s));
        apiRequest('/api/admin/batches').then(bList => {
          if (Array.isArray(bList)) setBatches(bList);
        }).catch(() => {});
        showToast('Student Updated', `${updatedStudent.full_name || form.name}'s profile updated successfully.`);
      } catch (err) {
        console.error('Failed to update student on server:', err);
        showToast('Update Failed', err.message || 'Could not update student.');
      }
    } else if (type === 'Create batch') {
      const feeVal = Number(form.amount) || 0;
      const cleanSubjects = form.subjects && form.subjects.length > 0
        ? form.subjects
          .filter(s => s.name && s.name.trim() !== '')
          .map(s => ({
            name: s.name.trim(),
            teacher_id: s.teacherId || s.teacher_id || null,
            share_percent: Number(s.sharePercent || s.share_percent) || 35.0,
            chapters: s.chapters || []
          }))
        : [];

      const batchPayload = {
        name: (form.title || 'New Batch').trim(),
        fee_type: form.feeType || 'MONTHLY',
        fee_amount: feeVal,
        subjects: cleanSubjects
      };

      try {
        const createdBatch = await apiRequest('/api/admin/batches', {
          method: 'POST',
          body: JSON.stringify(batchPayload)
        });
        setBatches(prev => [createdBatch, ...prev]);
        showToast('Batch Created', `${createdBatch.name} successfully created.`);
      } catch (err) {
        console.error('Failed to create batch on server:', err);
        showToast('Creation Failed', err.message || 'Could not create batch.');
      }
    } else if (type === 'Edit batch') {
      const feeVal = Number(form.amount) || 0;
      const cleanSubjects = form.subjects && form.subjects.length > 0
        ? form.subjects
          .filter(s => s.name && s.name.trim() !== '')
          .map(s => ({
            name: s.name.trim(),
            teacher_id: s.teacherId || s.teacher_id || null,
            share_percent: Number(s.sharePercent || s.share_percent) || 35.0,
            chapters: s.chapters || []
          }))
        : [];

      const batchPayload = {
        name: (form.title || modalItem?.name || 'Batch').trim(),
        fee_type: form.feeType || 'MONTHLY',
        fee_amount: feeVal,
        subjects: cleanSubjects
      };

      try {
        const updatedBatch = await apiRequest(`/api/admin/batches/${modalItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(batchPayload)
        });
        setBatches(prev => prev.map(b => b.id === modalItem.id ? updatedBatch : b));
        showToast('Batch Updated', `${updatedBatch.name} updated successfully.`);
      } catch (err) {
        console.error('Failed to update batch on server:', err);
        showToast('Update Failed', err.message || 'Could not update batch.');
      }
    } else if (type === 'Delete batch') {
      const target = modalItem || form;
      if (target?.id) {
        try {
          await apiRequest(`/api/admin/batches/${target.id}`, { method: 'DELETE' });
          setBatches(prev => prev.filter(b => b.id !== target.id));
          showToast('Batch Deleted', `"${target.name}" has been successfully deleted.`);
        } catch (err) {
          console.error('Failed to delete batch on server:', err);
          showToast('Delete Failed', err.message || 'Could not delete batch.');
        }
      }
      setModal(null);
      setModalItem(null);
      return;
    } else if (type === 'Add teacher') {
      const payload = {
        full_name: (form.name || '').trim(),
        email: (form.email || '').trim().toLowerCase(),
        phone: (form.phone || '').trim(),
        qualification: (form.qualification || '').trim() || null,
        specialization: (form.specialization || '').trim() || null
      };

      try {
        const res = await apiRequest('/api/admin/teachers/onboard', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const createdTeacher = res.teacher;
        setTeachers(prev => [createdTeacher, ...prev]);
        showToast('Faculty Onboarded', `${createdTeacher.full_name} registered. Default password: ${res.default_password || 'assigned'}`);
      } catch (err) {
        console.error('Failed to onboard teacher to server:', err);
        showToast('Onboard Failed', err.message || 'Could not register faculty member.');
      }
    } else if (type === 'Edit teacher') {
      const teacherId = modalItem?.id;
      if (!teacherId) {
        showToast('Error', 'Faculty identifier missing.');
        setModal(null);
        return;
      }

      const payload = {
        full_name: (form.name || '').trim(),
        phone: (form.phone || '').trim(),
        qualification: (form.qualification || '').trim() || null,
        specialization: (form.specialization || '').trim() || null,
        is_active: Boolean(form.isActive)
      };

      try {
        const res = await apiRequest(`/api/admin/teachers/${teacherId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const updatedTeacher = res.teacher || res;
        setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, ...updatedTeacher } : t));
        showToast('Faculty Updated', `${updatedTeacher.full_name || form.name}'s profile updated successfully.`);
      } catch (err) {
        console.error('Failed to update teacher on server:', err);
        showToast('Update Failed', err.message || 'Could not update faculty member.');
      }
    } else if (type === 'Collect cash' || type === 'Collect fee' || type.startsWith('Collect for ')) {
      const amt = Number(form.amount) || 2000;
      const recNo = `REC-2026-${String(transactions.length + 185).padStart(4, '0')}`;
      const newTx = {
        id: `tx-${Date.now()}`,
        receiptNo: recNo,
        studentName: modalItem?.name || form.name || 'Student',
        studentId: modalItem?.studentId || 'DT-1001',
        batch: modalItem?.batch || form.batch || 'Class 12 · Science',
        amount: amt,
        mode: form.mode || 'Cash (Counter)',
        status: 'SUCCESS',
        date: 'Today · Just now',
        collectedBy: 'Admin Counter',
      };
      setTransactions(prev => [newTx, ...prev]);

      // update student due
      if (modalItem) {
        setStudents(prev => prev.map(s => s.id === modalItem.id ? { ...s, dueAmount: 0, status: 'Paid' } : s));
      }
      showToast('Fee Payment Cleared', `Issued receipt ${recNo} for ₹${amt.toLocaleString('en-IN')}.`);
    } else if (type === 'Broadcast notice') {
      const newN = {
        id: `n-${Date.now()}`,
        title: form.title,
        audience: form.audience,
        date: 'Today',
        body: form.message,
        isPinned: false,
      };
      setNotices(prev => [newN, ...prev]);
      showToast('Notice Published', 'Notification broadcasted to student & faculty dashboards.');
    } else if (type === 'Export report') {
      const csv = [
        'Receipt Number,Student Name,Student ID,Batch,Amount,Mode,Date',
        ...transactions.map(t => `"${t.receiptNo}","${t.studentName}","${t.studentId || ''}","${t.batch}",${t.amount},"${t.mode}","${t.date}"`)
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'digitute-finance-ledger.csv'; a.click(); URL.revokeObjectURL(url);
      showToast('Report Exported', 'Downloaded complete financial ledger CSV.');
    }

    setModal(null);
  }

  function navigate(page) {
    setActivePage(page);
    setSearchQuery('');
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSignOut={() => openAction('Sign out')}
      />

      <div className="main-shell">
        <Topbar
          user={currentUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onMobileMenu={() => setMobileOpen(true)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onQuickAction={openAction}
          onNavigate={navigate}
        />

        <main className="page-content">
          {activePage === 'Home' && (
            <HomeView
              searchQuery={searchQuery}
              onQuickAction={openAction}
              onNavigate={navigate}
              onCollect={handleCollectFee}
              students={students}
            />
          )}

          {activePage === 'Batches & Courses' && (
            <BatchesView
              batches={batches}
              teachers={teachers}
              students={students}
              onCreateBatch={() => openAction('Create batch')}
              onEditBatch={(batch) => openAction('Edit batch', batch)}
              onDeleteBatch={(batch) => openAction('Delete batch', batch)}
              onSelectBatch={() => { }}
            />
          )}

          {activePage === 'Routine & Schedule' && (
            <RoutineScheduleView
              batches={batches}
              teachers={teachers}
              showToast={showToast}
            />
          )}

          {activePage === 'Teachers & Staff' && (
            <TeachersView
              teachers={teachers}
              batches={batches}
              onAddTeacher={() => openAction('Add teacher')}
              onEditTeacher={(teacher) => openAction('Edit teacher', teacher)}
            />
          )}

          {activePage === 'Students & Admissions' && (
            <StudentsView
              students={students}
              onNewAdmission={() => openAction('New admission')}
              onEditStudent={(student) => openAction('Edit student', student)}
            />
          )}

          {activePage === 'Finance & Fees' && (
            <FinanceView
              students={students}
              transactions={transactions}
              onCollectFee={handleCollectFee}
              onSendReminder={handleSendReminder}
              onPrintReceipt={handlePrintReceipt}
            />
          )}



          {activePage === 'Notice Board' && (
            <NoticeBoardView
              notices={notices}
              onBroadcastNotice={() => openAction('Broadcast notice')}
            />
          )}

          {activePage === 'Reports & Analytics' && (
            <ReportsView
              onExportReport={() => openAction('Export report')}
            />
          )}
        </main>
      </div>

      {modal && (
        <Modal
          key={`${modal}-${modalItem?.id || 'new'}`}
          modal={modal}
          selectedItem={modalItem}
          batches={batches}
          teachers={teachers}
          onClose={() => { setModal(null); setModalItem(null); }}
          onSubmit={submitModal}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
