import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiRequest } from '../../api';

export default function AttendanceAnalysis({ onBack, showToast, attendanceData: initialAttendanceData, routinesList = [], sessionsList = [] }) {
  const [timeframe, setTimeframe] = useState('month'); // 'week' | 'month' | 'year'
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const [liveAttendance, setLiveAttendance] = useState(initialAttendanceData || null);
  const [liveSessions, setLiveSessions] = useState(sessionsList || []);
  const [liveRoutines, setLiveRoutines] = useState(routinesList || []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [selectedMonthWeek, setSelectedMonthWeek] = useState(null);
  const [selectedYearMonth, setSelectedYearMonth] = useState(null);
  const dropdownRef = useRef(null);

  // Reset clicked selections when month, year, subject or timeframe changes
  useEffect(() => {
    setSelectedMonthWeek(null);
    setSelectedYearMonth(null);
  }, [monthOffset, yearOffset, selectedSubject, timeframe]);

  // Fetch live attendance if not provided
  useEffect(() => {
    if (!initialAttendanceData) {
      apiRequest('/api/student/my-attendance')
        .then((data) => {
          if (data) setLiveAttendance(data);
        })
        .catch((err) => console.warn('AttendanceAnalysis fetch error:', err));
    } else {
      setLiveAttendance(initialAttendanceData);
    }
  }, [initialAttendanceData]);

  // Ensure sessions and routines are directly linked and live from the database
  useEffect(() => {
    if (sessionsList && sessionsList.length > 0) {
      setLiveSessions(sessionsList);
    } else {
      apiRequest('/api/student/my-sessions')
        .then((data) => {
          if (Array.isArray(data)) setLiveSessions(data);
        })
        .catch((err) => console.warn('AttendanceAnalysis sessions fetch error:', err));
    }
  }, [sessionsList]);

  useEffect(() => {
    if (routinesList && routinesList.length > 0) {
      setLiveRoutines(routinesList);
    } else {
      apiRequest('/api/student/my-classes')
        .then((data) => {
          if (Array.isArray(data)) setLiveRoutines(data);
        })
        .catch((err) => console.warn('AttendanceAnalysis routines fetch error:', err));
    }
  }, [routinesList]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSubjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Dynamic Teacher resolver from routines, sessions, and attendance
  const resolvedTeachers = useMemo(() => {
    const map = {};
    (liveRoutines || []).forEach((r) => {
      const tName = r.users?.full_name || r.teacher?.full_name;
      if (r.subject && tName) {
        map[r.subject] = tName;
      }
    });
    (liveSessions || []).forEach((s) => {
      if (s.subject && s.teacher_name) {
        map[s.subject] = s.teacher_name;
      }
    });
    if (liveAttendance?.subject_wise) {
      Object.entries(liveAttendance.subject_wise).forEach(([sName, sInfo]) => {
        if (sInfo.teacher && sInfo.teacher !== 'Faculty') {
          map[sName] = sInfo.teacher;
        }
      });
    }
    return map;
  }, [liveRoutines, liveSessions, liveAttendance]);

  // 2. Dynamic Unique subjects enrolled by student (NO dummy subjects)
  const availableSubjects = useMemo(() => {
    const set = new Set();
    (liveRoutines || []).forEach((r) => { if (r.subject) set.add(r.subject); });
    (liveSessions || []).forEach((s) => { if (s.subject) set.add(s.subject); });
    if (liveAttendance?.subject_wise) {
      Object.keys(liveAttendance.subject_wise).forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [liveRoutines, liveSessions, liveAttendance]);

  // 3. Dynamic Subject Metadata helper
  const getSubjectMeta = (subjName) => {
    if (subjName === 'All') {
      return { name: 'All Subjects', icon: '📊', color: '#2563eb', bg: '#eff6ff', teacher: 'All Faculty', code: 'ALL-00' };
    }
    const s = (subjName || '').toLowerCase();
    let icon = '📖';
    let color = '#2563eb';
    let bg = '#eff6ff';
    let code = `${subjName.slice(0, 3).toUpperCase()}-101`;

    if (s.includes('phys')) {
      icon = '⚡';
      color = '#10b981';
      bg = '#ecfdf5';
      code = 'PHY-102';
    } else if (s.includes('math')) {
      icon = '📐';
      color = '#2563eb';
      bg = '#eff6ff';
      code = 'MTH-101';
    } else if (s.includes('chem')) {
      icon = '🧪';
      color = '#9333ea';
      bg = '#faf5ff';
      code = 'CHM-103';
    } else if (s.includes('bio')) {
      icon = '🧬';
      color = '#ea580c';
      bg = '#fff7ed';
      code = 'BIO-104';
    } else if (s.includes('comp') || s.includes('cs') || s.includes('it')) {
      icon = '💻';
      color = '#0284c7';
      bg = '#f0f9ff';
      code = 'CS-105';
    }

    return {
      name: subjName,
      icon,
      color,
      bg,
      code,
      teacher: resolvedTeachers[subjName] || 'Faculty'
    };
  };

  // Compute live slices and top/less subjects dynamically
  const { pieSlices, topSubject, lessSubject, overallRate, totalClasses, attended, missed } = useMemo(() => {
    const sw = liveAttendance?.subject_wise || {};

    const slices = availableSubjects.map((sName) => {
      const sInfo = sw[sName] || {};
      const meta = getSubjectMeta(sName);
      const sTotal = sInfo.total || 0;
      const sRate = sTotal > 0 ? (sInfo.percentage ?? 0) : 0;
      return {
        name: sName,
        value: sTotal, // Real count of classes held (0 if none)
        rate: sRate,
        color: meta.color
      };
    });

    let top = null;
    let less = null;

    if (availableSubjects.length > 0) {
      const activeWithClasses = availableSubjects.filter((s) => (sw[s]?.total || 0) > 0);

      if (activeWithClasses.length > 0) {
        const sorted = [...activeWithClasses].sort((a, b) => {
          const rateA = sw[a]?.total > 0 ? (sw[a]?.percentage ?? 0) : 0;
          const rateB = sw[b]?.total > 0 ? (sw[b]?.percentage ?? 0) : 0;
          return rateB - rateA;
        });
        const topName = sorted[0];
        const topInfo = sw[topName] || {};

        top = {
          name: topName,
          rate: topInfo.total > 0 ? (topInfo.percentage ?? 0) : 0,
          attended: topInfo.present || 0,
          total: topInfo.total || 0,
          teacher: resolvedTeachers[topName] || 'Faculty',
          note: 'Outstanding consistency recorded across current curriculum classes'
        };

        // If at least 2 subjects with classes held, pick the lowest
        if (activeWithClasses.length >= 2) {
          const lessName = sorted[sorted.length - 1];
          const lessInfo = sw[lessName] || {};
          less = {
            name: lessName,
            rate: lessInfo.total > 0 ? (lessInfo.percentage ?? 0) : 0,
            attended: lessInfo.present || 0,
            total: lessInfo.total || 0,
            teacher: resolvedTeachers[lessName] || 'Faculty',
            note: (lessInfo.total > 0 && (lessInfo.percentage ?? 0) < 75)
              ? 'Attendance needs improvement. Focus on attending upcoming classes regularly.'
              : 'Good standing. Keep attending classes consistently.'
          };
        } else if (availableSubjects.length > 1) {
          // If only 1 subject has held classes, pick another enrolled subject from the batch curriculum
          const otherSubj = availableSubjects.find((s) => s !== topName) || availableSubjects[1];
          const otherInfo = sw[otherSubj] || {};
          less = {
            name: otherSubj,
            rate: otherInfo.total > 0 ? (otherInfo.percentage ?? 0) : 0,
            attended: otherInfo.present || 0,
            total: otherInfo.total || 0,
            teacher: resolvedTeachers[otherSubj] || 'Faculty',
            note: otherInfo.total === 0
              ? 'No classes scheduled or recorded yet for this enrolled subject.'
              : 'Maintain attendance focus to ensure academic performance.'
          };
        } else {
          // Single subject in curriculum: show its attendance standing
          const lessInfo = sw[topName] || {};
          less = {
            name: topName,
            rate: lessInfo.total > 0 ? (lessInfo.percentage ?? 0) : 0,
            attended: lessInfo.present || 0,
            total: lessInfo.total || 0,
            teacher: resolvedTeachers[topName] || 'Faculty',
            note: 'Sole curriculum subject. Maintain regular attendance across upcoming sessions.'
          };
        }
      } else if (availableSubjects.length > 0) {
        // No classes held yet across any subject: provide default enrolled subject cards
        const firstSubj = availableSubjects[0];
        const secondSubj = availableSubjects[1] || availableSubjects[0];
        top = {
          name: firstSubj,
          rate: 0,
          attended: 0,
          total: 0,
          teacher: resolvedTeachers[firstSubj] || 'Faculty',
          note: 'Sessions will appear once conducted and marked.'
        };
        less = {
          name: secondSubj,
          rate: 0,
          attended: 0,
          total: 0,
          teacher: resolvedTeachers[secondSubj] || 'Faculty',
          note: 'Sessions will appear once conducted and marked.'
        };
      }
    }

    const tClasses = liveAttendance?.total_classes || 0;
    const pClasses = liveAttendance?.present_classes || 0;
    const aClasses = liveAttendance?.absent_classes || 0;
    const rate = liveAttendance?.attendance_percentage ?? 0;

    return {
      pieSlices: slices,
      topSubject: top,
      lessSubject: less,
      overallRate: rate,
      totalClasses: tClasses,
      attended: pClasses,
      missed: aClasses
    };
  }, [liveAttendance, availableSubjects, routinesList, resolvedTeachers]);

  // Overall Data by Timeframe (Week, Month, Year)
  const overallDataByTimeframe = useMemo(() => {
    const monthSummary = liveAttendance?.month_summary || {};
    const monthRate = monthSummary.rate ?? overallRate;
    const hasMonthData = (monthSummary.total !== undefined && monthSummary.total > 0);
    const monthTotal = hasMonthData ? monthSummary.total : (totalClasses || 0);
    const monthAttended = hasMonthData ? monthSummary.attended : attended;
    const monthMissed = hasMonthData ? monthSummary.missed : missed;

    return {
      week: {
        title: 'Current Week',
        overallRate,
        totalClasses,
        attended,
        missed,
        topSubject,
        lessSubject,
        pieSlices
      },
      month: {
        title: `${monthSummary.month_name || 'Current Month'} (Monthly Progression)`,
        overallRate: monthRate,
        totalClasses: monthTotal,
        attended: monthAttended,
        missed: monthMissed,
        topSubject,
        lessSubject,
        pieSlices
      },
      year: {
        title: 'Academic Term (Annual Progression)',
        overallRate,
        totalClasses,
        attended,
        missed,
        topSubject,
        lessSubject,
        pieSlices
      }
    };
  }, [liveAttendance, overallRate, totalClasses, attended, missed, topSubject, lessSubject, pieSlices]);

  // Determine base Monday for Week view
  const baseMonday = useMemo(() => {
    let referenceDate = new Date();
    const sortedDates = (liveSessions || [])
      .map((s) => s.session_date)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length > 0) {
      const parsed = new Date(sortedDates[0]);
      if (!isNaN(parsed.getTime())) {
        referenceDate = parsed;
      }
    }

    const d = new Date(referenceDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
    d.setDate(d.getDate() - dayOfWeek);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [liveSessions]);

  // Current active Week Monday and Sunday based on weekOffset
  const currentWeekDays = useMemo(() => {
    const monday = new Date(baseMonday);
    monday.setDate(baseMonday.getDate() + weekOffset * 7);

    const days = [];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-GB', { month: 'short' });
      days.push({
        dateObj: d,
        isoDate,
        dayNum,
        monthShort,
        shortName: shortNames[i],
        dayOfWeek: i + 1 // 1=Mon, ..., 7=Sun
      });
    }

    return days;
  }, [baseMonday, weekOffset]);

  // Week range label e.g., "Mon, 10 Nov – Sun, 16 Nov 2026"
  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length < 7) return '';
    const start = currentWeekDays[0];
    const end = currentWeekDays[6];
    const startStr = `${start.shortName}, ${start.dayNum} ${start.monthShort}`;
    const endStr = `${end.shortName}, ${end.dayNum} ${end.monthShort} ${end.dateObj.getFullYear()}`;
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Determine base Month Date
  const baseMonthDate = useMemo(() => {
    let referenceDate = new Date();
    const sortedDates = (liveSessions || [])
      .map((s) => s.session_date)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length > 0) {
      const parsed = new Date(sortedDates[0]);
      if (!isNaN(parsed.getTime())) {
        referenceDate = parsed;
      }
    }
    return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  }, [liveSessions]);

  // Current navigated Month Date & Label (e.g. "November 2026")
  const currentMonthDate = useMemo(() => {
    const d = new Date(baseMonthDate);
    d.setMonth(baseMonthDate.getMonth() + monthOffset);
    return d;
  }, [baseMonthDate, monthOffset]);

  const currentMonthPrefix = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [currentMonthDate]);

  const currentMonthLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  // Determine base Year & current navigated Year
  const baseYear = useMemo(() => {
    let referenceYear = new Date().getFullYear();
    const sortedDates = (liveSessions || [])
      .map((s) => s.session_date)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length > 0) {
      const parsed = new Date(sortedDates[0]);
      if (!isNaN(parsed.getFullYear())) {
        referenceYear = parsed.getFullYear();
      }
    }
    return referenceYear;
  }, [liveSessions]);

  const currentYear = useMemo(() => {
    return baseYear + yearOffset;
  }, [baseYear, yearOffset]);

  // Compute 7 days attendance cards for the selected subject
  const weekCardsData = useMemo(() => {
    const isAll = selectedSubject === 'All';
    const subjNameLower = (selectedSubject || '').toLowerCase();
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return currentWeekDays.map((day) => {
      // 1. Find concrete sessions from live database class_sessions for this day and subject
      const matchingSessions = (liveSessions || []).filter((s) => {
        if (s.session_date !== day.isoDate) return false;
        if (isAll) return true;
        return (s.subject || '').toLowerCase() === subjNameLower;
      });

      // 2. Also check attendance history from liveAttendance
      const historyMatching = (liveAttendance?.history || []).filter((h) => {
        const hDate = h.class_sessions?.session_date || h.session_date;
        if (hDate !== day.isoDate) return false;
        if (isAll) return true;
        const subj = h.class_sessions?.subject || h.subject || '';
        return subj.toLowerCase() === subjNameLower;
      });

      // Format time helper
      const formatTimeStr = (t) => {
        if (!t) return '';
        try {
          const parts = String(t).split(':');
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h < 10 ? '0' + h : h}:${m} ${ampm}`;
        } catch {
          return t;
        }
      };

      // Case A: Concrete session found in liveSessions (Database class_sessions)
      if (matchingSessions.length > 0) {
        const s = matchingSessions[0];
        const isAttended = s.student_attendance_status === 'Attended';
        const isAbsent = s.student_attendance_status === 'Absent' || (s.status === 'COMPLETED' && !isAttended);

        let statusType = 'No Class';
        if (isAttended) {
          statusType = 'Present';
        } else if (isAbsent) {
          statusType = 'Absent';
        } else if (s.status === 'CANCELLED') {
          statusType = 'No Class';
        } else if (day.isoDate >= todayIso || s.student_attendance_status === 'Upcoming' || s.status === 'SCHEDULED') {
          statusType = 'Upcoming';
        } else {
          statusType = 'Absent';
        }

        const startTime = formatTimeStr(s.start_time);
        const endTime = formatTimeStr(s.end_time);
        const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;
        const teacher = s.teacher_name || resolvedTeachers[s.subject] || 'Faculty';

        return {
          ...day,
          hasSession: statusType !== 'No Class',
          statusType,
          classesCount: matchingSessions.length,
          timeRange,
          teacher
        };
      }

      // Case B: Attendance history record found
      if (historyMatching.length > 0) {
        const h = historyMatching[0];
        const isAttended = h.status === 'PRESENT' || h.status === 'Attended';
        const cs = h.class_sessions || {};
        const startTime = formatTimeStr(cs.start_time);
        const endTime = formatTimeStr(cs.end_time);
        const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;
        const teacher = resolvedTeachers[cs.subject || selectedSubject] || 'Faculty';

        return {
          ...day,
          hasSession: true,
          statusType: isAttended ? 'Present' : 'Absent',
          classesCount: historyMatching.length,
          timeRange,
          teacher
        };
      }

      // Case C: For today or future dates, check recurring routines from database
      if (day.isoDate >= todayIso) {
        const matchingRoutine = (liveRoutines || []).find((r) => {
          const rDow = parseInt(r.day_of_week, 10);
          if (rDow !== day.dayOfWeek) return false;
          if (isAll) return true;
          return (r.subject || '').toLowerCase() === subjNameLower;
        });

        if (matchingRoutine) {
          const startTime = formatTimeStr(matchingRoutine.start_time);
          const endTime = formatTimeStr(matchingRoutine.end_time);
          const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;
          const teacher = matchingRoutine.users?.full_name || resolvedTeachers[matchingRoutine.subject || selectedSubject] || 'Faculty';

          return {
            ...day,
            hasSession: true,
            statusType: 'Upcoming',
            classesCount: 1,
            timeRange,
            teacher
          };
        }
      }

      // Case D: No class scheduled on this day
      return {
        ...day,
        hasSession: false,
        statusType: 'No Class',
        classesCount: 0,
        timeRange: '',
        teacher: resolvedTeachers[selectedSubject] || 'Faculty'
      };
    });
  }, [currentWeekDays, liveSessions, liveRoutines, liveAttendance, selectedSubject, resolvedTeachers]);

  // 4. Dynamic Single Subject Bar Data (Strictly calculated from real session records)
  const singleSubjectBarData = useMemo(() => {
    // Collect all unified session records with attendance status
    const getSubjectSessions = (sName) => {
      const recordsMap = {};

      const formatTimeStr = (t) => {
        if (!t) return '';
        try {
          const parts = String(t).split(':');
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h < 10 ? '0' + h : h}:${m} ${ampm}`;
        } catch {
          return t;
        }
      };

      const upsertRecord = (rec) => {
        if (!rec.date) return;
        const subjName = rec.subject || (sName !== 'All' ? sName : '');
        const subjLower = subjName.toLowerCase().trim();
        const dateStr = rec.date.trim();
        const timeStr = (rec.time || '').trim();

        // Check if an existing record in recordsMap has the same date, subject, and time
        const existingKey = Object.keys(recordsMap).find((k) => {
          const item = recordsMap[k];
          if (item.date !== dateStr) return false;
          if (sName !== 'All') {
            if (!item.time || !timeStr || item.time === timeStr) return true;
          } else {
            const itemSubj = (item.subject || '').toLowerCase().trim();
            if (itemSubj === subjLower) {
              if (!item.time || !timeStr || item.time === timeStr) return true;
            }
          }
          return false;
        });

        if (existingKey) {
          const existing = recordsMap[existingKey];
          if (rec.isAttended || rec.status === 'Present') {
            existing.isAttended = true;
            existing.status = 'Present';
            existing.isHeld = true;
            existing.isUpcoming = false;
          } else if (rec.status === 'Absent' || (existing.status !== 'Present' && rec.isAbsent)) {
            existing.status = 'Absent';
            existing.isHeld = true;
            existing.isUpcoming = false;
          } else if (existing.status !== 'Present' && existing.status !== 'Absent') {
            if (rec.status) existing.status = rec.status;
            if (rec.isUpcoming !== undefined) existing.isUpcoming = rec.isUpcoming;
            if (rec.isHeld !== undefined) existing.isHeld = rec.isHeld;
          }
          if (!existing.time && rec.time) existing.time = rec.time;
          if (rec.topic && (!existing.topic || existing.topic.startsWith('Curriculum Module'))) {
            existing.topic = rec.topic;
          }
          if (rec.teacher && rec.teacher !== 'Faculty') existing.teacher = rec.teacher;
        } else {
          const key = rec.id || `${subjLower}_${dateStr}_${timeStr || 'def'}`;
          recordsMap[key] = {
            ...rec,
            subject: subjName || sName
          };
        }
      };

      // 1. From liveSessions (Real database records from class_sessions)
      (liveSessions || []).forEach((s) => {
        if (!sName || sName === 'All' || (s.subject || '').toLowerCase() === sName.toLowerCase()) {
          const isAttended = s.student_attendance_status === 'Attended';
          const isAbsent = s.student_attendance_status === 'Absent' || (s.status === 'COMPLETED' && !isAttended);
          const isUpcoming = s.student_attendance_status === 'Upcoming' || s.status === 'SCHEDULED';
          const isHeld = isAttended || isAbsent;

          let status = 'Upcoming';
          if (isAttended) status = 'Present';
          else if (isAbsent) status = 'Absent';
          else if (isUpcoming) status = 'Upcoming';

          const sTime = s.start_time ? formatTimeStr(s.start_time) : '';
          const eTime = s.end_time ? formatTimeStr(s.end_time) : '';
          const timeRange = sTime && eTime ? `${sTime} - ${eTime}` : sTime;

          if (s.session_date) {
            upsertRecord({
              id: s.id,
              subject: s.subject || sName,
              date: s.session_date,
              isHeld,
              isAttended,
              isUpcoming,
              status,
              topic: s.topic_covered || s.topic || s.title || (s.subject ? `Curriculum Module - ${s.subject}` : `Curriculum Module - ${sName}`),
              time: timeRange,
              teacher: s.teacher_name || resolvedTeachers[s.subject || sName] || 'Faculty'
            });
          }
        }
      });

      // 2. From liveAttendance history
      const attHistory = liveAttendance?.history || [];
      attHistory.forEach((h) => {
        const subj = h.class_sessions?.subject || h.subject || '';
        if (!sName || sName === 'All' || subj.toLowerCase() === sName.toLowerCase()) {
          const sDate = h.class_sessions?.session_date || h.session_date;
          const isAttended = h.status === 'PRESENT' || h.status === 'Attended';
          const cs = h.class_sessions || {};
          const sTime = cs.start_time ? formatTimeStr(cs.start_time) : '';
          const eTime = cs.end_time ? formatTimeStr(cs.end_time) : '';
          const timeRange = sTime && eTime ? `${sTime} - ${eTime}` : sTime;
          if (sDate) {
            upsertRecord({
              id: h.session_id,
              subject: subj || sName,
              date: sDate,
              isHeld: true,
              isAttended,
              isUpcoming: false,
              status: isAttended ? 'Present' : 'Absent',
              topic: cs.topic_covered || cs.topic || cs.title || `Curriculum Module - ${subj || sName}`,
              time: timeRange,
              teacher: resolvedTeachers[subj || sName] || 'Faculty'
            });
          }
        }
      });

      // 3. From liveAttendance.subject_wise[sName].records
      const swInfo = liveAttendance?.subject_wise?.[sName] || {};
      (swInfo.records || []).forEach((rec, idx) => {
        if (rec.date) {
          const isAttended = rec.status === 'Present' || rec.status === 'PRESENT' || rec.status === 'Attended';
          upsertRecord({
            id: `sw-${idx}-${rec.date}`,
            subject: sName,
            date: rec.date,
            isHeld: true,
            isAttended,
            isUpcoming: false,
            status: isAttended ? 'Present' : 'Absent',
            topic: rec.topic_covered || rec.topic || `Curriculum Module - ${sName}`,
            time: rec.time || '',
            teacher: rec.teacher || resolvedTeachers[sName] || 'Faculty'
          });
        }
      });

      return Object.values(recordsMap);
    };

    const computeRateForItems = (items) => {
      const held = items.filter((it) => it.isHeld);
      if (held.length === 0) return 0;
      const attended = held.filter((it) => it.isAttended).length;
      return Math.round((attended / held.length) * 100);
    };

    const getBarValuesForSubject = (sName) => {
      const items = getSubjectSessions(sName);

      // Determine active month prefix for month breakdown
      let activeMonthPrefix = '';
      const latestHeld = items.filter((it) => it.isHeld).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latestHeld && latestHeld.date) {
        activeMonthPrefix = latestHeld.date.slice(0, 7);
      } else if (items.length > 0 && items[0].date) {
        activeMonthPrefix = items[0].date.slice(0, 7);
      } else {
        activeMonthPrefix = new Date().toISOString().slice(0, 7);
      }

      // WEEK (Mon - Sun: 1=Mon ... 7=Sun)
      const weekVals = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
        const dayItems = items.filter((it) => {
          if (!it.date) return false;
          const d = new Date(it.date);
          const rDow = (d.getDay() + 6) % 7 + 1;
          return rDow === dow;
        });
        return computeRateForItems(dayItems);
      });

      // Calculate effective current/latest date for upcoming week determination
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const sortedHeldDates = items
        .filter((it) => it.isHeld && it.date)
        .map((it) => it.date)
        .sort((a, b) => b.localeCompare(a));
      const latestHeldDate = sortedHeldDates[0] || todayIso;
      const effectiveToday = latestHeldDate > todayIso ? latestHeldDate : todayIso;

      const [mYear, mMonth] = currentMonthPrefix.split('-').map(Number);
      const totalDaysInCurrentMonth = new Date(mYear, mMonth, 0).getDate();

      // MONTH (Week 1 - 5 in active month)
      const monthVals = [1, 2, 3, 4, 5].map((w) => {
        const startDay = (w - 1) * 7 + 1;
        const endDay = w === 5 ? totalDaysInCurrentMonth : Math.min(totalDaysInCurrentMonth, w * 7);
        const weekStartDateStr = `${currentMonthPrefix}-${String(startDay).padStart(2, '0')}`;
        const weekEndDateStr = `${currentMonthPrefix}-${String(endDay).padStart(2, '0')}`;

        const weekItems = items.filter((it) => {
          if (!it.date || !it.date.startsWith(currentMonthPrefix)) return false;
          const dayNum = parseInt(it.date.split('-')[2], 10);
          const recWeek = Math.min(5, Math.ceil(dayNum / 7));
          return recWeek === w;
        });

        const held = weekItems.filter((it) => it.isHeld);
        const attended = held.filter((it) => it.isAttended).length;
        const hasHeld = held.length > 0;
        const rate = hasHeld ? Math.round((attended / held.length) * 100) : null;

        // An unheld week is Upcoming if:
        // - Its start date is in the future relative to effectiveToday
        // - OR effectiveToday falls within this week (ongoing week) and no classes have been held yet
        const isUpcoming = !hasHeld && (weekStartDateStr > effectiveToday || (effectiveToday >= weekStartDateStr && effectiveToday <= weekEndDateStr));

        let statusType = 'No Class';
        if (hasHeld) {
          if (rate >= 90) statusType = 'Excellent';
          else if (rate >= 75) statusType = 'Good';
          else if (rate >= 50) statusType = 'Needs Improvement';
          else if (rate > 0) statusType = 'Low';
          else statusType = 'Absent';
        } else if (isUpcoming) {
          statusType = 'Upcoming';
        } else {
          statusType = 'No Class';
        }

        return {
          weekNum: w,
          weekLabel: `Week ${w}`,
          weekStartDateStr,
          weekEndDateStr,
          startDay,
          endDay,
          hasHeld,
          isUpcoming,
          statusType,
          rate,
          heldCount: held.length,
          attendedCount: attended
        };
      });

      // YEAR (Jan - Dec for currentYear)
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const yearVals = Array.from({ length: 12 }, (_, mIdx) => {
        const monthPrefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
        const monthItems = items.filter((it) => it.date && it.date.startsWith(monthPrefix));
        const heldItems = monthItems.filter((it) => it.isHeld);
        const attendedItems = heldItems.filter((it) => it.isAttended);
        const hasData = heldItems.length > 0;
        const rate = hasData ? Math.round((attendedItems.length / heldItems.length) * 100) : null;

        return {
          monthIdx: mIdx,
          monthShort: monthNamesShort[mIdx],
          monthFull: monthNamesFull[mIdx],
          hasData,
          rate,
          totalHeld: heldItems.length,
          totalAttended: attendedItems.length
        };
      });

      return {
        week: weekVals,
        month: monthVals,
        year: yearVals,
        allSessions: items
      };
    };

    const subjectMap = {};
    availableSubjects.forEach((sName) => {
      subjectMap[sName] = getBarValuesForSubject(sName);
    });
    subjectMap['All'] = getBarValuesForSubject('All');

    return {
      categories: {
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      fullLabels: {
        week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        year: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      },
      data: subjectMap
    };
  }, [liveAttendance, availableSubjects, liveSessions, liveRoutines, currentMonthPrefix, currentYear]);

  const currentOverview = overallDataByTimeframe[timeframe];
  const activeMeta = getSubjectMeta(selectedSubject);
  const activeColor = activeMeta.color;

  // Selected week details & sessions for Month Filter View
  const selectedWeekDetails = useMemo(() => {
    if (!selectedMonthWeek) return null;

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthShort = currentMonthDate.toLocaleDateString('en-GB', { month: 'short' });
    const totalDays = new Date(year, month + 1, 0).getDate();

    const startDay = (selectedMonthWeek - 1) * 7 + 1;
    const endDay = selectedMonthWeek === 5 ? totalDays : Math.min(totalDays, selectedMonthWeek * 7);
    const dateRangeStr = `${startDay} ${monthShort} – ${endDay} ${monthShort} ${year}`;

    const subjRecords = singleSubjectBarData.data[selectedSubject]?.allSessions || [];

    // Look up week metadata from singleSubjectBarData
    const monthWeeksList = singleSubjectBarData.data[selectedSubject]?.month || [];
    const activeWeekMeta = monthWeeksList[selectedMonthWeek - 1] || null;
    const isUpcoming = activeWeekMeta ? activeWeekMeta.isUpcoming : false;

    // Filter real database sessions belonging to this week in this month
    const weekRecords = subjRecords
      .filter((rec) => {
        if (!rec.date || !rec.date.startsWith(currentMonthPrefix)) return false;
        const dayNum = parseInt(rec.date.split('-')[2], 10);
        const recWeek = Math.min(5, Math.ceil(dayNum / 7));
        return recWeek === selectedMonthWeek;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((rec) => {
        const parts = (rec.date || '').split('-');
        let dayNum = parseInt(parts[2], 10) || 1;
        let dMonthShort = monthShort;
        let dayName = 'Day';
        if (parts.length === 3) {
          const safeDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(safeDate.getTime())) {
            dayNum = safeDate.getDate();
            dMonthShort = safeDate.toLocaleDateString('en-GB', { month: 'short' });
            dayName = safeDate.toLocaleDateString('en-GB', { weekday: 'short' });
          }
        }
        return {
          ...rec,
          dayNum,
          monthShort: dMonthShort,
          dayName
        };
      });

    const attendedCount = weekRecords.filter((r) => r.isAttended || r.status === 'Present').length;
    const missedCount = weekRecords.filter((r) => !r.isUpcoming && (!r.isAttended || r.status === 'Absent')).length;
    const upcomingCount = weekRecords.filter((r) => r.isUpcoming || r.status === 'Upcoming').length;

    return {
      weekNum: selectedMonthWeek,
      dateRangeStr,
      isUpcoming,
      records: weekRecords,
      attendedCount,
      missedCount,
      upcomingCount
    };
  }, [currentMonthDate, selectedMonthWeek, singleSubjectBarData, selectedSubject, currentMonthPrefix]);

  // Selected month details & sessions for Year Filter View
  const selectedYearMonthDetails = useMemo(() => {
    if (selectedYearMonth === null) return null;

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const mIdx = selectedYearMonth;
    const monthShort = monthNamesShort[mIdx];
    const monthFull = monthNamesFull[mIdx];
    const monthPrefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
    const totalDays = new Date(currentYear, mIdx + 1, 0).getDate();
    const dateRangeStr = `1 ${monthShort} – ${totalDays} ${monthShort} ${currentYear}`;

    const subjRecords = singleSubjectBarData.data[selectedSubject]?.allSessions || [];

    const monthRecords = subjRecords
      .filter((rec) => {
        if (!rec.date || !rec.date.startsWith(monthPrefix)) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((rec) => {
        const parts = (rec.date || '').split('-');
        let dayNum = parseInt(parts[2], 10) || 1;
        let dMonthShort = monthShort;
        let dayName = 'Day';
        if (parts.length === 3) {
          const safeDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(safeDate.getTime())) {
            dayNum = safeDate.getDate();
            dMonthShort = safeDate.toLocaleDateString('en-GB', { month: 'short' });
            dayName = safeDate.toLocaleDateString('en-GB', { weekday: 'short' });
          }
        }
        return {
          ...rec,
          dayNum,
          monthShort: dMonthShort,
          dayName
        };
      });

    const attendedCount = monthRecords.filter((r) => r.isAttended || r.status === 'Present').length;
    const missedCount = monthRecords.filter((r) => !r.isUpcoming && (!r.isAttended || r.status === 'Absent')).length;
    const upcomingCount = monthRecords.filter((r) => r.isUpcoming || r.status === 'Upcoming').length;

    return {
      monthIdx: mIdx,
      monthShort,
      monthFull,
      dateRangeStr,
      records: monthRecords,
      attendedCount,
      missedCount,
      upcomingCount
    };
  }, [currentYear, selectedYearMonth, singleSubjectBarData, selectedSubject]);

  // Helper to render Donut Pie Chart with math-perfect SVG arcs
  const renderDonutChart = (slices, overallRateVal) => {
    const cx = 130;
    const cy = 130;
    const R = 98;
    const r = 62;

    // Filter to only subjects with actual classes held (value > 0)
    const activeSlices = (slices || []).filter((s) => (s.value || 0) > 0);
    const totalValue = activeSlices.reduce((sum, s) => sum + s.value, 0);

    let paths = [];
    if (activeSlices.length > 0 && totalValue > 0) {
      let currentAngle = -Math.PI / 2;

      paths = activeSlices.map((slice) => {
        const angle = (slice.value / totalValue) * (2 * Math.PI);
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const isHovered = hoveredSlice === slice.name;
        const currentR = isHovered ? R + 5 : R;

        if (angle >= 2 * Math.PI - 0.001 || activeSlices.length === 1) {
          const d = `M ${cx} ${cy - currentR} A ${currentR} ${currentR} 0 1 1 ${cx} ${cy + currentR} A ${currentR} ${currentR} 0 1 1 ${cx} ${cy - currentR} L ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`;
          return {
            ...slice,
            d,
            pct: 100
          };
        }

        const x1 = cx + currentR * Math.cos(startAngle);
        const y1 = cy + currentR * Math.sin(startAngle);
        const x2 = cx + currentR * Math.cos(endAngle);
        const y2 = cy + currentR * Math.sin(endAngle);

        const x3 = cx + r * Math.cos(endAngle);
        const y3 = cy + r * Math.sin(endAngle);
        const x4 = cx + r * Math.cos(startAngle);
        const y4 = cy + r * Math.sin(startAngle);

        const largeArc = angle > Math.PI ? 1 : 0;
        const d = `M ${x1} ${y1} A ${currentR} ${currentR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`;

        return {
          ...slice,
          d,
          pct: Math.round((slice.value / totalValue) * 100)
        };
      });
    }

    return (
      <div className="sp-pie-chart-wrap">
        <svg viewBox="0 0 260 260" className="sp-pie-svg">
          {paths.length === 0 ? (
            <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#e2e8f0" strokeWidth={R - r} />
          ) : (
            <g>
              {paths.map((p, idx) => (
                <path
                  key={idx}
                  d={p.d}
                  fill={p.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'all 0.16s ease' }}
                  onMouseEnter={() => setHoveredSlice(p.name)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))}
            </g>
          )}
          <circle cx={cx} cy={cy} r={r - 4} fill="#ffffff" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            fill="#0f172a"
          >
            {overallRateVal}%
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill="#64748b"
          >
            Overall Rate
          </text>
        </svg>

        {/* Slices Legend Grid */}
        <div className="sp-pie-legend-grid">
          {slices.map((s, idx) => (
            <div
              key={idx}
              className={`sp-pie-legend-item ${hoveredSlice === s.name ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoveredSlice(s.name)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => {
                setSelectedSubject(s.name);
                if (showToast) showToast(`Filtered to ${s.name}`);
              }}
              title={`Click to analyze ${s.name}`}
            >
              <span className="sp-pie-legend-dot" style={{ background: s.color }} />
              <span className="sp-pie-legend-name">{s.name}</span>
              <strong className="sp-pie-legend-rate">{s.rate}%</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper to render Bar Chart for a specific subject
  const renderSingleSubjectBarChart = () => {
    const categories = singleSubjectBarData.categories[timeframe];
    const fullLabels = singleSubjectBarData.fullLabels[timeframe];
    const values = singleSubjectBarData.data[selectedSubject]?.[timeframe] || Array(categories.length).fill(0);

    const svgWidth = 720;
    const svgHeight = 260;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 45;
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const getY = (val) => paddingTop + plotHeight - (val / 100) * plotHeight;

    return (
      <div className="sp-svg-chart-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="sp-responsive-chart-svg">
          <defs>
            <linearGradient id="subjBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[100, 75, 50, 25, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="500"
                  fill="#94a3b8"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          <g>
            {values.map((val, idx) => {
              const totalBars = values.length;
              const availableSlot = plotWidth / totalBars;
              const barWidth = Math.min(
                timeframe === 'year' ? 34 : timeframe === 'month' ? 52 : 44,
                availableSlot * 0.6
              );
              const x = paddingLeft + idx * availableSlot + (availableSlot - barWidth) / 2;
              const y = getY(val);
              const h = paddingTop + plotHeight - y;
              const isHovered = hoveredBar?.idx === idx;

              return (
                <g
                  key={idx}
                  className="sp-bar-group"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setHoveredBar({
                      idx,
                      val,
                      label: fullLabels[idx]
                    })
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <rect
                    x={x}
                    y={paddingTop}
                    width={barWidth}
                    height={plotHeight}
                    fill="#f8fafc"
                    rx="6"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(4, h)}
                    fill={isHovered ? activeColor : 'url(#subjBarGrad)'}
                    rx="6"
                    className="sp-animated-bar"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={timeframe === 'year' ? '10' : '11.5'}
                    fontWeight="700"
                    fill={isHovered ? activeColor : '#334155'}
                  >
                    {val}%
                  </text>
                </g>
              );
            })}
          </g>

          {/* X Axis Labels */}
          {categories.map((cat, idx) => {
            const totalBars = categories.length;
            const availableSlot = plotWidth / totalBars;
            const x = paddingLeft + idx * availableSlot + availableSlot / 2;
            const isHovered = hoveredBar?.idx === idx;

            return (
              <text
                key={idx}
                x={x}
                y={paddingTop + plotHeight + 20}
                textAnchor="middle"
                fontSize={timeframe === 'year' ? '11' : '12'}
                fontWeight={isHovered ? '700' : '600'}
                fill={isHovered ? '#0f172a' : '#64748b'}
              >
                {cat}
              </text>
            );
          })}
        </svg>

        {hoveredBar && (
          <div className="sp-chart-tooltip-floating">
            <strong className="sp-ctt-title">{hoveredBar.label}</strong>
            <div className="sp-ctt-row">
              <span>{selectedSubject} Rate:</span>
              <strong style={{ color: activeColor }}>{hoveredBar.val}%</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render Photo-Accurate Month Bar Chart (5 Columns for Week 1 - 5)
  const renderPhotoAccurateMonthChart = () => {
    const rawValues = singleSubjectBarData.data[selectedSubject]?.month || [];

    // Performance badge & color resolver matching the reference image exactly
    const getMonthPerformance = (weekItem) => {
      const statusType = weekItem?.statusType;
      const rate = weekItem?.rate;

      if (statusType === 'Upcoming') {
        return {
          text: 'Upcoming',
          barColor: '#bfdbfe',
          pillBg: '#dbeafe',
          pillColor: '#1d4ed8',
          pillWidth: 74,
          hasCheck: false,
          isUpcoming: true
        };
      }
      if (statusType === 'No Class') {
        return {
          text: 'No Class',
          barColor: '#cbd5e1',
          pillBg: '#f1f5f9',
          pillColor: '#64748b',
          pillWidth: 70,
          hasCheck: false,
          isNoClass: true
        };
      }
      if (rate >= 90) {
        return {
          text: 'Excellent',
          barColor: '#10b981',
          pillBg: '#dcfce7',
          pillColor: '#15803d',
          pillWidth: 74,
          hasCheck: rate === 100
        };
      }
      if (rate >= 75) {
        return {
          text: 'Good',
          barColor: '#10b981',
          pillBg: '#dcfce7',
          pillColor: '#15803d',
          pillWidth: 54,
          hasCheck: false
        };
      }
      if (rate >= 50) {
        return {
          text: 'Needs Improvement',
          barColor: '#f59e0b',
          pillBg: '#fef3c7',
          pillColor: '#b45309',
          pillWidth: 124,
          hasCheck: false
        };
      }
      if (rate > 0) {
        return {
          text: 'Low',
          barColor: '#f87171',
          pillBg: '#fee2e2',
          pillColor: '#dc2626',
          pillWidth: 46,
          hasCheck: false
        };
      }
      return {
        text: 'Absent',
        barColor: '#64748b',
        pillBg: '#fee2e2',
        pillColor: '#dc2626',
        pillWidth: 60,
        hasCheck: false
      };
    };

    const svgWidth = 840;
    const svgHeight = 350;
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 40;
    const plotHeight = 210;
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const baselineY = paddingTop + plotHeight; // 250

    const getY = (val) => paddingTop + plotHeight - (val / 100) * plotHeight;

    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    const totalCols = 5;
    const slotWidth = plotWidth / totalCols;
    const barWidth = 72;

    return (
      <div className="sp-svg-chart-container sp-month-chart-wrap">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="sp-responsive-chart-svg">
          {/* Subtle horizontal gridlines at 100%, 50%, 25%, 0% */}
          {[100, 50, 25, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={tick === 0 ? '1.2' : '1'}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Target 75% Gridline: RED DASHED LINE with RED 75% tick */}
          <g key="tick-75">
            <line
              x1={paddingLeft}
              y1={getY(75)}
              x2={svgWidth - paddingRight}
              y2={getY(75)}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 10}
              y={getY(75) + 4}
              textAnchor="end"
              fontSize="12.5"
              fontWeight="700"
              fill="#dc2626"
            >
              75%
            </text>
          </g>

          {/* 5 Columns (Week 1 - 5) */}
          <g>
            {weeks.map((weekLabel, idx) => {
              const weekNum = idx + 1;
              const isSelected = selectedMonthWeek === weekNum;
              const weekItem = rawValues[idx] || null;
              const perf = getMonthPerformance(weekItem);
              const slotCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
              const x = slotCenter - barWidth / 2;
              const isHovered = hoveredBar?.idx === idx;

              const hasRate = weekItem && weekItem.hasHeld && weekItem.rate !== null;
              const val = hasRate ? weekItem.rate : 0;
              const isUpcoming = perf.isUpcoming;
              const isNoClass = perf.isNoClass;

              const isZero = !hasRate || val === 0;
              const barHeight = !hasRate ? 6 : (val === 0 ? 6 : (val / 100) * plotHeight);
              const barY = !hasRate || val === 0 ? baselineY - 6 : getY(val);
              const textY = !hasRate || val === 0 ? baselineY - 14 : barY - 10;

              return (
                <g
                  key={idx}
                  className={`sp-month-col-group ${isSelected ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedMonthWeek((prev) => (prev === weekNum ? null : weekNum))}
                  onMouseEnter={() =>
                    setHoveredBar({
                      idx,
                      val: hasRate ? `${val}%` : perf.text,
                      label: `${weekLabel} (${currentMonthLabel})`,
                      statusText: perf.text,
                      barColor: perf.barColor
                    })
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Selection Ring Highlight for clicked week */}
                  {isSelected && (
                    <rect
                      x={x - 3}
                      y={paddingTop - 3}
                      width={barWidth + 6}
                      height={plotHeight + 6}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      rx="21"
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(37,99,235,0.22))' }}
                    />
                  )}

                  {/* Background Track with rounded corners */}
                  <rect
                    x={x}
                    y={paddingTop}
                    width={barWidth}
                    height={plotHeight}
                    fill={isSelected ? '#eff6ff' : '#f8fafc'}
                    rx="18"
                  />

                  {/* Colored Foreground Bar */}
                  <rect
                    x={x}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={perf.barColor}
                    rx={isZero ? '3' : '18'}
                    className="sp-month-animated-bar"
                    style={{
                      transition: 'all 0.25s ease',
                      filter: isHovered ? 'brightness(1.08)' : 'none'
                    }}
                  />

                  {/* Circular Checkmark Badge for 100% Attendance */}
                  {perf.hasCheck && (
                    <g transform={`translate(${slotCenter}, ${baselineY - 36})`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill="#ffffff"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
                      />
                      <path
                        d="M -6 0 L -1.5 4.5 L 6.5 -3.5"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* Percentage label above the bar or dash for upcoming/no class */}
                  <text
                    x={slotCenter}
                    y={textY}
                    textAnchor="middle"
                    fontSize="13.5"
                    fontWeight="800"
                    fill={isSelected ? '#1d4ed8' : (hasRate ? '#0f172a' : '#94a3b8')}
                  >
                    {hasRate ? `${val}%` : '-'}
                  </text>

                  {/* Week label below the baseline */}
                  <text
                    x={slotCenter}
                    y={baselineY + 26}
                    textAnchor="middle"
                    fontSize="13.5"
                    fontWeight={isSelected ? '800' : '700'}
                    fill={isSelected ? '#2563eb' : '#334155'}
                  >
                    {weekLabel}
                  </text>

                  {/* Performance status pill below Week label */}
                  <rect
                    x={slotCenter - perf.pillWidth / 2}
                    y={baselineY + 36}
                    width={perf.pillWidth}
                    height="22"
                    rx="11"
                    fill={perf.pillBg}
                  />
                  <text
                    x={slotCenter}
                    y={baselineY + 51}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={perf.pillColor}
                  >
                    {perf.text}
                  </text>

                  {/* Active selection dot below status pill */}
                  {isSelected && (
                    <circle
                      cx={slotCenter}
                      cy={baselineY + 68}
                      r="3.5"
                      fill="#2563eb"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {hoveredBar && (
          <div className="sp-chart-tooltip-floating">
            <strong className="sp-ctt-title">{hoveredBar.label}</strong>
            <div className="sp-ctt-row">
              <span>{selectedSubject} Rate:</span>
              <strong style={{ color: hoveredBar.barColor }}>
                {typeof hoveredBar.val === 'number' ? `${hoveredBar.val}%` : hoveredBar.val}
              </strong>
            </div>
            {hoveredBar.statusText && (
              <div className="sp-ctt-row" style={{ marginTop: '4px', fontSize: '11px', color: '#cbd5e1' }}>
                <span>Standing:</span>
                <strong style={{ color: '#ffffff' }}>{hoveredBar.statusText}</strong>
              </div>
            )}
          </div>
        )}

        {/* Selected Week Classes Breakdown List Card (Rendered ONLY when a week is selected) */}
        {selectedMonthWeek && selectedWeekDetails && (
          <div className="sp-month-week-log-card">
            <div className="sp-mwl-header">
              <div className="sp-mwl-header-left">
                <div className="sp-mwl-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h4 className="sp-mwl-title">
                    Week {selectedWeekDetails.weekNum} Classes
                  </h4>
                  <span className="sp-mwl-subtitle">
                    {selectedWeekDetails.dateRangeStr} · {selectedSubject === 'All' ? 'Curriculum' : selectedSubject}
                  </span>
                </div>
              </div>

              {selectedWeekDetails.isUpcoming ? (
                <div className="sp-mwl-stats-pill" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <span className="sp-mwl-stat-item" style={{ color: '#1d4ed8' }}>
                    <span className="sp-mwl-dot dot-upcoming" />
                    <strong>Upcoming Week</strong>
                  </span>
                  {selectedWeekDetails.records.length > 0 && (
                    <>
                      <span className="sp-mwl-divider">·</span>
                      <span className="sp-mwl-stat-item" style={{ color: '#1e293b' }}>
                        Scheduled: <strong>{selectedWeekDetails.records.length}</strong>
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="sp-mwl-stats-pill">
                  <span className="sp-mwl-stat-item stat-present">
                    <span className="sp-mwl-dot dot-present" />
                    <strong>{selectedWeekDetails.attendedCount}</strong> Present
                  </span>
                  <span className="sp-mwl-divider">·</span>
                  <span className="sp-mwl-stat-item stat-absent">
                    <span className="sp-mwl-dot dot-absent" />
                    <strong>{selectedWeekDetails.missedCount}</strong> Absent
                  </span>
                  <span className="sp-mwl-divider">·</span>
                  <span className="sp-mwl-stat-item">
                    Total: <strong>{selectedWeekDetails.records.length}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="sp-log-rows-wrap sp-mwl-rows-wrap">
              {selectedWeekDetails.records.length === 0 ? (
                <div className="sp-mwl-empty-state">
                  <div className="sp-mwl-empty-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <p className="sp-mwl-empty-text">
                    {selectedWeekDetails.isUpcoming
                      ? `Upcoming week – Classes will be recorded as scheduled`
                      : `No ${selectedSubject === 'All' ? '' : `${selectedSubject} `}classes recorded for Week ${selectedWeekDetails.weekNum}`}
                  </p>
                  <span className="sp-mwl-empty-sub">({selectedWeekDetails.dateRangeStr})</span>
                </div>
              ) : (
                selectedWeekDetails.records.map((item, idx) => {
                  const isPresent = item.status === 'Present';
                  const isUpcoming = item.status === 'Upcoming';
                  return (
                    <div key={item.id || idx} className="sp-log-row-clean">
                      <div className="sp-log-date-col">
                        <strong>{item.dayNum} {item.monthShort}</strong>
                        <span>{item.dayName}</span>
                      </div>
                      <div className="sp-log-info-col">
                        <span className="sp-log-topic-title">{item.topic}</span>
                        <span className="sp-log-time-sub">{item.time}</span>
                      </div>
                      <div className="sp-log-status-col">
                        <span className={`sp-status-tag ${isPresent ? 'tag-present' : isUpcoming ? 'tag-upcoming' : 'tag-absent'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render Photo-Accurate Year Circular Dial Chart (12 Months Jan - Dec in clock order)
  const renderPhotoAccurateYearChart = () => {
    const yearMonths = singleSubjectBarData.data[selectedSubject]?.year || [];

    // Calculate annual statistics
    const totalHeldInYear = yearMonths.reduce((sum, m) => sum + (m.totalHeld || 0), 0);
    const totalAttendedInYear = yearMonths.reduce((sum, m) => sum + (m.totalAttended || 0), 0);
    const overallYearRate = totalHeldInYear > 0
      ? Math.round((totalAttendedInYear / totalHeldInYear) * 100)
      : (liveAttendance?.attendance_percentage ?? 0);

    const goodMonthsCount = yearMonths.filter((m) => m.hasData && (m.rate ?? 0) >= 75).length;

    // Determine Best Month (highest rate with hasData)
    let bestMonthIdx = -1;
    let maxRate = -1;
    yearMonths.forEach((m) => {
      if (m.hasData && m.rate !== null && m.rate > maxRate) {
        maxRate = m.rate;
        bestMonthIdx = m.monthIdx;
      }
    });

    const svgWidth = 880;
    const svgHeight = 650;
    const cx = 440;
    const cy = 325;
    const R_orbit = 225;
    const nodeR = 32;
    const R_gauge = 104;
    const gaugeStroke = 14;
    const gaugeCircumference = 2 * Math.PI * R_gauge;

    // Dynamically resolve rate, text and stats for selected month or overall year
    const activeSelectedMonth = selectedYearMonth !== null ? yearMonths[selectedYearMonth] : null;

    const displayRate = activeSelectedMonth
      ? (activeSelectedMonth.hasData && activeSelectedMonth.rate !== null ? activeSelectedMonth.rate : 0)
      : overallYearRate;

    const displayRateText = activeSelectedMonth
      ? (activeSelectedMonth.hasData && activeSelectedMonth.rate !== null ? `${activeSelectedMonth.rate}%` : '-')
      : `${overallYearRate}%`;

    const displayLabel1 = activeSelectedMonth ? activeSelectedMonth.monthFull : 'Overall';
    const displayLabel2 = 'Attendance';

    const displaySub1 = activeSelectedMonth
      ? (activeSelectedMonth.hasData ? `${activeSelectedMonth.totalAttended} / ${activeSelectedMonth.totalHeld} classes` : 'No classes held')
      : `${goodMonthsCount} / 12 months`;

    const displaySub2 = activeSelectedMonth
      ? (activeSelectedMonth.hasData ? (activeSelectedMonth.rate >= 75 ? 'Good Standing' : activeSelectedMonth.rate >= 50 ? 'Average' : 'Low Attendance') : `${currentYear}`)
      : '≥ 75%';

    const arcColor = displayRate >= 75 ? '#10b981' : displayRate >= 50 ? '#f59e0b' : displayRate > 0 ? '#ef4444' : '#10b981';
    const gaugeProgress = ((displayRate || 0) / 100) * gaugeCircumference;

    return (
      <div className="sp-year-dial-container">
        {/* Desktop Clock Dial View (Shown on screens > 768px) */}
        <div className="sp-year-dial-desktop-wrap">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="sp-year-dial-svg">
          <defs>
            {/* Premium elevation drop shadows */}
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.04" />
            </filter>

            <filter id="nodeHoverShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="7" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.16" />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>

            <filter id="centerDiscShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>

            {/* Subtle radial pastel gradients for rich tactile depth */}
            <radialGradient id="nodeGradGood" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#f0fdf4" />
              <stop offset="100%" stopColor="#dcfce7" />
            </radialGradient>

            <radialGradient id="nodeGradWarning" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#fffbeb" />
              <stop offset="100%" stopColor="#fef3c7" />
            </radialGradient>

            <radialGradient id="nodeGradDanger" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#fef2f2" />
              <stop offset="100%" stopColor="#fee2e2" />
            </radialGradient>

            <radialGradient id="nodeGradNoData" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </radialGradient>
          </defs>

          {/* 1. Orbit Dashed Ring connecting the 12 month nodes */}
          <circle
            cx={cx}
            cy={cy}
            r={R_orbit}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.6"
            strokeDasharray="4 6"
          />

          {/* 2. Center Gauge: Background Track */}
          <circle
            cx={cx}
            cy={cy}
            r={R_gauge}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={gaugeStroke}
          />

          {/* 3. Center Gauge: Active Green Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={R_gauge}
            fill="none"
            stroke={arcColor}
            strokeWidth={gaugeStroke}
            strokeLinecap="round"
            strokeDasharray={`${gaugeProgress} ${gaugeCircumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease' }}
          />

          {/* 4. Center Inner Circle with Elevation Shadow */}
          <g
            style={{ cursor: selectedYearMonth !== null ? 'pointer' : 'default' }}
            onClick={() => {
              if (selectedYearMonth !== null) {
                setSelectedYearMonth(null);
              }
            }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={R_gauge - gaugeStroke / 2 - 4}
              fill="#ffffff"
              filter="url(#centerDiscShadow)"
            />
            <text
              x={cx}
              y={cy - 24}
              textAnchor="middle"
              fontSize="36"
              fontWeight="800"
              fill={activeSelectedMonth && !activeSelectedMonth.hasData ? '#94a3b8' : '#0f172a'}
            >
              {displayRateText}
            </text>
            <text
              x={cx}
              y={cy - 1}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill={activeSelectedMonth ? '#2563eb' : '#64748b'}
            >
              {displayLabel1}
            </text>
            <text
              x={cx}
              y={cy + 15}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#64748b"
            >
              {displayLabel2}
            </text>
            <text
              x={cx}
              y={cy + 36}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#1e293b"
            >
              {displaySub1}
            </text>
            <text
              x={cx}
              y={cy + 51}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="600"
              fill={activeSelectedMonth && activeSelectedMonth.hasData ? (activeSelectedMonth.rate >= 75 ? '#15803d' : activeSelectedMonth.rate >= 50 ? '#b45309' : '#dc2626') : '#64748b'}
            >
              {displaySub2}
            </text>
          </g>

          {/* 5. The 12 Month Nodes in Clockwise Order (Jan at 12 o'clock ... Dec at 11 o'clock) */}
          <g>
            {yearMonths.map((m, idx) => {
              const angleDeg = -90 + idx * 30;
              const angleRad = (angleDeg * Math.PI) / 180;
              const nodeX = cx + R_orbit * Math.cos(angleRad);
              const nodeY = cy + R_orbit * Math.sin(angleRad);

              // Colors & Gradients based on attendance standing
              let nodeColor = '#94a3b8';
              let bgGradId = 'nodeGradNoData';
              let statusLabel = 'No Data';

              if (m.hasData && m.rate !== null) {
                if (m.rate >= 75) {
                  nodeColor = '#10b981'; // Green
                  bgGradId = 'nodeGradGood';
                  statusLabel = 'Good (≥ 75%)';
                } else if (m.rate >= 50) {
                  nodeColor = '#f59e0b'; // Amber
                  bgGradId = 'nodeGradWarning';
                  statusLabel = '50% - 74%';
                } else {
                  nodeColor = '#ef4444'; // Red
                  bgGradId = 'nodeGradDanger';
                  statusLabel = '< 50%';
                }
              }

              const circ = 2 * Math.PI * nodeR;
              const arcLength = m.hasData && m.rate !== null ? (m.rate / 100) * circ : 0;
              const isHovered = hoveredBar?.idx === idx && hoveredBar?.isYear;

              // Positioning label outside node with comfortable clearance
              const ux = Math.cos(angleRad);
              const uy = Math.sin(angleRad);
              let labelAnchor = 'middle';
              let labelX = nodeX + ux * (nodeR + 15);
              let labelY = nodeY + uy * (nodeR + 14) + 4;

              if (idx === 0) { // Jan (Top)
                labelAnchor = 'middle';
                labelX = nodeX;
                labelY = nodeY - nodeR - 12;
              } else if (idx === 6) { // Jul (Bottom)
                labelAnchor = 'middle';
                labelX = nodeX;
                labelY = nodeY + nodeR + 20;
              } else if (idx === 3) { // Apr (Right)
                labelAnchor = 'start';
                labelX = nodeX + nodeR + 14;
                labelY = nodeY + 5;
              } else if (idx === 9) { // Oct (Left)
                labelAnchor = 'end';
                labelX = nodeX - nodeR - 14;
                labelY = nodeY + 5;
              } else {
                labelAnchor = ux > 0.25 ? 'start' : ux < -0.25 ? 'end' : 'middle';
                labelX = nodeX + ux * (nodeR + 14);
                labelY = nodeY + uy * (nodeR + 12) + (uy > 0 ? 14 : -6);
              }

              const isSelected = selectedYearMonth === idx;

              return (
                <g
                  key={idx}
                  className={`sp-year-node-group ${isSelected ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedYearMonth((prev) => (prev === idx ? null : idx))}
                  onMouseEnter={() =>
                    setHoveredBar({
                      idx,
                      isYear: true,
                      val: m.hasData ? m.rate : null,
                      label: `${m.monthFull} ${currentYear}`,
                      statusText: statusLabel,
                      barColor: nodeColor,
                      attended: m.totalAttended,
                      total: m.totalHeld,
                      hasData: m.hasData
                    })
                  }
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Selection Ring Highlight for clicked month */}
                  {isSelected && (
                    <circle
                      cx={nodeX}
                      cy={nodeY}
                      r={nodeR + 6}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.8"
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.32))' }}
                    />
                  )}

                  {/* Circular Node Background with soft radial tint & premium shadow */}
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={nodeR}
                    fill={`url(#${bgGradId})`}
                    filter={isHovered ? 'url(#nodeHoverShadow)' : 'url(#nodeShadow)'}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />

                  {/* Outer delicate ring track */}
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={nodeR}
                    fill="none"
                    stroke={m.hasData ? '#f1f5f9' : '#e2e8f0'}
                    strokeWidth={m.hasData ? '3.5' : '2'}
                  />

                  {/* Colored progress arc around node */}
                  {m.hasData && m.rate !== null && (
                    <circle
                      cx={nodeX}
                      cy={nodeY}
                      r={nodeR}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      strokeDasharray={`${arcLength} ${circ}`}
                      transform={`rotate(-90 ${nodeX} ${nodeY})`}
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                  )}

                  {/* Small Calendar Icon inside node */}
                  <g transform={`translate(${nodeX - 7.5}, ${nodeY - 17})`}>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={m.hasData ? nodeColor : '#94a3b8'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                    </svg>
                  </g>

                  {/* Rate / Dash percentage inside node */}
                  <text
                    x={nodeX}
                    y={nodeY + 13}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="800"
                    fill={m.hasData ? '#0f172a' : '#94a3b8'}
                  >
                    {m.hasData ? `${m.rate}%` : '-'}
                  </text>

                  {/* Month Label outside node */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={labelAnchor}
                    fontSize={isSelected ? '14' : '13'}
                    fontWeight={isSelected ? '800' : '700'}
                    fill={isSelected ? '#2563eb' : '#1e293b'}
                  >
                    {m.monthShort}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 6. Dedicated '👑 Best Month' Tag Layer (Rendered on top with zero clipping) */}
          {bestMonthIdx >= 0 && maxRate > 0 && (() => {
            const bAngleDeg = -90 + bestMonthIdx * 30;
            const bAngleRad = (bAngleDeg * Math.PI) / 180;
            const bNodeX = cx + R_orbit * Math.cos(bAngleRad);
            const bNodeY = cy + R_orbit * Math.sin(bAngleRad);

            const pillW = 116;
            const pillH = 28;
            const isLeft = bNodeX <= cx;
            // Place outside node circle with 14px clear gap
            const pX = isLeft ? bNodeX - nodeR - pillW - 14 : bNodeX + nodeR + 14;
            const pY = bNodeY - pillH / 2;

            return (
              <g className="sp-year-best-tag" style={{ pointerEvents: 'none' }}>
                <rect
                  x={pX}
                  y={pY}
                  width={pillW}
                  height={pillH}
                  rx="14"
                  fill="#dcfce7"
                  stroke="#86efac"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 6px rgba(16, 185, 129, 0.16))"
                />
                <text
                  x={pX + pillW / 2}
                  y={pY + 18}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#15803d"
                >
                  👑 Best Month
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Mobile Year Performance Hub (Shown on screens <= 768px) */}
      <div className="sp-year-dial-mobile-wrap">
        {/* 1. Central Gauge Summary Card */}
        <div className="sp-year-mobile-summary-card">
          <div className="sp-yms-circle-gauge">
            <svg width="110" height="110" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={arcColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${((displayRate || 0) / 100) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
              />
              <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="800" fill={activeSelectedMonth && !activeSelectedMonth.hasData ? '#94a3b8' : '#0f172a'}>
                {displayRateText}
              </text>
              <text x="60" y="74" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={activeSelectedMonth ? '#2563eb' : '#64748b'}>
                {activeSelectedMonth ? activeSelectedMonth.monthShort : 'Attendance'}
              </text>
            </svg>
          </div>
          <div className="sp-yms-info">
            <h4>
              {activeSelectedMonth
                ? `${activeSelectedMonth.monthFull} ${currentYear}`
                : `${currentYear} Annual Standing`}
            </h4>
            <p className="sp-yms-sub">
              {activeSelectedMonth
                ? (activeSelectedMonth.hasData
                    ? `${activeSelectedMonth.totalAttended} of ${activeSelectedMonth.totalHeld} classes attended`
                    : 'No classes held this month')
                : `${goodMonthsCount} of 12 months with ≥ 75% rate`}
            </p>
            <div className="sp-yms-stats-row">
              <div className="sp-yms-stat">
                <span>Total Held</span>
                <strong>{activeSelectedMonth ? (activeSelectedMonth.totalHeld || 0) : totalHeldInYear}</strong>
              </div>
              <div className="sp-yms-stat">
                <span>Attended</span>
                <strong style={{ color: '#16a34a' }}>
                  {activeSelectedMonth ? (activeSelectedMonth.totalAttended || 0) : totalAttendedInYear}
                </strong>
              </div>
              <div className="sp-yms-stat">
                <span>Missed</span>
                <strong style={{ color: '#ef4444' }}>
                  {activeSelectedMonth
                    ? Math.max(0, (activeSelectedMonth.totalHeld || 0) - (activeSelectedMonth.totalAttended || 0))
                    : Math.max(0, totalHeldInYear - totalAttendedInYear)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 12-Month Touch Matrix Grid (3 cols x 4 rows) */}
        <div className="sp-year-mobile-matrix-header">
          <span>Tap any month to view class log:</span>
        </div>
        <div className="sp-year-mobile-months-grid">
          {yearMonths.map((m, idx) => {
            const isSelected = selectedYearMonth === idx;
            let badgeBg = '#f1f5f9';
            let badgeColor = '#64748b';
            let badgeText = '-';

            if (m.hasData && m.rate !== null) {
              badgeText = `${m.rate}%`;
              if (m.rate >= 75) {
                badgeBg = '#dcfce7';
                badgeColor = '#15803d';
              } else if (m.rate >= 50) {
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
              } else {
                badgeBg = '#fee2e2';
                badgeColor = '#dc2626';
              }
            }

            return (
              <button
                key={m.monthShort}
                type="button"
                className={`sp-ym-grid-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedYearMonth((prev) => (prev === idx ? null : idx))}
              >
                <span className="sp-ym-month-name">{m.monthShort}</span>
                <span className="sp-ym-badge" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

        {/* Hover Tooltip */}
        {hoveredBar && hoveredBar.isYear && (
          <div className="sp-chart-tooltip-floating">
            <strong className="sp-ctt-title">{hoveredBar.label}</strong>
            <div className="sp-ctt-row">
              <span>{selectedSubject} Rate:</span>
              <strong style={{ color: hoveredBar.barColor }}>
                {hoveredBar.hasData ? `${hoveredBar.val}%` : 'No Data'}
              </strong>
            </div>
            {hoveredBar.hasData && (
              <div className="sp-ctt-row" style={{ marginTop: '2px', fontSize: '11px', color: '#cbd5e1' }}>
                <span>Classes:</span>
                <strong>{hoveredBar.attended} of {hoveredBar.total} attended</strong>
              </div>
            )}
            <div className="sp-ctt-row" style={{ marginTop: '4px', fontSize: '11px', color: '#cbd5e1' }}>
              <span>Standing:</span>
              <strong style={{ color: hoveredBar.barColor }}>{hoveredBar.statusText}</strong>
            </div>
          </div>
        )}

        {/* Selected Month Classes Breakdown List Card (Rendered ONLY when a month is selected) */}
        {selectedYearMonth !== null && selectedYearMonthDetails && (
          <div className="sp-month-week-log-card sp-year-month-log-card">
            <div className="sp-mwl-header">
              <div className="sp-mwl-header-left">
                <div className="sp-mwl-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h4 className="sp-mwl-title">
                    {selectedYearMonthDetails.monthFull} {currentYear} Classes
                  </h4>
                  <span className="sp-mwl-subtitle">
                    {selectedYearMonthDetails.dateRangeStr} · {selectedSubject === 'All' ? 'Curriculum' : selectedSubject}
                  </span>
                </div>
              </div>

              <div className="sp-mwl-stats-pill">
                <span className="sp-mwl-stat-item stat-present">
                  <span className="sp-mwl-dot dot-present" />
                  <strong>{selectedYearMonthDetails.attendedCount}</strong> Present
                </span>
                <span className="sp-mwl-divider">·</span>
                <span className="sp-mwl-stat-item stat-absent">
                  <span className="sp-mwl-dot dot-absent" />
                  <strong>{selectedYearMonthDetails.missedCount}</strong> Absent
                </span>
                {selectedYearMonthDetails.upcomingCount > 0 && (
                  <>
                    <span className="sp-mwl-divider">·</span>
                    <span className="sp-mwl-stat-item" style={{ color: '#2563eb' }}>
                      <span className="sp-mwl-dot dot-upcoming" />
                      <strong>{selectedYearMonthDetails.upcomingCount}</strong> Upcoming
                    </span>
                  </>
                )}
                <span className="sp-mwl-divider">·</span>
                <span className="sp-mwl-stat-item">
                  Total: <strong>{selectedYearMonthDetails.records.length}</strong>
                </span>
              </div>
            </div>

            <div className="sp-log-rows-wrap sp-mwl-rows-wrap">
              {selectedYearMonthDetails.records.length === 0 ? (
                <div className="sp-mwl-empty-state">
                  <div className="sp-mwl-empty-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <p className="sp-mwl-empty-text">
                    No {selectedSubject === 'All' ? '' : `${selectedSubject} `}classes recorded for {selectedYearMonthDetails.monthFull} {currentYear}
                  </p>
                  <span className="sp-mwl-empty-sub">({selectedYearMonthDetails.dateRangeStr})</span>
                </div>
              ) : (
                selectedYearMonthDetails.records.map((item, idx) => {
                  const isPresent = item.status === 'Present';
                  return (
                    <div key={item.id || idx} className="sp-log-row-clean">
                      <div className="sp-log-date-col">
                        <strong>{item.dayNum} {item.monthShort}</strong>
                        <span>{item.dayName}</span>
                      </div>
                      <div className="sp-log-info-col">
                        <span className="sp-log-topic-title">{item.topic}</span>
                        <span className="sp-log-time-sub">{item.time}</span>
                      </div>
                      <div className="sp-log-status-col">
                        <span className={`sp-status-tag ${isPresent ? 'tag-present' : item.status === 'Upcoming' ? 'tag-upcoming' : 'tag-absent'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render the Photo-Accurate Week Cards (Monday to Sunday)
  const renderWeekCardsView = () => {
    const subjectDisplayName = selectedSubject === 'All' ? 'Curriculum' : selectedSubject;

    return (
      <div className="sp-week-cards-grid">
        {weekCardsData.map((dayItem, idx) => {
          const { shortName, dayNum, monthShort, statusType, hasSession, classesCount, timeRange, teacher } = dayItem;

          // Card theme classes
          let cardThemeClass = 'theme-noclass';
          let badgeIcon = null;
          let pillText = 'No Class';

          if (statusType === 'Present') {
            cardThemeClass = 'theme-present';
            pillText = 'Present';
            badgeIcon = (
              <div className="sp-wc-circle-icon icon-present">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            );
          } else if (statusType === 'Absent') {
            cardThemeClass = 'theme-absent';
            pillText = 'Absent';
            badgeIcon = (
              <div className="sp-wc-circle-icon icon-absent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            );
          } else if (statusType === 'Upcoming') {
            cardThemeClass = 'theme-upcoming';
            pillText = 'Upcoming';
            badgeIcon = (
              <div className="sp-wc-circle-icon icon-upcoming">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            );
          } else if (statusType === 'Holiday') {
            cardThemeClass = 'theme-holiday';
            pillText = 'Holiday';
            badgeIcon = (
              <div className="sp-wc-circle-icon icon-holiday">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                </svg>
              </div>
            );
          } else {
            // No Class
            cardThemeClass = 'theme-noclass';
            pillText = 'No Class';
            badgeIcon = (
              <div className="sp-wc-circle-icon icon-noclass">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            );
          }

          return (
            <div key={idx} className={`sp-week-day-card ${cardThemeClass}`}>
              {/* Day & Date Header */}
              <div className="sp-wc-head">
                <span className="sp-wc-day-name">{shortName}</span>
                <span className="sp-wc-day-date">{dayNum} {monthShort}</span>
              </div>

              {/* Status Badge with Circle & Pill */}
              <div className="sp-wc-status-wrap">
                {badgeIcon}
                <span className={`sp-wc-status-pill pill-${statusType.toLowerCase().replace(/\s+/g, '')}`}>
                  {pillText}
                </span>
              </div>

              {/* Content / Class Schedule */}
              <div className="sp-wc-body">
                {hasSession && (statusType === 'Present' || statusType === 'Absent' || statusType === 'Upcoming') ? (
                  <div className="sp-wc-class-info">
                    <div className="sp-wc-class-count">
                      <span className="sp-wc-book-icon">📖</span>
                      <span>{classesCount} {classesCount > 1 ? 'Classes' : 'Class'}</span>
                    </div>

                    {timeRange ? (
                      <div className="sp-wc-detail-row">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="sp-wc-detail-text">{timeRange}</span>
                      </div>
                    ) : null}

                    {teacher ? (
                      <div className="sp-wc-detail-row">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="sp-wc-detail-text">{teacher}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="sp-wc-empty-state">
                    <div className="sp-wc-cal-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                        <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                        <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <p className="sp-wc-empty-text">No {subjectDisplayName} class scheduled</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="sp-view-container sp-analysis-page">
      {/* ========================================================================= */}
      {/* 1. CONTROLS STRIP: TIMEFRAME & SUBJECT DROPDOWN                           */}
      {/* ========================================================================= */}
      <div className="sp-analysis-controls-strip">
        <button
          className="sp-analysis-back-btn"
          onClick={onBack}
          title="Return to Classes & Attendance"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Classes & Attendance
        </button>

        <div className="sp-analysis-filters-cluster">
          {/* Week, Month, Year Filter */}
          <div className="sp-analysis-time-selector">
            <button
              className={`sp-time-pill ${timeframe === 'week' ? 'active' : ''}`}
              onClick={() => { setTimeframe('week'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Week
            </button>
            <button
              className={`sp-time-pill ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => { setTimeframe('month'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
              </svg>
              Month
            </button>
            <button
              className={`sp-time-pill ${timeframe === 'year' ? 'active' : ''}`}
              onClick={() => { setTimeframe('year'); setHoveredSlice(null); setHoveredBar(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Year
            </button>
          </div>

          {/* Subject Dropdown Filter */}
          <div className="sp-subject-dropdown-wrap" ref={dropdownRef}>
            <button
              className={`sp-subject-dropdown-btn ${subjectDropdownOpen ? 'open' : ''}`}
              onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
              title="Click to Choose Subject"
            >
              <span className="sp-sdb-icon">{activeMeta.icon || '📊'}</span>
              <span className="sp-sdb-text">
                {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`sp-sdb-arrow ${subjectDropdownOpen ? 'rotated' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {subjectDropdownOpen && (
              <div className="sp-subject-dropdown-menu">
                <div className="sp-sdm-header">Choose Subject</div>
                {['All', ...availableSubjects].map((subjKey) => {
                  const meta = getSubjectMeta(subjKey);
                  const isSelected = selectedSubject === subjKey;
                  return (
                    <button
                      key={subjKey}
                      className={`sp-sdm-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSubject(subjKey);
                        setSubjectDropdownOpen(false);
                        setHoveredSlice(null);
                        setHoveredBar(null);
                      }}
                    >
                      <span className="sp-sdm-item-icon">{meta.icon}</span>
                      <span className="sp-sdm-item-name">{meta.name}</span>
                      {isSelected && <span className="sp-sdm-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT CARD (PHOTO-ACCURATE WEEK CARDS OR MONTH/YEAR BAR CHART)  */}
      {/* ========================================================================= */}
      <div className="sp-card sp-overall-attendance-card">
        {/* Card Header Row */}
        <div className="sp-box-title-row" style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: activeMeta.bg || '#eff6ff',
                color: activeColor,
                display: 'grid',
                placeItems: 'center',
                fontSize: '18px'
              }}
            >
              {activeMeta.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                {selectedSubject === 'All' ? 'Overall' : selectedSubject} Attendance ({timeframe.toUpperCase()})
              </h3>
              <span className="sp-card-subtitle-small">
                {selectedSubject === 'All'
                  ? `${currentOverview.title} · Subject-wise breakdown and attendance analysis`
                  : `${activeMeta.teacher} · ${activeMeta.code}`}
              </span>
            </div>
          </div>

          {/* Right Header: When 'All', show Overall Rate chip. When single subject & 'week', show Week Navigator & Legend. Otherwise show legend */}
          {selectedSubject === 'All' ? (
            <span className="sp-chip-green" style={{ fontSize: '12px', padding: '4px 12px' }}>
              ● {currentOverview.overallRate}% Overall Attendance
            </span>
          ) : timeframe === 'week' ? (
            <div className="sp-week-header-right">
              {/* Date Range Navigation Pill */}
              <div className="sp-week-nav-pill">
                <button
                  className="sp-wn-btn"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  title="Previous Week"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="sp-wn-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{weekRangeLabel}</span>
                </div>
                <button
                  className="sp-wn-btn"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  title="Next Week"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Status Dot Legend (Present, Absent, Upcoming, No Class, Holiday) */}
              <div className="sp-week-status-legend">
                <span className="sp-wsl-item">
                  <span className="sp-wsl-dot dot-present" />
                  Present
                </span>
                <span className="sp-wsl-item">
                  <span className="sp-wsl-dot dot-absent" />
                  Absent
                </span>
                <span className="sp-wsl-item">
                  <span className="sp-wsl-dot dot-upcoming" />
                  Upcoming
                </span>
                <span className="sp-wsl-item">
                  <span className="sp-wsl-dot dot-noclass" />
                  No Class
                </span>
                <span className="sp-wsl-item">
                  <span className="sp-wsl-dot dot-holiday" />
                  Holiday
                </span>
              </div>
            </div>
          ) : timeframe === 'month' ? (
            <div className="sp-month-header-right">
              {/* Month Navigation Pill */}
              <div className="sp-month-nav-pill">
                <button
                  className="sp-mn-btn"
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  title="Previous Month"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="sp-mn-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                    <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                    <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                  </svg>
                  <span>{currentMonthLabel}</span>
                </div>
                <button
                  className="sp-mn-btn"
                  onClick={() => setMonthOffset((prev) => prev + 1)}
                  title="Next Month"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Legend with Rate and 75% red dashed line */}
              <div className="sp-month-chart-legend">
                <span className="sp-mcl-item">
                  <span className="sp-mcl-dot" style={{ background: '#10b981' }} />
                  {selectedSubject} Rate (%)
                </span>
                <span className="sp-mcl-item sp-mcl-target">
                  <span className="sp-mcl-dashed" />
                  75%
                </span>
              </div>
            </div>
          ) : timeframe === 'year' ? (
            <div className="sp-year-header-right">
              {/* Year Navigation Capsule Pill */}
              <div className="sp-year-nav-pill">
                <button
                  className="sp-yn-btn"
                  onClick={() => setYearOffset((prev) => prev - 1)}
                  title="Previous Year"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="sp-yn-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                    <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                    <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                  </svg>
                  <span>{currentYear}</span>
                </div>
                <button
                  className="sp-yn-btn"
                  onClick={() => setYearOffset((prev) => prev + 1)}
                  title="Next Year"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Year Status Legend */}
              <div className="sp-year-chart-legend">
                <span className="sp-ycl-item">
                  <span className="sp-ycl-dot dot-good" />
                  ≥ 75% (Good)
                </span>
                <span className="sp-ycl-item">
                  <span className="sp-ycl-dot dot-warning" />
                  50% - 74%
                </span>
                <span className="sp-ycl-item">
                  <span className="sp-ycl-dot dot-danger" />
                  &lt; 50%
                </span>
                <span className="sp-ycl-item">
                  <span className="sp-ycl-dot dot-nodata" />
                  No Data
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="sp-chart-legend-box">
                <span className="sp-cl-item">
                  <span className="sp-cl-dot" style={{ background: activeColor }} />
                  {selectedSubject} Rate (%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* View Switch: When 'All' is selected, ALWAYS show Pie Chart & Overall Breakdown. When a specific subject is selected in 'week', show the 7-Day Cards! */}
        {selectedSubject === 'All' ? (
          <div className="sp-overall-grid-2col">
            {/* Left Column: Pie / Donut Chart */}
            <div className="sp-overall-pie-col">
              {renderDonutChart(currentOverview.pieSlices, currentOverview.overallRate)}
            </div>

            {/* Right Column: Top Attended & Less Attended Subjects */}
            <div className="sp-overall-stats-column">
              {currentOverview.topSubject ? (
                <div className="sp-spotlight-card sp-spotlight-green">
                  <div className="sp-spotlight-head">
                    <div className="sp-spotlight-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
                      🏆
                    </div>
                    <div>
                      <span className="sp-spotlight-badge green">TOP ATTENDED SUBJECT</span>
                      <h4 className="sp-spotlight-title">
                        {currentOverview.topSubject.name} — <span style={{ color: '#16a34a' }}>{currentOverview.topSubject.rate}%</span>
                      </h4>
                    </div>
                  </div>
                  <div className="sp-spotlight-body">
                    <p className="sp-spotlight-meta">
                      <strong>{currentOverview.topSubject.attended} of {currentOverview.topSubject.total}</strong> classes attended · {currentOverview.topSubject.teacher}
                    </p>
                    <span className="sp-spotlight-note">{currentOverview.topSubject.note}</span>
                  </div>
                </div>
              ) : null}

              {currentOverview.lessSubject ? (
                <div className="sp-spotlight-card sp-spotlight-amber">
                  <div className="sp-spotlight-head">
                    <div className="sp-spotlight-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                      ⚠️
                    </div>
                    <div>
                      <span className="sp-spotlight-badge amber">LESS ATTENDED SUBJECT</span>
                      <h4 className="sp-spotlight-title">
                        {currentOverview.lessSubject.name} — <span style={{ color: '#d97706' }}>{currentOverview.lessSubject.rate}%</span>
                      </h4>
                    </div>
                  </div>
                  <div className="sp-spotlight-body">
                    <p className="sp-spotlight-meta">
                      <strong>{currentOverview.lessSubject.attended} of {currentOverview.lessSubject.total}</strong> classes attended · {currentOverview.lessSubject.teacher}
                    </p>
                    <span className="sp-spotlight-note">{currentOverview.lessSubject.note}</span>
                  </div>
                </div>
              ) : null}

              {/* Quick Summary Numbers Strip */}
              <div className="sp-summary-mini-strip">
                <div className="sp-sms-item">
                  <span>Total Held</span>
                  <strong>{currentOverview.totalClasses} Classes</strong>
                </div>
                <div className="sp-sms-item">
                  <span>Attended</span>
                  <strong style={{ color: '#16a34a' }}>{currentOverview.attended}</strong>
                </div>
                <div className="sp-sms-item">
                  <span>Missed</span>
                  <strong style={{ color: '#ef4444' }}>{currentOverview.missed}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : timeframe === 'week' ? (
          renderWeekCardsView()
        ) : timeframe === 'month' ? (
          renderPhotoAccurateMonthChart()
        ) : timeframe === 'year' ? (
          renderPhotoAccurateYearChart()
        ) : (
          renderSingleSubjectBarChart()
        )}
      </div>
    </div>
  );
}
