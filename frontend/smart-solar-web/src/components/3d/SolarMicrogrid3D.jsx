import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);
  const [activeTooltip, setActiveTooltip] = useState({
    name: 'Solar PV Tracker Array',
    details: 'Dual-Axis High-Efficiency Monocrystalline Silicon (48 kW peak capacity)',
  });

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      <div ref={mountRef} className="w-100 h-100" style={{ cursor: 'grab' }} />

      {/* Floating 3D Tooltip (Raycasting) */}
      {activeTooltip && (
        <div
          className="position-absolute glass-panel-glow p-2 px-3 rounded-3 text-white pointer-events-none"
          style={{
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div className="fw-bold text-info small d-flex align-items-center gap-1">
            <i className="bi bi-pin-map-fill" /> {activeTooltip.name}
          </div>
          <div className="text-light smaller" style={{ fontSize: '0.82rem' }}>
            {activeTooltip.details}
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarMicrogrid3D;