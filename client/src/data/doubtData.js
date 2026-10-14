/**
 * Doubt Corner Data Store & Persistence Service
 * DigiTute Teacher Portal
 */

const STORAGE_KEY = 'digitute_doubts_store_v2';

export const INITIAL_DOUBTS = [
  // =========================================================================
  // 1. B.Sc 6th Sem - Computer Network
  // =========================================================================
  // --- Rahim Ali (3 Pending Doubts) ---
  {
    id: 'dbt-rahim-1',
    studentId: 'st-rahim',
    studentName: 'Rahim Ali',
    studentAvatar: 'RA',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    questionTitle: 'TCP 3-Way Handshake SYN-ACK Process & Sequence Numbers',
    questionText: 'Can you please explain how the TCP 3-way handshake establishes a reliable connection? Specifically, why is the Initial Sequence Number (ISN) randomized instead of starting from zero, and what happens if the server\'s SYN-ACK packet is lost in transit?',
    attachment: {
      name: 'tcp_handshake_diagram.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      size: '840 KB',
    },
    askedAt: '14 Oct 2026, 10:15 AM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-rahim-2',
    studentId: 'st-rahim',
    studentName: 'Rahim Ali',
    studentAvatar: 'RA',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    questionTitle: 'IPv4 vs IPv6 Header Format & Fragmentation Difference',
    questionText: 'Why was header checksum removed in the IPv6 header while IPv4 strictly requires it? Also, does IPv6 allow intermediate router fragmentation like IPv4, or is Path MTU Discovery mandatory?',
    attachment: {
      name: 'ipv4_ipv6_header_comparison.pdf',
      type: 'document',
      url: '',
      size: '1.4 MB',
    },
    askedAt: '14 Oct 2026, 11:30 AM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-rahim-3',
    studentId: 'st-rahim',
    studentName: 'Rahim Ali',
    studentAvatar: 'RA',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    questionTitle: 'Why CSMA/CD Fails in Wireless 802.11 Networks',
    questionText: 'In wired Ethernet, CSMA/CD works efficiently to detect collisions. Why cannot wireless Wi-Fi devices use CSMA/CD, and why does CSMA/CA use RTS/CTS virtual carrier sensing instead?',
    attachment: null,
    askedAt: '14 Oct 2026, 12:45 PM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  // --- Offline Marked Doubt for Computer Network ---
  {
    id: 'dbt-tanmoy-cn-off',
    studentId: 'st-tanmoy',
    studentName: 'Tanmoy Biswas',
    studentAvatar: 'TB',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    questionTitle: 'CIDR Subnetting and Variable Length Subnet Masking (VLSM)',
    questionText: 'How to calculate network addresses, broadcast addresses, and usable host ranges for /27 and /29 subnets from a given classless /24 block? Needs blackboard calculation.',
    attachment: null,
    askedAt: '13 Oct 2026, 03:00 PM',
    status: 'offline',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: '13 Oct 2026, 05:30 PM',
    offlineNotes: 'Will solve on blackboard step-by-step in next classroom session.',
    solvedAt: null,
    resolutionType: null,
  },
  // --- Solved Doubt for Computer Network ---
  {
    id: 'dbt-ananya-cn-sol',
    studentId: 'st-ananya',
    studentName: 'Ananya Ghosh',
    studentAvatar: 'AG',
    batch: 'B.Sc 6th Sem',
    subject: 'Computer Network',
    questionTitle: 'OSI 7-Layer vs TCP/IP 4-Layer Architecture Mapping',
    questionText: 'How do Session and Presentation layer duties map into the application layer of TCP/IP?',
    attachment: null,
    askedAt: '12 Oct 2026, 11:00 AM',
    status: 'solved',
    teacherAnswer: 'In TCP/IP, session management (TLS handshakes, RPC) and presentation encoding (JSON, ASCII, encryption) are directly handled by user-space application libraries and protocols (HTTP/HTTPS, SSH) rather than separate operating system protocol stack layers.',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: '12 Oct 2026, 04:20 PM',
    resolutionType: 'online',
  },

  // =========================================================================
  // 2. MCA 2nd Sem - Software Engineering
  // =========================================================================
  // --- Sneha Maji (2 Pending Doubts) ---
  {
    id: 'dbt-sneha-1',
    studentId: 'st-sneha',
    studentName: 'Sneha Maji',
    studentAvatar: 'SM',
    batch: 'MCA 2nd Sem',
    subject: 'Software Engineering',
    questionTitle: 'Agile Scrum Sprint Retrospective vs Review Workflows',
    questionText: 'Could you clarify the practical distinction between Sprint Review and Sprint Retrospective? In our project assignment, who should attend each meeting, and how do we handle incomplete backlog items at the end of a sprint?',
    attachment: {
      name: 'scrum_ceremonies_chart.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
      size: '620 KB',
    },
    askedAt: '14 Oct 2026, 09:20 AM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-sneha-2',
    studentId: 'st-sneha',
    studentName: 'Sneha Maji',
    studentAvatar: 'SM',
    batch: 'MCA 2nd Sem',
    subject: 'Software Engineering',
    questionTitle: 'Cohesion vs Coupling in Microservices vs Monoliths',
    questionText: 'We learned that good software architecture aims for "High Cohesion, Low Coupling". How is this evaluated when designing REST microservices? Does sharing a database between two microservices violate loose coupling?',
    attachment: null,
    askedAt: '14 Oct 2026, 10:40 AM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  // --- Offline Marked Doubt for Software Engineering ---
  {
    id: 'dbt-priya-se-off',
    studentId: 'st-priya',
    studentName: 'Priya Sharma',
    studentAvatar: 'PS',
    batch: 'MCA 2nd Sem',
    subject: 'Software Engineering',
    questionTitle: 'Clean Architecture Dependency Inversion Principle with Code',
    questionText: 'Can you show how DIP and Dependency Injection container works with an actual Node.js/Java backend project example?',
    attachment: {
      name: 'dependency_inversion_uml.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      size: '950 KB',
    },
    askedAt: '12 Oct 2026, 04:30 PM',
    status: 'offline',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: '13 Oct 2026, 03:20 PM',
    offlineNotes: 'Reserved for group seminar discussion on Friday.',
    solvedAt: null,
    resolutionType: null,
  },
  // --- Solved Doubt for Software Engineering ---
  {
    id: 'dbt-rahul-se-sol',
    studentId: 'st-rahul',
    studentName: 'Rahul Sen',
    studentAvatar: 'RS',
    batch: 'MCA 2nd Sem',
    subject: 'Software Engineering',
    questionTitle: 'Factory Method vs Abstract Factory Design Patterns',
    questionText: 'When should we upgrade from a simple Factory Method to an Abstract Factory in enterprise design?',
    attachment: null,
    askedAt: '11 Oct 2026, 02:10 PM',
    status: 'solved',
    teacherAnswer: 'Use Factory Method when you only need to create one specific product type with polymorphic subclasses. Upgrade to Abstract Factory when your application needs to produce a complete family of related or dependent products (e.g., Windows UI vs MacOS UI components) without specifying their concrete classes.',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: '11 Oct 2026, 06:40 PM',
    resolutionType: 'online',
  },

  // =========================================================================
  // 3. B.Sc 4th Sem - DBMS
  // =========================================================================
  {
    id: 'dbt-dev-dbms-1',
    studentId: 'st-dev',
    studentName: 'Dev Sen',
    studentAvatar: 'DS',
    batch: 'B.Sc 4th Sem',
    subject: 'DBMS',
    questionTitle: 'B+ Tree Indexing vs Hash Indexing for Range Queries',
    questionText: 'Why is B+ Tree preferred over Hash Indexing in relational database management systems when queries use operators like BETWEEN, >, and <?',
    attachment: {
      name: 'bplus_tree_nodes.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
      size: '510 KB',
    },
    askedAt: '13 Oct 2026, 04:10 PM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-dev-dbms-2',
    studentId: 'st-dev',
    studentName: 'Dev Sen',
    studentAvatar: 'DS',
    batch: 'B.Sc 4th Sem',
    subject: 'DBMS',
    questionTitle: 'Two-Phase Commit (2PC) Protocol in Distributed Transactions',
    questionText: 'What happens in the 2PC prepare phase if the transaction coordinator crashes before broadcasting the commit decision?',
    attachment: null,
    askedAt: '13 Oct 2026, 05:20 PM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-arijit-dbms-off',
    studentId: 'st-arijit',
    studentName: 'Arijit Bose',
    studentAvatar: 'AB',
    batch: 'B.Sc 4th Sem',
    subject: 'DBMS',
    questionTitle: 'Boyce-Codd Normal Form (BCNF) Decomposition Algorithm',
    questionText: 'Could you demonstrate the step-by-step decomposition of a relation into BCNF that preserves functional dependencies?',
    attachment: null,
    askedAt: '12 Oct 2026, 01:15 PM',
    status: 'offline',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: '13 Oct 2026, 10:00 AM',
    offlineNotes: 'Will solve sample university exam problems on blackboard.',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-santanu-dbms-sol',
    studentId: 'st-santanu',
    studentName: 'Santanu Ghosh',
    studentAvatar: 'SG',
    batch: 'B.Sc 4th Sem',
    subject: 'DBMS',
    questionTitle: 'SQL Window Functions: ROW_NUMBER vs RANK vs DENSE_RANK',
    questionText: 'What is the exact behavior of ties when using RANK() versus DENSE_RANK()?',
    attachment: null,
    askedAt: '11 Oct 2026, 03:00 PM',
    status: 'solved',
    teacherAnswer: 'When there are duplicate values (ties), RANK() skips subsequent ranking numbers (e.g., 1, 2, 2, 4), while DENSE_RANK() does not skip any numbers (e.g., 1, 2, 2, 3). ROW_NUMBER() assigns strictly distinct sequential integers regardless of ties.',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: '11 Oct 2026, 05:15 PM',
    resolutionType: 'online',
  },

  // =========================================================================
  // 4. B.Tech CS 3rd Sem - Data Structures
  // =========================================================================
  {
    id: 'dbt-moumita-ds-1',
    studentId: 'st-moumita',
    studentName: 'Moumita Saha',
    studentAvatar: 'MS',
    batch: 'B.Tech CS 3rd Sem',
    subject: 'Data Structures',
    questionTitle: 'Dijkstra vs Bellman-Ford with Negative Edge Weights',
    questionText: 'Why does Dijkstraâ€™s shortest path algorithm fail in graphs containing negative edge weights or negative cycles, while Bellman-Ford can detect them?',
    attachment: null,
    askedAt: '13 Oct 2026, 05:40 PM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-rohan-ds-off',
    studentId: 'st-rohan',
    studentName: 'Rohan Paul',
    studentAvatar: 'RP',
    batch: 'B.Tech CS 3rd Sem',
    subject: 'Data Structures',
    questionTitle: 'AVL Tree Double Rotations (LR & RL Rotations)',
    questionText: 'I am confused about how pointer reassignment works during LR double rotation. Please demonstrate with node diagrams on blackboard.',
    attachment: null,
    askedAt: '12 Oct 2026, 11:45 AM',
    status: 'offline',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: '13 Oct 2026, 09:30 AM',
    offlineNotes: 'Whiteboard demonstration during tomorrow morning class.',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-koushik-ds-sol',
    studentId: 'st-koushik',
    studentName: 'Koushik Nandi',
    studentAvatar: 'KN',
    batch: 'B.Tech CS 3rd Sem',
    subject: 'Data Structures',
    questionTitle: 'Red-Black Tree Properties and Black Height Invariant',
    questionText: 'Why is the black height of every leaf node strictly equal in a balanced Red-Black tree?',
    attachment: null,
    askedAt: '10 Oct 2026, 04:30 PM',
    status: 'solved',
    teacherAnswer: 'The black height property guarantees that no path from root to leaf is more than twice as long as any other path, ensuring the tree height remains strictly bounded by 2 * log2(n + 1). Hence operations remain O(log n).',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: '11 Oct 2026, 10:00 AM',
    resolutionType: 'online',
  },

  // =========================================================================
  // 5. B.Sc 6th Sem - Operating Systems
  // =========================================================================
  {
    id: 'dbt-dev-os-1',
    studentId: 'st-dev',
    studentName: 'Dev Sen',
    studentAvatar: 'DS',
    batch: 'B.Sc 6th Sem',
    subject: 'Operating Systems',
    questionTitle: 'Counting Semaphore vs Binary Semaphore (Mutex) with Deadlock',
    questionText: 'Can a binary semaphore be used interchangeably with a mutex, or is ownership strictly enforced in a mutex?',
    attachment: null,
    askedAt: '14 Oct 2026, 08:30 AM',
    status: 'pending',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-arijit-os-off',
    studentId: 'st-arijit',
    studentName: 'Arijit Bose',
    studentAvatar: 'AB',
    batch: 'B.Sc 6th Sem',
    subject: 'Operating Systems',
    questionTitle: 'Second-Chance (Clock) Page Replacement Implementation',
    questionText: 'How is the circular queue with reference bit maintained during high page fault frequency? Needs a step-by-step whiteboard demonstration.',
    attachment: null,
    askedAt: '12 Oct 2026, 02:15 PM',
    status: 'offline',
    teacherAnswer: '',
    teacherAttachment: null,
    offlineMarkedAt: '13 Oct 2026, 11:00 AM',
    offlineNotes: 'Will demonstrate on whiteboard during tomorrow\'s lab class.',
    solvedAt: null,
    resolutionType: null,
  },
  {
    id: 'dbt-indrani-os-sol',
    studentId: 'st-indrani',
    studentName: 'Indrani Das',
    studentAvatar: 'ID',
    batch: 'B.Sc 6th Sem',
    subject: 'Operating Systems',
    questionTitle: 'Banker\'s Algorithm Safe State Determination',
    questionText: 'How does the operating system determine whether a resource allocation request leads to an unsafe state?',
    attachment: null,
    askedAt: '10 Oct 2026, 02:00 PM',
    status: 'solved',
    teacherAnswer: 'The algorithm checks whether the remaining Available vector can satisfy the Need vector (Max - Allocation) of at least one process. When that process terminates and releases resources, it iteratively verifies if all processes can safely finish in a valid sequence.',
    teacherAttachment: null,
    offlineMarkedAt: null,
    offlineNotes: '',
    solvedAt: '11 Oct 2026, 01:15 PM',
    resolutionType: 'online',
  },
];

/**
 * Fetch all doubts from localStorage or initialize with seed data
 */
export function getStoredDoubts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading doubts from localStorage:', err);
  }
  saveStoredDoubts(INITIAL_DOUBTS);
  return INITIAL_DOUBTS;
}

/**
 * Persist doubts array to localStorage and notify listeners
 */
export function saveStoredDoubts(doubts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('digitute_doubts_updated', { detail: doubts }));
    }
  } catch (err) {
    console.error('Error saving doubts to localStorage:', err);
  }
}

/**
 * Group pending doubts by student for the given batch & subject
 */
export function getGroupedPendingDoubts(batch, subject) {
  if (!batch || !subject) return [];
  const all = getStoredDoubts();
  const pending = all.filter((d) => {
    return (d.status === 'pending' || d.status === 'unsolved') && d.batch === batch && d.subject === subject;
  });

  const groupsMap = {};
  pending.forEach((d) => {
    if (!groupsMap[d.studentId]) {
      groupsMap[d.studentId] = {
        studentId: d.studentId,
        studentName: d.studentName,
        studentAvatar: d.studentAvatar,
        batch: d.batch,
        subject: d.subject,
        questions: [],
      };
    }
    groupsMap[d.studentId].questions.push(d);
  });

  return Object.values(groupsMap);
}

/**
 * Get offline-marked doubts for the given batch & subject
 */
export function getOfflineDoubts(batch, subject) {
  if (!batch || !subject) return [];
  const all = getStoredDoubts();
  return all.filter((d) => d.status === 'offline' && d.batch === batch && d.subject === subject);
}

/**
 * Get solved doubts for the given batch & subject
 */
export function getSolvedDoubts(batch, subject) {
  if (!batch || !subject) return [];
  const all = getStoredDoubts();
  return all.filter((d) => d.status === 'solved' && d.batch === batch && d.subject === subject);
}

/**
 * Submit teacher's answer for a specific doubt (moves from pending -> solved)
 */
export function submitDoubtSolution(doubtId, answerText, attachment = null) {
  const all = getStoredDoubts();
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated = all.map((d) => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: 'solved',
        teacherAnswer: answerText,
        teacherAttachment: attachment,
        solvedAt: nowStr,
        resolutionType: 'online',
      };
    }
    return d;
  });

  saveStoredDoubts(updated);
  return updated;
}

/**
 * Mark a doubt for offline discussion (moves from pending -> offline)
 */
export function markDoubtAsOffline(doubtId, notes = '') {
  const all = getStoredDoubts();
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated = all.map((d) => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: 'offline',
        offlineMarkedAt: nowStr,
        offlineNotes: notes || 'Marked for discussion in classroom lecture.',
      };
    }
    return d;
  });

  saveStoredDoubts(updated);
  return updated;
}

/**
 * Mark an offline doubt as resolved (moves from offline -> solved)
 */
export function resolveOfflineDoubt(doubtId, teacherNote = '') {
  const all = getStoredDoubts();
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated = all.map((d) => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: 'solved',
        teacherAnswer: teacherNote || d.offlineNotes || 'Resolved during offline classroom discussion.',
        solvedAt: nowStr,
        resolutionType: 'offline',
      };
    }
    return d;
  });

  saveStoredDoubts(updated);
  return updated;
}

/**
 * Compute real-time doubt metrics for a given batch & subject (used by Dashboard)
 */
export function getLiveBatchDoubtStats(batch, subject = null) {
  if (!batch) return { pending: 0, offline: 0, solvedCount: 0, totalCount: 0, solvedPct: 100 };

  const all = getStoredDoubts();
  const matching = all.filter((d) => {
    if (d.batch !== batch) return false;
    if (subject && d.subject !== subject) return false;
    return true;
  });

  const pending = matching.filter((d) => d.status === 'pending' || d.status === 'unsolved').length;
  const offline = matching.filter((d) => d.status === 'offline').length;
  const solved = matching.filter((d) => d.status === 'solved').length;
  const total = matching.length;

  const solvedPct = total > 0 ? Math.round((solved / total) * 100) : 100;

  return {
    pending,
    offline,
    solvedCount: solved,
    totalCount: total,
    solvedPct,
  };
}