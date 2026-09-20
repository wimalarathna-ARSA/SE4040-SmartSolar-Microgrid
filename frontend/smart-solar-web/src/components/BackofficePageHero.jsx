// ============================================================================
// File: BackofficePageHero.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Reusable hero banner component for Backoffice section pages.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BackofficePageHero
 * Professional banner for backoffice pages using real project images.
 * Additive only - existing headers/cards below are untouched.
 */
const BackofficePageHero = ({
  imageSrc,
  eyebrow = 'SOLARX Backoffice',
  title,
  subtitle,
  breadcrumb = [],
}) => {
  return (
    <div
      className="position-relative overflow-hidden mb-4"
      style={{
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        minHeight: '190px',
      }}
    >
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(95deg, rgba(3,25,45,0.94) 30%, rgba(3,25,45,0.72) 55%, rgba(3,25,45,0.30) 100%)',
        }}
      />
      <div className="position-relative d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 p-4 p-lg-5" style={{ zIndex: 1 }}>
        <div style={{ maxWidth: '640px' }}>
          {breadcrumb.length > 0 && (
            <div className="d-flex align-items-center gap-2 mb-2 small" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Link to="/backoffice" style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 600 }}>Dashboard</Link>
              {breadcrumb.map((c, i) => (
                <span key={i} className="d-flex align-items-center gap-2">
                  <span style={{ opacity: 0.5 }}>›</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{c}</span>
                </span>
              ))}
            </div>
          )}
          <div
            className="text-uppercase fw-bold mb-2"
            style={{ color: '#00ffce', fontSize: '0.72rem', letterSpacing: '0.16em' }}
          >
            {eyebrow}
          </div>
          <h2 className="fw-bold text-white mb-2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <img src="/images/solar-hero-panels.jpg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
          <img src="/images/solar-rooftop-home.jpg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
          <img src="/images/solar-field-sunset.jpeg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
        </div>
      </div>
    </div>
  );
};

export default BackofficePageHero;
