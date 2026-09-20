import React, { useState, useEffect } from 'react';

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
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollPosition < 80) {
        setActiveIdx(0);
        return;
      }

      if (scrollPosition + windowHeight >= docHeight - 80) {
        setActiveIdx(SECTIONS.length - 1);
        return;
      }

      let currentIdx = 0;
      const triggerPoint = scrollPosition + windowHeight * 0.38;

      for (let i = 0; i < SECTIONS.length; i++) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollPosition;
          if (triggerPoint >= top) {
            currentIdx = i;
          }
        }
      }

      setActiveIdx(currentIdx);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className="freq-floating-nav d-none d-md-flex"
      aria-label="Page section navigation"
      style={{ position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 1050 }}
    >
      {SECTIONS.map((sec, idx) => {
        const isActive = activeIdx === idx;
        return (
          <div key={sec.id} className="freq-nav-dot-item" style={{ zIndex: 2 }}>
            <button
              type="button"
              className={`freq-floating-dot ${isActive ? 'active' : ''}`}
              title={sec.label}
              aria-label={`Scroll to ${sec.label}`}
              aria-current={isActive ? 'true' : undefined}
            />
          </div>
        );
      })}
    </nav>
  );
};

export default FloatingDotNavigation;