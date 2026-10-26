import React, { useState, useMemo, useEffect } from 'react';
import { apiRequest } from '../../api';
import { getStudentOverallPerformance } from '../../data/academicData';
import AcademicPerformanceModal from './AcademicPerformanceModal';

/* ══════════════════════════════════════════════════════════════════════════
   STUDENT INFO (TEACHER PANEL)
   Fetches assigned batches, subjects, and enrolled students strictly
   from the database. All dummy arrays have been removed.
   ══════════════════════════════════════════════════════════════════════════ */
export function StudentInfo({ onBack }) {
  // Batches state from database
  const [batchesList, setBatchesList] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Selected filters
  const [selectedBatch, setSelectedBatch] = useState(''); // Holds batch_id
  const [selectedSubject, setSelectedSubject] = useState(''); // Holds subject name
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  // Loading & students list from database
  const [isLoading, setIsLoading] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [comboStudents, setComboStudents] = useState([]);
  const [selectedPerformanceStudent, setSelectedPerformanceStudent] = useState(null);
  const [, setUpdateTrigger] = useState(0);

  // 1. Fetch teacher's assigned batches directly from database on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingBatches(true);

    apiRequest('/api/teacher/my-batches')
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setBatchesList(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load teacher batches for Student Info:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBatches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-sync when exams or attendance are updated elsewhere
  useEffect(() => {
    const handleUpdate = () => setUpdateTrigger((k) => k + 1);
    window.addEventListener('digitute_exams_updated', handleUpdate);
    window.addEventListener('digitute_attendance_updated', handleUpdate);
    return () => {
      window.removeEventListener('digitute_exams_updated', handleUpdate);
      window.removeEventListener('digitute_attendance_updated', handleUpdate);
    };
  }, []);

  // Derived selected batch object and batch name
  const selectedBatchObj = useMemo(() => {
    return batchesList.find((b) => b.batch_id === selectedBatch || b.batch_name === selectedBatch) || null;
  }, [batchesList, selectedBatch]);

  const selectedBatchName = selectedBatchObj ? selectedBatchObj.batch_name : (selectedBatch || '');

  // Derived available subjects for the selected batch from database
  const availableSubjects = useMemo(() => {
    if (!selectedBatchObj || !selectedBatchObj.subjects) return [];
    return selectedBatchObj.subjects
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
  }, [selectedBatchObj]);

  const readyToShow = Boolean(selectedBatch && selectedSubject);

  // 2. Fetch enrolled students directly from database when batch and subject are selected
  useEffect(() => {
    if (!readyToShow) {
      setListVisible(false);
      setIsLoading(false);
      setComboStudents([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setListVisible(false);

    const params = new URLSearchParams({
      batch_id: selectedBatch || '',
      batch_name: selectedBatchName || '',
      subject: selectedSubject || '',
    });

    apiRequest(`/api/teacher/students?${params.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setComboStudents(list);
      })
      .catch((err) => {
        console.error('Failed to load enrolled students from database:', err);
        if (isMounted) setComboStudents([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setListVisible(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, selectedBatchName, selectedSubject, readyToShow]);

  const handleBatchChange = (newBatchId) => {
    setSelectedBatch(newBatchId);
    setSelectedSubject('');
    setSearchQuery('');
    setStatusFilter('All');
    setListVisible(false);
    setComboStudents([]);
  };

  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    setSearchQuery('');
    setStatusFilter('All');
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return comboStudents.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const phone = (s.phone || '');
      const roll = (s.roll || '').toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        roll.includes(q);
      const matchesStatus = statusFilter === 'All' || s.attendance === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [comboStudents, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { All: comboStudents.length, Excellent: 0, Good: 0, Average: 0, 'Below Average': 0 };
    comboStudents.forEach((s) => {
      if (counts[s.attendance] !== undefined) counts[s.attendance]++;
    });
    return counts;
  }, [comboStudents]);

  const handleCopyPhone = (phone, id) => {
    navigator.clipboard?.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAttendanceClass = (status) => {
    const map = {
      Excellent: 'att-badge-excellent',
      Good: 'att-badge-good',
      Average: 'att-badge-average',
      'Below Average': 'att-badge-below-average'
    };
    return map[status] || 'att-badge-default';
  };

  const getGradeClass = (grade) => {
    const map = {
      'A+': 'grade-badge-aplus',
      A: 'grade-badge-a',
      'B+': 'grade-badge-bplus',
      B: 'grade-badge-b',
      C: 'grade-badge-b',
      D: 'grade-badge-below-average'
    };
    return map[grade] || 'grade-badge-default';
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  /* ── RENDER ── */
  return (
    <div className="si-wrapper">
      {/* ── SELECTORS ── */}
      <section className="si-selector-card" aria-label="Batch and Subject Selectors">
        {/* Batch */}
        <div className="si-selector-item">
          <label htmlFor="batch-select" className="si-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>SELECT BATCH</span>
          </label>
          <div className="si-select-dropdown-wrap">
            <select
              id="batch-select"
              className="si-native-select"
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              <option value="" disabled>
                {loadingBatches ? '— Loading batches… —' : '— Choose a batch —'}
              </option>
              {batchesList.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
            <div className="si-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>

        <div className="si-selector-divider" aria-hidden="true" />

        {/* Subject */}
        <div className="si-selector-item">
          <label htmlFor="subject-select" className="si-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>SELECT SUBJECT</span>
          </label>
          <div className="si-select-dropdown-wrap">
            <select
              id="subject-select"
              className="si-native-select"
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={!selectedBatch || availableSubjects.length === 0}
            >
              <option value="" disabled>
                {!selectedBatch
                  ? '— Select batch first —'
                  : availableSubjects.length === 0
                  ? '— No subjects in this batch —'
                  : '— Choose a subject —'}
              </option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="si-select-caret" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMPTY PROMPT ── */}
      {!readyToShow && !isLoading && (
        <div className="si-select-prompt">
          <div className="si-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="si-prompt-text">
            {!selectedBatch
              ? 'Select a batch to get started'
              : 'Now select a subject to load students'}
          </p>
          <div className="si-prompt-hint">
            {!selectedBatch
              ? 'Choose your batch from the dropdown above'
              : `${availableSubjects.length} subject${availableSubjects.length === 1 ? '' : 's'} available for ${selectedBatchName}`}
          </div>
        </div>
      )}

      {/* ── SKELETON LOADING ANIMATION ── */}
      {isLoading && (
        <div className="si-loading-wrapper" aria-live="polite" aria-label="Loading students">
          <div className="si-loading-label">
            <div className="si-loading-spinner" aria-hidden="true" />
            <span>Fetching enrolled students for <strong>{selectedSubject}</strong> from database…</span>
          </div>
          <div className="si-skeleton-header" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="si-skeleton-row" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      )}

      {/* ── SEARCH & FILTER ── */}
      {listVisible && (
        <div className="si-controls-card si-animate-in">
          <div className="si-search-input-wrap">
            <svg className="si-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="si-search-input"
              placeholder="Search by name, contact or roll no…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="si-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="si-filter-pills" role="tablist" aria-label="Attendance status filter">
            {['All', 'Excellent', 'Good', 'Average', 'Below Average'].map((fk) => (
              <button
                key={fk}
                type="button"
                className={`si-filter-pill ${statusFilter === fk ? 'active' : ''} ${
                  fk !== 'All' ? `pill-${fk.toLowerCase().replace(/\s+/g, '-')}` : ''
                }`}
                onClick={() => setStatusFilter(fk)}
              >
                <span>{fk}</span>
                <span className="si-pill-badge">{statusCounts[fk] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STUDENT ROSTER ── */}
      {listVisible && (
        <section className="si-roster-section si-animate-in" aria-label="Student List">
          {filteredStudents.length === 0 ? (
            <div className="si-empty-state">
              <div className="si-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="si-empty-title">
                {comboStudents.length === 0 ? 'No students enrolled in this batch' : 'No students found'}
              </h3>
              <p className="si-empty-desc">
                {comboStudents.length === 0
                  ? `There are currently no active students assigned to ${selectedBatchName} in the database.`
                  : 'Try adjusting your search or filter.'}
              </p>
              {comboStudents.length > 0 && (
                <button
                  type="button"
                  className="si-empty-reset-btn"
                  onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="si-result-meta">
                Showing <strong>{filteredStudents.length}</strong> of <strong>{comboStudents.length}</strong> student{comboStudents.length === 1 ? '' : 's'}
                {selectedSubject && <> &mdash; <em>{selectedSubject}</em></>}
                {selectedBatchName && <> &middot; <em>{selectedBatchName}</em></>}
              </div>

              {/* DESKTOP TABLE */}
              <div className="si-table-container">
                <table className="si-table">
                  <thead>
                    <tr>
                      <th scope="col" className="col-index">#</th>
                      <th scope="col" className="col-name">Name</th>
                      <th scope="col" className="col-phone">Contact No.</th>
                      <th scope="col" className="col-attendance">Attendance Status</th>
                      <th scope="col" className="col-grade">Overall Grade</th>
                      <th scope="col" className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => (
                      <tr
                        key={student.id}
                        className="si-table-row si-row-animate"
                        style={{ animationDelay: `${idx * 35}ms` }}
                      >
                        <td className="col-index"><span className="si-row-num">{idx + 1}</span></td>
                        <td className="col-name">
                          <div className="si-student-cell">
                            <div className="si-student-avatar" aria-hidden="true">{getInitials(student.name)}</div>
                            <div className="si-student-info">
                              <span className="si-student-name">{student.name}</span>
                              <span className="si-student-roll">{student.roll} · {selectedBatchName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="col-phone">
                          <div className="si-phone-cell">
                            <a href={`tel:${student.phone}`} className="si-phone-link" title={`Call ${student.name}`}>
                              <svg className="si-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span>+91 {student.phone}</span>
                            </a>
                            <button
                              type="button"
                              className="si-copy-btn"
                              onClick={() => handleCopyPhone(student.phone, student.id)}
                              aria-label={`Copy phone for ${student.name}`}
                            >
                              {copiedId === student.id ? (
                                <span className="si-copied-text">Copied!</span>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="col-attendance">
                          <div className={`si-badge ${getAttendanceClass(student.attendance)}`}>
                            <span className="si-badge-dot" aria-hidden="true" />
                            <span className="si-badge-label">{student.attendance}</span>
                            <span className="si-badge-pct">({student.attendancePct}%)</span>
                          </div>
                        </td>
                        <td className="col-grade">
                          {(() => {
                            const perf = getStudentOverallPerformance(student.id, selectedBatchName, student.grade);
                            const displayGrade = perf.overallGrade;
                            return (
                              <button
                                type="button"
                                className="si-perf-trigger-btn"
                                onClick={() => setSelectedPerformanceStudent(student)}
                                title={`Click to view academic performance & exam records for ${student.name}`}
                              >
                                <div className={`si-badge ${getGradeClass(displayGrade)}`}>
                                  <span className="si-grade-label">{displayGrade}</span>
                                </div>
                                {perf.hasExams && (
                                  <span className="si-perf-records-badge" title={`Updated from ${perf.totalExamsCount} Exam(s)`}>
                                    {perf.totalExamsCount} Exam{perf.totalExamsCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="col-actions">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="si-action-icon-btn record-action"
                              onClick={() => setSelectedPerformanceStudent(student)}
                              title="View Exam Evaluation & Academic Records"
                              aria-label={`Academic record for ${student.name}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="M8 17l2-5 2 5" />
                              </svg>
                            </button>
                            <a
                              href={`tel:${student.phone}`}
                              className="si-action-icon-btn call-action"
                              aria-label={`Call ${student.name}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="si-mobile-cards-list">
                {filteredStudents.map((student, idx) => {
                  const perf = getStudentOverallPerformance(student.id, selectedBatchName, student.grade);
                  const displayGrade = perf.overallGrade;

                  return (
                    <div
                      key={student.id}
                      className="si-mobile-card si-row-animate"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="si-mcard-header">
                        <div className="si-mcard-user">
                          <div className="si-student-avatar" aria-hidden="true">{getInitials(student.name)}</div>
                          <div className="si-mcard-identity">
                            <div className="si-mcard-name-row">
                              <h4 className="si-student-name">{student.name}</h4>
                              <span className="si-mcard-idx">#{idx + 1}</span>
                            </div>
                            <span className="si-student-roll">{student.roll} · {selectedBatchName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="si-mcard-phone-row">
                        <a href={`tel:${student.phone}`} className="si-mcard-phone-link">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>+91 {student.phone}</span>
                        </a>
                        <button
                          type="button"
                          className="si-mcard-copy-btn"
                          onClick={() => handleCopyPhone(student.phone, student.id)}
                        >
                          {copiedId === student.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="si-mcard-stats-row">
                        <div className="si-mcard-stat-box">
                          <span className="si-mcard-stat-label">ATTENDANCE</span>
                          <div className={`si-badge ${getAttendanceClass(student.attendance)}`}>
                            <span className="si-badge-dot" aria-hidden="true" />
                            <span className="si-badge-label">{student.attendance}</span>
                            <span className="si-badge-pct">({student.attendancePct}%)</span>
                          </div>
                        </div>
                        <div className="si-mcard-stat-box right">
                          <span className="si-mcard-stat-label">OVERALL GRADE</span>
                          <button
                            type="button"
                            className="si-perf-trigger-btn"
                            onClick={() => setSelectedPerformanceStudent(student)}
                            title="View Exam Performance Records"
                          >
                            <div className={`si-badge ${getGradeClass(displayGrade)}`}>
                              <span className="si-grade-label">{displayGrade}</span>
                            </div>
                            {perf.hasExams && (
                              <span className="si-perf-records-badge">
                                {perf.totalExamsCount} Exam{perf.totalExamsCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── ACADEMIC PERFORMANCE & EXAM RECORDS MODAL ── */}
      {selectedPerformanceStudent && (
        <AcademicPerformanceModal
          student={selectedPerformanceStudent}
          batch={selectedBatchName}
          onClose={() => setSelectedPerformanceStudent(null)}
        />
      )}
    </div>
  );
}

export default StudentInfo;
