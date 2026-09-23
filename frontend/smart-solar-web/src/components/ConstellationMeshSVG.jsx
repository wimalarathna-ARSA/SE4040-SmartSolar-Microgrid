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
    [40, 160], [130, 50], [190, 310], [80, 430], [260, 520],
    [40, 740], [180, 860], [380, 110], [620, 60], [520, 340],
    [480, 680], [380, 890], [690, 820], [760, 280], [880, 100],
    [1020, 260], [1140, 60], [1380, 120], [1550, 260], [720, 520],
    [980, 480], [1260, 340], [1210, 580], [1520, 540], [940, 760],
    [1180, 790], [1460, 780],
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
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="4"
          />
        </filter>
      </defs>

      {/* Base constellation network */}
      <g stroke={baseStroke} strokeWidth="1">
        <line x1="40" y1="160" x2="130" y2="50" />
        <line x1="40" y1="160" x2="190" y2="310" />
        <line x1="130" y1="50" x2="380" y2="110" />
        <line x1="130" y1="50" x2="190" y2="310" />
        <line x1="190" y1="310" x2="380" y2="110" />
        <line x1="40" y1="160" x2="80" y2="430" />
        <line x1="190" y1="310" x2="80" y2="430" />
        <line x1="80" y1="430" x2="260" y2="520" />
        <line x1="190" y1="310" x2="260" y2="520" />
        <line x1="80" y1="430" x2="40" y2="740" />
        <line x1="40" y1="740" x2="260" y2="520" />
        <line x1="40" y1="740" x2="180" y2="860" />
        <line x1="260" y1="520" x2="180" y2="860" />
        <line x1="380" y1="110" x2="620" y2="60" />
        <line x1="380" y1="110" x2="520" y2="340" />
        <line x1="620" y1="60" x2="520" y2="340" />
        <line x1="260" y1="520" x2="520" y2="340" />
        <line x1="260" y1="520" x2="480" y2="680" />
        <line x1="520" y1="340" x2="480" y2="680" />
        <line x1="180" y1="860" x2="480" y2="680" />
        <line x1="180" y1="860" x2="380" y2="890" />
        <line x1="480" y1="680" x2="380" y2="890" />
        <line x1="480" y1="680" x2="690" y2="820" />
        <line x1="380" y1="890" x2="690" y2="820" />
      </g>

      {/* Upper accent network */}
      <g stroke={accentStroke} strokeWidth="1">
        <line x1="620" y1="60" x2="880" y2="100" />
        <line x1="620" y1="60" x2="760" y2="280" />
        <line x1="520" y1="340" x2="760" y2="280" />
        <line x1="760" y1="280" x2="880" y2="100" />
        <line x1="880" y1="100" x2="1140" y2="60" />
        <line x1="880" y1="100" x2="1020" y2="260" />
        <line x1="1140" y1="60" x2="1020" y2="260" />
        <line x1="760" y1="280" x2="1020" y2="260" />
        <line x1="1140" y1="60" x2="1380" y2="120" />
        <line x1="1020" y1="260" x2="1380" y2="120" />
        <line x1="1020" y1="260" x2="1260" y2="340" />
        <line x1="1380" y1="120" x2="1550" y2="260" />
        <line x1="1380" y1="120" x2="1260" y2="340" />
        <line x1="1260" y1="340" x2="1550" y2="260" />
      </g>

      {/* Middle and lower mesh */}
      <g stroke={midStroke} strokeWidth="1">
        <line x1="520" y1="340" x2="720" y2="520" />
        <line x1="760" y1="280" x2="720" y2="520" />
        <line x1="480" y1="680" x2="720" y2="520" />
        <line x1="720" y1="520" x2="980" y2="480" />
        <line x1="1020" y1="260" x2="980" y2="480" />
        <line x1="980" y1="480" x2="1260" y2="340" />
        <line x1="980" y1="480" x2="1210" y2="580" />
        <line x1="1260" y1="340" x2="1210" y2="580" />
        <line x1="1260" y1="340" x2="1520" y2="540" />
        <line x1="1550" y1="260" x2="1520" y2="540" />
        <line x1="1210" y1="580" x2="1520" y2="540" />
        <line x1="690" y1="820" x2="720" y2="520" />
        <line x1="690" y1="820" x2="940" y2="760" />
        <line x1="720" y1="520" x2="940" y2="760" />
        <line x1="980" y1="480" x2="940" y2="760" />
        <line x1="940" y1="760" x2="1180" y2="790" />
        <line x1="980" y1="480" x2="1180" y2="790" />
        <line x1="1210" y1="580" x2="1180" y2="790" />
        <line x1="1180" y1="790" x2="1460" y2="780" />
        <line x1="1210" y1="580" x2="1460" y2="780" />
        <line x1="1520" y1="540" x2="1460" y2="780" />
      </g>

      {/* Constellation nodes */}
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