// ============================================================================
// File: PlatformFunctionalitiesSection.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Home page platform functionalities overview section.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState } from 'react';
import MotionReveal from './MotionReveal';

/**
 * PlatformFunctionalitiesSection
 * Recreates the Frequenz "The one-stop platform for autonomous energy management" section
 * with 8 interactive functionality tiles.
 * 
 * Hover Behavior (Matching Reference Image 2):
 * - Normal: Dark glass tile with SVG icon + cyan title at the bottom.
 * - Hover: Smoothly transforms into a solid neon cyan card (#00ffce) with deep dark navy (#0c0233)
 *   title at the top and a bulleted list of technical capabilities.
 */
const PlatformFunctionalitiesSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const tiles = [
    {
      id: 'config',
      title: 'Microgrid Configuration',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <circle cx="21" cy="21" r="14" stroke="#ffffff" strokeWidth="2" strokeDasharray="14 10" />
          <circle cx="21" cy="21" r="6" stroke="#00ffce" strokeWidth="2" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Rapid multi-station node provisioning across Sri Lanka',
        'Dynamic BESS battery slot capacity thresholds',
        'Substation transformer & inverter voltage parameters',
        'Automated CEB grid synchronization rules',
      ],
    },
    {
      id: 'trading',
      title: 'Prosumer Trading Apps',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="10" y="10" width="22" height="22" rx="3" stroke="#ffffff" strokeWidth="2" />
          <circle cx="21" cy="21" r="4" fill="#00ffce" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        '7-Day window reservation booking & slot claims',
        'Dynamic kWh pricing & solar feed-in tariffs',
        'Instant wallet credit & prosumer yield monetization',
        'Peer-to-peer surplus renewable power distribution',
      ],
    },
    {
      id: 'api',
      title: 'API Ecosystem',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <circle cx="16" cy="21" r="5" stroke="#ffffff" strokeWidth="2" />
          <circle cx="26" cy="21" r="5" stroke="#00ffce" strokeWidth="2" />
          <path d="M19 18L23 24M23 18L19 24" stroke="#00ffce" strokeWidth="1.5" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Realtime component event dispatching',
        'Advanced prime broker functionality',
        'Ancillary Services Markets access',
        'Several utility APIs for seamless microgrid management and monitoring',
      ],
    },
    {
      id: 'twin',
      title: '3D Digital Twin Cockpit',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="12" y="10" width="18" height="22" rx="2" stroke="#ffffff" strokeWidth="2" />
          <line x1="16" y1="16" x2="26" y2="16" stroke="#00ffce" strokeWidth="2" />
          <line x1="16" y1="21" x2="24" y2="21" stroke="#00ffce" strokeWidth="2" />
          <line x1="16" y1="26" x2="22" y2="26" stroke="#00ffce" strokeWidth="2" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'High-fidelity Three.js monocrystalline solar arrays',
        'Interactive 360° orbital camera with component touring',
        'Dawn, Noon, Dusk & Night lighting simulation',
        'Real-time irradiance and raycast component telemetry',
      ],
    },
    {
      id: 'ai',
      title: 'AI Analytics & Alerts',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="10" y="12" width="22" height="18" rx="3" stroke="#ffffff" strokeWidth="2" />
          <path d="M7 17H10M7 25H10M32 17H35M32 25H35" stroke="#00ffce" strokeWidth="2" strokeLinecap="round" />
          <text x="14" y="25" fill="#00ffce" fontSize="10" fontWeight="bold" fontFamily="monospace">AI</text>
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Machine learning energy yield forecasting',
        'Automatic battery degradation & anomaly alerts',
        'Dynamic curtailment prevention algorithms',
        'Weather-correlated solar irradiance predictions',
      ],
    },
    {
      id: 'radar',
      title: 'Island Grid Radar',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <circle cx="21" cy="21" r="13" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 6" />
          <circle cx="21" cy="21" r="8" stroke="#00ffce" strokeWidth="1.5" />
          <circle cx="21" cy="21" r="3" fill="#00ffce" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Geographic GPS projection of provincial solar nodes',
        'Real-time transmission line pulse animations',
        'Colombo, Kandy, Galle, and Jaffna live telemetry',
        'Province-level operational status & load distribution',
      ],
    },
    {
      id: 'android',
      title: 'Android Native Client',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="12" y="10" width="18" height="22" rx="3" stroke="#ffffff" strokeWidth="2" />
          <circle cx="21" cy="21" r="4" stroke="#00ffce" strokeWidth="1.5" />
          <line x1="18" y1="27" x2="24" y2="27" stroke="#00ffce" strokeWidth="1.5" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Pure native Android app with SQLite local cache',
        'Dynamic offline QR token generation & verification',
        'Biometric authentication & NIC-key authorization',
        'Push notifications for reservation approvals',
      ],
    },
    {
      id: 'reports',
      title: 'Reports & Compliance',
      icon: (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="11" y="9" width="20" height="24" rx="2" stroke="#ffffff" strokeWidth="2" />
          <line x1="15" y1="15" x2="25" y2="15" stroke="#00ffce" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="15" y1="20" x2="27" y2="20" stroke="#00ffce" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="15" y1="25" x2="23" y2="25" stroke="#00ffce" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="31" cy="11" r="2.5" fill="#a855f7" />
        </svg>
      ),
      bullets: [
        'Comprehensive energy dispatch audit trail',
        'CEB regulatory compliance reporting & analytics',
        'Operator check-in / check-out verification logs',
        'Exportable CSV and PDF performance summaries',
      ],
    },
  ];

  return (
    <section
      id="functionalities"
      className="position-relative py-5 px-3 overflow-hidden"
      style={{
        backgroundColor: '#020202',
        backgroundImage: `
          linear-gradient(115deg, rgba(0, 255, 206, 0.42) 0%, rgba(0, 190, 160, 0.22) 18%, rgba(2, 20, 22, 0.1) 36%, transparent 52%),
          radial-gradient(ellipse 65% 55% at 92% 15%, rgba(120, 25, 75, 0.25) 0%, transparent 65%),
          linear-gradient(180deg, #020202 0%, #03080c 100%)
        `,
      }}
    >
          <div aria-hidden="true" className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 0 }}>
        <img src="/images/solar-field-sunset.jpeg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14 }} />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(180deg, #020202 0%, rgba(2,2,2,0.6) 30%, rgba(2,2,2,0.6) 70%, #020202 100%)' }} />
      </div>
      <div className="container-fluid px-lg-5 px-3 py-4 position-relative" style={{ zIndex: 1 }}>
        {/* Section Header */}
        <MotionReveal animation="fade-up" className="row g-4 align-items-start mb-5 pb-2">
          {/* Left Column: Eyebrow + Large Bold Headline */}
          <div className="col-lg-6 col-md-12 ps-lg-4">
            <div
              className="text-uppercase fw-bold mb-3"
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '0.8rem',
                letterSpacing: '0.14em',
              }}
            >
              PLATFORM FUNCTIONALITIES
            </div>
            <h2
              className="text-white fw-bold mb-0"
              style={{
                fontSize: 'clamp(2.2rem, 3.8vw, 3.4rem)',
                lineHeight: '1.12',
                letterSpacing: '-0.035em',
              }}
            >
              The <span className="fw-bolder">one-stop platform</span>
              <br />
              for autonomous
              <br />
              energy management.
            </h2>
          </div>

          {/* Right Column: Platform Description */}
          <div className="col-lg-6 col-md-12 ps-lg-5 text-light text-opacity-80">
            <p style={{ fontSize: '0.96rem', lineHeight: '1.65', marginBottom: '1rem', color: '#c9d4e2' }}>
              Set up microgrid assets in minutes with our highly automated system. Monitor live solar yield, BESS battery storage banks, and prosumer slots in real time. Validate energy transactions with zero-trust HMAC-SHA256 cryptography and optimize electricity dispatch.
            </p>
            <p style={{ fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '0', color: '#9baec4' }}>
              These are just a few of the many functionalities of our enterprise platform. Hover over any tile below to explore details.
            </p>
          </div>
        </MotionReveal>


        {/* 8 Platform Functionality Cards Grid */}
        <div className="row g-3 px-lg-4">
          {tiles.map((tile, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div key={tile.id} className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <MotionReveal animation="fade-up" delay={0.06 * idx}>
                  <div
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="position-relative overflow-hidden cursor-pointer"
                  style={{
                    height: '240px',
                    borderRadius: '8px',
                    border: isHovered ? '1.5px solid #00ffce' : '1px solid rgba(255, 255, 255, 0.22)',
                    backgroundColor: isHovered ? '#00ffce' : 'transparent',
                    color: isHovered ? '#0c0233' : '#ffffff',
                    padding: '24px 22px',
                    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: isHovered
                      ? '0 0 35px rgba(0, 255, 206, 0.65), 0 15px 30px rgba(0, 0, 0, 0.6)'
                      : 'none',
                    transform: isHovered ? 'translateY(-3px)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isHovered ? 'flex-start' : 'space-between',
                  }}
                >
                  {/* NON-HOVERED STATE: Top Icon + Bottom Cyan Title */}
                  {!isHovered && (
                    <>
                      <div>
                        {tile.icon}
                      </div>
                      <div>
                        <h4
                          className="fw-bold mb-0"
                          style={{
                            color: '#00ffce',
                            fontSize: '1.18rem',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.3',
                          }}
                        >
                          {tile.title}
                        </h4>
                      </div>
                    </>
                  )}

                  {/* HOVERED STATE: Solid #00ffce with Dark Navy Title at top + Feature Bullets */}
                  {isHovered && (
                    <div className="d-flex flex-column h-100 justify-content-between">
                      <div>
                        <h4
                          className="fw-bold mb-2"
                          style={{
                            color: '#0c0233',
                            fontSize: '1.16rem',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.25',
                          }}
                        >
                          {tile.title}
                        </h4>

                        <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                          {tile.bullets.map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className="d-flex align-items-start"
                              style={{
                                color: '#0c0233',
                                fontSize: '0.8rem',
                                lineHeight: '1.38',
                                fontWeight: '500',
                              }}
                            >
                              <span className="me-1 fw-bold" style={{ color: '#0c0233', fontSize: '0.9rem', lineHeight: '1.2' }}>
                                ›
                              </span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </MotionReveal>
            </div>
          );
          })}
        </div>
      </div>     
    </section>
  );
};

export default PlatformFunctionalitiesSection;