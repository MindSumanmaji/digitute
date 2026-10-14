import React from 'react';
import { getStudentOverallPerformance, getGradeBadgeStyle } from '../../data/academicData';

export function AcademicPerformanceModal({ student, batch, onClose }) {
  if (!student) return null;

  const performance = getStudentOverallPerformance(student.id, batch, student.grade);
  const gradeStyle = getGradeBadgeStyle(performance.overallGrade);

  return (
    <div className="si-perf-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="si-perf-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="si-perf-header">
          <div className="si-perf-student-meta">
            <div className="si-perf-avatar" aria-hidden="true">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="si-perf-name">{student.name}</h3>
              <span className="si-perf-roll">Roll: {student.roll} • {batch}</span>
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
                {performance.overallGrade}
              </span>
              {performance.avgPercentage !== null && (
                <span className="si-perf-avg-pct">
                  Average Score: <strong>{performance.avgPercentage}%</strong>
                </span>
              )}
            </div>
          </div>
          <div className="si-perf-grade-right">
            <span className="si-perf-source-tag">
              {performance.hasExams
                ? `Computed from ${performance.evaluatedCount} Exam(s)`
                : 'Baseline Initial Grade'}
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

          {performance.history && performance.history.length > 0 ? (
            <div className="si-perf-exam-list">
              {performance.history.map((exam, idx) => {
                const isAbs = exam.isAbsent;
                const exGradeStyle = !isAbs ? getGradeBadgeStyle(exam.grade) : null;

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
              <span className="si-perf-att-pct">({student.attendancePct}% Recorded)</span>
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
