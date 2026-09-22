// ============================================================================
// File: IntroductionSection.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Home page introduction section component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import MotionReveal from './MotionReveal';

/**
 * IntroductionSection
 * Recreates the iconic Frequenz compact showcase card with the exact bottom-left emerald/cyan atmospheric
 * lighting flare and top-right subtle wireframe constellation lines as seen in the reference screenshot.
 */
const IntroductionSection = () => {
  return (
    <section
      id="introduction"
      className="position-relative py-5 px-3 overflow-hidden d-flex align-items-center"
      style={{
        backgroundColor: '#020202',
        backgroundImage: `
          radial-gradient(ellipse 75% 65% at 0% 95%, rgba(0, 230, 170, 0.58) 0%, rgba(0, 160, 130, 0.32) 32%, rgba(0, 70, 60, 0.15) 55%, transparent 75%),
          radial-gradient(ellipse 55% 55% at 95% 5%, rgba(130, 30, 85, 0.32) 0%, rgba(60, 12, 40, 0.15) 45%, transparent 70%),
          linear-gradient(180deg, #020202 0%, #03080c 100%)
        `,
        minHeight: '82vh',
      }}
    >
      {/* Decorative Subtle Constellation Wireframe Lines in Top Right Background */}
      <svg
        className="position-absolute top-0 end-0 pointer-events-none motion-float"
        style={{ width: '420px', height: '360px', opacity: 0.45, zIndex: 1 }}
        viewBox="0 0 420 360"
        fill="none"
      >
        <circle cx="290" cy="70" r="3.5" fill="#00ffce" />
        <circle cx="380" cy="110" r="2.5" fill="#00ffce" />
        <circle cx="250" cy="160" r="3" fill="#00ffce" />
        <circle cx="340" cy="200" r="4" fill="#00ffce" />
        <circle cx="400" cy="260" r="2.5" fill="#00ffce" />
        <circle cx="280" cy="280" r="3.5" fill="#00ffce" />
        <line x1="290" y1="70" x2="380" y2="110" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="290" y1="70" x2="250" y2="160" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="380" y1="110" x2="340" y2="200" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="250" y1="160" x2="340" y2="200" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="340" y1="200" x2="400" y2="260" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="250" y1="160" x2="280" y2="280" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
        <line x1="340" y1="200" x2="280" y2="280" stroke="rgba(0, 255, 206, 0.35)" strokeWidth="1" />
      </svg>

      <div className="container-fluid px-lg-5 px-3 position-relative" style={{ zIndex: 2 }}>
        {/* Compact, Refined Light Frosted Card Container ("Square") */}
        <MotionReveal
          animation="scale-up"
          className="mx-auto text-dark position-relative shadow-2xl"
          style={{
            background: 'linear-gradient(155deg, #e9eef5 0%, #dde4ed 100%)',
            borderRadius: '24px',
            padding: 'clamp(28px, 3.5vw, 44px) clamp(28px, 4vw, 50px)',
            maxWidth: '1040px',
            color: '#0c0233',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 255, 206, 0.08)',
          }}
        >
          {/* Top Half: Eyebrow, Main Headline & Narrative */}
          <div className="row g-4 align-items-start mb-4 pb-2">
            {/* Left Column: Eyebrow + Large Bold Headline */}
            <div className="col-lg-6 col-md-12">
              <div
                className="text-uppercase fw-bold mb-3"
                style={{
                  color: '#5b697e',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                }}
              >
                INTRODUCTION
              </div>
              <h2
                className="fw-bold mb-0"
                style={{
                  fontSize: 'clamp(1.85rem, 3.1vw, 2.75rem)',
                  lineHeight: '1.14',
                  letterSpacing: '-0.03em',
                  color: '#0c0233',
                }}
              >
                Orchestrate complex setups of distributed energy resources <span style={{ fontWeight: '800' }}>with ease.</span>
              </h2>
            </div>

            {/* Right Column: Narrative Copy */}
            <div className="col-lg-6 col-md-12 ps-lg-4">
              <p
                style={{
                  fontSize: '0.94rem',
                  lineHeight: '1.6',
                  color: '#2b3648',
                  marginBottom: '0.85rem',
                }}
              >
                Managing DERs like rooftop photovoltaic arrays, high-capacity BESS battery storage, EV charging slots, and prosumer nodes is key for the future of energy.
              </p>

              <p
                className="fw-bold"
                style={{
                  fontSize: '0.96rem',
                  lineHeight: '1.55',
                  color: '#0c0233',
                  marginBottom: '0.85rem',
                }}
              >
                We enable you to run these challenging setups.
              </p>

              <p
                style={{
                  fontSize: '0.91rem',
                  lineHeight: '1.6',
                  color: '#3e4c61',
                  marginBottom: '1rem',
                }}
              >
                These island microgrids can be operated by AI-accelerated dispatch engines and our enterprise platform whilst connected to provincial energy markets for risk diversification, significant tariff savings, and maximum grid stability.
              </p>

              <a
                href="#digital-twin"
                className="d-inline-flex align-items-center gap-1 fw-semibold text-decoration-none"
                style={{
                  color: '#0c0233',
                  fontSize: '0.9rem',
                  borderBottom: '1.5px solid #0c0233',
                  paddingBottom: '2px',
                  transition: 'opacity 0.2s ease',
                }}
              >
                Explore 3D digital twin below to find out more <span style={{ fontSize: '0.95rem' }}>↓</span>
              </a>
            </div>
          </div>

          {/* Bottom Half: 3 Compact Columns - Manage, Store, Trade */}
          <div className="row g-4 pt-3 border-top" style={{ borderColor: 'rgba(12, 2, 51, 0.12)' }}>
            
            {/* Column 1: Manage */}
            <div className="col-lg-4 col-md-12">
              <MotionReveal animation="fade-up" delay={0.1} className="d-flex flex-column h-100 pe-lg-2">
                {/* Equalizer Icon with Cyan Accent */}
                <div className="d-flex align-items-center gap-2 mb-2 pb-1">
                  <div className="d-flex align-items-end gap-1" style={{ height: '22px' }}>
                    <div style={{ width: '4px', height: '13px', backgroundColor: '#0c0233', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '20px', backgroundColor: '#00cbb0', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '15px', backgroundColor: '#0c0233', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '9px', backgroundColor: '#00cbb0', borderRadius: '2px' }} />
                  </div>
                  <h3 className="fw-bold mb-0 fs-5" style={{ color: '#0c0233', letterSpacing: '-0.02em' }}>
                    Manage
                  </h3>
                </div>

                <div className="fw-bold mb-2" style={{ fontSize: '0.88rem', color: '#0c0233', lineHeight: '1.4' }}>
                  Actively manage and customize local energy systems.
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0.75rem' }}>
                  Implement decentralized energy resources that utilize real-time data analysis and intelligent algorithms for optimized energy efficiency and savings.
                </p>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0' }}>
                  Enhance energy resilience through local power generation and distributed grid node orchestration across Sri Lankan provinces.
                </p>
              </MotionReveal>
            </div>

            {/* Column 2: Store */}
            <div className="col-lg-4 col-md-12">
              <MotionReveal animation="fade-up" delay={0.2} className="d-flex flex-column h-100 pe-lg-2">
                {/* Ring / Battery Circle Icon with Cyan Accent */}
                <div className="d-flex align-items-center gap-2 mb-2 pb-1">
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '2.8px solid #00cbb0',
                      borderTopColor: '#0c0233',
                      display: 'inline-block',
                    }}
                  />
                  <h3 className="fw-bold mb-0 fs-5" style={{ color: '#0c0233', letterSpacing: '-0.02em' }}>
                    Store
                  </h3>
                </div>

                <div className="fw-bold mb-2" style={{ fontSize: '0.88rem', color: '#0c0233', lineHeight: '1.4' }}>
                  Capture and store excess energy to maximize the utilization of renewable power sources.
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0.75rem' }}>
                  Leverage dynamic BESS container storage to reduce dependence on expensive peak-hour grid consumption and peak tariff surcharges.
                </p>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0' }}>
                  Take advantage of storage capacities to schedule prosumer battery slots during low-price windows while avoiding sell-offs at low prices.
                </p>
              </MotionReveal>
            </div>

            {/* Column 3: Trade */}
            <div className="col-lg-4 col-md-12">
              <MotionReveal animation="fade-up" delay={0.3} className="d-flex flex-column h-100">
                {/* Node Square Icon with Cyan Accent */}
                <div className="d-flex align-items-center gap-2 mb-2 pb-1">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2.2px solid #0c0233',
                      borderTop: '2.2px solid #00cbb0',
                      borderRight: '2.2px solid #00cbb0',
                      borderRadius: '3px',
                      display: 'inline-block',
                    }}
                  />
                  <h3 className="fw-bold mb-0 fs-5" style={{ color: '#0c0233', letterSpacing: '-0.02em' }}>
                    Trade
                  </h3>
                </div>

                <div className="fw-bold mb-2" style={{ fontSize: '0.88rem', color: '#0c0233', lineHeight: '1.4' }}>
                  Connect microgrids to various energy markets.
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0.75rem' }}>
                  Enable power trading, balancing energy for grid stability, and offering demand response capabilities via cryptographically verified QR tokens.
                </p>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0.75rem' }}>
                  Foresee and dynamically respond to price changes, weather conditions, and prosumer demand spikes in real-time.
                </p>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.55', color: '#3d4b60', marginBottom: '0' }}>
                  Foster more efficient and flexible energy procurement strategies for both prosumers and grid operators.
                </p>
              </MotionReveal>
            </div>

          </div>
        </MotionReveal>
      </div>
    </section>
  );
};

export default IntroductionSection;