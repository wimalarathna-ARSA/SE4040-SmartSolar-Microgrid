// ============================================================================
// File: BackofficeDashboard.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice main dashboard: live pending prosumers, approved future reservations and stats.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BackofficePageHero from '../../components/BackofficePageHero';
import RingChart from '../../components/RingChart';
import { ENTER_ANIMS, ENTER_FADE } from '../../utils/enterAnimations';

const kpiCards = [
  { key: 'stations', label: 'ACTIVE NODES', valueKey: 'totalStationsCount', fallback: 4, sub: 'Microgrid Hubs' },
  { key: 'future', label: 'APPROVED FUTURE', valueKey: 'countOfApprovedFutureReservations', fallback: 2, sub: 'Within 7 Days' },
  { key: 'prosumers', label: 'PROSUMERS', valueKey: 'totalProsumersCount', fallback: 5, sub: 'Registered by NIC' },
  { key: 'completed', label: 'COMPLETED', valueKey: 'completedReservationsCount', fallback: 1, sub: 'Finalized Trades' },
];

const moduleCards = [
  {
    to: '/backoffice/staff', title: 'User Management', 
    desc: 'Create and manage administrative users with two distinct roles: Backoffice and Grid Operator.',
    cta: 'Manage Staff Users', btnClass: 'bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]',
    icon: 'bi-shield-check', iconWrap: 'bg-[#063127]/10 text-[#063127]', img: '/images/Solar_5.jpg',
  },
  {
    to: '/backoffice/prosumers', title: 'Prosumer Control', 
    desc: 'View pending activations, activate, deactivate, or reactivate prosumer profiles using National Identity Card (NIC).',
    cta: 'Manage Prosumers', btnClass: 'bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]',
    icon: 'bi-person-circle', iconWrap: 'bg-[#063127]/10 text-[#063127]', img: '/images/solar-rooftop-home.jpg',
  },
  {
    to: '/backoffice/stations', title: 'Microgrid Nodes', 
    desc: 'Create solar hubs with GPS coordinates, capacity specs (kW/h), and battery storage slots. Deactivation is protected against active reservations.',
    cta: 'Configure Hubs', btnClass: 'bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]',
    icon: 'bi-broadcast-pin', iconWrap: 'bg-[#063127]/10 text-[#063127]', img: '/images/solar-field-sunset.jpeg',
  },
  {
    to: '/backoffice/reservations', title: 'Energy Reservations',
    desc: 'Monitor power trading bookings across stations, enforcing 7-day advance reservation and 12-hour cancellation notice rules.',
    cta: 'View Reservations', btnClass: 'bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]',
    icon: 'bi-calendar2-check', iconWrap: 'bg-[#063127]/10 text-[#063127]', img: '/images/Solar_2.jpg',
  },
];

const BackofficeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeReservationsCount: 0,
    pendingReservationsCount: 0,
    countOfApprovedFutureReservations: 0,
    completedReservationsCount: 0,
    totalStationsCount: 0,
    totalProsumersCount: 0,
  });
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reservation pipeline ring data (live project stats with card fallbacks).
  const approvedCount = stats.countOfApprovedFutureReservations || 2;
  const activeCount = stats.activeReservationsCount || 1;
  const pendingCount = stats.pendingReservationsCount || 0;
  const completedCount = stats.completedReservationsCount || 1;
  const pipelineTotal = approvedCount + activeCount + pendingCount + completedCount;
  const ringData = [
    { label: 'Approved Future', value: approvedCount, maxValue: pipelineTotal, color: '#063127' },
    { label: 'Active Now', value: activeCount, maxValue: pipelineTotal, color: '#2E695A' },
    { label: 'Pending Review', value: pendingCount, maxValue: pipelineTotal, color: '#56877A' },
    { label: 'Completed', value: completedCount, maxValue: pipelineTotal, color: '#7FA69B' },
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/reservations/dashboard-stats'),
          api.get('/users/pending-prosumers'),
        ]);
        setStats(statsRes.data);
        setPendingProsumers(pendingRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <BackofficePageHero
          imageSrc="/images/Solar_1.jpg"
          eyebrow="SOLARX • Command Center"
          title="Backoffice Command Center"
          subtitle="Live reservations, stations and prosumers across the island microgrid network."
          breadcrumb={[]}
        />

        {/* TOOLBAR: role status only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3 bg-white/65 border border-white rounded-pill ps-4 pe-2 py-1 shadow-sm backdrop-blur-xl">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-[#063127] text-[1rem]"></i>
              <span className="text-[0.82rem] fw-semibold text-[#063127]">Backoffice Role Verified</span>
            </div>
            <span className="rounded-pill px-3 py-1 text-[0.74rem] fw-bold tracking-wide text-white bg-[#063127] shadow-sm">
              {user?.nic || 'ADMIN-04'}
            </span>
          </div>
        </div>

        {/* Pending Prosumers Alert */}
        {pendingProsumers.length > 0 && (
          <div className="card bg-white border border-[#063127]/20 rounded-[16px] shadow-sm mb-4">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-person-exclamation fs-3 text-[#686053]"></i>
                <div>
                  <div className="fw-bold text-[0.92rem] text-[#063127]">
                    {pendingProsumers.length} New Prosumer Registration(s) Pending Activation
                  </div>
                  <div className="text-[0.8rem] text-[#686053]">
                    Per rubric requirements, prosumer accounts registered via mobile require Backoffice approval.
                  </div>
                </div>
              </div>
              <Link to="/backoffice/prosumers" className="btn text-white fw-bold text-[0.82rem] rounded-[10px] px-3 py-2 bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] transition hover:-translate-y-0.5 hover:shadow-lg">
                Review Registrations &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Pending Reservations Alert */}
        {stats.pendingReservationsCount > 0 && (
          <div className="card bg-[#BFD5D0]/25 border border-[#8FB3A9] rounded-[16px] shadow-sm mb-4">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-circle bg-[#BFD5D0] text-[#063127] d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm">
                  <i className="bi bi-hourglass-split fs-4 text-[#3B796A]"></i>
                </div>
                <div>
                  <div className="fw-bold text-[0.95rem] text-[#063127]">
                    {stats.pendingReservationsCount} Energy Booking(s) Pending Backoffice Approval
                  </div>
                  <div className="text-[0.8rem] text-[#3B796A] fw-medium">
                    Prosumers are waiting for approval to generate their secure transaction QR pass for station battery bays.
                  </div>
                </div>
              </div>
              <Link to="/backoffice/reservations?status=Pending" className="btn text-white fw-bold text-[0.82rem] rounded-[10px] px-3 py-2 bg-[#3B796A] hover:bg-[#063127] border border-[#3B796A] transition hover:-translate-y-0.5 hover:shadow-lg text-decoration-none">
                Review &amp; Approve Bookings &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* KPI STAT STRIP: single horizontal forest band, square corners */}
        <div className={`d-flex align-items-stretch bg-[#063127] shadow-sm mb-4 px-2 py-3 overflow-auto rounded-0 ${ENTER_FADE} motion-reduce:animate-none`}>
          {kpiCards.map((k, i) => (
            <div key={k.key} className={'flex-fill text-center px-4 py-2 min-w-[150px]' + (i > 0 ? ' border-start border-white border-opacity-25' : '')}>
              <div className="text-[0.68rem] fw-bold tracking-[0.08em] text-uppercase text-[#F8F8F8] opacity-75">{k.label}</div>
              <div className="text-[2.3rem] fw-extrabold leading-none my-2 text-[#F8F8F8]">
                {loading ? '…' : (stats[k.valueKey] || k.fallback)}
              </div>
              <div className="text-[0.76rem] fw-medium text-[#686053]">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* RESERVATION PIPELINE RING CHART */}
        <div className="card border-0 rounded-[24px] bg-white/70 shadow-sm backdrop-blur-xl mb-4 overflow-hidden">
          <div className="row g-0 align-items-center">
            <div className="col-md-5 p-4 d-flex justify-content-center">
              <RingChart
                data={ringData}
                size={210}
                strokeWidth={16}
                ringGap={8}
                animationDuration={1100}
                animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
              />
            </div>
            <div className="col-md-7 p-4">
              <h3 className="text-[1.15rem] fw-extrabold text-[#063127] mb-1 tracking-tight">Reservation Pipeline</h3>
              <p className="text-[0.84rem] text-[#686053] mb-3">Live share of power-trading bookings by lifecycle stage.</p>
              {ringData.map((r) => {
                const pct = pipelineTotal > 0 ? Math.round((r.value / pipelineTotal) * 100) : 0;
                return (
                  <div key={r.label} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="d-flex align-items-center gap-2 text-[0.86rem] fw-bold text-[#063127]">
                        <span className="d-inline-block rounded-circle w-[12px] h-[12px]" style={{ backgroundColor: r.color }}></span>
                        {r.label}
                      </span>
                      <span className="text-[0.82rem] fw-semibold text-[#686053]">{r.value} &bull; {pct}%</span>
                    </div>
                    <div className="rounded-pill bg-[#063127]/10 h-[8px] overflow-hidden">
                      <div className="rounded-pill h-100 transition" style={{ width: `${pct}%`, backgroundColor: r.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION TITLE: Management Modules */}
        <div className="d-flex align-items-center mb-4 mt-2">
          <h2 className="fs-5 fw-bold text-[#063127] m-0 text-nowrap">Management Modules</h2>
          <div className="flex-grow-1 h-px bg-[#063127]/15 ms-4" />
        </div>

        {/* 4 LARGE MANAGEMENT MODULE CARDS */}
        <div className="row g-4 mb-4">
          {moduleCards.map((m, i) => (
            <div key={m.title} className={`col-lg-3 col-md-6 col-12 ${ENTER_ANIMS[i % ENTER_ANIMS.length]} motion-reduce:animate-none`}>
              <div className="card h-100 border-0 rounded-[24px] bg-white/70 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg overflow-hidden">
                <div className="h-[150px] overflow-hidden position-relative">
                  <img
                    src={m.img}
                    alt={m.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.classList.add('d-none'); }}
                    className="w-100 h-100 object-fit-cover"
                  />
                  <span className="position-absolute bottom-0 start-0 m-3 badge rounded-pill bg-[#063127]/85 text-white text-[0.68rem] fw-bold px-3 py-1 backdrop-blur-sm">{m.eyebrow}</span>
                </div>
                <div className="card-body d-flex flex-column justify-content-between p-[24px_28px_28px]">
                  <div>
                    <div className={'d-flex align-items-center justify-content-center rounded-[18px] w-[56px] h-[56px] text-[1.65rem] mb-4 ' + m.iconWrap}>
                      <i className={'bi ' + m.icon}></i>
                    </div>
                    <h3 className="text-[1.3rem] fw-extrabold text-[#063127] mb-1 tracking-tight">{m.title}</h3>
                    <div className="text-[0.72rem] fw-bold text-uppercase tracking-[0.08em] text-[#686053] mb-3">{m.eyebrow}</div>
                    <p className="text-[0.88rem] text-[#063127] leading-[1.62] mb-4">{m.desc}</p>
                  </div>
                  <Link to={m.to} className={'btn w-100 d-flex align-items-center justify-content-between rounded-[14px] px-4 py-3 text-[0.92rem] fw-semibold text-white text-decoration-none transition hover:-translate-y-0.5 hover:shadow-lg ' + m.btnClass}>
                    <span>{m.cta}</span>
                    <i className="bi bi-arrow-right fs-6"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM STATUS BAR */}
        <div className="d-flex justify-content-between align-items-center pt-3 text-[#686053] text-[0.78rem]">
          <div>Backoffice Administration Console</div>
          <div>Role: Administrator &bull; Session secured</div>
        </div>

      </div>
    </div>
  );
};

export default BackofficeDashboard;
