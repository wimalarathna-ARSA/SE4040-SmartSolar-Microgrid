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

const Footer = () => {
  return (
    <footer
      id="footer"
      className="position-relative text-light"
      style={{ backgroundColor: '#020202' }}
    >
      {/* =========================================================================
          1. UPPER CTA SECTION
          ========================================================================= */}

      <section
        className="position-relative overflow-hidden py-5 d-flex align-items-center justify-content-center"
        style={{ minHeight: '520px' }}
      >
        <FrequenzGlobeFooter3D />

        <div
          className="container position-relative text-center py-5"
          style={{ zIndex: 2 }}
        >
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
                boxShadow:
                  '0 0 30px rgba(0,255,206,0.55), 0 8px 24px rgba(0,0,0,0.5)',
                border: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              <span>↗</span> Get started
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;