import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';

export function AcademicPerformanceModal({ student, batch, onClose }) {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (!student?.id) return;
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (student.batch_id) params.set('batch_id', student.batch_id);

    apiRequest(`/api/teacher/students/${student.id}/performance?${params.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        setPerformance(data);
      })
      .catch((err) => {
        console.warn('Failed to load live exam performance:', err);
        if (!isMounted) return;
        setPerformance({
          hasExams: false,
          overallGrade: student.grade || 'N/A',
          avgPercentage: null,
          totalExamsCount: 0,
          evaluatedCount: 0,
          absentCount: 0,
          history: []
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [student?.id, student?.batch_id, student?.grade]);

  if (!student) return null;

  const getGradeStyle = (grade) => {
    switch (grade) {
      case 'A+': return { color: '#047857', background: '#D1FAE5', borderColor: '#A7F3D0' };
      case 'A':  return { color: '#1D4ED8', background: '#DBEAFE', borderColor: '#BFDBFE' };
      case 'B+': return { color: '#0284C7', background: '#E0F2FE', borderColor: '#BAE6FD' };
      case 'B':  return { color: '#4F46E5', background: '#EEF2FF', borderColor: '#E0E7FF' };
      case 'C':  return { color: '#D97706', background: '#FEF3C7', borderColor: '#FDE68A' };
      case 'D':  return { color: '#DC2626', background: '#FEE2E2', borderColor: '#FECACA' };
      default:   return { color: '#64748B', background: '#F1F5F9', borderColor: '#E2E8F0' };
    }
  };

  const overallGrade = performance?.overallGrade || student.grade || 'N/A';
  const gradeStyle = getGradeStyle(overallGrade);

  return (
    <div className="si-perf-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="si-perf-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="si-perf-header">
          <div className="si-perf-student-meta">
            <div className="si-perf-avatar" aria-hidden="true">
              {student.name ? student.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <h3 className="si-perf-name">{student.name}</h3>
              <span className="si-perf-roll">{batch || student.batch_name}</span>
            </div>
          </div>
          <button
            type="button"
            className="si-perf-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Overall Grade Banner */}
        <div className="si-perf-grade-banner">
          <div className="si-perf-grade-left">
            <span className="si-perf-grade-caption">Overall Academic Grade</span>
            <div className="si-perf-badge-row">
              <span
                className="si-perf-grade-badge"
                style={{
                  color: gradeStyle.color,
                  backgroundColor: gradeStyle.background,
                  borderColor: gradeStyle.borderColor,
                }}
              >
                {overallGrade}
              </span>
              {performance?.avgPercentage !== null && performance?.avgPercentage !== undefined && (
                <span className="si-perf-avg-pct">
                  Average Score: <strong>{performance.avgPercentage}%</strong>
                </span>
              )}
            </div>
          </div>
          <div className="si-perf-grade-right">
            <span className="si-perf-source-tag">
              {performance?.hasExams
                ? `Computed from ${performance.evaluatedCount} Exam(s)`
                : 'No Exam Records Yet'}
            </span>
          </div>
        </div>

        {/* Exams List */}
        <div className="si-perf-content">
          <h4 className="si-perf-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 17l2-5 2 5" strokeWidth="2" />
            </svg>
            <span>Exam Evaluation Records</span>
          </h4>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Fetching live exam records from database...
            </div>
          ) : performance?.history && performance.history.length > 0 ? (
            <div className="si-perf-exam-list">
              {performance.history.map((exam, idx) => {
                const isAbs = exam.isAbsent;
                const exGradeStyle = !isAbs ? getGradeStyle(exam.grade) : null;

                return (
                  <div key={exam.examId || idx} className="si-perf-exam-card">
                    <div className="si-perf-exam-top">
                      <div>
                        <span className="si-perf-exam-title">{exam.examTitle}</span>
                        <span className="si-perf-exam-subject">{exam.subject}</span>
                      </div>
                      <span className="si-perf-exam-date">{exam.examDate}</span>
                    </div>

                    <div className="si-perf-exam-bottom">
                      <div className="si-perf-marks-pill">
                        {isAbs ? (
                          <span className="si-perf-absent-text">✕ Marked Absent (Excluded from Grade)</span>
                        ) : (
                          <>
                            <span className="si-perf-score">
                              <strong>{exam.obtainedMarks}</strong> / {exam.totalMarks}
                            </span>
                            <span className="si-perf-pct">({exam.percentage}%)</span>
                          </>
                        )}
                      </div>

                      {!isAbs && (
                        <div
                          className="si-perf-exam-grade"
                          style={{
                            color: exGradeStyle.color,
                            backgroundColor: exGradeStyle.background,
                            borderColor: exGradeStyle.borderColor,
                          }}
                        >
                          Grade {exam.grade}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="si-perf-no-exams">
              <span className="si-perf-empty-icon">📝</span>
              <p>No exams have been evaluated for this student yet.</p>
              <small>Use <strong>Academics → Exam Evaluation</strong> to submit exam marks and generate dynamic grades.</small>
            </div>
          )}

          {/* Attendance snapshot */}
          <div className="si-perf-att-box">
            <span className="si-perf-att-label">Attendance Status</span>
            <div className="si-perf-att-val">
              <span className="si-perf-att-badge">{student.attendance}</span>
              {student.attendancePct !== null && student.attendancePct !== undefined ? (
                <span className="si-perf-att-pct">({student.attendancePct}% Recorded)</span>
              ) : (
                <span className="si-perf-att-pct" style={{ color: '#94A3B8' }}>(No sessions held)</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="si-perf-footer">
          <button type="button" className="si-perf-close-action" onClick={onClose}>
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcademicPerformanceModal;
