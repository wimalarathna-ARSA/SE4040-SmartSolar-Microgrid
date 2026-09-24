// ============================================================================
// File: Card3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Reusable 3D perspective tilt container with cursor specular glare effects.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useRef, useState } from 'react';

/**
 * Card3D: Wraps children with a realistic 3D perspective tilt effect,
 * dynamic specular cursor glare, and depth elevation.
 */
const Card3D = ({
  children,
  className = '',
  style = {},
  maxTilt = 10,
  glare = true,
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
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
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

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlarePos({ x: glareX, y: glareY, opacity: 0.25 });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
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
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          ...style,
        }}
        className={`card-3d ${className}`}
        {...props}
      >
        {/* Dynamic Specular Glare Layer */}
        {glare && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              zIndex: 3,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}), transparent 60%)`,
              transition: isHovered ? 'opacity 0.15s ease-out' : 'opacity 0.4s ease-out',
            }}
          />
        )}
        {/* Card Content with 3D Depth */}
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card3D;
