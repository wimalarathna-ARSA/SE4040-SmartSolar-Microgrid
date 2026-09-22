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

  const nodes = [
    [40, 160],
    [130, 50],
    [190, 310],
    [80, 430],
    [260, 520],
    [40, 740],
    [180, 860],
    [380, 110],
    [620, 60],
    [520, 340],
    [480, 680],
    [380, 890],
    [690, 820],
    [760, 280],
    [880, 100],
    [1020, 260],
    [1140, 60],
    [1380, 120],
    [1550, 260],
    [720, 520],
    [980, 480],
    [1260, 340],
    [1210, 580],
    [1520, 540],
    [940, 760],
    [1180, 790],
    [1460, 780],
  ];

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

      {nodes.map(([cx, cy], i) => (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r="9"
            fill={glowFill}
            filter={`url(#meshNodeGlow-${theme})`}
          />

          <circle
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#ffffff"
            stroke={nodeStroke}
            strokeWidth="1.2"
          />
        </g>
      ))}
    </svg>
  );
};

export default ConstellationMeshSVG;