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
    </section>
  );
};

export default PlatformFunctionalitiesSection;