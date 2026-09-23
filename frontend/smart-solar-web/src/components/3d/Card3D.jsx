// ============================================================================
// File: Card3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Reusable 3D perspective card container.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';

/**
 * Card3D: Reusable container for applying 3D perspective styling to content.
 */
const Card3D = ({
  children,
  className = '',
  style = {},
  perspective = 1000,
  ...props
}) => {
  return (
    <div
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
      className="card-3d-wrapper"
    >
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
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