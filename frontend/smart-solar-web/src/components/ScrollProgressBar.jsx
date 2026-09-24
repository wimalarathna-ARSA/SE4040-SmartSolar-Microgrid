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
 * A sleek, high-precision neon cyan/emerald progress bar pinned to the top
 * of the browser window that tracks scroll progress through the homepage.
 */
const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollPx =
        document.documentElement.scrollTop ||
        document.body.scrollTop;

      const winHeightPx =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const scrolled =
        winHeightPx > 0
          ? (scrollPx / winHeightPx) * 100
          : 0;

      setScrollProgress(
        Math.min(100, Math.max(0, scrolled))
      );

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

    return () =>
      window.removeEventListener('scroll', onScroll);
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
          background:
            'linear-gradient(90deg, #00ffce 0%, #10b981 50%, #38bdf8 85%, #a855f7 100%)',
          boxShadow:
            '0 0 12px rgba(0, 255, 206, 0.8), 0 0 20px rgba(0, 255, 206, 0.4)',
          transition: 'width 0.1s linear',
          position: 'relative',
        }}
      >
        {/* Leading glowing spark particle */}
        <div
          style={{
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow:
              '0 0 8px #00ffce, 0 0 16px #00ffce',
            opacity:
              scrollProgress > 1 && scrollProgress < 99
                ? 1
                : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      </div>
    </div>
  );
};

export default ScrollProgressBar;