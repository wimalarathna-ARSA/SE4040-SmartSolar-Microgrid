// ============================================================================
// File: FloatingDotNavigation.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Floating section dot navigation for single-page scroll layouts.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
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

/**
 * FloatingDotNavigation
 * Sticky/fixed vertical dot navigation rail pinned to the left edge across all homepage sections.
 * Automatically tracks scroll progress and illuminates the corresponding glowing cyan dot,
 * matching Frequenz.com exactly.
 */
const FloatingDotNavigation = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;

          // If at very top
          if (scrollPosition < 80) {
            setActiveIdx(0);
            ticking = false;
            return;
          }

          // If near bottom of page
          if (scrollPosition + windowHeight >= docHeight - 80) {
            setActiveIdx(SECTIONS.length - 1);
            ticking = false;
            return;
          }

          // Find current active section
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
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on initial load
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id, idx) => {
    setActiveIdx(idx);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="freq-floating-nav d-none d-md-flex"
      aria-label="Page section navigation"
      style={{ position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 1050 }}
    >
      {/* Background vertical connecting track */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          bottom: '6px',
          left: '50%',
          width: '1px',
          backgroundColor: 'rgba(0, 255, 206, 0.12)',
          transform: 'translateX(-50%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Animated active depth line */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          width: '2px',
          height: `${(activeIdx / (SECTIONS.length - 1)) * 100}%`,
          background: 'linear-gradient(180deg, rgba(0,255,206,0.3) 0%, #00ffce 100%)',
          boxShadow: '0 0 8px rgba(0, 255, 206, 0.6)',
          transform: 'translateX(-50%)',
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {SECTIONS.map((sec, idx) => {
        const isActive = activeIdx === idx;
        return (
          <div key={sec.id} className="freq-nav-dot-item" style={{ zIndex: 2 }}>
            <button
              type="button"
              onClick={() => scrollTo(sec.id, idx)}
              className={`freq-floating-dot ${isActive ? 'active motion-glow-pulse' : ''}`}
              title={sec.label}
              aria-label={`Scroll to ${sec.label}`}
              aria-current={isActive ? 'true' : undefined}
            />
            {/* Tooltip on Hover */}
            <div className="freq-dot-tooltip">
              {sec.label}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default FloatingDotNavigation;
