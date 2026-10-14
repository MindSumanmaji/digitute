/**
 * Academic Data Store & Calculation Helpers for DigiTute Teacher Panel
 * Handles shared students roster, grade configurations, attendance records,
 * and exam evaluation persistence.
 */

export const BATCHES = [
  'B.Sc 6th Sem',
  'B.Sc 4th Sem',
  'MCA 2nd Sem',
  'B.Tech CS 3rd Sem',
];

export const BATCH_SUBJECTS_MAP = {
  'B.Sc 6th Sem':      ['Computer Network', 'Operating Systems', 'Database Systems'],
  'B.Sc 4th Sem':      ['DBMS', 'Data Structures', 'Computer Architecture'],
  'MCA 2nd Sem':       ['Software Engineering', 'Computer Graphics', 'Web Technologies'],
  'B.Tech CS 3rd Sem': ['Data Structures', 'Digital Electronics', 'Discrete Mathematics'],
};

export const TODAY_CLASSES = [
  { id: 'cls-1', time: '10:00 A.M', subject: 'Computer Network', batch: 'B.Sc 6th Sem' },
  { id: 'cls-2', time: '12:00 P.M', subject: 'DBMS',             batch: 'B.Sc 4th Sem' },
  { id: 'cls-3', time: '2:00 P.M',  subject: 'Software Engineering', batch: 'MCA 2nd Sem' },
];

/* ──────────────────────────────────────────────────────────────────────────
   20 MOCK STUDENTS — sorted alphabetically
   ────────────────────────────────────────────────────────────────────────── */
export const ALL_STUDENTS = [
  { id: 'st-01', roll: 'CS-01', name: 'Amitava Dutta',    phone: '8240567891', attendance: 'Below Average', attendancePct: 55, grade: 'B'  },
  { id: 'st-02', roll: 'CS-02', name: 'Ananya Ghosh',     phone: '9874561230', attendance: 'Good',          attendancePct: 88, grade: 'A'  },
  { id: 'st-03', roll: 'CS-03', name: 'Arijit Bose',      phone: '9831204567', attendance: 'Excellent',     attendancePct: 93, grade: 'A+' },
  { id: 'st-04', roll: 'CS-04', name: 'Arnab Chatterjee', phone: '7001238945', attendance: 'Average',       attendancePct: 70, grade: 'B+' },
  { id: 'st-05', roll: 'CS-05', name: 'Dev Sen',          phone: '8134236754', attendance: 'Below Average', attendancePct: 58, grade: 'B'  },
  { id: 'st-06', roll: 'CS-06', name: 'Dipankar Mitra',   phone: '9432801256', attendance: 'Good',          attendancePct: 84, grade: 'A'  },
  { id: 'st-07', roll: 'CS-07', name: 'Indrani Das',      phone: '8967453201', attendance: 'Average',       attendancePct: 75, grade: 'B+' },
  { id: 'st-08', roll: 'CS-08', name: 'Kamal Roy',        phone: '9712342367', attendance: 'Average',       attendancePct: 74, grade: 'B+' },
  { id: 'st-09', roll: 'CS-09', name: 'Koushik Nandi',    phone: '9903451278', attendance: 'Excellent',     attendancePct: 97, grade: 'A+' },
  { id: 'st-10', roll: 'CS-10', name: 'Madhuri Haldar',   phone: '7890231456', attendance: 'Good',          attendancePct: 80, grade: 'A'  },
  { id: 'st-11', roll: 'CS-11', name: 'Moumita Saha',     phone: '9674512390', attendance: 'Excellent',     attendancePct: 91, grade: 'A+' },
  { id: 'st-12', roll: 'CS-12', name: 'Nayan Patra',      phone: '8012349876', attendance: 'Below Average', attendancePct: 61, grade: 'B'  },
  { id: 'st-13', roll: 'CS-13', name: 'Priya Sharma',     phone: '9830112456', attendance: 'Excellent',     attendancePct: 94, grade: 'A+' },
  { id: 'st-14', roll: 'CS-14', name: 'Rahul Sen',        phone: '9734253411', attendance: 'Good',          attendancePct: 86, grade: 'A+' },
  { id: 'st-15', roll: 'CS-15', name: 'Ram Das',          phone: '9002324534', attendance: 'Excellent',     attendancePct: 96, grade: 'A'  },
  { id: 'st-16', roll: 'CS-16', name: 'Rohan Paul',       phone: '7003412985', attendance: 'Good',          attendancePct: 82, grade: 'B'  },
  { id: 'st-17', roll: 'CS-17', name: 'Santanu Ghosh',    phone: '9123490012', attendance: 'Average',       attendancePct: 69, grade: 'B+' },
  { id: 'st-18', roll: 'CS-18', name: 'Sneha Mukherjee',  phone: '9123894561', attendance: 'Excellent',     attendancePct: 98, grade: 'A+' },
  { id: 'st-19', roll: 'CS-19', name: 'Sourav Banerjee',  phone: '8910452367', attendance: 'Average',       attendancePct: 72, grade: 'B+' },
  { id: 'st-20', roll: 'CS-20', name: 'Tanmoy Biswas',    phone: '9560123478', attendance: 'Good',          attendancePct: 85, grade: 'A'  },
];

/* Deterministic seeded shuffle — same batch+subject always gives same subset */
function seededShuffle(arr, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getStudentsForCombo(batch, subject) {
  if (!batch || !subject) return [];
  const seed = `${batch}::${subject}`;
  const shuffled = seededShuffle(ALL_STUDENTS, seed);
  const h = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 12 + (h % 5); // 12-16 students
  return shuffled
    .slice(0, count)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ──────────────────────────────────────────────────────────────────────────
   GRADE SYSTEM CONFIGURATION
   ────────────────────────────────────────────────────────────────────────── */
export const GRADE_RULES = [
  { grade: 'A+', min: 90, max: 100, label: 'Outstanding (90% - 100%)',  color: '#7C3AED', bg: '#EDE9FE' },
  { grade: 'A',  min: 80, max: 89.99, label: 'Excellent (80% - 89%)',     color: '#2563EB', bg: '#DBEAFE' },
  { grade: 'B+', min: 70, max: 79.99, label: 'Very Good (70% - 79%)',     color: '#059669', bg: '#D1FAE5' },
  { grade: 'B',  min: 60, max: 69.99, label: 'Good (60% - 69%)',          color: '#D97706', bg: '#FEF3C7' },
  { grade: 'C',  min: 50, max: 59.99, label: 'Average (50% - 59%)',       color: '#EA580C', bg: '#FFEDD5' },
  { grade: 'D',  min: 0,  max: 49.99, label: 'Needs Improvement (< 50%)', color: '#DC2626', bg: '#FEE2E2' },
];

export function calculateGrade(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) return '—';
  const pct = Number(percentage);
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

export function getGradeBadgeStyle(grade) {
  const match = GRADE_RULES.find((r) => r.grade === grade);
  if (match) {
    return { color: match.color, background: match.bg, borderColor: match.color };
  }
  return { color: '#64748B', background: '#F1F5F9', borderColor: '#CBD5E1' };
}

/* ──────────────────────────────────────────────────────────────────────────
   LOCAL STORAGE PERSISTENCE: ATTENDANCE
   ────────────────────────────────────────────────────────────────────────── */
const ATTENDANCE_STORAGE_KEY = 'digitute_attendance_records_v2';

export function getSavedAttendanceRecords() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read attendance records', e);
    return [];
  }
}

export function saveAttendanceSubmission(record) {
  try {
    const existing = getSavedAttendanceRecords();
    const updated = [record, ...existing];
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so other components can refresh live
    window.dispatchEvent(new CustomEvent('digitute_attendance_updated', { detail: record }));
    return true;
  } catch (e) {
    console.error('Failed to save attendance', e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   LOCAL STORAGE PERSISTENCE: EXAM EVALUATIONS
   ────────────────────────────────────────────────────────────────────────── */
const EXAM_STORAGE_KEY = 'digitute_exam_evaluations_v2';

export function getSavedExamEvaluations() {
  try {
    const raw = localStorage.getItem(EXAM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read exam evaluations', e);
    return [];
  }
}

export function saveExamSubmission(examRecord) {
  try {
    const existing = getSavedExamEvaluations();
    const updated = [examRecord, ...existing];
    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so Student Info updates live
    window.dispatchEvent(new CustomEvent('digitute_exams_updated', { detail: examRecord }));
    return true;
  } catch (e) {
    console.error('Failed to save exam evaluation', e);
    return false;
  }
}

/**
 * Returns all exams a student was evaluated in, optionally filtered by batch
 */
export function getStudentExamHistory(studentId, batch = null) {
  const allExams = getSavedExamEvaluations();
  const history = [];

  allExams.forEach((exam) => {
    if (batch && exam.batch !== batch) return;
    const studentEntry = exam.results?.find((r) => r.studentId === studentId);
    if (studentEntry) {
      history.push({
        examId: exam.id,
        examTitle: exam.examTitle || 'Class Exam',
        batch: exam.batch,
        subject: exam.subject,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        obtainedMarks: studentEntry.obtainedMarks,
        isAbsent: studentEntry.isAbsent,
        percentage: studentEntry.percentage,
        grade: studentEntry.grade,
        createdAt: exam.createdAt,
      });
    }
  });

  return history;
}

/**
 * Calculates a student's overall academic grade across all valid exams.
 * If no exams exist yet, falls back to the student's initial profile grade.
 * Excludes exams where student was absent.
 */
export function getStudentOverallPerformance(studentId, batch, initialDefaultGrade = 'B+') {
  const history = getStudentExamHistory(studentId, batch);
  const validEvaluated = history.filter((h) => !h.isAbsent && typeof h.percentage === 'number');

  if (validEvaluated.length === 0) {
    return {
      hasExams: false,
      overallGrade: initialDefaultGrade,
      avgPercentage: null,
      totalExamsCount: history.length,
      evaluatedCount: 0,
      absentCount: history.filter((h) => h.isAbsent).length,
      history,
    };
  }

  const sumPct = validEvaluated.reduce((sum, item) => sum + item.percentage, 0);
  const avgPct = Math.round(sumPct / validEvaluated.length);
  const overallGrade = calculateGrade(avgPct);

  return {
    hasExams: true,
    overallGrade,
    avgPercentage: avgPct,
    totalExamsCount: history.length,
    evaluatedCount: validEvaluated.length,
    absentCount: history.filter((h) => h.isAbsent).length,
    history,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   DPP (DAILY PRACTICE PROBLEM) MANAGEMENT HELPERS
   ────────────────────────────────────────────────────────────────────────── */
export const DEFAULT_SUBJECT_TOPICS = {
  'Computer Network': [
    'OSI Model & TCP/IP Architecture',
    'Data Link Layer & Framing Techniques',
    'IP Addressing & Subnetting (CIDR)',
    'Routing Algorithms (Dijkstra, Bellman-Ford)',
    'Transport Layer (TCP Handshake, Flow Control)',
    'Application Layer (DNS, HTTP/HTTPS, FTP)',
  ],
  'Operating Systems': [
    'Process Lifecycle & Context Switching',
    'CPU Scheduling (FCFS, SJF, Round Robin)',
    'Process Synchronization & Semaphores',
    'Deadlocks (Banker\'s Algorithm, Detection)',
    'Memory Management & Paging',
    'Virtual Memory & Page Replacement (LRU, FIFO)',
  ],
  'Database Systems': [
    'ER Modeling & Relational Mapping',
    'SQL Complex Queries & Aggregations',
    'Relational Algebra & Tuple Calculus',
    'Normalization (1NF, 2NF, 3NF, BCNF)',
    'Transactions & ACID Properties',
    'Concurrency Control & 2-Phase Locking',
  ],
  'DBMS': [
    'Relational Model & Keys (Primary, Foreign)',
    'SQL DDL & DML Commands',
    'Joins (Inner, Left, Right, Full Outer)',
    'Functional Dependencies & Normalization',
    'Transaction Isolation Levels',
    'Indexing & B+ Trees',
  ],
  'Data Structures': [
    'Singly & Doubly Linked Lists',
    'Stacks & Queues Applications',
    'Binary Search Trees (BST) & Traversals',
    'AVL Trees & Balanced Search Trees',
    'Graph Representation & Traversals (BFS/DFS)',
    'Sorting Algorithms (Quick Sort, Merge Sort)',
  ],
  'Computer Architecture': [
    'Instruction Set Architecture (RISC vs CISC)',
    'Arithmetic Logic Unit (ALU) & Data Path',
    'Instruction Pipelining & Hazards',
    'Cache Memory Mapping & Hit Ratio',
    'Direct Memory Access (DMA) & Interrupts',
    'Virtual Memory Translation',
  ],
  'Software Engineering': [
    'Software Development Life Cycle Models',
    'Agile Framework & Scrum Sprints',
    'SRS Documentation & Use Cases',
    'System Design & UML Class Diagrams',
    'Software Testing (Black-box vs White-box)',
    'Refactoring & Design Patterns',
  ],
  'Computer Graphics': [
    'Raster Scan & Display Technologies',
    'Line Drawing (Bresenham\'s Algorithm)',
    '2D Geometric Transformations',
    'Cohen-Sutherland Line Clipping',
    '3D Projections (Orthographic & Perspective)',
    'Illumination Models & Shading',
  ],
  'Web Technologies': [
    'Semantic HTML5 & Responsive CSS3 Grid',
    'Modern JavaScript (ES6+, Promises, Async/Await)',
    'DOM Manipulation & Event Handling',
    'Fetch API & Asynchronous Operations',
    'RESTful APIs & State Management',
    'Web Security (CORS, XSS, CSRF)',
  ],
  'Digital Electronics': [
    'Number Systems & Binary Arithmetic',
    'Boolean Algebra & Logic Gates',
    'K-Map Minimization (SOP & POS)',
    'Combinational Logic (Adders, Multiplexers)',
    'Sequential Logic (Flip-Flops & Latches)',
    'Synchronous & Asynchronous Counters',
  ],
  'Discrete Mathematics': [
    'Set Theory, Relations & Functions',
    'Propositional & Predicate Calculus',
    'Mathematical Induction & Recursion',
    'Combinatorics & Pigeonhole Principle',
    'Graph Theory (Euler & Hamiltonian Paths)',
    'Tree Properties & Spanning Trees',
  ],
};

const DPPS_STORAGE_KEY = 'digitute_dpps_v1';

export const INITIAL_SAMPLE_DPPS = [
  {
    id: 'dpp-101',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    topic: 'Data Link Layer & Framing Techniques',
    title: 'DPP #03 — Bit Stuffing & CRC Checksum',
    dueDate: '2026-10-18',
    totalMarks: 20,
    submissionType: 'file', // 'file' | 'typed'
    fileName: 'CN_DPP03_Bit_Stuffing_CRC.pdf',
    fileSize: '420 KB',
    fileType: 'application/pdf',
    questionsCount: 4,
    submittedCount: 14,
    totalStudents: 15,
    status: 'Published',
    publishedAt: '2026-10-12T10:30:00.000Z',
    instructions: 'Solve all numerical problems on CRC checksum and show step-by-step bit stuffing calculations.',
  },
  {
    id: 'dpp-102',
    batch: 'B.Sc 4th Sem',
    subject: 'DBMS',
    topic: 'Normalization (1NF, 2NF, 3NF, BCNF)',
    title: 'DPP #02 — Finding Candidate Keys & Normal Forms',
    dueDate: '2026-10-19',
    totalMarks: 25,
    submissionType: 'typed',
    questionsCount: 3,
    submittedCount: 11,
    totalStudents: 14,
    status: 'Published',
    publishedAt: '2026-10-13T14:15:00.000Z',
    typedQuestions: [
      { id: 'q-1', text: 'Given relation R(A, B, C, D, E) with F = {A -> BC, CD -> E, B -> D, E -> A}. Find all candidate keys of R.', marks: 8 },
      { id: 'q-2', text: 'Determine the highest normal form of relation R from Question 1. Justify your answer with dependency checks.', marks: 7 },
      { id: 'q-3', text: 'Decompose relation R into 3NF if it is not already in 3NF. Ensure lossless-join and dependency preservation.', marks: 10 },
    ],
  },
];

export function getSavedDpps() {
  try {
    const raw = localStorage.getItem(DPPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading DPPs from storage:', err);
  }
  // Initialize default seed DPPs
  try {
    localStorage.setItem(DPPS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_DPPS));
  } catch {
    // ignore
  }
  return INITIAL_SAMPLE_DPPS;
}

export function saveDpp(newDpp) {
  const current = getSavedDpps();
  const updated = [newDpp, ...current];
  try {
    localStorage.setItem(DPPS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving DPP:', err);
  }
  return updated;
}

export function deleteDpp(dppId) {
  const current = getSavedDpps();
  const updated = current.filter((d) => d.id !== dppId);
  try {
    localStorage.setItem(DPPS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting DPP:', err);
  }
  return updated;
}
