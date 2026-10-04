// ============================================================================
// File: MotionReveal.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Scroll-triggered reveal animation wrapper component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';

/**
 * MotionReveal
 * High-performance wrapper component that applies modern entrance and scroll-driven
 * animations to any section or card element.
 * 
 * Complies with Modern Web Guidance:
 * - Uses hardware-accelerated transforms & opacity
 * - Integrates native CSS scroll-driven animations via @supports
 * - Smooth fallback using IntersectionObserver
 * - Full prefers-reduced-motion accessibility support
 */
const MotionReveal = ({
  children,
  animation = 'fade-up', // 'fade-up' | 'fade-left' | 'fade-right' | 'scale-up'
  delay = 0,             // In seconds (e.g. 0.1, 0.2)
  threshold = 0.12,      // Intersection threshold
  className = '',
  style = {},
  as: Component = 'div',
  ...props
}) => {
  const elementRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check if reduced motion is preferred by the user
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          // Once revealed, unobserve to free resources
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  const animationClass =
    animation === 'fade-left'
      ? 'motion-fade-left'
      : animation === 'fade-right'
      ? 'motion-fade-right'
      : animation === 'scale-up'
      ? 'motion-scale-up'
      : '';

  return (
    <Component
      ref={elementRef}
      className={`motion-reveal ${animationClass} ${isRevealed ? 'is-revealed' : ''} ${className}`}
      style={{
        transitionDelay: delay ? `${delay}s` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MotionReveal;
