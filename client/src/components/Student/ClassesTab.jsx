import React, { useState } from 'react';
import AttendanceAnalysis from './AttendanceAnalysis';

export default function ClassesTab({ showToast }) {
  const [classesPeriod, setClassesPeriod] = useState('Today');
  const [enteredWeekDay, setEnteredWeekDay] = useState(null);
  const [enteredMonthDate, setEnteredMonthDate] = useState(null);
  const [showAnalysisView, setShowAnalysisView] = useState(false);

  // Subject-wise attendance section states
  const [selectedAttSubject, setSelectedAttSubject] = useState('Physics');
  const [selectedAttDate, setSelectedAttDate] = useState(null);
  const [attStatusFilter, setAttStatusFilter] = useState('All');

  // Week Days Data (Monday 12 Oct to Sunday 18 Oct 2026)
  const weekDaysData = [
    {
      day: 'Monday',
      short: 'Mon',
      date: '12 Oct 2026',
      dateNum: 12,
      isToday: false,
      statusText: '2 Attended · 3 Completed',
      classesCount: 5,
      classes: [
        {
          timeStart: '09:00 AM',
          timeEnd: '10:00 AM',
          barColor: 'sp-bar-blue',
          subject: 'Mathematics',
          topic: 'Algebra & Trigonometry - Problem Solving Session',
          teacher: 'S. Roy Sir',
          room: 'Room 101',
          avatar: 'S',
          avatarBg: '#eff6ff',
          avatarColor: '#2563eb',
          status: 'Attended'
        },
        {
          timeStart: '10:15 AM',
          timeEnd: '11:15 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Kirchhoff’s Laws & Wheatstone Bridge Analysis',
          teacher: 'P. Das Sir',
          room: 'Room 102',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Attended'
        },
        {
          timeStart: '02:00 PM',
          timeEnd: '03:00 PM',
          barColor: 'sp-bar-slate',
          subject: 'Computer',
          topic: 'TCP/IP Model & Network Security Essentials',
          teacher: 'K. Gupta Sir',
          room: 'Lab 2',
          avatar: 'K',
          avatarBg: '#e0f2fe',
          avatarColor: '#0284c7',
          status: 'Attended'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Chemical Bonding & Hybridization Theory',
          teacher: 'A. Sen Sir',
          room: 'Room 101',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Attended'
        },
        {
          timeStart: '05:15 PM',
          timeEnd: '06:15 PM',
          barColor: 'sp-bar-amber',
          subject: 'Biology',
          topic: 'Cell Structure & Function - Revision Class',
          teacher: 'M. Khan Ma\'am',
          room: 'Room 103',
          avatar: 'M',
          avatarBg: '#ffedd5',
          avatarColor: '#ea580c',
          status: 'Attended'
        }
      ]
    },
    {
      day: 'Tuesday',
      short: 'Tue',
      date: '13 Oct 2026',
      dateNum: 13,
      isToday: false,
      statusText: '3 Attended · 1 Missed',
      classesCount: 4,
      classes: [
        {
          timeStart: '10:15 AM',
          timeEnd: '11:15 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Potentiometer & Meter Bridge Practical Problems',
          teacher: 'P. Das Sir',
          room: 'Room 102',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Attended'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Molecular Orbital Theory & Bond Order',
          teacher: 'A. Sen Sir',
          room: 'Room 101',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Absent'
        },
        {
          timeStart: '05:15 PM',
          timeEnd: '06:15 PM',
          barColor: 'sp-bar-amber',
          subject: 'Biology',
          topic: 'Biomolecules - Structure of Proteins & Enzymes',
          teacher: 'M. Khan Ma\'am',
          room: 'Room 103',
          avatar: 'M',
          avatarBg: '#ffedd5',
          avatarColor: '#ea580c',
          status: 'Attended'
        },
        {
          timeStart: '06:30 PM',
          timeEnd: '07:30 PM',
          barColor: 'sp-bar-slate',
          subject: 'Computer',
          topic: 'Python Object-Oriented Programming & Classes',
          teacher: 'K. Gupta Sir',
          room: 'Lab 2',
          avatar: 'K',
          avatarBg: '#e0f2fe',
          avatarColor: '#0284c7',
          status: 'Attended'
        }
      ]
    },
    {
      day: 'Wednesday',
      short: 'Wed',
      date: '14 Oct 2026',
      dateNum: 14,
      isToday: true,
      statusText: '4 Classes Scheduled (Today)',
      classesCount: 4,
      classes: [
        {
          timeStart: '09:00 AM',
          timeEnd: '10:00 AM',
          barColor: 'sp-bar-blue',
          subject: 'Mathematics',
          topic: 'Determinants Properties & Minors Cofactors',
          teacher: 'S. Roy Sir',
          room: 'Room 101',
          avatar: 'S',
          avatarBg: '#eff6ff',
          avatarColor: '#2563eb',
          status: 'Attended'
        },
        {
          timeStart: '10:15 AM',
          timeEnd: '11:15 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Magnetic Effects of Current & Ampere’s Law',
          teacher: 'P. Das Sir',
          room: 'Room 102',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Live'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Electrochemistry - Nernst Equation Numerical',
          teacher: 'A. Sen Sir',
          room: 'Room 101',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Upcoming'
        },
        {
          timeStart: '05:15 PM',
          timeEnd: '06:15 PM',
          barColor: 'sp-bar-amber',
          subject: 'Biology',
          topic: 'Photosynthesis - Light & Dark Reactions',
          teacher: 'M. Khan Ma\'am',
          room: 'Room 103',
          avatar: 'M',
          avatarBg: '#ffedd5',
          avatarColor: '#ea580c',
          status: 'Upcoming'
        }
      ]
    },
    {
      day: 'Thursday',
      short: 'Thu',
      date: '15 Oct 2026',
      dateNum: 15,
      isToday: false,
      statusText: '4 Classes Scheduled',
      classesCount: 4,
      classes: [
        {
          timeStart: '09:00 AM',
          timeEnd: '10:00 AM',
          barColor: 'sp-bar-blue',
          subject: 'Mathematics',
          topic: 'Matrices Inversion & Solution of Linear Systems',
          teacher: 'S. Roy Sir',
          room: 'Room 101',
          avatar: 'S',
          avatarBg: '#eff6ff',
          avatarColor: '#2563eb',
          status: 'Upcoming'
        },
        {
          timeStart: '10:15 AM',
          timeEnd: '11:15 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Moving Coil Galvanometer Sensitivity',
          teacher: 'P. Das Sir',
          room: 'Room 102',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Upcoming'
        },
        {
          timeStart: '02:00 PM',
          timeEnd: '03:00 PM',
          barColor: 'sp-bar-slate',
          subject: 'Computer',
          topic: 'SQL Joins & Group By Aggregations',
          teacher: 'K. Gupta Sir',
          room: 'Lab 2',
          avatar: 'K',
          avatarBg: '#e0f2fe',
          avatarColor: '#0284c7',
          status: 'Upcoming'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Chemical Kinetics - Rate Law & Integrated Equations',
          teacher: 'A. Sen Sir',
          room: 'Room 101',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Upcoming'
        }
      ]
    },
    {
      day: 'Friday',
      short: 'Fri',
      date: '16 Oct 2026',
      dateNum: 16,
      isToday: false,
      statusText: '4 Classes Scheduled',
      classesCount: 4,
      classes: [
        {
          timeStart: '09:00 AM',
          timeEnd: '10:00 AM',
          barColor: 'sp-bar-blue',
          subject: 'Mathematics',
          topic: 'Continuity & Differentiability Core Concepts',
          teacher: 'S. Roy Sir',
          room: 'Room 101',
          avatar: 'S',
          avatarBg: '#eff6ff',
          avatarColor: '#2563eb',
          status: 'Upcoming'
        },
        {
          timeStart: '10:15 AM',
          timeEnd: '11:15 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Electromagnetic Induction & Faraday’s Laws',
          teacher: 'P. Das Sir',
          room: 'Room 102',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Upcoming'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Surface Chemistry & Colloids Classification',
          teacher: 'A. Sen Sir',
          room: 'Room 101',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Upcoming'
        },
        {
          timeStart: '05:15 PM',
          timeEnd: '06:15 PM',
          barColor: 'sp-bar-amber',
          subject: 'Biology',
          topic: 'Plant Growth & Hormones Auxin Cytokinin',
          teacher: 'M. Khan Ma\'am',
          room: 'Room 103',
          avatar: 'M',
          avatarBg: '#ffedd5',
          avatarColor: '#ea580c',
          status: 'Upcoming'
        }
      ]
    },
    {
      day: 'Saturday',
      short: 'Sat',
      date: '17 Oct 2026',
      dateNum: 17,
      isToday: false,
      statusText: '3 Classes & Practical Session',
      classesCount: 3,
      classes: [
        {
          timeStart: '10:15 AM',
          timeEnd: '11:45 AM',
          barColor: 'sp-bar-mint',
          subject: 'Physics',
          topic: 'Optics Lab Practical - Convex Lens & Focal Length',
          teacher: 'P. Das Sir',
          room: 'Physics Lab',
          avatar: 'P',
          avatarBg: '#dcfce7',
          avatarColor: '#16a34a',
          status: 'Upcoming'
        },
        {
          timeStart: '02:00 PM',
          timeEnd: '03:30 PM',
          barColor: 'sp-bar-slate',
          subject: 'Computer',
          topic: 'Python Lab - Data Structures & File Handling',
          teacher: 'K. Gupta Sir',
          room: 'Lab 2',
          avatar: 'K',
          avatarBg: '#e0f2fe',
          avatarColor: '#0284c7',
          status: 'Upcoming'
        },
        {
          timeStart: '04:00 PM',
          timeEnd: '05:30 PM',
          barColor: 'sp-bar-purple',
          subject: 'Chemistry',
          topic: 'Qualitative Salt Analysis Practical Session',
          teacher: 'A. Sen Sir',
          room: 'Chem Lab',
          avatar: 'A',
          avatarBg: '#f3e8ff',
          avatarColor: '#9333ea',
          status: 'Upcoming'
        }
      ]
    },
    {
      day: 'Sunday',
      short: 'Sun',
      date: '18 Oct 2026',
      dateNum: 18,
      isToday: false,
      statusText: 'Unit Test 2 & Special Workshop',
      classesCount: 2,
      classes: [
        {
          timeStart: '10:00 AM',
          timeEnd: '12:00 PM',
          barColor: 'sp-bar-blue',
          subject: 'Mathematics',
          topic: 'Unit Test 2: Algebra, Matrices & Determinants',
          teacher: 'S. Roy Sir',
          room: 'Exam Hall A',
          avatar: 'S',
          avatarBg: '#eff6ff',
          avatarColor: '#2563eb',
          status: 'Upcoming'
        },
        {
          timeStart: '03:00 PM',
          timeEnd: '05:00 PM',
          barColor: 'sp-bar-amber',
          subject: 'Special Workshop',
          topic: 'JEE & Board Problem Solving Masterclass',
          teacher: 'P. Das & A. Sen Sir',
          room: 'Auditorium',
          avatar: 'W',
          avatarBg: '#ffedd5',
          avatarColor: '#ea580c',
          status: 'Upcoming'
        }
      ]
    }
  ];

  // Helper to get day name for October 2026 (Oct 1 is Thursday)
  const getDayNameForDate = (dateNum) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const idx = (dateNum - 1 + 3) % 7;
    return dayNames[idx];
  };

  // Helper to generate full class timetable for any date in October 2026
  const getMonthClassesForDate = (dateNum) => {
    // If it matches one of our week days
    const foundWeekDay = weekDaysData.find((w) => w.dateNum === dateNum);
    if (foundWeekDay) {
      return foundWeekDay.classes;
    }

    const dayName = getDayNameForDate(dateNum);
    const dayIndex = (dateNum - 1 + 3) % 7;
    const baseDay = weekDaysData[dayIndex];

    return baseDay.classes.map((c) => {
      let status = 'Upcoming';
      if (dateNum < 14) {
        // past dates: mostly attended, occasional absent
        const isAbsentDay = [8, 11, 13].includes(dateNum) && (c.subject === 'Chemistry' || c.subject === 'Physics');
        status = isAbsentDay ? 'Absent' : 'Attended';
      } else if (dateNum === 14) {
        status = c.status;
      }
      return {
        ...c,
        status
      };
    });
  };

  // Month Calendar Cells (35 cells: Sep 28-30 muted, Oct 1-31, Nov 1 muted)
  const monthCalendarCells = [
    { num: 28, isCurrentMonth: false, monthName: 'Sep' },
    { num: 29, isCurrentMonth: false, monthName: 'Sep' },
    { num: 30, isCurrentMonth: false, monthName: 'Sep' },
    ...Array.from({ length: 31 }, (_, i) => ({
      num: i + 1,
      isCurrentMonth: true,
      monthName: 'Oct'
    })),
    { num: 1, isCurrentMonth: false, monthName: 'Nov' }
  ];

  // Subject-wise attendance records data
  const subjectAttendanceData = {
    'Physics': {
      name: 'Physics',
      code: 'PHY-102',
      icon: '⚡',
      color: '#10b981',
      lightBg: '#ecfdf5',
      badgeBg: '#dcfce7',
      teacher: 'P. Das Sir',
      room: 'Room 102',
      totalClasses: 25,
      attended: 22,
      missed: 3,
      percentage: 88,
      records: [
        { date: 1, day: 'Thu', topic: 'Electric Charges & Coulomb’s Law', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class & Submitted Assignment' },
        { date: 3, day: 'Sat', topic: 'Electric Field & Field Lines Vector Analysis', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 5, day: 'Mon', topic: 'Gauss’s Law & Continuous Charge Distribution', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class & Solved DPP' },
        { date: 6, day: 'Tue', topic: 'Electric Potential & Equipotential Surfaces', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 7, day: 'Wed', topic: 'Capacitance & Dielectrics in Parallel Plates', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 8, day: 'Thu', topic: 'Energy Stored in Capacitor & Combinations', time: '10:15 AM - 11:15 AM', status: 'Absent', remark: 'Absent (Medical Leave - Notified)' },
        { date: 10, day: 'Sat', topic: 'Current Electricity - Drift Velocity & Ohm’s Law', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 11, day: 'Sun', topic: 'Resistance, Resistivity & Temperature Effect', time: '10:15 AM - 11:15 AM', status: 'Absent', remark: 'Absent (Missed Class)' },
        { date: 12, day: 'Mon', topic: 'Kirchhoff’s Laws & Wheatstone Bridge Analysis', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 13, day: 'Tue', topic: 'Potentiometer & Meter Bridge Practical Problems', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Attended Class' },
        { date: 14, day: 'Wed', topic: 'Magnetic Effects of Current & Ampere’s Law', time: '10:15 AM - 11:15 AM', status: 'Present', remark: 'Ongoing / Today' },
      ]
    },
    'Mathematics': {
      name: 'Mathematics',
      code: 'MTH-101',
      icon: '📐',
      color: '#2563eb',
      lightBg: '#eff6ff',
      badgeBg: '#dbeafe',
      teacher: 'S. Roy Sir',
      room: 'Room 101',
      totalClasses: 25,
      attended: 23,
      missed: 2,
      percentage: 92,
      records: [
        { date: 1, day: 'Thu', topic: 'Relations & Functions - Types & Domain Range', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class' },
        { date: 2, day: 'Fri', topic: 'Equivalence Relations & Bijective Functions', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class' },
        { date: 5, day: 'Mon', topic: 'Inverse Trigonometric Functions Properties', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class & Solved DPP' },
        { date: 7, day: 'Wed', topic: 'Matrices - Multiplication & Symmetric Matrices', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class' },
        { date: 8, day: 'Thu', topic: 'Determinants Properties & Minors Cofactors', time: '09:00 AM - 10:00 AM', status: 'Absent', remark: 'Absent (Medical Leave)' },
        { date: 9, day: 'Fri', topic: 'Cramer’s Rule & Matrix Inversion Method', time: '09:00 AM - 10:00 AM', status: 'Absent', remark: 'Absent (Family Event)' },
        { date: 10, day: 'Sat', topic: 'Adjoint & Inverse of 3x3 Matrices', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class' },
        { date: 12, day: 'Mon', topic: 'Algebra & Trigonometry - Problem Solving Session', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class' },
        { date: 14, day: 'Wed', topic: 'Determinants Properties & Minors Cofactors', time: '09:00 AM - 10:00 AM', status: 'Present', remark: 'Attended Class (Today)' },
      ]
    },
    'Chemistry': {
      name: 'Chemistry',
      code: 'CHM-103',
      icon: '🧪',
      color: '#9333ea',
      lightBg: '#faf5ff',
      badgeBg: '#f3e8ff',
      teacher: 'A. Sen Sir',
      room: 'Room 101',
      totalClasses: 20,
      attended: 17,
      missed: 3,
      percentage: 85,
      records: [
        { date: 2, day: 'Fri', topic: 'Solutions - Raoult’s Law & Ideal Solutions', time: '04:00 PM - 05:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 4, day: 'Sun', topic: 'Colligative Properties & Osmotic Pressure', time: '04:00 PM - 05:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 6, day: 'Tue', topic: 'Electrochemistry - Galvanic & Electrolytic Cells', time: '04:00 PM - 05:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 7, day: 'Wed', topic: 'Nernst Equation & Kohlrausch’s Law Calculations', time: '04:00 PM - 05:00 PM', status: 'Absent', remark: 'Absent (Unwell)' },
        { date: 9, day: 'Fri', topic: 'Chemical Kinetics - Order & Molecularity of Reaction', time: '04:00 PM - 05:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 11, day: 'Sun', topic: 'Arrhenius Equation & Activation Energy Curves', time: '04:00 PM - 05:00 PM', status: 'Absent', remark: 'Absent (Bus Breakdown)' },
        { date: 12, day: 'Mon', topic: 'Chemical Bonding & Hybridization Theory', time: '04:00 PM - 05:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 13, day: 'Tue', topic: 'Molecular Orbital Theory & Bond Order', time: '04:00 PM - 05:00 PM', status: 'Absent', remark: 'Absent (Special Leave)' },
      ]
    },
    'Biology': {
      name: 'Biology',
      code: 'BIO-104',
      icon: '🧬',
      color: '#ea580c',
      lightBg: '#fff7ed',
      badgeBg: '#ffedd5',
      teacher: 'M. Khan Ma\'am',
      room: 'Room 103',
      totalClasses: 20,
      attended: 19,
      missed: 1,
      percentage: 95,
      records: [
        { date: 2, day: 'Fri', topic: 'Cell: The Unit of Life - Fluid Mosaic Model', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 4, day: 'Sun', topic: 'Cell Division - Mitosis Stages & Cytokinesis', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 6, day: 'Tue', topic: 'Biomolecules - Structure of Proteins & Enzymes', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 8, day: 'Thu', topic: 'Photosynthesis - Pigment Systems & Light Reaction', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 9, day: 'Fri', topic: 'Calvin Cycle & C4 Plant Pathways', time: '05:15 PM - 06:15 PM', status: 'Absent', remark: 'Absent (Late Entry Not Allowed)' },
        { date: 10, day: 'Sat', topic: 'Cell Organelles - Mitochondria & Chloroplast', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 12, day: 'Mon', topic: 'Cell Structure & Function - Revision Class', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
        { date: 13, day: 'Tue', topic: 'Biomolecules - Structure of Proteins & Enzymes', time: '05:15 PM - 06:15 PM', status: 'Present', remark: 'Attended Class' },
      ]
    },
    'Computer': {
      name: 'Computer',
      code: 'CS-105',
      icon: '💻',
      color: '#0284c7',
      lightBg: '#f0f9ff',
      badgeBg: '#e0f2fe',
      teacher: 'K. Gupta Sir',
      room: 'Lab 2',
      totalClasses: 20,
      attended: 18,
      missed: 2,
      percentage: 90,
      records: [
        { date: 1, day: 'Thu', topic: 'Python Data Structures - Lists, Tuples & Slicing', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class & Lab' },
        { date: 3, day: 'Sat', topic: 'Dictionary Comprehension & Custom Functions', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 5, day: 'Mon', topic: 'File Handling - Working with CSV & Text Files', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 7, day: 'Wed', topic: 'Relational Database Concepts & SQL SELECT Queries', time: '02:00 PM - 03:00 PM', status: 'Absent', remark: 'Absent (Medical Checkup)' },
        { date: 8, day: 'Thu', topic: 'SQL Aggregate Functions & GROUP BY Clause', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 10, day: 'Sat', topic: 'Database Normalization - 1NF, 2NF & 3NF Rules', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 11, day: 'Sun', topic: 'Computer Networks - OSI Reference Model Layers', time: '02:00 PM - 03:00 PM', status: 'Absent', remark: 'Absent (Network Outage)' },
        { date: 12, day: 'Mon', topic: 'TCP/IP Model & Network Security Essentials', time: '02:00 PM - 03:00 PM', status: 'Present', remark: 'Attended Class' },
        { date: 13, day: 'Tue', topic: 'Python Object-Oriented Programming & Classes', time: '06:30 PM - 07:30 PM', status: 'Present', remark: 'Attended Class' },
      ]
    }
  };

  const currentSubj = subjectAttendanceData[selectedAttSubject] || subjectAttendanceData['Physics'];
  const recordsByDate = {};
  currentSubj.records.forEach((r) => {
    recordsByDate[r.date] = r;
  });

  let filteredRecords = currentSubj.records;
  if (attStatusFilter !== 'All') {
    filteredRecords = filteredRecords.filter((r) => r.status === attStatusFilter);
  }
  if (selectedAttDate) {
    filteredRecords = filteredRecords.filter((r) => r.date === selectedAttDate);
  }

  // Active week day item for drill-down view
  const activeWeekDayObj = weekDaysData.find((w) => w.day === enteredWeekDay) || weekDaysData[2];

  // Helper to render individual class rows cleanly
  const renderClassRow = (cls, idx, isLast) => (
    <div key={idx} className={`sp-class-v2-row ${isLast ? 'last-row' : ''}`}>
      <div className="sp-c2-time-col">
        <strong>{cls.timeStart}</strong>
        <span>{cls.timeEnd}</span>
      </div>
      <div className={`sp-c2-bar ${cls.barColor || 'sp-bar-blue'}`} />
      <div className="sp-c2-info-col">
        <h4>{cls.subject}</h4>
        <p>{cls.topic}</p>
      </div>
      <div className="sp-c2-teacher-col">
        <div
          className="sp-c2-avatar-circle"
          style={{ background: cls.avatarBg || '#eff6ff', color: cls.avatarColor || '#2563eb' }}
        >
          {cls.avatar || cls.teacher[0]}
        </div>
        <div>
          <strong>{cls.teacher}</strong>
          <span>{cls.room}</span>
        </div>
      </div>
      <div className="sp-c2-status-col">
        {cls.status === 'Attended' && (
          <span className="sp-badge-attended">
            <span className="sp-badge-check">✓</span> Attended
          </span>
        )}
        {cls.status === 'Absent' && (
          <span className="sp-status-tag tag-absent" style={{ fontWeight: 600, padding: '5px 12px' }}>
            ✕ Absent
          </span>
        )}
        {cls.status === 'Live' && (
          <span className="sp-live-badge-pulse" style={{ padding: '4px 10px', fontSize: '12px' }}>
            ● Live Now
          </span>
        )}
        {cls.status === 'Upcoming' && (
          <span className="sp-badge-upcoming">
            🕒 Upcoming
          </span>
        )}
      </div>
    </div>
  );

  if (showAnalysisView) {
    return (
      <AttendanceAnalysis
        onBack={() => setShowAnalysisView(false)}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="sp-view-container sp-classes-view">
      {/* Header with Blue Calendar Icon */}
      <div className="sp-classes-header-row">
        <div className="sp-classes-title-group">
          <div className="sp-classes-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="sp-page-title">Classes & Attendance</h1>
            <p className="sp-page-subtitle">View your class schedule and track your attendance.</p>
          </div>
        </div>

        {/* Dedicated Attendance Analysis Navigation Button */}
        <button
          className="sp-header-analysis-btn"
          onClick={() => setShowAnalysisView(true)}
          title="Open Full Attendance Analysis & Graphs (Week, Month, Year)"
        >
          <span>📊</span> Attendance Analysis
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="sp-metrics-grid-3">
        {/* 1. Classes Attended */}
        <div className="sp-metric-card">
          <div className="sp-metric-icon-box sp-bg-mint">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <polyline points="9 13 11 15 15 11" />
            </svg>
          </div>
          <div className="sp-metric-info">
            <strong className="sp-metric-value">18</strong>
            <span className="sp-metric-label">Classes Attended</span>
            <span className="sp-metric-sub">This Month</span>
          </div>
        </div>

        {/* 2. Classes Missed */}
        <div className="sp-metric-card">
          <div className="sp-metric-icon-box sp-bg-pink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="10" x2="14" y1="12" y2="16" />
              <line x1="14" x2="10" y1="12" y2="16" />
            </svg>
          </div>
          <div className="sp-metric-info">
            <strong className="sp-metric-value">2</strong>
            <span className="sp-metric-label">Classes Missed</span>
            <span className="sp-metric-sub">This Month</span>
          </div>
        </div>

        {/* 3. Attendance Rate (Clickable to open Full Analysis) */}
        <div
          className="sp-metric-card sp-metric-card-clickable"
          onClick={() => setShowAnalysisView(true)}
          title="Click to open Full Attendance Analysis & Graphs (Week, Month, Year)"
        >
          <div className="sp-metric-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <svg width="30" height="30" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="90, 100"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="sp-metric-info" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong className="sp-metric-value">90%</strong>
              <span className="sp-metric-action-tag">Analysis ↗</span>
            </div>
            <span className="sp-metric-label">Attendance Rate</span>
            <span className="sp-metric-sub">Click for Week/Month/Year Graphs</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Date Switcher Strip */}
      <div className="sp-classes-filter-bar">
        {/* Segmented Filter Pills */}
        <div className="sp-segmented-pills">
          {['Today', 'This Week', 'This Month'].map((tab) => (
            <button
              key={tab}
              className={`sp-seg-pill ${classesPeriod === tab ? 'active' : ''}`}
              onClick={() => {
                setClassesPeriod(tab);
                setEnteredWeekDay(null);
                setEnteredMonthDate(null);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Context Header for Current Selection */}
        <div className="sp-date-navigator">
          {classesPeriod === 'Today' && (
            <>
              <button className="sp-date-nav-btn" onClick={() => showToast('Viewing Wed, 14 Oct 2026')}>⟨</button>
              <strong className="sp-date-nav-text">Wed, 14 Oct 2026 (Today)</strong>
              <button className="sp-date-nav-btn" onClick={() => showToast('Viewing Wed, 14 Oct 2026')}>⟩</button>
            </>
          )}
          {classesPeriod === 'This Week' && (
            <>
              <strong className="sp-date-nav-text" style={{ padding: '0 8px' }}>
                {enteredWeekDay ? `Viewing: ${enteredWeekDay}` : 'Current Week: 12 Oct – 18 Oct 2026'}
              </strong>
            </>
          )}
          {classesPeriod === 'This Month' && (
            <>
              <strong className="sp-date-nav-text" style={{ padding: '0 8px' }}>
                {enteredMonthDate ? `Viewing: ${enteredMonthDate} Oct 2026` : 'October 2026'}
              </strong>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERIOD VIEW (IN-PLACE REPLACEMENT FOR WEEK & MONTH)                   */}
      {/* ========================================================================= */}

      {/* A. TODAY'S VIEW */}
      {classesPeriod === 'Today' && (
        <div className="sp-card sp-todays-classes-box">
          <div className="sp-box-title-row">
            <div className="sp-box-title-left">
              <div className="sp-title-icon-round" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <h3>Today's Classes</h3>
                <span className="sp-card-subtitle-small">4 scheduled sessions for Wednesday, 14 Oct 2026</span>
              </div>
            </div>
            <span className="sp-live-badge-pulse">● 1 Completed, 1 Live, 2 Upcoming</span>
          </div>

          <div className="sp-classes-v2-list">
            {weekDaysData[2].classes.map((cls, idx, arr) =>
              renderClassRow(cls, idx, idx === arr.length - 1)
            )}
          </div>
        </div>
      )}

      {/* B. THIS WEEK VIEW */}
      {classesPeriod === 'This Week' && (
        <>
          {/* If NOT entered into a day: Show the 7 Day Boxes in a Grid */}
          {!enteredWeekDay ? (
            <div className="sp-week-view-wrapper">
              <div className="sp-week-days-grid">
                {weekDaysData.map((d) => (
                  <div
                    key={d.day}
                    className={`sp-week-day-card ${d.isToday ? 'is-active-day' : ''}`}
                    onClick={() => setEnteredWeekDay(d.day)}
                  >
                    <div className="sp-wd-head">
                      <div>
                        <h4 className="sp-wd-title">{d.day}</h4>
                        <span className="sp-wd-date">{d.date}</span>
                      </div>
                      {d.isToday && <span className="sp-wd-today-pill">TODAY</span>}
                    </div>

                    <div className="sp-wd-body">
                      <p className="sp-wd-status-text">{d.statusText}</p>
                    </div>

                    <div className="sp-wd-footer-row">
                      <span className="sp-wd-class-badge">📚 {d.classesCount} Classes</span>
                      <span className="sp-wd-enter-link">
                        Enter Day →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* When clicked Enter Day: Show That Day's Timetable IN THE SAME PLACE */
            <div className="sp-card sp-todays-classes-box" style={{ marginBottom: '24px' }}>
              <div className="sp-box-title-row" style={{ flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="sp-back-to-grid-btn"
                    onClick={() => setEnteredWeekDay(null)}
                    title="Back to 7 Days Overview"
                  >
                    ← Back to 7 Days
                  </button>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                      {activeWeekDayObj.day} Timetable ({activeWeekDayObj.date})
                    </h3>
                    <span className="sp-card-subtitle-small">
                      {activeWeekDayObj.classes.length} scheduled sessions for {activeWeekDayObj.day}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="sp-live-badge-pulse">● {activeWeekDayObj.statusText}</span>

                  {/* Mini Switcher to quickly jump to another day */}
                  <div className="sp-days-mini-switcher">
                    {weekDaysData.map((d) => (
                      <button
                        key={d.day}
                        className={`sp-mini-day-btn ${enteredWeekDay === d.day ? 'active' : ''}`}
                        onClick={() => setEnteredWeekDay(d.day)}
                        title={`View ${d.day}`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sp-classes-v2-list">
                {activeWeekDayObj.classes.map((cls, idx, arr) =>
                  renderClassRow(cls, idx, idx === arr.length - 1)
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* C. THIS MONTH VIEW */}
      {classesPeriod === 'This Month' && (
        <>
          {/* If NOT entered into a date: Show the 35-Day Month Calendar Grid */}
          {!enteredMonthDate ? (
            <div className="sp-month-calendar-box">
              <div className="sp-mcal-top-bar">
                <div className="sp-mcal-title-wrap">
                  <h3>October 2026 Academic Calendar</h3>
                  <p>Click on any date to inspect its class timetable</p>
                </div>
                <div className="sp-mcal-legend">
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#10b981' }} /> Attended
                  </div>
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#ef4444' }} /> Missed
                  </div>
                  <div className="sp-mcal-legend-item">
                    <span className="sp-mcal-dot" style={{ background: '#2563eb' }} /> Scheduled
                  </div>
                </div>
              </div>

              <div className="sp-mcal-grid-container">
                <div className="sp-mcal-header-row">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                    <div key={d} className="sp-mcal-col-header">{d}</div>
                  ))}
                </div>

                <div className="sp-mcal-days-grid">
                  {monthCalendarCells.map((cell, idx) => {
                    if (!cell.isCurrentMonth) {
                      return (
                        <div key={idx} className="sp-mcal-day-cell muted">
                          <div className="sp-mcal-day-top">
                            <span className="sp-mcal-day-number">{cell.num}</span>
                          </div>
                        </div>
                      );
                    }

                    const isToday = cell.num === 14;
                    const classes = getMonthClassesForDate(cell.num);
                    const hasAttended = classes.some((c) => c.status === 'Attended');
                    const hasAbsent = classes.some((c) => c.status === 'Absent');
                    const hasUpcoming = classes.some((c) => c.status === 'Upcoming' || c.status === 'Live');

                    return (
                      <button
                        key={idx}
                        className={`sp-mcal-day-cell ${isToday ? 'is-selected-date' : ''}`}
                        onClick={() => setEnteredMonthDate(cell.num)}
                      >
                        <div className="sp-mcal-day-top">
                          <span className={`sp-mcal-day-number ${isToday ? 'glow-today' : ''}`}>
                            {cell.num}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 700 }}>
                              TODAY
                            </span>
                          )}
                        </div>

                        <div className="sp-mcal-day-classes-preview">
                          <span className="sp-mcal-mini-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            {classes.length} Classes
                          </span>
                          {cell.num === 18 && (
                            <span className="sp-mcal-mini-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                              Unit Test 2
                            </span>
                          )}
                        </div>

                        <div className="sp-mcal-dots-row">
                          {hasAttended && <span className="sp-mcal-dot" style={{ background: '#10b981' }} />}
                          {hasAbsent && <span className="sp-mcal-dot" style={{ background: '#ef4444' }} />}
                          {hasUpcoming && <span className="sp-mcal-dot" style={{ background: '#2563eb' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* When clicked any date: Show That Date's Timetable IN THE SAME PLACE */
            <div className="sp-card sp-todays-classes-box" style={{ marginBottom: '24px' }}>
              <div className="sp-box-title-row" style={{ flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="sp-back-to-grid-btn"
                    onClick={() => setEnteredMonthDate(null)}
                    title="Back to Month Calendar"
                  >
                    ← Back to Calendar
                  </button>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                      {getDayNameForDate(enteredMonthDate)} Timetable ({enteredMonthDate} Oct 2026)
                    </h3>
                    <span className="sp-card-subtitle-small">
                      {getMonthClassesForDate(enteredMonthDate).length} scheduled sessions for this date
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="sp-date-nav-btn"
                    disabled={enteredMonthDate <= 1}
                    onClick={() => setEnteredMonthDate((prev) => Math.max(1, prev - 1))}
                    title="Previous Date"
                  >
                    ⟨
                  </button>
                  <strong className="sp-date-nav-text" style={{ minWidth: '90px', textAlign: 'center' }}>
                    {enteredMonthDate} Oct 2026
                  </strong>
                  <button
                    className="sp-date-nav-btn"
                    disabled={enteredMonthDate >= 31}
                    onClick={() => setEnteredMonthDate((prev) => Math.min(31, prev + 1))}
                    title="Next Date"
                  >
                    ⟩
                  </button>
                </div>
              </div>

              <div className="sp-classes-v2-list">
                {getMonthClassesForDate(enteredMonthDate).map((cls, idx, arr) =>
                  renderClassRow(cls, idx, idx === arr.length - 1)
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBJECT-WISE ATTENDANCE & DATE RECORDS (CLEAN & MINIMALIST)             */}
      {/* ========================================================================= */}
      <div className="sp-card sp-subject-att-card">
        <div className="sp-sub-att-header-simple">
          <div>
            <h3>Subject Attendance</h3>
            <p className="sp-sub-att-desc">Track attended and missed classes by subject</p>
          </div>
          <div className="sp-sub-att-stat-inline">
            <span className="sp-stat-inline-item text-green">● {currentSubj.attended} Present</span>
            <span className="sp-stat-inline-item text-red">● {currentSubj.missed} Absent</span>
            <span className="sp-stat-inline-item text-dark"><strong>{currentSubj.percentage}%</strong> Rate</span>
          </div>
        </div>

        {/* Minimalist Subject Selector Pills */}
        <div className="sp-sub-pills-bar">
          {Object.keys(subjectAttendanceData).map((subjKey) => {
            const subj = subjectAttendanceData[subjKey];
            const isActive = selectedAttSubject === subjKey;
            return (
              <button
                key={subjKey}
                className={`sp-sub-simple-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAttSubject(subjKey);
                  setSelectedAttDate(null);
                }}
              >
                <span className="sp-pill-label">{subj.name}</span>
                <span className="sp-pill-rate">{subj.percentage}%</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Split: Clean Calendar on Left, Class History Table on Right */}
        <div className="sp-sub-split-clean">
          {/* Left: Minimal Calendar */}
          <div className="sp-cal-box-clean">
            <div className="sp-cal-nav-row">
              <strong className="sp-cal-month-title">October 2026</strong>
              <div className="sp-cal-arrows">
                <button className="sp-cal-btn-mini" onClick={() => showToast('September 2026 loaded')}>⟨</button>
                <button className="sp-cal-btn-mini" onClick={() => showToast('November 2026 loaded')}>⟩</button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="sp-cal-clean-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => (
                <div key={i} className="sp-cal-clean-weekday">{dayChar}</div>
              ))}

              {/* Sep 27-30 muted */}
              {[27, 28, 29, 30].map((d) => (
                <div key={`prev-${d}`} className="sp-cal-clean-cell muted">{d}</div>
              ))}

              {/* Oct 1-31 */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const rec = recordsByDate[day];
                const isSelected = selectedAttDate === day;
                const isPresent = rec?.status === 'Present';
                const isAbsent = rec?.status === 'Absent';
                const isToday = day === 14;

                let cellClass = 'sp-cal-clean-cell';
                if (isSelected) cellClass += ' is-selected';
                if (isToday) cellClass += ' is-today';

                return (
                  <button
                    key={`oct-${day}`}
                    className={cellClass}
                    onClick={() => {
                      if (selectedAttDate === day) {
                        setSelectedAttDate(null);
                      } else {
                        setSelectedAttDate(day);
                      }
                    }}
                  >
                    <span className="sp-cal-cell-num">{day}</span>
                    {isPresent && <span className="sp-cal-clean-dot dot-present" />}
                    {isAbsent && <span className="sp-cal-clean-dot dot-absent" />}
                  </button>
                );
              })}
            </div>

            {/* Minimal Legend */}
            <div className="sp-cal-clean-legend">
              <span className="sp-legend-label">
                <i className="sp-dot-indicator dot-present" /> Present ({currentSubj.attended})
              </span>
              <span className="sp-legend-label">
                <i className="sp-dot-indicator dot-absent" /> Absent ({currentSubj.missed})
              </span>
            </div>
          </div>

          {/* Right: Clean Class Log */}
          <div className="sp-log-box-clean">
            <div className="sp-log-nav-row">
              <div className="sp-log-nav-title">
                <h4>{currentSubj.name} Classes</h4>
                <span className="sp-log-teacher-sub">{currentSubj.teacher} · {currentSubj.room}</span>
              </div>

              {/* Clean Status Pills */}
              <div className="sp-log-filter-group">
                <button
                  className={`sp-log-tab ${attStatusFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('All')}
                >
                  All
                </button>
                <button
                  className={`sp-log-tab ${attStatusFilter === 'Present' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('Present')}
                >
                  Present
                </button>
                <button
                  className={`sp-log-tab ${attStatusFilter === 'Absent' ? 'active' : ''}`}
                  onClick={() => setAttStatusFilter('Absent')}
                >
                  Absent
                </button>
              </div>
            </div>

            {selectedAttDate && (
              <div className="sp-date-filter-chip">
                <span>Showing: {selectedAttDate} Oct 2026</span>
                <button onClick={() => setSelectedAttDate(null)}>✕ Reset</button>
              </div>
            )}

            {/* List */}
            <div className="sp-log-rows-wrap">
              {filteredRecords.length === 0 ? (
                <div className="sp-log-empty-clean">
                  No class records for this selection.
                  <button onClick={() => { setAttStatusFilter('All'); setSelectedAttDate(null); }}>
                    Show all
                  </button>
                </div>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isPresent = item.status === 'Present';
                  return (
                    <div key={idx} className="sp-log-row-clean">
                      <div className="sp-log-date-col">
                        <strong>{item.date} Oct</strong>
                        <span>{item.day}</span>
                      </div>
                      <div className="sp-log-info-col">
                        <span className="sp-log-topic-title">{item.topic}</span>
                        <span className="sp-log-time-sub">{item.time}</span>
                      </div>
                      <div className="sp-log-status-col">
                        <span className={`sp-status-tag ${isPresent ? 'tag-present' : 'tag-absent'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
