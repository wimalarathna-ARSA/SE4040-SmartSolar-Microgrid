// ============================================================================
// File: MicrogridEdgeSection.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Home page microgrid edge network feature section component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import MotionReveal from './MotionReveal';

/**
 * MicrogridEdgeSection
 * Replaces the old "Decentralized Microgrid Stack" section.
 * Inspired by the Frequenz "Unlock the full potential of local power grids" layout:
 *   - Eyebrow: MICROGRID EDGE CONTROL
 *   - Two-column header: bold left headline + right description
 *   - Central isometric SVG platform illustration
 *   - 6 feature tiles in 2 rows x 3 columns
 */

const FEATURES = [
  {
    icon: 'bi-lightning-charge-fill',
    title: 'Easy set-up & configuration',
    desc: 'Rapid hub deployment with plug-and-play hardware integration, automated NIC-key provisioning, and a guided zero-touch onboarding wizard for solar arrays and BESS containers.',
  },
  {
    icon: 'bi-shield-exclamation',
    title: 'Incident & status reporting',
    desc: 'Real-time grid health monitoring with automated fault alerts, maintenance scheduling, and instant operator notifications for capacity breaches or inverter failures.',
  },
  {
    icon: 'bi-activity',
    title: 'Real-time data collection & monitoring',
    desc: 'Live kWh / kW telemetry streamed into MongoDB time-series collections. Sub-second dashboard refresh with historical trend analysis and exportable audit logs.',
  },
  {
    icon: 'bi-lock-fill',
    title: 'Built-in safety features',
    desc: 'HMAC-SHA256 payload signing, zero-trust cryptographic validation, and role-based access layers ensure every dispatch command is authenticated and tamper-proof.',
  },
  {
    icon: 'bi-cpu-fill',
    title: 'Simulation & backtesting',
    desc: 'Interactive 3D yield simulator powered by an AI forecasting engine. Backtest dispatch strategies against historical irradiance and tariff data before going live.',
  },
  {
    icon: 'bi-person-badge-fill',
    title: 'Secure access control',
    desc: 'Role-based NIC-key authentication, cryptographic QR token generation, and tiered backoffice / operator permissions protect every layer of the platform.',
  },
];

const FeatureTile = ({ icon, title, desc }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(0,255,206,0.06)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(0,255,206,0.35)' : 'rgba(0,255,206,0.1)'}`,
        borderRadius: '12px',
        padding: '28px 24px',
        transition: 'all 0.28s ease',
        cursor: 'default',
        height: '100%',
      }}
    >
      <div
        className="mb-3"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: hovered ? 'rgba(0,255,206,0.15)' : 'rgba(0,255,206,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          color: '#00ffce',
          transition: 'background 0.28s ease',
        }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <h5
        className="fw-bold mb-2"
        style={{ color: '#00ffce', fontSize: '1rem', letterSpacing: '-0.01em' }}
      >
        {title}
      </h5>
      <p
        className="mb-0"
        style={{
          color: hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          transition: 'color 0.28s ease',
        }}
      >
        {desc}
      </p>
    </div>
  );
};

const MicrogridEdgeSection = () => {
  return (
    <section
      id="architecture"
      className="py-5 border-top border-secondary border-opacity-10 position-relative overflow-hidden"
      style={{ backgroundColor: '#04070d' }}
    >
      <div
        className="position-absolute top-0 end-0 pointer-events-none"
        style={{
          width: '520px',
          height: '420px',
          background: 'radial-gradient(ellipse 60% 55% at 95% 5%, rgba(0,255,206,0.07) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="container-fluid px-lg-5 px-3 position-relative" style={{ zIndex: 1 }}>
        <MotionReveal animation="fade-up">
        <div className="row g-4 align-items-start mb-5">
          <div className="col-lg-5 col-md-12">
            <div
              className="text-uppercase fw-bold mb-3"
              style={{ color: '#00ffce', fontSize: '0.76rem', letterSpacing: '0.16em' }}
            >
              MICROGRID EDGE CONTROL
            </div>
            <h2
              className="fw-bold text-white mb-0"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: '1.12', letterSpacing: '-0.03em' }}
            >
              Unlock the full potential
              <br />
              of local power grids
            </h2>
          </div>

          <div className="col-lg-5 col-md-12 ps-lg-5">
            <p className="text-secondary mb-3" style={{ fontSize: '0.96rem', lineHeight: '1.65' }}>
              SOLARX transforms local power grids into intelligent, self-healing energy systems.
              By combining AI-accelerated dispatch, cryptographic validation, and real-time
              telemetry, our platform gives operators full visibility and control from edge
              hardware to provincial energy markets.
            </p>
            <p className="fw-semibold text-white text-opacity-75 mb-0" style={{ fontSize: '0.93rem', lineHeight: '1.55' }}>
              One platform. Every asset. Zero compromise.
            </p>
          </div>
        </div>
        </MotionReveal>

        <div className="d-flex justify-content-center align-items-center my-4 my-lg-5">
          <div style={{ position: 'relative', width: '100%', maxWidth: '720px', aspectRatio: '16/7' }}>
            <svg viewBox="0 0 720 315" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              {[0,1,2,3,4,5,6].map(i => (
                <line key={`hg-${i}`} x1={60+i*90} y1="230" x2={60+i*90-60} y2="290" stroke="rgba(0,255,206,0.08)" strokeWidth="1"/>
              ))}
              {[0,1,2,3,4,5].map(i => (
                <line key={`vg-${i}`} x1="60" y1={230+i*12} x2="600" y2={230+i*12} stroke="rgba(0,255,206,0.05)" strokeWidth="1"/>
              ))}
              <polygon points="360,160 520,220 480,280 320,280 160,220 200,160" fill="rgba(0,255,206,0.04)" stroke="rgba(0,255,206,0.25)" strokeWidth="1.2"/>
              <polygon points="360,172 505,226 468,272 252,272 215,226 360,172" fill="rgba(0,255,206,0.025)" stroke="rgba(0,255,206,0.12)" strokeWidth="0.8"/>
              {[[360,172,360,80],[280,202,280,118],[440,202,440,118]].map(([x1,y1,x2,y2],i) => (
                <line key={`pillar-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,255,206,0.35)" strokeWidth="1" strokeDasharray="4 3"/>
              ))}
              <polygon points="360,80 440,118 440,140 360,102 280,140 280,118" fill="rgba(0,255,206,0.08)" stroke="rgba(0,255,206,0.4)" strokeWidth="1.2"/>
              <circle cx="360" cy="80" r="10" fill="rgba(0,255,206,0.15)" stroke="#00ffce" strokeWidth="1.5"/>
              <circle cx="360" cy="80" r="5" fill="#00ffce" opacity="0.9"/>
              <circle cx="360" cy="80" r="18" fill="rgba(0,255,206,0.05)" stroke="rgba(0,255,206,0.12)" strokeWidth="1"/>
              <circle cx="280" cy="118" r="6" fill="rgba(0,255,206,0.15)" stroke="#00ffce" strokeWidth="1.2"/>
              <circle cx="440" cy="118" r="6" fill="rgba(0,255,206,0.15)" stroke="#00ffce" strokeWidth="1.2"/>
              <path d="M 280 118 Q 360 68 440 118" stroke="rgba(0,255,206,0.3)" strokeWidth="1" fill="none" strokeDasharray="5 3"/>
              <rect x="140" y="200" width="50" height="30" rx="3" fill="rgba(0,255,206,0.06)" stroke="rgba(0,255,206,0.2)" strokeWidth="1"/>
              <line x1="165" y1="200" x2="165" y2="175" stroke="rgba(0,255,206,0.25)" strokeWidth="1"/>
              <rect x="150" y="168" width="30" height="9" rx="2" fill="rgba(0,255,206,0.12)" stroke="#00ffce" strokeWidth="0.8"/>
              <rect x="530" y="200" width="50" height="30" rx="3" fill="rgba(0,255,206,0.06)" stroke="rgba(0,255,206,0.2)" strokeWidth="1"/>
              <rect x="540" y="188" width="30" height="14" rx="3" fill="rgba(0,255,206,0.1)" stroke="#00ffce" strokeWidth="0.8"/>
              <rect x="548" y="185" width="14" height="4" rx="1" fill="#00ffce" opacity="0.6"/>
              <line x1="190" y1="215" x2="250" y2="235" stroke="rgba(0,255,206,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
              <line x1="530" y1="215" x2="470" y2="235" stroke="rgba(0,255,206,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
              <rect x="50" y="60" width="110" height="36" rx="6" fill="rgba(0,255,206,0.07)" stroke="rgba(0,255,206,0.2)" strokeWidth="1"/>
              <text x="105" y="75" textAnchor="middle" fill="#00ffce" fontSize="9" fontFamily="monospace" fontWeight="bold">LIVE kWh</text>
              <text x="105" y="89" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">+2.4 MW  up</text>
              <rect x="560" y="60" width="110" height="36" rx="6" fill="rgba(0,255,206,0.07)" stroke="rgba(0,255,206,0.2)" strokeWidth="1"/>
              <text x="615" y="75" textAnchor="middle" fill="#00ffce" fontSize="9" fontFamily="monospace" fontWeight="bold">BESS STATE</text>
              <text x="615" y="89" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">87%  CHRG</text>
              <rect x="290" y="14" width="140" height="36" rx="6" fill="rgba(0,255,206,0.07)" stroke="rgba(0,255,206,0.2)" strokeWidth="1"/>
              <text x="360" y="29" textAnchor="middle" fill="#00ffce" fontSize="9" fontFamily="monospace" fontWeight="bold">DISPATCH ENGINE</text>
              <text x="360" y="43" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">AI ACTIVE HUBS</text>
            </svg>
          </div>
        </div>

        <div className="row g-4 mt-2">
          {FEATURES.map((feat, idx) => (
            <MotionReveal key={idx} animation="fade-up" delay={0.08 * idx} className="col-lg-4 col-md-6 col-12">
              <FeatureTile {...feat} />
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MicrogridEdgeSection;
