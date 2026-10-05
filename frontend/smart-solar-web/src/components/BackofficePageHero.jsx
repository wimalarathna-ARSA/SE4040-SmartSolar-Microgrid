// ============================================================================
// File: BackofficePageHero.jsx
// Description: Reusable hero banner for Backoffice section pages.
// Theme: #F8F8F8 background, #063127 primary, #686053 muted (matches reference).
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';

const BackofficePageHero = ({
  imageSrc = '',
  eyebrow = 'SOLARX Backoffice',
  title,
  subtitle,
  breadcrumb = [],
}) => {
  return (
    <div className="position-relative overflow-hidden mb-4 rounded-4 shadow-sm min-h-[190px] bg-[#063127] animate-[bl-fade-in_600ms_ease-out_both] motion-reduce:animate-none">
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={(e) => { e.currentTarget.classList.add('d-none'); }}
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover opacity-25"
        />
      )}
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-to-r from-[#063127] via-[#063127]/60 to-transparent" />
      <div className="position-relative d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 p-4 p-lg-5 z-1 animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_100ms_both] motion-reduce:animate-none">
        <div className="mw-100 max-w-[640px]">
          {breadcrumb.length > 0 && (
            <div className="d-flex align-items-center gap-2 mb-2 small">
              <Link to="/backoffice" className="text-decoration-none fw-semibold text-[#F8F8F8] opacity-75">Dashboard</Link>
              {breadcrumb.map((c, i) => (
                <span key={i} className="d-flex align-items-center gap-2">
                  <span className="opacity-50 text-[#F8F8F8]">›</span>
                  <span className="fw-semibold text-[#F8F8F8]">{c}</span>
                </span>
              ))}
            </div>
          )}
          <div className="text-uppercase fw-bold mb-2 text-[#F8F8F8] opacity-75 text-[0.72rem] tracking-[0.16em]">
            {eyebrow}
          </div>
          <h2 className="fw-bold mb-2 text-[#F8F8F8] text-[clamp(1.5rem,2.6vw,2.1rem)] tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mb-0 text-[#F8F8F8] opacity-75 text-[0.92rem] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <span className="rounded-pill px-3 py-2 text-[0.75rem] fw-bold bg-[#F8F8F8] text-[#063127]">
            Backoffice
          </span>
        </div>
      </div>
    </div>
  );
};

export default BackofficePageHero;
