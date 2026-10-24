import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle2,
  CalendarDays, Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  UserCheck, AlertCircle, Sparkles, Building2, UserCog, MoreVertical,
  X, Check, ArrowRight, ShieldAlert, Edit2, Trash2, Loader2
} from 'lucide-react';
import { apiRequest } from '../../api';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 7, name: 'Sunday', short: 'Sun' }
];

// Helper to format HH:MM:SS or HH:MM into a clean 12-hour AM/PM string
const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${String(formattedH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
};

const formatTimeRangeDisplay = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
};

const getSubjectColor = (subject) => {
  const s = (subject || '').toLowerCase();
  if (s.includes('phys')) return 'teal';
  if (s.includes('math') || s.includes('calc')) return 'violet';
  if (s.includes('chem')) return 'orange';
  if (s.includes('bio')) return 'rose';
  return 'teal';
};

const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1).trim().toLowerCase() === String(id2).trim().toLowerCase();
};

const isSameSubject = (name1, name2) => {
  if (!name1 || !name2) return false;
  return String(name1).trim().toLowerCase() === String(name2).trim().toLowerCase();
};

const getSubjectName = (s) => (typeof s === 'string' ? s : s?.name || '');
const getSubjectTeacherId = (s) => (typeof s === 'object' ? (s?.teacher_id || s?.teacherId || null) : null);

export default function RoutineScheduleView({ batches = [], teachers = [], showToast }) {
  const [subTab, setSubTab] = useState('timetable'); // 'timetable' | 'calendar' | 'today'
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Real Database State
  const [masterRoutines, setMasterRoutines] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Date Navigation State
  const todayObj = new Date();
  const [currentDate, setCurrentDate] = useState(todayObj);
  const todayFormatted = todayObj.toISOString().split('T')[0];

  // Modal Dialog States
  const [activeModal, setActiveModal] = useState(null); // 'auto_generate' | 'add_routine' | 'session_action'
  const [selectedSession, setSelectedSession] = useState(null);

  // Target month for auto generation (default current or next month YYYY-MM)
  const defaultNextMonth = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`;
  const [generateMonth, setGenerateMonth] = useState(defaultNextMonth);

  // New Routine Form State (Initializes clean/blank)
  const [newSlotForm, setNewSlotForm] = useState({
    batchId: '',
    subject: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: ''
  });

  // Action Drawer Form (Reschedule / Substitute / Cancel / Complete)
  const [sessionActionType, setSessionActionType] = useState('reschedule');
  const [actionForm, setActionForm] = useState({
    newDate: todayFormatted,
    newTime: '16:00',
    newEndTime: '17:30',
    substituteTeacherId: teachers[0]?.id || '',
    cancelReason: 'Faculty emergency leave'
  });

  // Current selected batch and its subjects
  const currentBatchObj = useMemo(() => {
    if (!newSlotForm.batchId) return null;
    return batches.find(b => b.id === newSlotForm.batchId) || null;
  }, [batches, newSlotForm.batchId]);

  const currentBatchSubjects = useMemo(() => {
    return currentBatchObj?.subjects || [];
  }, [currentBatchObj]);

  // Track active filtering priority ('subject' | 'teacher' | null) for bi-directional synchronization
  const [filterTrigger, setFilterTrigger] = useState('subject');

  // All unique subject names for this batch
  const batchSubjectNames = useMemo(() => {
    if (!newSlotForm.batchId || !currentBatchSubjects) return [];
    const names = [];
    currentBatchSubjects.forEach(s => {
      const n = getSubjectName(s);
      if (n && !names.some(existing => isSameSubject(existing, n))) {
        names.push(n);
      }
    });
    return names;
  }, [newSlotForm.batchId, currentBatchSubjects]);

  // Teachers who are assigned to at least one subject in this batch
  const batchAssignedTeachers = useMemo(() => {
    if (!newSlotForm.batchId || !currentBatchSubjects) return [];
    const assignedIds = currentBatchSubjects
      .map(s => getSubjectTeacherId(s))
      .filter(Boolean);
    const matched = teachers.filter(t =>
      assignedIds.some(id => isSameId(id, t.id))
    );
    return matched.length > 0 ? matched : teachers;
  }, [newSlotForm.batchId, currentBatchSubjects, teachers]);

  // Teachers assigned to the currently selected subject in this batch
  const teachersAssignedToSubject = useMemo(() => {
    if (!newSlotForm.subject) return [];
    const matchingSubjects = currentBatchSubjects.filter(s =>
      isSameSubject(getSubjectName(s), newSlotForm.subject)
    );
    const assignedTeacherIds = matchingSubjects
      .map(s => getSubjectTeacherId(s))
      .filter(Boolean);
    return teachers.filter(t =>
      assignedTeacherIds.some(id => isSameId(id, t.id))
    );
  }, [newSlotForm.subject, currentBatchSubjects, teachers]);

  // Subjects assigned to the currently selected teacher in this batch
  const subjectsAssignedToTeacher = useMemo(() => {
    if (!newSlotForm.teacherId) return [];
    const matchingSubjects = currentBatchSubjects.filter(s =>
      isSameId(getSubjectTeacherId(s), newSlotForm.teacherId)
    );
    const names = [];
    matchingSubjects.forEach(s => {
      const n = getSubjectName(s);
      if (n && !names.some(existing => isSameSubject(existing, n))) {
        names.push(n);
      }
    });
    return names;
  }, [newSlotForm.teacherId, currentBatchSubjects]);

  // Filtered teachers list: only show assigned teachers if subject is active
  const displayedTeachers = useMemo(() => {
    if (filterTrigger === 'subject' && newSlotForm.subject && teachersAssignedToSubject.length > 0) {
      return teachersAssignedToSubject;
    }
    return batchAssignedTeachers;
  }, [filterTrigger, newSlotForm.subject, teachersAssignedToSubject, batchAssignedTeachers]);

  // Filtered subjects list: only show assigned subjects if teacher is active
  const displayedSubjects = useMemo(() => {
    if (filterTrigger === 'teacher' && newSlotForm.teacherId && subjectsAssignedToTeacher.length > 0) {
      return subjectsAssignedToTeacher;
    }
    return batchSubjectNames;
  }, [filterTrigger, newSlotForm.teacherId, subjectsAssignedToTeacher, batchSubjectNames]);

  // When selected batch changes in new slot form, reset subject and teacher cleanly
  const handleBatchSelectInForm = (bId) => {
    setFilterTrigger(null);
    setNewSlotForm(prev => ({
      ...prev,
      batchId: bId,
      subject: '',
      teacherId: ''
    }));
  };

  // 1. When Subject is selected -> Filter Teacher dropdown to ONLY teachers assigned to this subject
  const handleSubjectSelectInForm = (subjectName) => {
    if (!subjectName) {
      setFilterTrigger(null);
      setNewSlotForm(prev => ({
        ...prev,
        subject: '',
        teacherId: ''
      }));
      return;
    }

    setFilterTrigger('subject');
    const batchObj = batches.find(b => b.id === newSlotForm.batchId);
    const bSubjects = batchObj?.subjects || [];
    const matching = bSubjects.filter(s => isSameSubject(getSubjectName(s), subjectName));
    const mappedTeacherIds = matching
      .map(s => getSubjectTeacherId(s))
      .filter(Boolean);

    setNewSlotForm(prev => {
      let nextTeacherId = prev.teacherId;
      if (mappedTeacherIds.length > 0) {
        if (!mappedTeacherIds.some(id => isSameId(id, prev.teacherId))) {
          nextTeacherId = mappedTeacherIds[0];
        }
      } else {
        nextTeacherId = prev.teacherId || teachers[0]?.id || '';
      }
      return {
        ...prev,
        subject: subjectName,
        teacherId: nextTeacherId
      };
    });
  };

  // 2. Vice-Versa: When Teacher is selected -> Filter Subject dropdown to ONLY subjects assigned to this teacher
  const handleTeacherSelectInForm = (teacherId) => {
    if (!teacherId) {
      setFilterTrigger(null);
      setNewSlotForm(prev => ({
        ...prev,
        teacherId: '',
        subject: ''
      }));
      return;
    }

    setFilterTrigger('teacher');
    const batchObj = batches.find(b => b.id === newSlotForm.batchId);
    const bSubjects = batchObj?.subjects || [];
    const matching = bSubjects.filter(s => isSameId(getSubjectTeacherId(s), teacherId));
    const mappedSubjectNames = matching.map(s => getSubjectName(s)).filter(Boolean);

    setNewSlotForm(prev => {
      let nextSubject = prev.subject;
      if (mappedSubjectNames.length > 0) {
        if (!mappedSubjectNames.some(sn => isSameSubject(sn, prev.subject))) {
          nextSubject = mappedSubjectNames[0];
        }
      } else {
        nextSubject = prev.subject || batchSubjectNames[0] || '';
      }
      return {
        ...prev,
        teacherId: teacherId,
        subject: nextSubject
      };
    });
  };

  const openAddRoutineModal = () => {
    setFilterTrigger(null);
    setNewSlotForm({
      batchId: '',
      subject: '',
      teacherId: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: ''
    });
    setActiveModal('add_routine');
  };

  const closeAddRoutineModal = () => {
    setActiveModal(null);
    setFilterTrigger(null);
    setNewSlotForm({
      batchId: '',
      subject: '',
      teacherId: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: ''
    });
  };

  // --------------------------------------------------------------------------
  // API FETCH: 1. Master Weekly Routines (class_routines)
  // --------------------------------------------------------------------------
  const fetchRoutines = useCallback(async () => {
    try {
      setLoadingRoutines(true);
      const url = `/api/admin/routines${selectedBatch !== 'ALL' ? `?batch_id=${selectedBatch}` : ''}`;
      const data = await apiRequest(url);

      const formatted = (data || []).map(r => ({
        id: r.id,
        batchId: r.batch_id,
        batchName: r.batch_name || 'General Batch',
        subject: r.subject,
        teacherId: r.teacher_id,
        teacherName: r.teacher_name || 'Faculty Member',
        teacherSpecialization: r.teacher_specialization || '',
        dayOfWeek: Number(r.day_of_week),
        startTime: r.start_time?.slice(0, 5) || '10:00',
        endTime: r.end_time?.slice(0, 5) || '11:30',
        timeDisplay: formatTimeRangeDisplay(r.start_time, r.end_time),
        color: getSubjectColor(r.subject)
      }));
      setMasterRoutines(formatted);
    } catch (err) {
      console.error('Failed to load class routines:', err);
      if (showToast) showToast('Error', err.message || 'Could not fetch master routines.');
    } finally {
      setLoadingRoutines(false);
    }
  }, [selectedBatch, showToast]);

  // --------------------------------------------------------------------------
  // API FETCH: 2. Concrete Date-wise Sessions (class_sessions)
  // --------------------------------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      let url = `/api/admin/sessions?start_date=${startStr}&end_date=${endStr}`;
      if (selectedBatch !== 'ALL') url += `&batch_id=${selectedBatch}`;
      if (selectedTeacher !== 'ALL') url += `&teacher_id=${selectedTeacher}`;

      const data = await apiRequest(url);

      const formatted = (data || []).map(s => ({
        id: s.id,
        routineId: s.routine_id,
        batchId: s.batch_id,
        batchName: s.batch_name || 'General Batch',
        subject: s.subject,
        teacherId: s.teacher_id,
        teacherName: s.teacher_name || 'Faculty Member',
        teacherSpecialization: s.teacher_specialization || '',
        date: s.session_date,
        startTime: s.start_time?.slice(0, 5) || '10:00',
        endTime: s.end_time?.slice(0, 5) || '11:30',
        timeDisplay: formatTimeRangeDisplay(s.start_time, s.end_time),
        color: getSubjectColor(s.subject),
        status: s.status,
        topicCovered: s.topic_covered || '',
        cancellationReason: s.cancellation_reason || '',
        rescheduledFromId: s.rescheduled_from_id || null,
        attendanceCount: s.attendance_count || { present: 0, absent: 0 }
      }));
      setSessions(formatted);
    } catch (err) {
      console.error('Failed to load class sessions:', err);
      if (showToast) showToast('Error', err.message || 'Could not fetch class sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }, [year, month, daysInMonth, selectedBatch, selectedTeacher, showToast]);

  // Initial load
  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // --------------------------------------------------------------------------
  // AIRTIGHT LIVE CONFLICT AUDIT ENGINE (Master Routine Slot)
  // Prevents teacher double-booking & batch overlap concurrently
  // --------------------------------------------------------------------------
  const conflictAudit = useMemo(() => {
    if (!newSlotForm.teacherId || !newSlotForm.batchId || !newSlotForm.subject || !newSlotForm.startTime || !newSlotForm.endTime) {
      return { hasConflict: false };
    }

    const cleanStart = newSlotForm.startTime;
    const cleanEnd = newSlotForm.endTime;

    // Check 1: Start must be earlier than End
    if (cleanStart >= cleanEnd) {
      return {
        hasConflict: true,
        type: 'INVALID_TIME',
        message: 'Invalid Time Duration: Class start time must be strictly earlier than end time.'
      };
    }

    const teacherObj = teachers.find(t => t.id === newSlotForm.teacherId);
    const teacherName = teacherObj ? (teacherObj.full_name || teacherObj.name) : 'Selected Faculty';
    const batchObj = batches.find(b => b.id === newSlotForm.batchId);
    const batchName = batchObj ? batchObj.name : 'Selected Batch';

    // Check 2: Teacher Conflict on the same day_of_week
    // Formula: existing_start < new_end AND new_start < existing_end
    const teacherClash = masterRoutines.find(r => {
      if (r.teacherId !== newSlotForm.teacherId) return false;
      if (Number(r.dayOfWeek) !== Number(newSlotForm.dayOfWeek)) return false;
      return (r.startTime < cleanEnd && cleanStart < r.endTime);
    });

    if (teacherClash) {
      return {
        hasConflict: true,
        type: 'TEACHER_CLASH',
        message: `Teacher Clash Detected: ${teacherName} is already assigned to "${teacherClash.batchName}" (${teacherClash.subject}) from ${teacherClash.timeDisplay} on this day!`
      };
    }

    // Check 3: Batch Conflict on the same day_of_week
    const batchClash = masterRoutines.find(r => {
      if (r.batchId !== newSlotForm.batchId) return false;
      if (Number(r.dayOfWeek) !== Number(newSlotForm.dayOfWeek)) return false;
      return (r.startTime < cleanEnd && cleanStart < r.endTime);
    });

    if (batchClash) {
      return {
        hasConflict: true,
        type: 'BATCH_CLASH',
        message: `Batch Clash Detected: Batch "${batchName}" already has a class scheduled ("${batchClash.subject}" with ${batchClash.teacherName}) from ${batchClash.timeDisplay} on this day!`
      };
    }

    return { hasConflict: false };
  }, [newSlotForm, masterRoutines, teachers, batches]);

  // --------------------------------------------------------------------------
  // LIVE CONFLICT AUDIT FOR RESCHEDULE / SUBSTITUTE ACTION MODAL
  // --------------------------------------------------------------------------
  const sessionActionConflict = useMemo(() => {
    if (!selectedSession) return { hasConflict: false };

    if (sessionActionType === 'reschedule') {
      const nDate = actionForm.newDate;
      const nStart = actionForm.newTime;
      const nEnd = actionForm.newEndTime;

      if (!nDate || !nStart || !nEnd) return { hasConflict: false };
      if (nStart >= nEnd) {
        return { hasConflict: true, message: 'Start time must be earlier than end time.' };
      }

      // Check if teacher has an overlapping active session on nDate
      const teacherClash = sessions.find(s => {
        if (s.id === selectedSession.id) return false;
        if (s.status === 'CANCELLED') return false;
        if (s.date !== nDate) return false;
        if (s.teacherId !== selectedSession.teacherId) return false;
        return (s.startTime < nEnd && nStart < s.endTime);
      });

      if (teacherClash) {
        return {
          hasConflict: true,
          message: `Faculty clash: ${selectedSession.teacherName} already has '${teacherClash.subject}' (${teacherClash.batchName}) from ${teacherClash.timeDisplay} on ${nDate}.`
        };
      }

      // Check if batch has an overlapping session on nDate
      const batchClash = sessions.find(s => {
        if (s.id === selectedSession.id) return false;
        if (s.status === 'CANCELLED') return false;
        if (s.date !== nDate) return false;
        if (s.batchId !== selectedSession.batchId) return false;
        return (s.startTime < nEnd && nStart < s.endTime);
      });

      if (batchClash) {
        return {
          hasConflict: true,
          message: `Batch clash: "${selectedSession.batchName}" already has '${batchClash.subject}' from ${batchClash.timeDisplay} on ${nDate}.`
        };
      }
    } else if (sessionActionType === 'substitute') {
      const subId = actionForm.substituteTeacherId;
      if (!subId) return { hasConflict: false };
      const subObj = teachers.find(t => t.id === subId);
      const subName = subObj ? (subObj.full_name || subObj.name) : 'Substitute teacher';

      // Check if substitute teacher is already booked on this session date & time
      const subClash = sessions.find(s => {
        if (s.id === selectedSession.id) return false;
        if (s.status === 'CANCELLED') return false;
        if (s.date !== selectedSession.date) return false;
        if (s.teacherId !== subId) return false;
        return (s.startTime < selectedSession.endTime && selectedSession.startTime < s.endTime);
      });

      if (subClash) {
        return {
          hasConflict: true,
          message: `Substitute faculty clash: ${subName} is already conducting '${subClash.subject}' (${subClash.batchName}) from ${subClash.timeDisplay} on this date.`
        };
      }
    }

    return { hasConflict: false };
  }, [selectedSession, sessionActionType, actionForm, sessions, teachers]);

  // --------------------------------------------------------------------------
  // Filters & Today Computation
  // --------------------------------------------------------------------------
  const filteredMasterRoutines = useMemo(() => {
    return masterRoutines.filter(r => {
      if (selectedBatch !== 'ALL' && r.batchId !== selectedBatch) return false;
      if (selectedTeacher !== 'ALL' && r.teacherId !== selectedTeacher) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          r.subject.toLowerCase().includes(query) ||
          r.batchName.toLowerCase().includes(query) ||
          r.teacherName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [masterRoutines, selectedBatch, selectedTeacher, searchTerm]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (selectedBatch !== 'ALL' && s.batchId !== selectedBatch) return false;
      if (selectedTeacher !== 'ALL' && s.teacherId !== selectedTeacher) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          s.subject.toLowerCase().includes(query) ||
          s.batchName.toLowerCase().includes(query) ||
          s.teacherName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [sessions, selectedBatch, selectedTeacher, searchTerm]);

  const todaySessions = useMemo(() => {
    return filteredSessions.filter(s => s.date === todayFormatted);
  }, [filteredSessions, todayFormatted]);

  // --------------------------------------------------------------------------
  // CRUD ACTIONS
  // --------------------------------------------------------------------------

  // 1. Add Master Routine Slot
  const handleAddRoutineSlot = async (e) => {
    e.preventDefault();
    if (conflictAudit.hasConflict) {
      if (showToast) showToast('Schedule Conflict', conflictAudit.message);
      return;
    }

    try {
      setSubmittingAction(true);
      const payload = {
        batch_id: newSlotForm.batchId,
        subject: newSlotForm.subject.trim(),
        teacher_id: newSlotForm.teacherId,
        day_of_week: Number(newSlotForm.dayOfWeek),
        start_time: newSlotForm.startTime,
        end_time: newSlotForm.endTime
      };

      const res = await apiRequest('/api/admin/routines', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const dayName = DAYS_OF_WEEK.find(d => d.id === Number(res.day_of_week))?.name;
      if (showToast) {
        showToast(
          'Routine Slot Created',
          `Added ${res.subject} (${dayName}) to ${res.batch_name || 'batch'}. Schedule synchronized.`
        );
      }
      closeAddRoutineModal();
      await fetchRoutines();
    } catch (err) {
      console.error('Failed to create routine slot:', err);
      if (showToast) showToast('Cannot Add Slot', err.message || 'Server rejected slot.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 2. Delete Master Routine Slot
  const handleDeleteRoutineSlot = async (id, subject, dayOfWeek) => {
    const dayName = DAYS_OF_WEEK.find(d => d.id === dayOfWeek)?.name || 'this day';
    if (!window.confirm(`Are you sure you want to remove weekly recurring class "${subject}" (${dayName}) from master routine?`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/routines/${id}`, { method: 'DELETE' });
      setMasterRoutines(prev => prev.filter(r => r.id !== id));
      if (showToast) {
        showToast('Routine Slot Removed', `Removed ${subject} from master recurring timetable.`);
      }
    } catch (err) {
      console.error('Failed to delete routine slot:', err);
      if (showToast) showToast('Delete Failed', err.message || 'Could not delete slot.');
    }
  };

  // 3. Auto-Generate Month Sessions from Master Routines
  const handleAutoGenerate = async () => {
    try {
      setSubmittingAction(true);
      const res = await apiRequest('/api/admin/sessions/generate', {
        method: 'POST',
        body: JSON.stringify({
          month: generateMonth,
          batch_id: selectedBatch !== 'ALL' ? selectedBatch : null
        })
      });

      setActiveModal(null);
      if (showToast) {
        showToast(
          'Sessions Synchronized',
          res.message || `Generated ${res.generated_count || 0} class sessions without conflicts!`
        );
      }
      await fetchSessions();
    } catch (err) {
      console.error('Failed to auto-generate sessions:', err);
      if (showToast) showToast('Generation Failed', err.message || 'Could not generate sessions.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 4. Session Actions (Reschedule, Substitute, Cancel, Complete)
  const handleApplySessionAction = async () => {
    if (!selectedSession) return;
    if (sessionActionConflict.hasConflict) {
      if (showToast) showToast('Action Conflict', sessionActionConflict.message);
      return;
    }

    try {
      setSubmittingAction(true);
      const payload = {
        action: sessionActionType,
        new_date: sessionActionType === 'reschedule' ? actionForm.newDate : null,
        new_start_time: sessionActionType === 'reschedule' ? actionForm.newTime : null,
        new_end_time: sessionActionType === 'reschedule' ? actionForm.newEndTime : null,
        substitute_teacher_id: sessionActionType === 'substitute' ? actionForm.substituteTeacherId : null,
        cancellation_reason: sessionActionType === 'cancel' ? actionForm.cancelReason : null,
        topic_covered: selectedSession.topicCovered || null
      };

      const res = await apiRequest(`/api/admin/sessions/${selectedSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (showToast) {
        showToast('Session Updated', res.message || 'Class session updated successfully.');
      }
      setActiveModal(null);
      setSelectedSession(null);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to update session:', err);
      if (showToast) showToast('Action Failed', err.message || 'Could not update session.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToday = () => setCurrentDate(new Date());

  // Calendar Day Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon is 0

  return (
    <div className="module-container">
      {/* Module Top Header */}
      <div className="module-header" style={{ marginBottom: 14 }}>
        <div className="module-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            className="button-secondary"
            onClick={() => {
              setGenerateMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
              setActiveModal('auto_generate');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700 }}
          >
            <Sparkles size={16} color="var(--orange)" /> Auto-generate month
          </button>
          <button
            className="button-primary"
            onClick={openAddRoutineModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Plus size={16} /> Add routine slot
          </button>
        </div>
      </div>

      {/* Sub-tabs / View Switcher */}
      <div className="sub-tabs" style={{ marginBottom: 14 }}>
        <button
          className={`sub-tab ${subTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setSubTab('timetable')}
        >
          <CalendarDays size={16} /> 7-Day Master Timetable
          <span className="sub-tab-badge">{masterRoutines.length} slots</span>
        </button>

        <button
          className={`sub-tab ${subTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setSubTab('calendar')}
        >
          <Calendar size={16} /> Monthly Calendar
          <span className="sub-tab-badge">{filteredSessions.length} sessions</span>
        </button>

        <button
          className={`sub-tab ${subTab === 'today' ? 'active' : ''}`}
          onClick={() => setSubTab('today')}
        >
          <Clock size={16} /> Today's Sessions
          <span className="sub-tab-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
            {todaySessions.length} classes
          </span>
        </button>
      </div>

      {/* Filter and Date Controls Toolbar */}
      <div
        className="data-table-toolbar"
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Batch Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--page-bg)',
                color: 'var(--text)'
              }}
            >
              <option value="ALL">All Batches (Centralized)</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Faculty:</span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--page-bg)',
                color: 'var(--text)'
              }}
            >
              <option value="ALL">All Faculty Members</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="data-table-search" style={{ minWidth: 230, height: 38 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search subject or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>

          <button
            onClick={() => {
              fetchRoutines();
              fetchSessions();
            }}
            className="icon-button"
            title="Refresh from server"
            style={{ width: 36, height: 36 }}
          >
            <RefreshCw size={15} className={loadingRoutines || loadingSessions ? 'spinning' : ''} />
          </button>
        </div>

        {/* Date Month Navigator (For Monthly Calendar Grid) */}
        {subTab === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={prevMonth}
              className="icon-button"
              title="Previous Month"
              style={{ width: 34, height: 34 }}
            >
              <ChevronLeft size={18} />
            </button>
            <strong style={{ fontSize: 15.5, minWidth: 140, textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
              {monthName}
            </strong>
            <button
              onClick={nextMonth}
              className="icon-button"
              title="Next Month"
              style={{ width: 34, height: 34 }}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={jumpToday}
              className="button-secondary btn-sm"
              style={{ fontSize: 12, padding: '4px 8px' }}
            >
              This Month
            </button>
          </div>
        )}

        {/* Today's Live Date Header */}
        {subTab === 'today' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <CalendarDays size={18} color="var(--teal)" />
            <strong style={{ color: 'var(--text)', fontFamily: 'Manrope, sans-serif' }}>
              {todayObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: 7-DAY CENTRALIZED MASTER TIMETABLE GRID (Monday - Sunday)     */}
      {/* ==================================================================== */}
      {subTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loadingRoutines && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10, color: 'var(--text-3)' }}>
              <Loader2 size={20} className="spinning" /> Loading recurring schedule...
            </div>
          )}

          {!loadingRoutines && masterRoutines.length === 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px dashed var(--border)',
              borderRadius: 14,
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-3)'
            }}>
              <CalendarDays size={42} color="var(--teal)" style={{ opacity: 0.6, margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>No Recurring Routines Configured</h3>
              <p style={{ maxWidth: 440, margin: '0 auto 16px', fontSize: 13.5, lineHeight: 1.5 }}>
                Master weekly routines serve as the centralized blueprint for all classes. Add your first routine slot to prevent teacher and batch schedule clashes.
              </p>
              <button
                className="button-primary"
                onClick={openAddRoutineModal}
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add First Routine Slot
              </button>
            </div>
          )}

          {/* 7-Day Columns Layout */}
          {!loadingRoutines && masterRoutines.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                alignItems: 'start'
              }}
            >
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = filteredMasterRoutines.filter(r => r.dayOfWeek === day.id);

                return (
                  <div
                    key={day.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 260
                    }}
                  >
                    {/* Day Header */}
                    <div
                      style={{
                        padding: '11px 13px',
                        background: '#f8f9fa',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 15.5, color: 'var(--text)' }}>
                          {day.name}
                        </strong>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>
                        {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                      </span>
                    </div>

                    {/* Day Slots List */}
                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {daySlots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 10px', color: 'var(--text-3)', fontSize: 13.5 }}>
                          No scheduled classes
                        </div>
                      ) : (
                        daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            style={{
                              background: 'var(--page-bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              padding: '11px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              position: 'relative'
                            }}
                          >
                            {/* Time */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={13.5} color="var(--text-3)" /> {slot.timeDisplay}
                              </span>
                            </div>

                            {/* Subject & Batch */}
                            <div>
                              <strong style={{ fontSize: 15.5, color: 'var(--text)', display: 'block' }}>
                                {slot.subject}
                              </strong>
                              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                                {slot.batchName}
                              </span>
                            </div>

                            {/* Faculty & Delete action */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: 6,
                                paddingTop: 8,
                                borderTop: '1px dashed #e2e8f0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: slot.color === 'teal' ? '#dcfce7' : slot.color === 'violet' ? '#f3e8ff' : '#ffedd5',
                                    color: slot.color === 'teal' ? '#15803d' : slot.color === 'violet' ? '#7e22ce' : '#c2410c',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 12,
                                    fontWeight: 800
                                  }}
                                >
                                  {slot.teacherName[0] || 'T'}
                                </span>
                                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)' }}>
                                  {slot.teacherName}
                                </span>
                              </div>

                              <button
                                onClick={() => handleDeleteRoutineSlot(slot.id, slot.subject, slot.dayOfWeek)}
                                style={{ border: 0, background: 'transparent', color: '#94a3b8', padding: 4, cursor: 'pointer', borderRadius: 4 }}
                                title="Delete recurring slot"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MONTHLY CALENDAR GRID (Concrete Date-wise Sessions)           */}
      {/* ==================================================================== */}
      {subTab === 'calendar' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {/* Calendar Weekday Names */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f8f9fa',
              borderBottom: '1px solid var(--border)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 13.5,
              color: 'var(--text-2)',
              padding: '12px 0'
            }}
          >
            {DAYS_OF_WEEK.map(d => (
              <div key={d.id}>{d.name}</div>
            ))}
          </div>

          {loadingSessions && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'var(--text-3)' }}>
              <Loader2 size={20} className="spinning" /> Loading monthly sessions...
            </div>
          )}

          {/* Calendar Day Cells */}
          {!loadingSessions && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                minHeight: 520
              }}
            >
              {/* Blank cells before 1st of month */}
              {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
                <div key={`blank-${idx}`} style={{ background: '#fafbfc', borderRight: '1px solid #edf1f3', borderBottom: '1px solid #edf1f3', minHeight: 100 }} />
              ))}

              {/* Days in current month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const daySessions = filteredSessions.filter(s => s.date === cellDateStr);
                const isCellToday = cellDateStr === todayFormatted;

                return (
                  <div
                    key={dayNum}
                    style={{
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: '8px 9px',
                      minHeight: 105,
                      background: isCellToday ? '#f0fdf9' : 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5
                    }}
                  >
                    {/* Day Number Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: isCellToday ? 800 : 700,
                          width: 25,
                          height: 25,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: isCellToday ? 'var(--teal)' : 'transparent',
                          color: isCellToday ? '#fff' : 'var(--text)'
                        }}
                      >
                        {dayNum}
                      </span>
                      {daySessions.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                          {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
                        </span>
                      )}
                    </div>

                    {/* Sessions on this date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                      {daySessions.map((sess) => {
                        const isCompleted = sess.status === 'COMPLETED';
                        const isCancelled = sess.status === 'CANCELLED';
                        const isRescheduled = sess.status === 'RESCHEDULED';

                        return (
                          <div
                            key={sess.id}
                            onClick={() => {
                              setSelectedSession(sess);
                              setActionForm(prev => ({
                                ...prev,
                                newDate: sess.date,
                                newTime: sess.startTime,
                                newEndTime: sess.endTime,
                                substituteTeacherId: teachers.find(t => t.id !== sess.teacherId)?.id || teachers[0]?.id || ''
                              }));
                              setActiveModal('session_action');
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: 'pointer',
                              background: isCancelled ? '#fee2e2' : isCompleted ? '#f1f5f9' : isRescheduled ? '#ffedd5' : 'var(--teal-soft)',
                              borderLeft: `3px solid ${isCancelled ? '#ef4444' : isCompleted ? '#94a3b8' : isRescheduled ? '#f97316' : 'var(--teal)'}`,
                              color: isCancelled ? '#991b1b' : isCompleted ? '#64748b' : isRescheduled ? '#9a3412' : 'var(--teal-dark)',
                              textDecoration: isCancelled ? 'line-through' : 'none',
                              lineHeight: 1.3
                            }}
                            title={`${sess.subject} (${sess.timeDisplay}) - Click to manage`}
                          >
                            <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sess.subject}
                            </div>
                            <div style={{ fontSize: 10.5, opacity: 0.85 }}>
                              {sess.startTime} · {sess.teacherName.split(' ')[0]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TODAY'S LIVE SESSIONS & ATTENDANCE LEDGER                     */}
      {/* ==================================================================== */}
      {subTab === 'today' && (
        <div>
          {loadingSessions && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'var(--text-3)' }}>
              <Loader2 size={20} className="spinning" /> Checking today's sessions...
            </div>
          )}

          {!loadingSessions && todaySessions.length === 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-3)'
            }}>
              <Clock size={38} color="var(--teal)" style={{ opacity: 0.6, margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: 16.5, color: 'var(--text)', marginBottom: 4 }}>No Classes Scheduled For Today</h3>
              <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto 14px' }}>
                If you have recurring routines set up, click "Auto-generate month" to generate sessions for the active calendar dates.
              </p>
              <button
                className="button-secondary"
                onClick={() => {
                  setGenerateMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
                  setActiveModal('auto_generate');
                }}
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={15} color="var(--orange)" /> Auto-generate sessions
              </button>
            </div>
          )}

          {!loadingSessions && todaySessions.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14
              }}
            >
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 5,
                          textTransform: 'uppercase',
                          background: session.status === 'COMPLETED' ? '#dcfce7' : session.status === 'CANCELLED' ? '#fee2e2' : 'var(--teal-soft)',
                          color: session.status === 'COMPLETED' ? '#15803d' : session.status === 'CANCELLED' ? '#b91c1c' : 'var(--teal-dark)'
                        }}
                      >
                        {session.status}
                      </span>
                      <h3 style={{ margin: '8px 0 3px', fontSize: 16.5, fontFamily: 'Manrope, sans-serif' }}>
                        {session.subject}
                      </h3>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{session.batchName}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                        {session.timeDisplay}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--page-bg)',
                      padding: '10px 14px',
                      borderRadius: 9,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: 12
                        }}
                      >
                        {session.teacherName[0] || 'T'}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 13.5 }}>{session.teacherName}</strong>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                          {session.teacherSpecialization || 'Faculty Member'}
                        </span>
                      </div>
                    </div>

                    {session.topicCovered && (
                      <span style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 180, textAlign: 'right' }}>
                        📖 {session.topicCovered}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
                      <button
                        className="button-primary"
                        onClick={async () => {
                          try {
                            await apiRequest(`/api/admin/sessions/${session.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ action: 'complete' })
                            });
                            if (showToast) showToast('Session Completed', 'Marked as completed.');
                            await fetchSessions();
                          } catch (err) {
                            if (showToast) showToast('Error', err.message);
                          }
                        }}
                        style={{ flex: 1, fontSize: 12.5, padding: '7px 10px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                      >
                        <Check size={15} /> Mark done
                      </button>
                    )}
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('reschedule');
                        setActionForm(prev => ({
                          ...prev,
                          newDate: session.date,
                          newTime: session.startTime,
                          newEndTime: session.endTime
                        }));
                        setActiveModal('session_action');
                      }}
                      style={{ flex: 1, fontSize: 12.5, padding: '7px 10px', height: 'auto' }}
                    >
                      Reschedule
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('substitute');
                        setActionForm(prev => ({
                          ...prev,
                          substituteTeacherId: teachers.find(t => t.id !== session.teacherId)?.id || teachers[0]?.id || ''
                        }));
                        setActiveModal('session_action');
                      }}
                      style={{ fontSize: 12.5, padding: '7px 10px', height: 'auto' }}
                    >
                      Substitute
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionActionType('cancel');
                        setActiveModal('session_action');
                      }}
                      style={{ fontSize: 11.5, padding: '6px 8px', height: 'auto', color: 'var(--rose)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: AUTO-GENERATE NEXT MONTH SESSIONS (Live Sync)               */}
      {/* ==================================================================== */}
      {activeModal === 'auto_generate' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2>Auto-Generate Month Sessions</h2>
                <p>Bulk creates date-wise sessions from the 7-day recurring master timetable.</p>
              </div>
              <button className="icon-button" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <Sparkles size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Automated Conflict-Free Synchronization:</strong>
                  <div style={{ marginTop: 4, lineHeight: 1.45 }}>
                    The system expands all active <code>class_routines</code> across the chosen calendar month, mapping Monday–Sunday automatically without duplicate collisions.
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                  TARGET MONTH & YEAR
                </label>
                <input
                  type="month"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span>Active Master Weekly Routines:</span>
                  <strong>{masterRoutines.length} slots / week</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--teal-dark)' }}>
                  <span>Estimated Sessions to Generate:</span>
                  <strong>~{masterRoutines.length * 4} classes</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setActiveModal(null)} disabled={submittingAction}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleAutoGenerate} disabled={submittingAction}>
                {submittingAction ? <Loader2 size={16} className="spinning" /> : <Check size={16} />}
                Generate & Sync Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD MASTER ROUTINE SLOT (with Live Conflict Checker)        */}
      {/* ==================================================================== */}
      {activeModal === 'add_routine' && (
        <div className="modal-backdrop" onClick={closeAddRoutineModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h2>Add Master Weekly Routine Slot</h2>
                <p>Define recurring weekly schedule with automatic faculty conflict detection.</p>
              </div>
              <button className="icon-button" onClick={closeAddRoutineModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddRoutineSlot} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Live Conflict Warning Box */}
              {conflictAudit.hasConflict && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: 12,
                    borderRadius: 9,
                    color: '#991b1b',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 9
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Scheduling Clash Detected!</strong>
                    <div style={{ marginTop: 3, lineHeight: 1.4 }}>{conflictAudit.message}</div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <label>
                  <span>Select Batch *</span>
                  <select
                    value={newSlotForm.batchId}
                    onChange={(e) => handleBatchSelectInForm(e.target.value)}
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Subject *</span>
                  {!newSlotForm.batchId ? (
                    <select disabled value="" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                      <option value="">Select Batch First</option>
                    </select>
                  ) : batchSubjectNames.length > 0 ? (
                    <select
                      value={newSlotForm.subject}
                      onChange={(e) => handleSubjectSelectInForm(e.target.value)}
                      required
                    >
                      <option value="">Select Subject</option>
                      {displayedSubjects.map((sName, idx) => (
                        <option key={idx} value={sName}>
                          {sName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newSlotForm.subject}
                      onChange={(e) => setNewSlotForm({ ...newSlotForm, subject: e.target.value })}
                      placeholder="Type subject (No subjects in batch)"
                      required
                    />
                  )}
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Assigned Teacher *</span>
                  {!newSlotForm.batchId ? (
                    <select disabled value="" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                      <option value="">Select Batch First</option>
                    </select>
                  ) : (
                    <select
                      value={newSlotForm.teacherId}
                      onChange={(e) => handleTeacherSelectInForm(e.target.value)}
                      required
                    >
                      <option value="">Select Teacher</option>
                      {displayedTeachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.full_name || t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <label>
                  <span>Day of Week *</span>
                  <select
                    value={newSlotForm.dayOfWeek}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, dayOfWeek: Number(e.target.value) })}
                    required
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Start Time *</span>
                  <input
                    type="time"
                    value={newSlotForm.startTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, startTime: e.target.value })}
                    required
                  />
                </label>

                <label>
                  <span>End Time *</span>
                  <input
                    type="time"
                    value={newSlotForm.endTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, endTime: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="modal-footer" style={{ margin: '10px -20px -16px', padding: '14px 20px' }}>
                <button type="button" className="button-secondary" onClick={closeAddRoutineModal} disabled={submittingAction}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={conflictAudit.hasConflict || submittingAction}
                >
                  {submittingAction ? <Loader2 size={16} className="spinning" /> : <Plus size={16} />}
                  Save Master Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SESSION MANAGEMENT (Reschedule / Substitute / Cancel)       */}
      {/* ==================================================================== */}
      {activeModal === 'session_action' && selectedSession && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2>Manage Class Session</h2>
                <p>{selectedSession.subject} · {selectedSession.batchName}</p>
              </div>
              <button className="icon-button" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Conflict warning in Session Action */}
              {sessionActionConflict.hasConflict && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: 10,
                    borderRadius: 8,
                    color: '#991b1b',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8
                  }}
                >
                  <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{sessionActionConflict.message}</div>
                </div>
              )}

              {/* Action tabs */}
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setSessionActionType('reschedule')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '7px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: sessionActionType === 'reschedule' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'reschedule' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'reschedule' ? 'var(--text)' : 'var(--text-3)',
                    cursor: 'pointer'
                  }}
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setSessionActionType('substitute')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '7px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: sessionActionType === 'substitute' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'substitute' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'substitute' ? 'var(--text)' : 'var(--text-3)',
                    cursor: 'pointer'
                  }}
                >
                  Substitute
                </button>
                <button
                  type="button"
                  onClick={() => setSessionActionType('cancel')}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: '7px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: sessionActionType === 'cancel' ? '#fff' : 'transparent',
                    boxShadow: sessionActionType === 'cancel' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                    color: sessionActionType === 'cancel' ? 'var(--rose)' : 'var(--text-3)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Class
                </button>
              </div>

              {/* Current Session Snapshot */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Current Date:</span>
                  <strong>{selectedSession.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Current Time:</span>
                  <strong>{selectedSession.timeDisplay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Assigned Faculty:</span>
                  <strong>{selectedSession.teacherName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Current Status:</span>
                  <span style={{ fontWeight: 700, color: 'var(--teal-dark)' }}>{selectedSession.status}</span>
                </div>
              </div>

              {/* Action Form Inputs */}
              {sessionActionType === 'reschedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                      NEW SESSION DATE
                    </span>
                    <input
                      type="date"
                      value={actionForm.newDate}
                      onChange={(e) => setActionForm({ ...actionForm, newDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)' }}
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        START TIME
                      </span>
                      <input
                        type="time"
                        value={actionForm.newTime}
                        onChange={(e) => setActionForm({ ...actionForm, newTime: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)' }}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        END TIME
                      </span>
                      <input
                        type="time"
                        value={actionForm.newEndTime}
                        onChange={(e) => setActionForm({ ...actionForm, newEndTime: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)' }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {sessionActionType === 'substitute' && (
                <label>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                    SELECT SUBSTITUTE FACULTY
                  </span>
                  <select
                    value={actionForm.substituteTeacherId}
                    onChange={(e) => setActionForm({ ...actionForm, substituteTeacherId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {sessionActionType === 'cancel' && (
                <label>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                    REASON FOR CANCELLATION
                  </span>
                  <textarea
                    rows={3}
                    value={actionForm.cancelReason}
                    onChange={(e) => setActionForm({ ...actionForm, cancelReason: e.target.value })}
                    placeholder="e.g. Faculty medical leave, regional holiday, institute maintenance..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </label>
              )}
            </div>

            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setActiveModal(null)} disabled={submittingAction}>
                Cancel
              </button>
              <button
                className="button-primary"
                onClick={handleApplySessionAction}
                disabled={sessionActionConflict.hasConflict || submittingAction}
              >
                {submittingAction ? <Loader2 size={16} className="spinning" /> : <Check size={16} />}
                Apply Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
