import React from 'react';
export function HeroSection({
  label = 'TEACHER PORTAL',
  title = 'Welcome Back!',
  subtitle = 'Manage your classes, students, and attendance'
}) {
  return (
    <section className="dt-hero-section" aria-label="Hero Introduction">
      <div className="dt-hero-content">
        {label && <span className="dt-hero-label">{label}</span>}
        {title && <h1 className="dt-hero-title">{title}</h1>}
        {subtitle && <p className="dt-hero-subtitle">{subtitle}</p>}
      </div>

      <div className="dt-hero-illustration-container" aria-hidden="true">
        <div className="dt-hero-illustration">
          <span className="dt-hero-emojis">📚🎓</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
