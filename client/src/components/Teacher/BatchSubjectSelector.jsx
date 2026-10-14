import React from 'react';
export function BatchSubjectSelector({
  batches = [],
  subjects = [],
  selectedBatch = '',
  selectedSubject = '',
  onBatchChange,
  onSubjectChange
}) {
  const getOptionLabel = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || item.label || item.title || String(item.id || '');
  };

  const getOptionValue = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.id !== undefined ? String(item.id) : (item.value || item.name || '');
  };

  const currentBatchLabel = () => {
    if (!selectedBatch && batches.length > 0) return getOptionLabel(batches[0]);
    const found = batches.find((b) => getOptionValue(b) === String(selectedBatch) || getOptionLabel(b) === String(selectedBatch));
    return found ? getOptionLabel(found) : selectedBatch || 'Select Batch';
  };

  const currentSubjectLabel = () => {
    if (!selectedSubject && subjects.length > 0) return getOptionLabel(subjects[0]);
    const found = subjects.find((s) => getOptionValue(s) === String(selectedSubject) || getOptionLabel(s) === String(selectedSubject));
    return found ? getOptionLabel(found) : selectedSubject || 'Select Subject';
  };

  return (
    <div className="dt-batch-subject-selector" role="region" aria-label="Batch and Subject Selector">
      {/* Batch Section */}
      <div className="dt-selector-section" title="Change Batch">
        <div className="dt-selector-icon-bubble" aria-hidden="true">
          {/* Batch / Classroom Icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <div className="dt-selector-content">
          <span className="dt-selector-label">Select Batch</span>
          <span className="dt-selector-value">{currentBatchLabel()}</span>
        </div>

        <div className="dt-selector-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <select
          className="dt-selector-native-select"
          aria-label="Select Batch"
          value={selectedBatch}
          onChange={(e) => onBatchChange && onBatchChange(e.target.value)}
        >
          {batches.map((batch, index) => {
            const val = getOptionValue(batch);
            const lbl = getOptionLabel(batch);
            return (
              <option key={val || index} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
      </div>

      {/* Vertical Divider */}
      <div className="dt-selector-divider" aria-hidden="true" />

      {/* Subject Section */}
      <div className="dt-selector-section" title="Change Subject">
        <div className="dt-selector-icon-bubble" aria-hidden="true">
          {/* Subject / Book Icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>

        <div className="dt-selector-content">
          <span className="dt-selector-label">Select Subject</span>
          <span className="dt-selector-value">{currentSubjectLabel()}</span>
        </div>

        <div className="dt-selector-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <select
          className="dt-selector-native-select"
          aria-label="Select Subject"
          value={selectedSubject}
          onChange={(e) => onSubjectChange && onSubjectChange(e.target.value)}
        >
          {subjects.map((subject, index) => {
            const val = getOptionValue(subject);
            const lbl = getOptionLabel(subject);
            return (
              <option key={val || index} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

export default BatchSubjectSelector;
