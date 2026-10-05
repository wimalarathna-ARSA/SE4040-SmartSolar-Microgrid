// ============================================================================
// File: motion.js
// Description: Tiny spring / tween / in-view helpers for the Baseline home
// page. Mirrors react-spring { tension, friction } integration in rAF.
// ============================================================================
import { useEffect, useRef, useState } from 'react';

export const EASE_CSS = {
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
};

// Single numeric spring: v += (-tension*(x-target) - friction*v) * dt; x += v*dt
export function springTo({ from, to, tension = 200, friction = 26, onUpdate, onDone }) {
  let x = from;
  let v = 0;
  let raf = 0;
  let last = performance.now();
  const step = (t) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    const force = -tension * (x - to) - friction * v;
    v += force * dt;
    x += v * dt;
    onUpdate(x);
    if (Math.abs(x - to) < 0.002 && Math.abs(v) < 0.002) {
      onUpdate(to);
      if (onDone) onDone();
      return;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export function isMobileHoverDisabled() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
}

// Animate a flat object of numbers toward a target with per-key springs.
export function useSpringObject(initial) {
  const [values, setValues] = useState(initial);
  const live = useRef(initial);
  const cancels = useRef({});
  useEffect(() => () => {
    Object.values(cancels.current).forEach((c) => c && c());
  }, []);
  const go = (target, config = {}) => {
    const { tension = 200, friction = 26 } = config;
    if (isMobileHoverDisabled()) {
      live.current = { ...live.current, ...target };
      setValues(live.current);
      return;
    }
    Object.keys(target).forEach((k) => {
      if (cancels.current[k]) cancels.current[k]();
      const from = live.current[k] ?? 0;
      cancels.current[k] = springTo({
        from,
        to: target[k],
        tension,
        friction,
        onUpdate: (x) => {
          live.current = { ...live.current, [k]: x };
          setValues({ ...live.current });
        },
      });
    });
  };
  return [values, go];
}

// First-time viewport entry trigger (plays once), with optional delay.
export function useInViewOnce(delay = 0) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (delay > 0) {
              timer = setTimeout(() => setInView(true), delay);
            } else {
              setInView(true);
            }
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay]);
  return [ref, inView];
}
