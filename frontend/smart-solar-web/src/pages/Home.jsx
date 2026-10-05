// ============================================================================
// File: Home.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: SØLΛR-X island microgrid landing page. Styled with
// Bootstrap 5 + Tailwind CSS utilities (see baseline.css for the few
// keyframes/root-scale rules utilities cannot express).
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import api from '../services/api';
import RingChart from '../components/RingChart';
import FrequenzGlobeFooter3D from '../components/3d/FrequenzGlobeFooter3D';
import '../baseline/baseline.css';
import { EASE_CSS, useInViewOnce, useSpringObject } from '../baseline/motion';

const IMG = '/images';
const HERO_IMG = `${IMG}/solar-hero-panels.jpg`;

/* ------------------------------ data ---------------------------------- */
const COLLECTIONS = [
  { img: `${IMG}/Solar_1.jpg`, brand: 'SØLΛR-X Pro', title: 'Featured Hubs', cta: 'Explore hubs', alt: 'Solar panel rows at a microgrid hub' },
  { img: `${IMG}/solar-field-sunset.jpeg`, brand: 'Grid Series', title: 'New Capacity', cta: 'View the fleet', alt: 'Solar field harvesting power at sunset' },
  { img: `${IMG}/solar-rooftop-home.jpg`, brand: 'Prosumer Kit', title: 'Home Range', cta: 'Browse plans', alt: 'Rooftop solar installation on a home' },
];

const HEADLINES = [
  ['Clean', 'Sun', 'Share', 'Here'],
  ['Solar', 'Power', 'Track', 'Live'],
  ['Every', 'Watt', 'Check', 'Now'],
];
const SLIDE_IMGS = [
  `${IMG}/Solar_1.jpg`,
  `${IMG}/Solar_2.jpg`,
  `${IMG}/Solar_3.jpg`,
  `${IMG}/Solar_5.jpg`,
  `${IMG}/solar-field-sunset.jpeg`,
];
const GHOST_X = [[-3, 3], [3, -3], [-2, 4], [4, -3]];

const PROGRAMS = [
  {
    idx: '01', name: 'Prosumer Onboarding', desc: 'Register by NIC, get approved and start trading in hours.', href: '#onboarding',
    overview: 'Enables residential and commercial solar owners across Sri Lanka to transition from passive energy consumers into active grid trading participants (prosumers).',
    features: [
      { t: 'Identity-First Registration', d: 'Validates both new and old Sri Lankan National Identity Card (NIC) formats to ensure single-identity integrity.' },
      { t: 'Interactive Solar Array Geocoding', d: 'Integrated GPS location picker maps the prosumer’s physical rooftop installation and coordinates directly into the national microgrid registry.' },
      { t: 'Backoffice Verification Queue', d: 'Administrators review incoming registrations, verify grid connection suitability, and activate prosumer accounts with one click.' },
      { t: 'Instant Digital Credentials', d: 'Approved prosumers immediately gain access to their mobile and web dashboard to monitor energy yields, trade credits, and wallet balances.' },
    ],
  },
  {
    idx: '02', name: 'Battery Reservations', desc: 'Book charging slots up to 7 days ahead, secured by QR.', href: '#reservations',
    overview: 'Provides a flexible, algorithmic booking system where prosumers can reserve physical battery bays at microgrid hubs for either charging energy or dropping off surplus solar power.',
    features: [
      { t: 'Dual-Mode Reservations', d: 'Drop-Off (Sell to Grid) monetizes surplus daytime solar harvest by discharging energy into hub storage at regulated feed-in tariffs (Rs. 45 / kWh), while Charging (Buy from Grid) secures battery backup or EV capacity during peak or scheduled off-peak windows.' },
      { t: '7-Day Rolling Horizon', d: 'Real-time scheduling calendar prevents station overcrowding and guarantees slot availability up to a week in advance.' },
      { t: 'Cryptographic QR Token Generation', d: 'Every approved booking issues a unique, time-stamped digital QR pass containing encrypted station, slot, and user metadata.' },
      { t: 'Flexible Cancellation & Rescheduling', d: 'Prosumers can manage, reschedule, or cancel bookings prior to operator check-in with dynamic slot reallocation.' },
    ],
  },
  {
    idx: '03', name: 'Hub Monitoring', desc: 'Live telemetry, slot availability and transfer history.', href: '#monitoring',
    overview: 'Centralized live observability dashboard delivering real-time telemetry from distributed microgrid stations across Sri Lanka (Colombo Central, Kandy Hill, Galle Coastal, Jaffna Peninsula).',
    features: [
      { t: 'Live 5-Second Telemetry Refresh', d: 'Continuous polling keeps battery slot occupancy, active kilowatt loads, and substation metrics synchronized without page refreshes.' },
      { t: 'BESS (Battery Energy Storage System) Health', d: 'Real-time tracking of station total storage capacity (kWh), battery bay health, and operational readiness.' },
      { t: 'Transfer History Ledger', d: 'Full chronological audit log detailing every completed kWh transfer, timestamp, operator signature, and net energy balance.' },
      { t: 'Dynamic Capacity Rebalancing', d: 'Visual slot occupancy rings and alerts notify backoffice teams when hubs approach maximum charge or discharge capacity.' },
    ],
  },
  {
    idx: '04', name: 'Operator Verification', desc: 'On-site QR checks that finalize every energy handoff.', href: '#verification',
    overview: 'The physical trust anchor of the SØLΛR-X network. Station operators authenticate prosumers, inspect battery hardware, and digitally record physical energy handoffs.',
    features: [
      { t: 'Instant QR Payload Verification', d: 'Operators scan the prosumer’s mobile QR code using the station console or camera scanner to instantly validate the reservation.' },
      { t: 'Physical Hardware Inspection', d: 'Built-in verification checklist allowing operators to record battery health, cell conditions, and technical inspection notes.' },
      { t: 'Atomic Job Finalization', d: 'One-touch completion updates the reservation status to Completed, records operator NIC, and logs final energy transfer amounts.' },
      { t: 'Automated Slot Recirculation', d: 'Finalizing a job automatically resets the occupied battery bay back to the available pool for future reservations.' },
    ],
  },
];

const fmt2 = (n) => String(n).padStart(2, '0');

const RING_BG = { '#BFD5D0': 'bg-[#BFD5D0]', '#8FB3A9': 'bg-[#8FB3A9]', '#65998B': 'bg-[#65998B]', '#2E695A': 'bg-[#2E695A]' };

const QUOTES = [
  { text: 'I booked a slot, scanned my QR and picked up a full charge the same day. Trading power finally feels instant.', name: 'Kamal Perera', role: 'Prosumer, Colombo' },
  { text: 'The hub telemetry is always accurate — we plan our entire fleet charging around live slot data.', name: 'Nimal Fernando', role: 'Fleet Operator' },
  { text: 'From rooftop panels to paid reservations in a week. The approval process was painless.', name: 'Ayesha Rahman', role: 'Prosumer, Kandy' },
];

/* --------------------------- primitives -------------------------------- */
function Mask({ active, delay = 0, duration = 950, easing = 'easeOutExpo', y = '115%', pad = '0.14em', inline = false, children }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) { setOn(false); return undefined; }
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setOn(true)); });
    return () => { cancelAnimationFrame(r1); if (r2) cancelAnimationFrame(r2); };
  }, [active]);
  return (
    <span className={`${inline ? 'inline-block' : 'block'} overflow-hidden ${pad === '0' ? 'p-0' : pad === '0.12em' ? 'pb-[0.12em]' : 'pb-[0.14em]'}`}>
      <span
        className={inline ? 'inline-block' : 'block'}
        style={{
          transform: on ? 'translateY(0)' : `translateY(${y})`,
          opacity: on ? 1 : 0,
          transition: `transform ${duration}ms ${EASE_CSS[easing]} ${delay}ms, opacity ${duration}ms ${EASE_CSS[easing]} ${delay}ms`,
        }}
      >
        {children}
      </span>
    </span>
  );
}

function Eyebrow({ tone = 'dark', children }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] ${tone === 'dark' ? 'text-[#717784]' : 'text-white/70'}`}>
      <i aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${tone === 'dark' ? 'bg-[#3B796A]' : 'bg-[#8FB3A9]'}`} />
      {children}
    </span>
  );
}

function ArrowSvg({ size = '1rem' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ArrowBtn({ variant = 'outline', prev = false, onClick, label }) {
  const [v, go] = useSpringObject({ s: 1 });
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full ${variant === 'outline' ? 'bg-transparent border-[1px] border-[#e6e8ec] text-[#0a0a0a] hover:border-[#0a0a0a]' : 'bg-[#0a0a0a] border-[1px] border-[#0a0a0a] text-white hover:bg-[#063127]'}`}
      onMouseEnter={() => go({ s: 1.15 }, { tension: 320, friction: 18 })}
      onMouseLeave={() => go({ s: 1 }, { tension: 320, friction: 18 })}
    >
      <span className="inline-flex" style={{ transform: `${prev ? 'scaleX(-1) ' : ''}scale(${v.s})` }}>
        <ArrowSvg size="1.25rem" />
      </span>
    </button>
  );
}

function Dots({ tone = 'dark', count, index, onPick }) {
  const idle = tone === 'dark' ? 'w-1.5 bg-[#d7dae1]' : 'w-1.5 bg-white/40';
  const active = tone === 'dark' ? 'w-5 bg-[#0a0a0a]' : 'w-5 bg-white';
  return (
    <div className="flex gap-2 items-center" role="tablist" aria-label="Carousel">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} type="button" role="tab" aria-selected={i === index} aria-current={i === index ? 'true' : undefined} aria-label={`Go to slide ${i + 1}`} className="bg-transparent border-0 p-1.5" onClick={() => onPick(i)}>
          <i className={`block h-1.5 rounded-full transition-all ${i === index ? active : idle}`} />
        </button>
      ))}
    </div>
  );
}

/* ------------------------- section pieces ------------------------------ */
function Rise({ delay = 0, fromY = 28, fromScale = 1, tension = 200, friction = 26, className = '', style = {}, children }) {
  const [ref, inView] = useInViewOnce(delay);
  const [v, go] = useSpringObject({ o: 0, y: fromY, s: fromScale });
  const fired = useRef(false);
  useEffect(() => {
    if (inView && !fired.current) { fired.current = true; go({ o: 1, y: 0, s: 1 }, { tension, friction }); }
  }, [inView, go, tension, friction]);
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: v.o, transform: `translateY(${v.y}px) scale(${v.s})` }}>
      {children}
    </div>
  );
}

function ProgramRow({ row, index, open, onToggle }) {
  const [v, go] = useSpringObject({ x: 0, o: 0.55 });
  return (
    <li className={`border-t border-[#e6e8ec] rounded-[1.5rem] transition-colors ${index === PROGRAMS.length - 1 ? 'border-b' : ''} ${open ? 'bg-[#65998B]' : ''}`}>
      <Rise delay={index * 90} fromY={26} tension={190} friction={26}>
        <a
          href={row.href}
          aria-expanded={open}
          onClick={(e) => { e.preventDefault(); onToggle(); }}
          onMouseEnter={() => go({ x: 8, o: 1 }, { tension: 300, friction: 20 })}
          onMouseLeave={() => go({ x: 0, o: 0.55 }, { tension: 300, friction: 20 })}
          className={`flex items-center gap-6 no-underline text-inherit rounded-[1.5rem] ${open ? 'px-6 pt-7 pb-[1.25rem] hover:bg-transparent' : 'py-7 px-0 hover:bg-white'}`}
        >
          <span className={`w-10 text-sm font-medium shrink-0 ${open ? 'text-white/80' : 'text-[#717784]'}`}>{row.idx}</span>
          <span className="flex-1">
            <b className={`block text-2xl sm:text-3xl font-medium tracking-[-0.01em] ${open ? 'text-white' : ''}`}>{row.name}</b>
            <span className={`text-sm ${open ? 'text-white/85' : 'text-[#717784]'}`}>{row.desc}</span>
          </span>
          <span className={`flex items-center justify-center w-11 h-11 rounded-full border-[1px] shrink-0 ${open ? 'border-white/45 text-white' : 'border-[#e6e8ec]'}`} style={{ transform: `translateX(${v.x}px) rotate(${open ? 90 : 0}deg)`, opacity: open ? 1 : v.o }}>
            <ArrowSvg size="1.25rem" />
          </span>
        </a>
        <div className={`grid transition-[grid-template-rows] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-[1.25rem] pb-6 sm:px-6 sm:pb-[1.75rem] sm:ps-[5.5rem] max-w-[60rem]">
              <h4 className="text-xs font-medium uppercase tracking-[0.22em] text-white/85 mt-[1.25rem] first:mt-0 mb-2">Overview</h4>
              <p className="text-[0.95rem] leading-[1.65] text-white m-0">{row.overview}</p>
              <h4 className="text-xs font-medium uppercase tracking-[0.22em] text-white/85 mt-[1.25rem] mb-2">Key Details &amp; Features</h4>
              <ul className="list-none m-0 p-0 flex flex-col gap-[0.6rem]">
                {row.features.map((f) => (
                  <li key={f.t} className="text-sm leading-[1.6] text-white/90 ps-[1rem] border-s-2 border-s-[#063127]"><b className="text-white font-medium">{f.t}:</b> {f.d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Rise>
    </li>
  );
}

function CourtCard({ img, alt, name, desc, tone, index }) {
  const [v, go] = useSpringObject({ s: 1 });
  return (
    <Rise delay={index * 140} fromY={48} tension={180} friction={26} className={`${index === 1 ? 'mb-8' : ''} flex-1 flex`}>
      <figure
        className="flex-1 m-0 relative overflow-hidden rounded-[1.5rem] bg-[#f4f4f4] aspect-[3/4]"
        onMouseEnter={() => go({ s: 1.03 }, { tension: 300, friction: 22 })}
        onMouseLeave={() => go({ s: 1 }, { tension: 300, friction: 22 })}
      >
        <img src={img} alt={alt} loading="lazy" className="w-full h-full object-cover" style={{ transform: `scale(${v.s})` }} />
        <figcaption className={`absolute left-0 right-0 bottom-0 m-[0.75rem] rounded-xl backdrop-blur text-white px-[1rem] py-[0.75rem] ${tone === 'clay' ? 'bg-[rgba(6,49,39,0.4)]' : 'bg-[rgba(101,153,139,0.55)]'}`}>
          <b className="block text-sm font-medium">{name}</b>
          <span className="text-[0.65rem] opacity-85">{desc}</span>
        </figcaption>
      </figure>
    </Rise>
  );
}

function StatCell({ stat, index }) {
  return (
    <Rise delay={index * 110} fromY={30} tension={180} friction={24} className="border-t border-white/20 pt-[1.25rem] m-0">
      <dt className="sr-only">{stat.label}</dt>
      <dd className="m-0">
        <div className="text-6xl sm:text-7xl font-medium tracking-[-0.02em] leading-none">{stat.value}</div>
        <div className="text-sm text-white/65 mt-[0.75rem]">{stat.label}</div>
      </dd>
    </Rise>
  );
}

function QuoteCard({ quote, index }) {
  const [v, go] = useSpringObject({ y: 0 });
  return (
    <li className="h-full">
      <Rise delay={index * 120} fromY={40} tension={180} friction={26} className="h-full">
        <figure
          className="flex flex-col justify-between h-full rounded-[1.5rem] bg-[#f4f4f4] p-7 m-0"
          style={{ transform: `translateY(${v.y}px)` }}
          onMouseEnter={() => go({ y: -8 }, { tension: 300, friction: 22 })}
          onMouseLeave={() => go({ y: 0 }, { tension: 300, friction: 22 })}
        >
          <div>
            <div className="text-4xl text-[#3B796A] leading-none" aria-hidden="true">&ldquo;</div>
            <blockquote className="text-lg leading-[1.6] text-[#0a0a0a] mt-[1rem] mb-0">{quote.text}</blockquote>
          </div>
          <figcaption className="border-t border-[#e6e8ec] pt-[1rem] mt-6"><b className="font-medium">{quote.name}</b><span className="block text-sm text-[#717784]">{quote.role}</span></figcaption>
        </figure>
      </Rise>
    </li>
  );
}

/* -------------------------------- Home --------------------------------- */
const Home = () => {
  const lenisRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const [fillGo, setFillGo] = useState(false);

  const [slide, setSlide] = useState(0);
  const [trust, setTrust] = useState(0);
  const [openProg, setOpenProg] = useState(-1);

  /* Live project data (same methods as Backoffice/Operator pages). */
  const [liveStats, setLiveStats] = useState({
    activeReservationsCount: 0,
    pendingReservationsCount: 0,
    countOfApprovedFutureReservations: 0,
    completedReservationsCount: 0,
    totalStationsCount: 0,
    totalProsumersCount: 0,
  });
  const [liveStations, setLiveStations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  const fetchData = async () => {
    setDataLoading(true);
    setDataError(false);
    try {
      const [statsRes, stationsRes] = await Promise.all([
        api.get('/reservations/dashboard-stats'),
        api.get('/stations?status=Active'),
      ]);
      setLiveStats(statsRes.data);
      setLiveStations(Array.isArray(stationsRes.data) ? stationsRes.data : []);
    } catch {
      // No fake data: surface the failure honestly with a retry option.
      setDataError(true);
      setLiveStations([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const slides = liveStations.slice(0, 3).map((s, i) => ({
    img: SLIDE_IMGS[i % SLIDE_IMGS.length],
    name: s.name || s.stationCode || `Solar Hub ${i + 1}`,
    role: `${s.capacityKWh ?? '—'} kWh · ${s.totalBatterySlots ?? s.availableBatterySlots ?? '—'} Slots`,
    alt: `${s.name || s.stationCode || 'Solar'} hub`,
    headline: HEADLINES[i % HEADLINES.length],
  }));
  const safeTrust = slides.length ? trust % slides.length : 0;

  const openSlots = liveStations.reduce((sum, s) => sum + (s.availableBatterySlots || 0), 0);
  const statVal = (n) => (dataLoading ? '…' : dataError ? '—' : fmt2(n));
  const statItems = [
    { value: statVal(liveStats.totalStationsCount || liveStations.length), label: 'Active solar hubs' },
    { value: statVal(openSlots), label: 'Battery slots open' },
    { value: statVal(liveStats.completedReservationsCount), label: 'Transfers completed' },
    { value: statVal(liveStats.pendingReservationsCount), label: 'Bookings awaiting action' },
  ];

  /* Live booking pipeline for the ring chart (same source as backoffice). */
  const approvedCount = liveStats.countOfApprovedFutureReservations;
  const activeCount = liveStats.activeReservationsCount;
  const pendingCount = liveStats.pendingReservationsCount;
  const completedCount = liveStats.completedReservationsCount;
  const pipelineTotal = approvedCount + activeCount + pendingCount + completedCount;
  const ringData = [
    { label: 'Completed', value: completedCount, maxValue: pipelineTotal, color: '#BFD5D0' },
    { label: 'Pending Review', value: pendingCount, maxValue: pipelineTotal, color: '#8FB3A9' },
    { label: 'Active Now', value: activeCount, maxValue: pipelineTotal, color: '#65998B' },
    { label: 'Approved Future', value: approvedCount, maxValue: pipelineTotal, color: '#2E695A' },
  ];
  const [trustOut, setTrustOut] = useState(null);

  const heroRef = useRef(null);
  const plateRef = useRef(null);
  const trustRef = useRef(null);
  const ghostRefs = useRef([]);

  /* Lenis + adaptive root + loader */
  useEffect(() => {
    document.documentElement.classList.add('bl-scale');
    const fitRoot = () => {
      const FONT_BASE = 16, BASE_W = 1920, COEF = 0.6666;
      const reduction = ((BASE_W - window.innerWidth) / BASE_W) * 100 * COEF;
      const size = FONT_BASE - (FONT_BASE * reduction) / 100;
      if (size > FONT_BASE) document.documentElement.style.fontSize = `${size}px`;
      else document.documentElement.style.removeProperty('font-size');
    };
    fitRoot();
    window.addEventListener('resize', fitRoot);

    const lenis = new Lenis({ smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    window.scrollTo(0, 0);

    const lock = () => { lenis.stop(); document.documentElement.classList.add('bl-locked'); };
    const unlock = () => { lenis.start(); document.documentElement.classList.remove('bl-locked'); };
    lock();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN = reduced ? 200 : 1400;
    const MAX = 2600;
    const EXIT = reduced ? 0 : 850;
    const fillTimer = setTimeout(() => setFillGo(true), reduced ? 0 : 120);

    let done = false;
    let t2 = 0; let t3 = 0;
    const finish = () => {
      if (done) return;
      done = true;
      t2 = setTimeout(() => {
        setReady(true);
        unlock();
        setExiting(true);
        t3 = setTimeout(() => setGone(true), EXIT);
      }, MIN);
    };
    if (document.readyState === 'complete') finish();
    else {
      window.addEventListener('load', finish);
      setTimeout(finish, MAX);
    }

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      clearTimeout(fillTimer); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener('load', finish);
      window.removeEventListener('resize', fitRoot);
      document.documentElement.classList.remove('bl-scale', 'bl-locked');
      document.documentElement.style.removeProperty('font-size');
    };
  }, []);

  /* Scroll parallax loop (hero plate + ghost words) */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (heroRef.current && plateRef.current) {
        const r = heroRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
        plateRef.current.style.transform = `translateY(${(p * 12).toFixed(2)}%)`;
      }
      if (trustRef.current) {
        const r = trustRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
        ghostRefs.current.forEach((el, i) => {
          if (!el) return;
          const [from, to] = GHOST_X[i] || [0, 0];
          el.style.transform = `translateX(${(from + (to - from) * p).toFixed(2)}%)`;
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Collection autoplay (gated on loader ready) */
  useEffect(() => {
    if (!ready) return undefined;
    const id = setInterval(() => {
      setSlide((prev) => (prev + 1) % COLLECTIONS.length);
    }, 3800);
    return () => clearInterval(id);
  }, [ready]);

  const pickSlide = (i) => setSlide(i);

  const pickTrust = (i) => {
    setTrust((prev) => {
      if (i === prev) return prev;
      setTrustOut({ src: slides[prev].img, k: `tout-${prev}-${Date.now()}` });
      setTimeout(() => setTrustOut(null), 600);
      return i;
    });
  };

  const scrollToId = (e, href) => {
    if (!href || !href.startsWith('#')) return;
    const el = document.querySelector(href);
    if (el) {
      e.preventDefault();
      if (lenisRef.current) lenisRef.current.scrollTo(el);
      else el.scrollIntoView({ behavior: 'smooth' });
    } else if (href.length > 1) {
      e.preventDefault();
    }
  };

  const cur = COLLECTIONS[slide];
  const t = slides[safeTrust];

  return (
    <>
      {!gone && (
        <div className={`fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-[#063127] text-white gap-8 z-[200] transition-transform duration-[850ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${exiting ? '-translate-y-[105%]' : 'translate-y-0'}`} aria-hidden={exiting}>
          <div className="flex items-center gap-[0.75rem] text-2xl font-medium uppercase tracking-[0.2em]"><img src="/solarx-logo.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.classList.add('hidden'); }} className="w-[2rem] h-[2rem] object-contain" /><span>SØLΛR-X</span></div>
          <div className="w-40 h-px rounded-full bg-white/20 overflow-hidden">
            <div
              className={`w-full h-full bg-white origin-left transition-transform duration-[1280ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${fillGo ? 'scale-x-100' : 'scale-x-0'}`}
            />
          </div>
        </div>
      )}

      <main className="bl-font w-full bg-white text-[#0a0a0a] p-2 sm:p-[0.75rem] overflow-x-clip">
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[#063127] text-white rounded-[2rem] flex flex-col min-h-[36rem] h-[calc(100svh-1rem)] sm:h-[calc(100svh-1.5rem)]" ref={heroRef} id="hero">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10" aria-hidden="true">
            <div className="absolute left-0 right-0 w-full top-[-16%] h-[132%]" ref={plateRef}>
              <img src={HERO_IMG} alt="Rooftop solar panels harvesting daylight" fetchPriority="high" className="w-full h-full object-cover" onError={(e) => e.currentTarget.classList.add('hidden')} />
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[rgba(6,49,39,0.65)] via-[rgba(6,49,39,0.35)] to-[rgba(6,49,39,0.75)]" />
          </div>

          <header className="flex items-center px-6 pt-6 sm:px-10 sm:pt-8 text-xs text-white">
            <nav className="hidden lg:flex flex-1 gap-8" aria-label="Primary">
              <a href="#programs" onClick={(e) => scrollToId(e, '#programs')} className="text-white/90 hover:text-white no-underline">How It Works</a>
              <a href="#facilities" onClick={(e) => scrollToId(e, '#facilities')} className="text-white/90 hover:text-white no-underline">Hub Network</a>
            </nav>
            <a className="flex-1 flex items-center justify-center gap-2 text-base font-medium uppercase tracking-[0.2em] text-white no-underline" href="#hero" onClick={(e) => scrollToId(e, '#hero')} aria-label="SolarX home">
              <img src="/solarx-logo.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.classList.add('hidden'); }} className="w-[1.75rem] h-[1.75rem] object-contain" />
              SØLΛR-X
            </a>
            <div className="flex-1 flex items-center justify-end gap-[1rem]">
              <Link className="inline-flex items-center rounded-full bg-white text-[#063127] px-[1.25rem] py-2.5 text-xs font-medium uppercase tracking-[0.08em] no-underline hover:bg-[#063127] hover:text-[#686053]" to="/login">Staff Login</Link>
            </div>
          </header>

          <div className="px-6 pt-[1rem] sm:px-10">
            <h1 id="hero-title" className="text-[9.5vw] font-medium uppercase leading-[0.85] tracking-[-0.02em] whitespace-nowrap m-0">
              {['Power', 'The', 'Future'].map((w, i) => (
                <Mask key={w} inline active={ready} delay={i * 140} duration={1100} easing="easeOutExpo" y="115%" pad="0">
                  <span className={i < 2 ? 'me-[0.22em]' : ''}>{w}</span>
                </Mask>
              ))}
            </h1>
          </div>

          <div className="mt-auto px-6 pb-8 sm:px-10 sm:pb-10 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end">
            <div>
              <p className="text-[2.4rem] font-medium uppercase leading-[0.95] tracking-[-0.01em] text-white/85 m-0">
                {['Plug In,', 'Power Up'].map((line, i) => (
                  <Mask key={line} active={ready} delay={350 + i * 110} duration={900} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
                ))}
              </p>
            </div>
            <div className="flex items-end gap-[1rem]">
              <Rise delay={650} fromY={28} tension={200} friction={26} className="hidden md:flex flex-col gap-[0.75rem] w-64">
                <div className="relative flex gap-[0.75rem] rounded-[1.5rem] border-[1px] border-white/15 bg-white/10 p-[0.75rem] shadow-[0_8px_30px_rgba(6,49,39,0.2)] backdrop-blur-xl min-h-[5.5rem] animate-[bl-slide-in_480ms_cubic-bezier(0.16,1,0.3,1)]" key={slide}>
                  <img className="rounded-xl object-cover shrink-0 w-14 h-14" src={cur.img} alt={cur.alt} loading="lazy" />
                  <div>
                    <div className="text-[0.7rem] font-medium uppercase tracking-[0.08em]">{cur.brand}</div>
                    <div className="text-[0.7rem] uppercase opacity-80 mt-[0.15rem]">{cur.title}</div>
                    <button type="button" className="inline-block text-[0.65rem] text-white underline underline-offset-2 bg-transparent border-0 p-0 mt-[0.3rem] text-left">{cur.cta} &rarr;</button>
                  </div>
                </div>
                <Dots tone="light" count={COLLECTIONS.length} index={slide} onPick={pickSlide} />
              </Rise>
              <Rise delay={780} fromY={28} tension={200} friction={26}>
                <article className="w-full flex gap-[0.75rem] items-stretch rounded-[1.5rem] border-[1px] border-white/15 bg-white/10 p-[0.75rem] shadow-[0_8px_30px_rgba(6,49,39,0.2)] backdrop-blur-xl max-w-[20rem]">
                  <div className="flex flex-col justify-between gap-2 flex-1">
                    <div className="text-3xl font-medium leading-none">500+</div>
                    <div className="flex" aria-hidden="true">
                      <i className="w-5 h-5 rounded-full border-[1px] border-[rgba(6,49,39,0.4)] -ms-2 first:ms-0 bg-[#8FB3A9]" /><i className="w-5 h-5 rounded-full border-[1px] border-[rgba(6,49,39,0.4)] -ms-2 first:ms-0 bg-[#BFD5D0]" /><i className="w-5 h-5 rounded-full border-[1px] border-[rgba(6,49,39,0.4)] -ms-2 first:ms-0 bg-[#3B796A]" /><i className="w-5 h-5 rounded-full border-[1px] border-[rgba(6,49,39,0.4)] -ms-2 first:ms-0 bg-white" />
                    </div>
                    <div className="text-[0.65rem] opacity-80">Prosumers trading</div>
                  </div>
                  <img className="rounded-xl object-cover w-16 aspect-[3/4]" src={`${IMG}/solar-rooftop-home.jpg`} alt="Rooftop solar installation on a prosumer home" loading="lazy" />
                </article>
              </Rise>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="relative isolate overflow-hidden bg-white px-6 py-16 sm:px-10 sm:py-20" ref={trustRef} aria-label="Trusted by island prosumers">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.55] z-0" aria-hidden="true">
            <FrequenzGlobeFooter3D
              lineColor={0x063127}
              nodeColor={0x2E695A}
              glowRgb="46, 105, 90"
              lineOpacity={0.5}
              additive={false}
              scale={1.45}
            />
          </div>
          <div className="relative z-20 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
            <Rise fromY={0} fromScale={0.9} tension={220} friction={22}>
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#f4f4f4] flex flex-col items-center justify-center text-center shrink-0">
                <b className="text-2xl font-medium">100%</b>
                <span className="text-[0.6rem] text-[#717784] leading-[1.3] max-w-[7em]">Hardware-backed energy trading</span>
              </div>
            </Rise>
            <Rise delay={120} fromY={24} tension={200} friction={26}>
              <article className="flex gap-[1rem] items-start rounded-[1.5rem] bg-[#f4f4f4] p-[1.25rem] sm:p-[1.5rem] max-w-[28rem]">
                <span className="rounded-xl bg-white px-[1rem] py-[0.5rem] text-xl font-medium shrink-0">#01</span>
                <div>
                  <h3 className="text-lg font-medium m-0 mb-[0.4rem]">Trusted by island prosumers</h3>
                  <p className="text-xs text-[#717784] leading-[1.6] m-0">From first-time rooftop owners to fleet operators, prosumers trade here because every kilowatt is QR-verified.</p>
                </div>
              </article>
            </Rise>
          </div>

          {slides.length === 0 ? (
            <div className="relative z-10 rounded-[1.5rem] bg-[#f4f4f4] px-8 py-10 text-center mx-auto mt-12 max-w-[32rem]">
              {dataLoading ? (
                <><span className="inline-block w-7 h-7 rounded-full border-[3px] border-[#e6e8ec] border-t-[#3B796A] mb-[1rem] animate-[bl-spin_0.9s_linear_infinite]" aria-hidden="true" /><p className="text-sm text-[#717784] m-0">Loading live hub data…</p></>
              ) : (
                <>
                  <b className="block text-lg font-medium mb-2">Live hub data unavailable</b>
                  <p className="text-sm text-[#717784] m-0 mb-[1.25rem]">Start the backend API and try again — no demo data is shown here.</p>
                  <button type="button" className="rounded-full bg-[#0a0a0a] text-white px-7 py-[0.75rem] text-sm font-medium uppercase tracking-[0.06em] border-0 hover:bg-[#063127]" onClick={fetchData}>Retry</button>
                </>
              )}
            </div>
          ) : (
          <>
          <div className="pointer-events-none select-none relative z-0 mx-auto mt-12 max-w-[88rem]">
            <h2 id="trust-title" className="text-[8.2vw] font-medium uppercase leading-[1.02] tracking-[-0.02em] m-0" aria-live="polite">
              <span className="flex justify-between gap-[10vw]">
                {[t.headline[0], t.headline[1]].map((w, i) => (
                  <span key={`${safeTrust}-${i}`} ref={(el) => { ghostRefs.current[i] = el; }} className="inline-block will-change-transform">
                    <Mask active inline={false} delay={i * 90} duration={700} easing="easeOutExpo" y="115%" pad="0.12em">
                      <span className="text-[#d7dae1]">{w}</span>
                    </Mask>
                  </span>
                ))}
              </span>
              <span className="flex justify-between gap-[10vw]">
                {[t.headline[2], t.headline[3]].map((w, j) => {
                  const i = j + 2;
                  return (
                    <span key={`${safeTrust}-${i}`} ref={(el) => { ghostRefs.current[i] = el; }} className="inline-block will-change-transform">
                      <Mask active delay={i * 90} duration={700} easing="easeOutExpo" y="115%" pad="0.12em">
                        <span className={i === 2 ? 'text-[#0a0a0a]' : 'text-[#d7dae1]'}>{w}</span>
                      </Mask>
                    </span>
                  );
                })}
              </span>
            </h2>
          </div>

          <div className="relative z-10 w-[13rem] mx-auto mt-[1rem] sm:absolute sm:start-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[16rem] sm:m-0">
            <Rise fromY={60} tension={170} friction={26}>
              <figure className="relative m-0 overflow-hidden rounded-[1.5rem] bg-[#3B796A] aspect-[3/4] rotate-6">
                {trustOut && (
                  <img key={trustOut.k} src={trustOut.src} alt="" aria-hidden="true" className="absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-opacity duration-[550ms]" />
                )}
                <img key={safeTrust} src={t.img} alt={t.alt} loading="lazy" className="absolute top-0 left-0 w-full h-full object-cover" />
                <figcaption className="absolute left-0 right-0 bottom-0 m-[0.75rem] rounded-xl bg-[rgba(6,49,39,0.4)] text-white backdrop-blur px-[0.75rem] py-[0.5rem]"><b className="block text-sm font-medium">{t.name}</b><span className="text-[0.65rem] opacity-80">{t.role}</span></figcaption>
              </figure>
            </Rise>
          </div>

          <div className="relative z-20 flex items-center justify-between mt-12 sm:mt-24">
            <ArrowBtn variant="outline" prev label="Previous hub" onClick={() => pickTrust((safeTrust + slides.length - 1) % slides.length)} />
            <Dots tone="dark" count={slides.length} index={safeTrust} onPick={pickTrust} />
            <ArrowBtn variant="solid" label="Next hub" onClick={() => pickTrust((safeTrust + 1) % slides.length)} />
          </div>
          </>
          )}
        </section>

        {/* PROGRAMS */}
        <section className="bg-[#f4f4f4] px-6 py-24 sm:px-10" id="programs">
          <Eyebrow tone="dark">How it works</Eyebrow>
          <h2 id="programs-title" className="text-5xl font-medium leading-[0.95] tracking-[-0.02em] mt-[1rem] mb-0">
            {['Trade power', 'in four steps'].map((line, i) => (
              <Mask key={line} active delay={i * 120} duration={950} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
            ))}
          </h2>
          <ul className="list-none mt-14 mb-0 p-0">
            {PROGRAMS.map((row, i) => (
              <ProgramRow key={row.idx} row={row} index={i} open={openProg === i} onToggle={() => setOpenProg(openProg === i ? -1 : i)} />
            ))}
          </ul>
        </section>

        {/* FACILITIES */}
        <section className="bg-white rounded-[2rem] -mt-10 relative px-6 pt-16 pb-20 sm:px-10" id="facilities">
          <div className="grid gap-10 items-end grid-cols-1 md:grid-cols-[1fr_1.4fr]">
            <div className="max-w-[24rem]">
              <Rise fromY={0} fromScale={0.85} tension={240} friction={20}>
                <img className="rounded-[1.5rem] object-cover w-16 h-16" src={`${IMG}/Solar_2.jpg`} alt="Battery bays inside a solar hub" loading="lazy" />
              </Rise>
              <h2 id="facilities-title" className="text-5xl font-medium leading-[0.95] tracking-[-0.02em] mt-6 mb-0">
                {['Tour Our', 'Island-Wide', 'Solar Hubs'].map((line, i) => (
                  <Mask key={line} active delay={i * 120} duration={950} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
                ))}
              </h2>
              <FacilitiesBody />
            </div>
            <div className="flex items-end gap-[1.25rem]">
              <CourtCard img={`${IMG}/Solar_1.jpg`} alt="Solar array at the Colombo central hub" name="Colombo Central" desc="A 250 kWh urban hub tuned for daily prosumer trading." tone="clay" index={0} />
              <CourtCard img={`${IMG}/Solar_5.jpg`} alt="High-yield panels at the coastal hub" name="Galle Coastal" desc="A 300 kWh coastal array built for peak daylight harvest." tone="blue" index={1} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-[#063127] text-white rounded-[2rem] mt-[0.75rem] px-6 py-20 sm:px-10" aria-label="By the numbers">
          <Eyebrow tone="light">By the numbers</Eyebrow>
          <h2 id="stats-title" className="text-5xl font-medium mt-[1rem] mb-0 tracking-[-0.02em]">
            {['A grid that', 'keeps score'].map((line, i) => (
              <Mask key={line} active delay={i * 120} duration={950} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
            ))}
          </h2>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mt-16 mb-0">
            {statItems.map((s, i) => (
              <StatCell key={s.label} stat={s} index={i} />
            ))}
          </dl>
          <div className="flex flex-col items-center gap-8 mt-16 border-t border-white/15 pt-12 md:flex-row md:justify-center">
            <RingChart
              data={ringData}
              size={190}
              strokeWidth={14}
              ringGap={7}
              trackColor="rgba(248, 248, 248, 0.18)"
              animationDuration={1100}
              animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
              centerValue={dataLoading ? '…' : dataError ? '—' : String(pipelineTotal)}
              centerLabel="Bookings"
              valueColor="#F8F8F8"
              labelColor="rgba(248, 248, 248, 0.7)"
            />
            <div className="flex-1 w-full max-w-[28rem]">
              <h3 className="text-xl font-medium tracking-[-0.01em] m-0 mb-1">Live booking pipeline</h3>
              <p className="text-sm text-white/65 m-0 mb-6">{dataError && !dataLoading ? 'Live data unavailable — start the backend API and refresh.' : 'Every reservation on the network, by lifecycle stage.'}</p>
              {ringData.map((r) => {
                const pct = pipelineTotal > 0 ? Math.round((r.value / pipelineTotal) * 100) : 0;
                return (
                  <div key={r.label} className="mb-[1rem]">
                    <div className="flex justify-between items-center mb-[0.35rem]">
                      <span className="inline-flex items-center gap-2 text-sm font-medium"><i className={`inline-block w-3 h-3 rounded-full ${RING_BG[r.color] || 'bg-white'}`} />{r.label}</span>
                      <span className="text-[0.8rem] text-white/65">{r.value} &bull; {pct}%</span>
                    </div>
                    <div className="rounded-full bg-white/15 h-2 overflow-hidden"><div className={`rounded-full h-full ${RING_BG[r.color] || 'bg-white'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-white px-6 py-20 sm:px-10 sm:py-24" id="testimonials">
          <Eyebrow tone="dark">What prosumers say</Eyebrow>
          <h2 id="testimonials-title" className="text-5xl font-medium mt-[1rem] mb-0 tracking-[-0.02em]">
            {['Powered by', 'the community'].map((line, i) => (
              <Mask key={line} active delay={i * 120} duration={950} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
            ))}
          </h2>
          <ul className="list-none grid grid-cols-1 md:grid-cols-3 gap-[1.25rem] mt-14 mb-0 p-0">
            {QUOTES.map((q, i) => (
              <QuoteCard key={q.name} quote={q} index={i} />
            ))}
          </ul>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#063127] text-white rounded-[2rem] mt-[0.75rem] px-6 py-14 sm:px-10 sm:py-16" id="contact">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end border-b border-white/15 pb-14">
            <div>
              <Eyebrow tone="light">Get started</Eyebrow>
              <p className="text-6xl font-medium leading-[0.92] tracking-[-0.02em] mt-[1rem] mb-0">
                {['Ready to', 'trade?'].map((line, i) => (
                  <Mask key={line} active delay={i * 120} duration={950} easing="easeOutExpo" y="115%" pad="0.14em">{line}</Mask>
                ))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 py-14">
            <div className="max-w-[20rem]">
              <div className="flex items-center gap-2 text-lg font-medium uppercase tracking-[0.2em]"><img src="/solarx-logo.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.classList.add('hidden'); }} className="w-[1.75rem] h-[1.75rem] object-contain" /> SØLΛR-X</div>
              <p className="text-sm text-white/65 mt-[1rem] mb-0">An island microgrid network where rooftop solar meets QR-verified energy trading.</p>
              <address className="not-italic mt-6 text-sm text-white/80 flex flex-col gap-[0.4rem]">
                <a href="mailto:hello@smartsolar.lk" className="text-inherit no-underline hover:text-white">hello@smartsolar.lk</a>
                <a href="tel:+94115550148" className="text-inherit no-underline hover:text-white">+94 11 555 0148</a>
                <span className="text-white/55">45 High Level Road, Maharagama</span>
              </address>
            </div>
            <nav aria-label="Platform">
              <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 m-0 mb-[1rem]">Platform</h4>
              <ul className="list-none m-0 p-0 flex flex-col gap-[0.75rem] text-sm">
                <li><a href="#onboarding" onClick={(e) => scrollToId(e, '#onboarding')} className="text-white/80 no-underline hover:text-white">Prosumer Onboarding</a></li>
                <li><a href="#reservations" onClick={(e) => scrollToId(e, '#reservations')} className="text-white/80 no-underline hover:text-white">Battery Reservations</a></li>
                <li><a href="#monitoring" onClick={(e) => scrollToId(e, '#monitoring')} className="text-white/80 no-underline hover:text-white">Hub Monitoring</a></li>
                <li><a href="#verification" onClick={(e) => scrollToId(e, '#verification')} className="text-white/80 no-underline hover:text-white">Operator Verification</a></li>
              </ul>
            </nav>
            <nav aria-label="Network">
              <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 m-0 mb-[1rem]">Network</h4>
              <ul className="list-none m-0 p-0 flex flex-col gap-[0.75rem] text-sm">
                <li><a href="#membership" onClick={(e) => scrollToId(e, '#membership')} className="text-white/80 no-underline hover:text-white">Membership</a></li>
                <li><a href="#facilities" onClick={(e) => scrollToId(e, '#facilities')} className="text-white/80 no-underline hover:text-white">Solar Hubs</a></li>
                <li><a href="#events" onClick={(e) => scrollToId(e, '#events')} className="text-white/80 no-underline hover:text-white">Events</a></li>
                <li><a href="#support" onClick={(e) => scrollToId(e, '#support')} className="text-white/80 no-underline hover:text-white">Support</a></li>
              </ul>
            </nav>
            <nav aria-label="Company">
              <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 m-0 mb-[1rem]">Company</h4>
              <ul className="list-none m-0 p-0 flex flex-col gap-[0.75rem] text-sm">
                <li><a href="#about" onClick={(e) => scrollToId(e, '#about')} className="text-white/80 no-underline hover:text-white">About</a></li>
                <li><a href="#programs" onClick={(e) => scrollToId(e, '#programs')} className="text-white/80 no-underline hover:text-white">Operators</a></li>
                <li><a href="#careers" onClick={(e) => scrollToId(e, '#careers')} className="text-white/80 no-underline hover:text-white">Careers</a></li>
                <li><a href="#contact" onClick={(e) => scrollToId(e, '#contact')} className="text-white/80 no-underline hover:text-white">Contact</a></li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-white/15 pt-8 text-sm text-white/60 flex flex-col gap-[1.25rem] sm:flex-row sm:justify-between sm:items-center">
            <span>&copy; 2026 SØLΛR-X Microgrid. All rights reserved.</span>
            <nav aria-label="Social" className="flex gap-[1.25rem]">
              <a href="#instagram" onClick={(e) => scrollToId(e, '#instagram')} className="text-inherit no-underline hover:text-white">Instagram</a>
              <a href="#x" onClick={(e) => scrollToId(e, '#x')} className="text-inherit no-underline hover:text-white">X</a>
              <a href="#youtube" onClick={(e) => scrollToId(e, '#youtube')} className="text-inherit no-underline hover:text-white">YouTube</a>
              <a href="#linkedin" onClick={(e) => scrollToId(e, '#linkedin')} className="text-inherit no-underline hover:text-white">LinkedIn</a>
            </nav>
            <nav aria-label="Legal" className="flex gap-[1.25rem]">
              <a href="#privacy" onClick={(e) => scrollToId(e, '#privacy')} className="text-inherit no-underline hover:text-white">Privacy</a>
              <a href="#terms" onClick={(e) => scrollToId(e, '#terms')} className="text-inherit no-underline hover:text-white">Terms</a>
            </nav>
          </div>
        </footer>
      </main>

    </>
  );
};

function FacilitiesBody() {
  const [ref, inView] = useInViewOnce(250);
  const words = 'Reserve battery capacity for home backup, fleet charging, or resale — and trade on the same hardware that powers the island.'.split(' ');
  return (
    <p className="text-sm text-[#717784] mt-6 mb-0 max-w-[20rem]" ref={ref}>
      {words.map((w, i) => (
        <Mask key={i} inline active={inView} delay={i * 28} duration={700} easing="easeOutQuart" y="18px" pad="0">
          <span className={i < words.length - 1 ? 'me-[0.28em]' : ''}>{w}</span>
        </Mask>
      ))}
    </p>
  );
}

export default Home;
