import { useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Bell, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, Clock3, Command, CreditCard, Download, Ellipsis,
  FileText, GraduationCap, Home, LifeBuoy, LogOut, Menu, Moon,
  MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Users, Wallet, X, Megaphone, Building2, UserRoundPlus,
  BookMarked, CalendarCheck, ChartNoAxesCombined, ClipboardList, PanelLeftClose,
  PanelLeftOpen, ReceiptText, TrendingUp, UserCheck, UserCog, WalletCards,
  CircleHelp, Filter, CheckCheck, Printer, MessageSquare, Copy, Link2, Trash2
} from 'lucide-react';

import {
  initialBatches, initialTeachers, initialStudents, initialTransactions,
  initialNotices, initialSyllabus, initialExams, initialMaterials
} from './data/mockData';

import BatchesView from './components/Admin/BatchesView';
import TeachersView from './components/Admin/TeachersView';
import StudentsView from './components/Admin/StudentsView';
import FinanceView from './components/Admin/FinanceView';
import NoticeBoardView from './components/Admin/NoticeBoardView';
import ReportsView from './components/Admin/ReportsView';

const navGroups = [
  {
    label: 'WORKSPACE',
    items: [
      { label: 'Home', icon: Home },
      { label: 'Batches & Courses', icon: BookOpen, count: '4' },
      { label: 'Teachers & Staff', icon: UserCog, count: '4' },
      { label: 'Students & Admissions', icon: Users, count: '6' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Finance & Fees', icon: WalletCards },
      { label: 'Notice Board', icon: Megaphone },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { label: 'Reports & Analytics', icon: ChartNoAxesCombined },
    ],
  },
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
      {!collapsed && <div className="brand-copy"><span>DigiTute</span><small>COACHING PORTAL</small></div>}
    </div>
  );
}

function Sidebar({ activePage, onNavigate, collapsed, setCollapsed, mobileOpen, setMobileOpen, studentCount, batchCount, teacherCount }) {
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
        <div className="institute-switcher">
          <div className="institute-avatar"><Building2 size={17} /></div>
          {!collapsed && <><div className="institute-copy"><strong>DigiTute Centre</strong><span>Admin workspace</span></div><div className="online-dot" style={{ position: 'static' }} /></>}
        </div>
        <nav className="side-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              {!collapsed && <div className="nav-group-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;
                const countBadge = item.label === 'Batches & Courses' ? batchCount : item.label === 'Teachers & Staff' ? teacherCount : item.label === 'Students & Admissions' ? studentCount : null;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => { onNavigate(item.label); setMobileOpen(false); }}
                  >
                    <Icon size={18} />
                    {!collapsed && <span className="nav-item-label">{item.label}</span>}
                    {!collapsed && countBadge && <span className={`nav-count ${active ? 'nav-count-active' : ''}`}>{countBadge}</span>}
                    {collapsed && <span className="nav-tooltip">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function Topbar({ searchQuery, setSearchQuery, onMobileMenu, darkMode, setDarkMode, onQuickAction, onNavigate }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={onMobileMenu}>
          <Menu size={20} />
        </button>
        <div className="breadcrumb">
          <span>DigiTute</span>
          <span>/</span>
          <strong>Admin Portal</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="global-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search students, batches or ledger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd><Command size={10} />K</kbd>
        </div>

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
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          >
            <div className="top-profile-avatar">AD</div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {profileOpen && (
            <div className="floating-popover profile-menu">
              <strong>Admin Director</strong>
              <span>admin@digitute.app</span>
              <button onClick={() => { setProfileOpen(false); onQuickAction('Sign out'); }}><LogOut size={14} /> Sign out</button>
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
                <span className="room-pill">{item.room}</span>
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
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> TUESDAY, 13 OCTOBER 2026</div>
          <h1>Good morning, Admin <span className="wave">✦</span></h1>
          <p>Here is what is happening at DigiTute Coaching Centre today.</p>
        </div>
        <div className="welcome-actions">
          <button className="button-primary" onClick={() => onQuickAction('New admission')}><Plus size={17} /> New admission</button>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Institute Overview</h2>
          <p>Key academic & financial metrics at a glance.</p>
        </div>
        <div className="period-button"><CalendarDays size={15} /> This month</div>
      </div>

      <div className="metrics-grid">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>

      <div className="main-grid">
        <CollectionChart period={period} setPeriod={setPeriod} />
        <TodaySchedule onViewAll={() => onNavigate('Batches & Courses')} />
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
                {dueList.map((s) => (
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
                ))}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <div style={{ padding: 12, borderRadius: 9, background: '#f8fbfb', border: '1px solid #ebf2f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 11.5 }}>Kali Puja & Diwali Vacation</strong>
                <span className="notice-audience-pill" style={{ fontSize: 8.5 }}>All Students</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-2)' }}>Classes suspended from 28th Oct to 3rd Nov 2026.</p>
            </div>
            <div style={{ padding: 12, borderRadius: 9, background: '#f8fbfb', border: '1px solid #ebf2f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 11.5 }}>October Fee Due Reminder</strong>
                <span className="notice-audience-pill" style={{ fontSize: 8.5 }}>Pending Dues</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-2)' }}>Kindly clear dues by 10th Oct to avoid late fines.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Modal({ modal, onClose, onSubmit, selectedItem, batches, teachers }) {
  const [form, setForm] = useState({
    name: selectedItem?.name || '',
    email: selectedItem?.email || '',
    phone: selectedItem?.phone || '',
    batch: selectedItem?.batch || (batches[0]?.name || ''),
    guardianName: selectedItem?.guardianName || '',
    guardianPhone: selectedItem?.guardianPhone || '',
    guardianWhatsapp: selectedItem?.guardianWhatsapp || '',
    address: selectedItem?.address || '',
    discountAmount: selectedItem?.discountAmount || '',
    amount: selectedItem?.dueAmount || '',
    mode: 'Cash',
    title: '',
    duration: '1 Year',
    dueDay: '10',
    lateFine: '100',
    qualification: '',
    specialization: '',
    payoutModel: 'Fixed Monthly (₹6,000/mo)',
    audience: 'All Students & Teachers',
    message: '',
  });

  const [batchSubjects, setBatchSubjects] = useState([
    {
      name: 'Physics',
      teacherId: teachers?.[0]?.id || 't-1',
      teacher: teachers?.[0]?.name || 'Arindam Roy',
      sharePercent: 35
    },
    {
      name: 'Chemistry',
      teacherId: teachers?.[1]?.id || 't-2',
      teacher: teachers?.[1]?.name || 'Debjani Paul',
      sharePercent: 30
    }
  ]);

  const [batchRoutine, setBatchRoutine] = useState([
    { day: 'Monday', subject: 'Physics', time: '04:00 PM - 05:30 PM' },
    { day: 'Wednesday', subject: 'Chemistry', time: '04:30 PM - 06:00 PM' }
  ]);

  const [selectedTeacherBatches, setSelectedTeacherBatches] = useState(
    batches?.[0]?.name ? [batches[0].name] : []
  );

  if (!modal) return null;

  const isAdmission = modal === 'New admission';
  const isBatch = modal === 'Create batch';
  const isTeacher = modal === 'Add teacher';
  const isCollect = modal === 'Collect cash' || modal === 'Collect fee' || modal.startsWith('Collect for ');
  const isReceipt = modal.startsWith('Receipt: ');
  const isNotice = modal === 'Broadcast notice' || modal === 'Send fee reminders';
  const isExport = modal === 'Export report';

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSubject = () => {
    const defaultTeacher = teachers?.[0] || { id: 't-1', name: 'Faculty' };
    setBatchSubjects(prev => [
      ...prev,
      {
        name: '',
        teacherId: defaultTeacher.id,
        teacher: defaultTeacher.name,
        sharePercent: 30
      }
    ]);
  };

  const removeSubject = (index) => {
    if (batchSubjects.length <= 1) return;
    setBatchSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    setBatchSubjects(prev => {
      const copy = [...prev];
      if (field === 'teacherId') {
        const found = teachers.find(t => t.id === value);
        copy[index] = { ...copy[index], teacherId: value, teacher: found ? found.name : '' };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const addRoutineSlot = () => {
    const defaultSubj = batchSubjects[0]?.name || 'Physics';
    setBatchRoutine(prev => [
      ...prev,
      { day: 'Friday', subject: defaultSubj, time: '04:00 PM - 05:30 PM' }
    ]);
  };

  const removeRoutineSlot = (index) => {
    setBatchRoutine(prev => prev.filter((_, i) => i !== index));
  };

  const updateRoutineSlot = (index, field, value) => {
    setBatchRoutine(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };



  const toggleTeacherBatch = (batchName) => {
    setSelectedTeacherBatches(prev =>
      prev.includes(batchName)
        ? (prev.length > 1 ? prev.filter(b => b !== batchName) : prev)
        : [...prev, batchName]
    );
  };

  const totalShare = batchSubjects.reduce((sum, s) => sum + (Number(s.sharePercent) || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (isBatch) {
      onSubmit({
        type: modal,
        form: {
          ...form,
          subjects: batchSubjects,
          routine: batchRoutine
        }
      });
    } else if (isTeacher) {
      onSubmit({
        type: modal,
        form: {
          ...form,
          assignedBatches: selectedTeacherBatches
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
          <div className="modal-heading-icon"><Sparkles size={19} /></div>
          <div>
            <h2>
              {isAdmission ? 'New Student Admission' :
               isBatch ? 'Create New Course Batch' :
               isTeacher ? 'Add Faculty Member' :
               isCollect ? (modal.startsWith('Collect for ') ? modal : 'Collect Tuition Fee') :
               isReceipt ? 'Official Payment Receipt' :
               isNotice ? 'Broadcast Announcement' :
               isExport ? 'Export Institute Report' : modal}
            </h2>
            <p>
              {isAdmission ? 'Enter student and guardian contact details for batch enrolment.' :
               isBatch ? 'Configure batch name, tuition fee model, faculty revenue sharing and class schedule.' :
               isTeacher ? 'Onboard teacher with qualification, subjects and payout model.' :
               isCollect ? 'Record counter cash payment and issue digital receipt slip.' :
               isReceipt ? 'Official money voucher with institute seal.' :
               isNotice ? 'Publish notification to student and faculty portals.' : 'Confirm action.'}
            </p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        {isReceipt ? (
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
            {isAdmission && (
              <>
                <div className="form-row">
                  <label className="form-field">
                    <span>Student Full Name <b>*</b></span>
                    <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Rahul Sharma" />
                  </label>
                  <label className="form-field">
                    <span>Email Address (Mandatory for Login) <b>*</b></span>
                    <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="rahul.sharma@gmail.com" />
                  </label>
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
                            value={subj.teacherId}
                            onChange={(e) => updateSubject(idx, 'teacherId', e.target.value)}
                          >
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.specialization || 'Faculty'})
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

                <div className="batch-form-section">
                  <div className="batch-section-header">
                    <div>
                      <span>3. Weekly Class Schedule & Routine</span>
                      <small>Timetable slots for recurring weekly classes</small>
                    </div>
                    <button type="button" className="button-secondary btn-sm" onClick={addRoutineSlot}>
                      <Plus size={13} /> Add Routine Slot
                    </button>
                  </div>

                  <div className="batch-dynamic-list">
                    {batchRoutine.map((slot, idx) => (
                      <div key={idx} className="batch-dynamic-row">
                        <label className="form-field flex-2">
                          <span style={{ fontSize: 9.5 }}>Day <b>*</b></span>
                          <select
                            value={slot.day}
                            onChange={(e) => updateRoutineSlot(idx, 'day', e.target.value)}
                          >
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                          </select>
                        </label>
                        <label className="form-field flex-2">
                          <span style={{ fontSize: 9.5 }}>Subject <b>*</b></span>
                          <input
                            required
                            placeholder="Subject"
                            list={`subj-datalist-${idx}`}
                            value={slot.subject}
                            onChange={(e) => updateRoutineSlot(idx, 'subject', e.target.value)}
                          />
                          <datalist id={`subj-datalist-${idx}`}>
                            {batchSubjects.filter(s => s.name).map((s, i) => (
                              <option key={i} value={s.name} />
                            ))}
                          </datalist>
                        </label>
                        <label className="form-field flex-3">
                          <span style={{ fontSize: 9.5 }}>Time Slot <b>*</b></span>
                          <input
                            required
                            placeholder="04:00 PM - 05:30 PM"
                            value={slot.time}
                            onChange={(e) => updateRoutineSlot(idx, 'time', e.target.value)}
                          />
                        </label>
                        {batchRoutine.length > 1 && (
                          <button
                            type="button"
                            className="btn-trash"
                            title="Remove Slot"
                            onClick={() => removeRoutineSlot(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
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
                  <label className="form-field">
                    <span>Email Address (Mandatory for Login) <b>*</b></span>
                    <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="arindam.roy@digitute.app" />
                  </label>
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
                <div className="form-field">
                  <span>Assigned Batches / Classes <b>*</b></span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                    {batches.map(b => {
                      const isSelected = selectedTeacherBatches.includes(b.name);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          className={`batch-chip-toggle ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleTeacherBatch(b.name)}
                        >
                          {isSelected ? '✓ ' : '+ '} {b.name}
                        </button>
                      );
                    })}
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
  const [activePage, setActivePage] = useState('Home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Core Mock States
  const [batches, setBatches] = useState(initialBatches);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [students, setStudents] = useState(initialStudents);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [notices, setNotices] = useState(initialNotices);
  const [syllabus, setSyllabus] = useState(initialSyllabus);
  const [exams, setExams] = useState(initialExams);
  const [materials, setMaterials] = useState(initialMaterials);

  function showToast(title, message) {
    setToast({ title, message });
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(null), 4500);
  }

  function openAction(action, item = null) {
    if (action === 'Sign out') {
      if (onBackToLanding) {
        onBackToLanding();
      } else {
        showToast('Session Active', 'You are logged into DigiTute admin.');
      }
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

  function submitModal(payload) {
    const { type, form } = payload;

    if (type === 'New admission') {
      const newSt = {
        id: `s-${Date.now()}`,
        studentId: `DT-${1000 + students.length + 1}`,
        name: form.name,
        email: form.email,
        batch: form.batch,
        phone: form.phone,
        guardianName: form.guardianName,
        guardianPhone: form.guardianWhatsapp || form.phone,
        guardianWhatsapp: form.guardianWhatsapp || form.phone,
        discountAmount: Number(form.discountAmount) || 0,
        address: form.address || '',
        status: 'Paid',
        dueAmount: 0,
        dueDate: 'New Enrolment',
        attendancePercent: 100,
        avatarTone: 'mint',
      };
      setStudents(prev => [newSt, ...prev]);
      showToast('Student Enrolled', `${form.name} admitted to ${form.batch}.`);
    } else if (type === 'Create batch') {
      const newB = {
        id: `b-${Date.now()}`,
        name: form.title,
        feeType: form.feeType || 'MONTHLY',
        feeAmount: Number(form.amount) || 2000,
        monthlyFee: Number(form.amount) || 2000,
        studentCount: 0,
        active: true,
        subjects: form.subjects && form.subjects.length > 0
          ? form.subjects
              .filter(s => s.name && s.name.trim() !== '')
              .map(s => {
                const matchedTeacher = teachers.find(t => t.id === s.teacherId);
                const share = Number(s.sharePercent) || 35;
                return {
                  name: s.name.trim(),
                  teacherId: s.teacherId || (matchedTeacher?.id || 't-1'),
                  teacher: s.teacher || (matchedTeacher?.name || 'Faculty'),
                  sharePercent: share,
                  earningModel: `${share}% Share`
                };
              })
          : [
              { name: 'Core Subject', teacher: 'Arindam Roy', teacherId: 't-1', sharePercent: 35, earningModel: '35% Share' }
            ],
        routine: form.routine && form.routine.length > 0
          ? form.routine
              .filter(r => r.subject && r.subject.trim() !== '')
              .map(r => ({
                day: r.day || 'Monday',
                subject: r.subject.trim(),
                time: r.time || '04:00 PM - 05:30 PM'
              }))
          : [
              { day: 'Monday', subject: 'Core Subject', time: '04:00 PM - 05:30 PM' }
            ],
      };
      setBatches(prev => [newB, ...prev]);
      showToast('Batch Created', `${form.title} created with ${newB.subjects.length} subjects & timetable.`);
    } else if (type === 'Add teacher') {
      const avatarTones = ['teal', 'orange', 'violet', 'blue', 'mint', 'rose'];
      const randomTone = avatarTones[teachers.length % avatarTones.length];
      const newT = {
        id: `t-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        email: form.email || `${form.name.toLowerCase().replace(/\s+/g, '.')}@digitute.app`,
        qualification: form.qualification,
        specialization: form.specialization,
        assignedBatches: form.assignedBatches && form.assignedBatches.length > 0
          ? form.assignedBatches
          : [batches[0]?.name || 'Class 12 · Science'],
        classesThisMonth: 0,
        payoutModel: 'Revenue Share (from Batches)',
        monthlyEarnings: 0,
        bankStatus: 'Bank Verified',
        avatarTone: randomTone,
      };
      setTeachers(prev => [newT, ...prev]);
      showToast('Faculty Added', `${form.name} joined DigiTute faculty.`);
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
        studentCount={students.length}
        batchCount={batches.length}
        teacherCount={teachers.length}
      />

      <div className="main-shell">
        <Topbar
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
              onCreateBatch={() => openAction('Create batch')}
              onSelectBatch={() => {}}
            />
          )}

          {activePage === 'Teachers & Staff' && (
            <TeachersView
              teachers={teachers}
              batches={batches}
              onAddTeacher={() => openAction('Add teacher')}
            />
          )}

          {activePage === 'Students & Admissions' && (
            <StudentsView
              students={students}
              onNewAdmission={() => openAction('New admission')}
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

      <Modal
        key={modal || 'modal'}
        modal={modal}
        selectedItem={modalItem}
        batches={batches}
        teachers={teachers}
        onClose={() => setModal(null)}
        onSubmit={submitModal}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
