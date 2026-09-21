import React, { useEffect, useRef, useState } from 'react';

const MotionReveal = ({
  children,
  threshold = 0.12,
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

  return (
    <Component
      ref={elementRef}
      className={`motion-reveal ${isRevealed ? 'is-revealed' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MotionReveal;