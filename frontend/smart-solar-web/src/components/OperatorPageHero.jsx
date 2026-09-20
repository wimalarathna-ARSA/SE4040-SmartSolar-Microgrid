// ============================================================================
// File: OperatorPageHero.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Reusable hero banner component for Grid Operator section pages.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

const OperatorPageHero = ({
  imageSrc,
  eyebrow = 'SOLARX • Grid Operations',
  title,
  subtitle,
  breadcrumb = [],
}) => {
  return (
    <div
      className="position-relative overflow-hidden mb-4"
      style={{
        borderRadius: '18px',
        minHeight: '190px',
      }}
    >
      <div
        className="position-relative d-flex align-items-center p-4"
        style={{
          minHeight: '190px',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          {breadcrumb.length > 0 && (
            <div
              className="d-flex align-items-center gap-2 mb-2 small"
              style={{
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Link
                to="/operator"
                style={{
                  color: '#6ee7b7',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Operations
              </Link>

              {breadcrumb.map((c, i) => (
                <span
                  key={i}
                  className="d-flex align-items-center gap-2"
                >
                  <span style={{ opacity: 0.5 }}>›</span>
                  <span
                    style={{
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {c}
                  </span>
                </span>
              ))}
            </div>
          )}

          <div
            className="text-uppercase fw-bold mb-2"
            style={{
              color: '#6ee7b7',
              fontSize: '0.72rem',
              letterSpacing: '0.16em',
            }}
          >
            {eyebrow}
          </div>

          <h2
            className="fw-bold text-white mb-2"
            style={{
              fontSize: '2rem',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="mb-0"
              style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorPageHero;