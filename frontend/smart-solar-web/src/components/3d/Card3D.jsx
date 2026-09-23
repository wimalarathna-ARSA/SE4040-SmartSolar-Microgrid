// ============================================================================
// File: Card3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Reusable 3D perspective tilt container with cursor interaction.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useRef, useState } from 'react';

/**
 * Card3D: Wraps children with a realistic 3D perspective tilt effect.
 */
const Card3D = ({
  children,
  className = '',
  style = {},
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
  ...props
}) => {
  const cardRef = useRef(null);

  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform({
      rotateX: Number(rotateX.toFixed(2)),
      rotateY: Number(rotateY.toFixed(2)),
      scale,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    setTransform({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
  };

  return (
    <div
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
      className="card-3d-wrapper"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
          transition: isHovered
            ? 'transform 0.1s ease-out'
            : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          ...style,
        }}
        className={`card-3d ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export default Card3D;