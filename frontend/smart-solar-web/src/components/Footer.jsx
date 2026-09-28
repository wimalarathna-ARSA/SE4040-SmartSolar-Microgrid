// ============================================================================
// File: Footer.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Site-wide footer component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import FrequenzGlobeFooter3D from './3d/FrequenzGlobeFooter3D';

/**
 * Footer
 * Matches the exact Frequenz enterprise footer design:
 * 1. Upper CTA section with centered 3D glowing constellation globe, bold headline, and "↗ Get started" button.
 * 2. Horizontal divider with "Scroll to top" button.
 * 3. Two-column footer: Left column (Company, address, contact, LinkedIn), Right column (Careers with cyan title & "↗ View open positions").
 * 4. Bottom legal links: Cookies, Imprint, Privacy, Trust Center.
 */
const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="position-relative text-light" style={{ backgroundColor: '#020202' }}>
      {/* 
        ========================================================================
        1. UPPER CTA SECTION: Centered 3D Glowing Globe & Enterprise Headline
        ========================================================================
      */}
      <section className="position-relative overflow-hidden py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '520px' }}>
        {/* 3D Glowing Wireframe Globe Canvas */}
        <FrequenzGlobeFooter3D />

        {/* Centered CTA Content */}
        <div className="container position-relative text-center py-5" style={{ zIndex: 2 }}>
          <div
            className="text-uppercase fw-bold mb-3"
            style={{
              color: '#00ffce',
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
            }}
          >
            SØLΛR-X FOR ENTERPRISES
          </div>

          <h2
            className="text-white fw-bold mb-4 mx-auto"
            style={{
              fontSize: 'clamp(2.3rem, 4.4vw, 3.6rem)',
              lineHeight: '1.14',
              letterSpacing: '-0.035em',
              maxWidth: '820px',
            }}
          >
            Leverage the unlimited
            <br />
            flexibility of our platform
          </h2>

          <div
            className="text-light text-opacity-80 mx-auto mb-4"
            style={{
              fontSize: '0.96rem',
              lineHeight: '1.65',
              maxWidth: '640px',
            }}
          >
            <p className="mb-2">
              Are you a technical manager or energy expert looking for new energy solutions or business models?
            </p>
            <p className="mb-2">
              Discover, with us, the many-sided possibilities of our innovative platform.
            </p>
            <p className="mb-0 fw-semibold text-white">
              Let's invent new solutions together!
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="d-inline-flex align-items-center gap-2 fw-bold text-decoration-none"
              style={{
                background: 'linear-gradient(135deg, #00ffce 0%, #00d4b0 100%)',
                color: '#022c26',
                fontSize: '1.1rem',
                padding: '14px 38px',
                borderRadius: '10px',
                boxShadow: '0 0 30px rgba(0,255,206,0.55), 0 8px 24px rgba(0,0,0,0.5)',
                border: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              <span>↗</span> Get started
            </Link>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        2. HORIZONTAL DIVIDER & "SCROLL TO TOP"
        ========================================================================
      */}
      <div className="container position-relative">
        <div className="d-flex justify-content-end mb-2">
          <button
            onClick={scrollToTop}
            className="btn btn-link text-decoration-none text-light p-0 d-flex flex-column align-items-center gap-1 opacity-75 hover-opacity-100"
            style={{ cursor: 'pointer', background: 'none', border: 'none' }}
            title="Scroll to top"
          >
            <i className="bi bi-chevron-up fs-5 text-white"></i>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>
              Scroll to top
            </span>
          </button>
        </div>
        <hr className="my-0" style={{ borderColor: 'rgba(255, 255, 255, 0.25)', opacity: 1 }} />
      </div>

      {/* 
        ========================================================================
        3. MAIN TWO-COLUMN FOOTER CONTENT
        ========================================================================
      */}
      <div className="container py-5">
        <div className="row g-5 justify-content-between align-items-start">
          
          {/* Left Column: Brand, Address, Phone, Email & Social */}
          <div className="col-lg-5 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-4">
              <img src="/solarx-logo.png" alt="SØLΛR-X" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
              <h3
                className="text-white fw-bold mb-0"
                style={{ fontSize: '1.9rem', letterSpacing: '-0.025em' }}
              >
                SØLΛR<span style={{ color: '#00ffce' }}>-X</span>
              </h3>
            </div>

            <div className="text-secondary small mb-4" style={{ lineHeight: '1.65', fontSize: '0.88rem' }}>
              SØLΛR-X Energy Platform PLC<br />
              Union Place, Colombo 02<br />
              00200 Colombo, Sri Lanka
            </div>

            <div className="mb-4">
              <div className="text-white fw-bold small mb-1" style={{ fontSize: '0.9rem' }}>
                +94 11 7 555 874
              </div>
              <a
                href="mailto:info@solarx.energy"
                className="text-white fw-bold text-decoration-none small"
                style={{ fontSize: '0.9rem' }}
              >
                info@solarx.energy
              </a>
            </div>

            <div>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="d-inline-flex align-items-center justify-content-center text-white text-decoration-none rounded-1"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease',
                }}
                title="LinkedIn"
              >
                <i className="bi bi-linkedin" style={{ fontSize: '0.9rem' }}></i>
              </a>
            </div>
          </div>

          {/* Right Column: Careers */}
          <div className="col-lg-5 col-md-6">
            <h3
              className="fw-bold mb-3"
              style={{
                color: '#00ffce',
                fontSize: '1.85rem',
                letterSpacing: '-0.02em',
              }}
            >
              Careers
            </h3>

            <p
              className="text-light text-opacity-80 small mb-4"
              style={{
                maxWidth: '400px',
                lineHeight: '1.6',
                fontSize: '0.92rem',
              }}
            >
              Be part of our team leading the charge in national power management and decentralized solar microgrids.
            </p>

            <div>
              <a
                href="mailto:careers@solarx.energy"
                className="d-inline-flex align-items-center gap-2 fw-semibold"
                style={{
                  border: '1.5px solid #00ffce',
                  color: '#00ffce',
                  backgroundColor: 'transparent',
                  padding: '10px 22px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 206, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 206, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>↗</span> View open positions
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        4. BOTTOM LEGAL BAR
        ========================================================================
      */}
      <div className="container pb-4 pt-2">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-secondary small" style={{ fontSize: '0.78rem' }}>
          <div>
            &copy; {new Date().getFullYear()} SØLΛR-X Energy Platform PLC
          </div>

          <div className="d-flex align-items-center gap-4 flex-wrap">
            <a href="#cookies" onClick={(e) => e.preventDefault()} className="text-secondary text-decoration-none hover-white transition-colors">
              Cookies
            </a>
            <a href="#imprint" onClick={(e) => e.preventDefault()} className="text-secondary text-decoration-none hover-white transition-colors">
              Imprint
            </a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-secondary text-decoration-none hover-white transition-colors">
              Privacy
            </a>
            <a href="#trust" onClick={(e) => e.preventDefault()} className="text-secondary text-decoration-none hover-white transition-colors">
              Trust Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;