import React from 'react';
import realisticEducationSvg from '../../assets/digitute_realistic_education_resized.svg';
/**
 * Realistic Educational Illustration Component
 * Displays the high-detail realistic DigiTute educational SVG (books, graduation cap, potted plant)
 * consistently across Dashboard, Academics, Study Material, Finance, and Settings.
 */
export function EducationIllustration({ className = '', style = {} }) {
  return (
    <div 
      className={`education-illustration-wrap ${className}`}
      style={style}
      aria-hidden="true"
    >
      <img
        src={realisticEducationSvg}
        alt="DigiTute realistic educational illustration with books, graduation cap and plant"
        className="education-illustration-img"
      />
    </div>
  );
}

export default EducationIllustration;
