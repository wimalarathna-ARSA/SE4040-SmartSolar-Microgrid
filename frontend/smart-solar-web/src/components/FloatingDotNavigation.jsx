import React from 'react';

const SECTIONS = [
  { id: 'hero', label: 'Power Reimagined' },
  { id: 'introduction', label: 'Orchestrate DERs' },
  { id: 'digital-twin', label: '3D Digital Twin' },
  { id: 'functionalities', label: 'Platform Functionalities' },
  { id: 'stats', label: 'Live Grid Telemetry' },
  { id: 'hubs', label: 'Active Microgrid Hubs' },
  { id: 'radar-map', label: 'Geographic Island Radar' },
  { id: 'simulator', label: '3D Yield Simulator' },
  { id: 'architecture', label: 'System Architecture' },
  { id: 'footer', label: 'Company & Support' },
];

const FloatingDotNavigation = () => {
  return (
    <nav
      className="freq-floating-nav d-none d-md-flex"
      aria-label="Page section navigation"
      style={{ position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 1050 }}
    >
      {SECTIONS.map((sec) => (
        <div key={sec.id} className="freq-nav-dot-item" style={{ zIndex: 2 }}>
          <button
            type="button"
            className="freq-floating-dot"
            title={sec.label}
            aria-label={`Scroll to ${sec.label}`}
          />
        </div>
      ))}
    </nav>
  );
};

export default FloatingDotNavigation;