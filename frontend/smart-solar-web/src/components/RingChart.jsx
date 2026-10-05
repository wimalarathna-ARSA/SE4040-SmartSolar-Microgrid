// ============================================================================
// File: RingChart.jsx
// Description: Dependency-free animated multi-ring (radial progress) chart.
//              Drop-in alternative to shadcn ring-chart style components:
//              concentric SVG rings with animated stroke, configurable gap,
//              center label, and per-ring value/maxValue progress.
// Theme: #F8F8F8 background, #063127 primary, #686053 muted.
// ============================================================================
import React, { useEffect, useState } from 'react';

const RingChart = ({
  data = [],
  size = 200,
  strokeWidth = 16,
  ringGap = 8,
  trackColor = 'rgba(6, 49, 39, 0.12)',
  animationDuration = 1100,
  animationEasing = 'cubic-bezier(0.85, 0, 0.15, 1)',
  centerValue = '',
  centerLabel = '',
  valueColor = '#063127',
  labelColor = '#686053',
}) => {
  const [animated, setAnimated] = useState(false);
  const valuesKey = JSON.stringify(data.map((d) => d.value));

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey]);

  const outerRadius = size / 2 - strokeWidth / 2 - 2;
  const center = size / 2;

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={centerLabel || 'Ring chart'}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          {data.map((ring, i) => {
            const radius = outerRadius - i * (strokeWidth + ringGap);
            if (radius <= 0) return null;
            const circumference = 2 * Math.PI * radius;
            const fraction = ring.maxValue > 0
              ? Math.min(Math.max(ring.value / ring.maxValue, 0), 1)
              : 0;
            const offset = animated ? circumference * (1 - fraction) : circumference;
            return (
              <g key={ring.label || i}>
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={trackColor}
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={ring.color || '#063127'}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition: `stroke-dashoffset ${animationDuration}ms ${animationEasing}`,
                  }}
                />
              </g>
            );
          })}
        </g>
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-extrabold"
          fill={valueColor}
          fontSize={size * 0.14}
        >
          {centerValue}
        </text>
        {centerLabel && (
          <text
            x={center}
            y={center + size * 0.1}
            textAnchor="middle"
            dominantBaseline="central"
            fill={labelColor}
            fontSize={size * 0.055}
            fontWeight="700"
          >
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  );
};

export default RingChart;
