// ============================================================================
// File: ConstellationMeshSVG.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Animated SVG background constellation mesh component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';

const ConstellationMeshSVG = ({ theme = 'blue' }) => {
  const isGreen = theme === 'green';

  const baseStroke = isGreen
    ? 'rgba(167, 243, 208, 0.35)'
    : 'rgba(160, 225, 255, 0.35)';

  const accentStroke = isGreen
    ? 'rgba(52, 211, 153, 0.45)'
    : 'rgba(0, 240, 255, 0.4)';

  const midStroke = isGreen
    ? 'rgba(52, 211, 153, 0.35)'
    : 'rgba(0, 240, 255, 0.35)';

  const glowFill = isGreen
    ? 'rgba(52, 211, 153, 0.25)'
    : 'rgba(0, 240, 255, 0.2)';

  const nodeStroke = isGreen ? '#10b981' : '#00f0ff';

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <filter
          id={`meshNodeGlow-${theme}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>
    </svg>
  );
};

export default ConstellationMeshSVG;