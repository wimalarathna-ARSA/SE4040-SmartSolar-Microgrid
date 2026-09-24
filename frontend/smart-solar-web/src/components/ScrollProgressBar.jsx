// ============================================================================
// File: ScrollProgressBar.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Scroll-driven progress bar component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useState } from 'react';

/**
 * ScrollProgressBar
 * Tracks scroll progress using requestAnimationFrame
 * for smoother browser performance.
 */
const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollPx =
        document.documentElement.scrollTop || document.body.scrollTop;

      const winHeightPx =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const scrolled =
        winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;

      setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, {
      passive: true,
    });

    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3.5px',
        backgroundColor: 'rgba(0, 255, 206, 0.08)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: `${scrollProgress}%`,
          height: '100%',
          backgroundColor: '#00ffce',
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;