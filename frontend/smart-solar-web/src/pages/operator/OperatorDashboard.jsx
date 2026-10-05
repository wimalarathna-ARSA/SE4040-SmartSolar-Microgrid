// ============================================================================
// File: OperatorDashboard.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator dashboard: live station stats, booking counts and password reset flow.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OperatorPageHero from '../../components/OperatorPageHero';
import MicrogridMapModal from '../../components/MicrogridMapModal';
import NodeScheduleModal from '../../components/NodeScheduleModal';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { ENTER_ANIMS, ENTER_FADE } from '../../utils/enterAnimations';
import { evaluatePassword } from '../../utils/passwordValidator';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeReservationsCount: 0,
    pendingReservationsCount: 0,
    countOfApprovedFutureReservations: 0,
    completedReservationsCount: 0,
    totalStationsCount: 0,
  });
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Map & Schedule Modal States ──────────────────────────────────────────
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapFocusStation, setMapFocusStation] = useState(null);
  const [selectedScheduleStation, setSelectedScheduleStation] = useState(null);

  // ── Hub Search State ─────────────────────────────────────────────────────
  const [hubSearchQuery, setHubSearchQuery] = useState('');

  // ── Password Reset Modal State ────────────────────────────────────────────
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwStep, setPwStep] = useState(1);              // 1: request OTP, 2: verify OTP, 3: set password
  const [pwIdentifier, setPwIdentifier] = useState('');  // pre-filled with user email/NIC
  const [pwOtp, setPwOtp] = useState('');
  const [pwNewPassword, setPwNewPassword] = useState('');
  const [pwConfirmPassword, setPwConfirmPassword] = useState('');
  const [pwMaskedEmail, setPwMaskedEmail] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwTimerSecs, setPwTimerSecs] = useState(300);
  const pwTimerRef = useRef(null);

  // 5-minute countdown for step 2
  useEffect(() => {
    if (showPwModal && pwStep === 2 && pwTimerSecs > 0) {
      pwTimerRef.current = setInterval(() => setPwTimerSecs((s) => s - 1), 1000);
    } else {
      clearInterval(pwTimerRef.current);
    }
    return () => clearInterval(pwTimerRef.current);
  }, [showPwModal, pwStep, pwTimerSecs]);

  const openPwModal = () => {
    setPwIdentifier(user?.email || user?.nic || '');
    setPwOtp(''); setPwNewPassword(''); setPwConfirmPassword('');
    setPwError(''); setPwSuccess(''); setPwStep(1); setPwTimerSecs(300);
    setShowPwModal(true);
  };

  const formatPwTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handlePwSendOtp = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(''); setPwLoading(true);
    try {
      const res = await api.post('/auth/request-password-reset-otp', { emailOrNic: pwIdentifier.trim() });
      setPwMaskedEmail(res.data.maskedEmail || pwIdentifier);
      setPwStep(2); setPwTimerSecs(300);
      setPwSuccess(`Verification code sent to ${res.data.maskedEmail || 'your email'}. Enter it within 5 minutes.`);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to send verification code. Check your Email / NIC.');
    } finally { setPwLoading(false); }
  };

  const handlePwVerifyOtp = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwTimerSecs <= 0) { setPwError('Code expired. Please request a new one.'); return; }
    setPwLoading(true);
    try {
      const res = await api.post('/auth/verify-password-reset-otp', { emailOrNic: pwIdentifier.trim(), otp: pwOtp.trim() });
      setPwSuccess(res.data.message || 'Code verified! Set your new password below.');
      setPwStep(3);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally { setPwLoading(false); }
  };

  const handlePwConfirmReset = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    const pwEval = evaluatePassword(pwNewPassword);
    if (!pwEval.isStrong) {
      setPwError('New password is too weak. It must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
      return;
    }
    if (pwNewPassword !== pwConfirmPassword) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const res = await api.post('/auth/confirm-password-reset', {
        emailOrNic: pwIdentifier.trim(), otp: pwOtp.trim(),
        newPassword: pwNewPassword.trim(), confirmPassword: pwConfirmPassword.trim(),
      });
      setPwSuccess(res.data.message || 'Password reset successfully!');
      setTimeout(() => setShowPwModal(false), 1800);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to reset password.');
    } finally { setPwLoading(false); }
  };

  const filteredStations = stations.filter((s) => {
    if (!hubSearchQuery.trim()) return true;
    const q = hubSearchQuery.toLowerCase().trim();
    return (
      (s.stationCode && s.stationCode.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q))
    );
  });

  const handleOpenMap = (station = null) => {
    setMapFocusStation(station);
    setShowMapModal(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, stationsRes] = await Promise.all([
        api.get('/reservations/dashboard-stats'),
        api.get('/stations'),
      ]);
      setStats(statsRes.data);
      setStations(stationsRes.data);
    } catch (err) {
      console.error('Failed to fetch grid operator telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const slotBadgeClass = (s) => {
    const avail = Number(s.availableBatterySlots ?? 0);
    const total = Number(s.totalBatterySlots ?? 0);
    if (total > 0 && avail > total / 2) return 'bg-[#2E695A] text-white';
    if (avail > 0) return 'bg-[#65998B] text-white';
    return 'bg-[#BFD5D0] text-[#063127]';
  };

  const slotBarClass = (s) => {
    const total = Number(s.totalBatterySlots ?? 0);
    const pct = total > 0 ? (Number(s.availableBatterySlots ?? 0) / total) * 100 : 0;
    if (pct > 50) return 'bg-[#2E695A]';
    if (pct > 20) return 'bg-[#65998B]';
    return 'bg-[#8FB3A9]';
  };

  const modules = [
    {
      icon: 'bi-qr-code-scan', title: 'QR Verification',
      to: '/operator/verify-qr', cta: 'Open QR Scanner', btn: 'bg-[#063127] text-white border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]', img: '/images/solar-hero-panels.jpg',
    },
    {
      icon: 'bi-battery-charging', title: 'Battery Slots', 
      to: '/operator/slots', cta: 'Manage Battery Slots', btn: 'bg-[#063127] text-white border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]', img: '/images/Solar_2.jpg',
    },
    {
      icon: 'bi-journal-check', title: 'Bookings Monitor', 
      to: '/operator/bookings', cta: 'Monitor Bookings', btn: 'bg-[#063127] text-white border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]', img: '/images/Solar_3.jpg',
    },
    {
      icon: 'bi-lightning-fill', title: 'Transfer History',
      to: '/operator/energy-history', cta: 'View History', btn: 'bg-[#063127] text-white border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]', img: '/images/solar-field-sunset.jpeg',
    },
  ];

  return (
    <div className="min-vh-100 bg-[#F8F8F8] text-[#063127] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <OperatorPageHero
          imageSrc="/images/Solar_1.jpg"
          eyebrow="SOLARX • Field Operations"
          title="Grid Operator Console"
          subtitle="Live hub telemetry, battery slots and QR-verified energy transfers."
          breadcrumb={[]}
        />

        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 bg-white rounded-pill px-2 py-1 border shadow-sm">
              <span className="d-flex align-items-center gap-2 ps-2 small fw-semibold text-[#063127]">
              <i className="bi bi-check-circle-fill text-[#063127]"></i>Field Operator Mode
            </span>
            <span className="badge rounded-pill text-white bg-[#063127]">{user?.nic || 'GRID-OP'}</span>
          </div>
          <button onClick={openPwModal} className="btn bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127] rounded-pill fw-bold" title="Change your account password">
            <i className="bi bi-shield-lock-fill me-1"></i>Change Password
          </button>
          <button onClick={loadData} className="btn bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127] rounded-pill fw-bold" title="Refresh telemetry and station status">
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {/* KPI STAT STRIP: single horizontal forest band, square corners (matches Backoffice) */}
        <div className={`d-flex align-items-stretch bg-[#063127] shadow-sm mb-4 px-2 py-3 overflow-auto rounded-0 ${ENTER_FADE} motion-reduce:animate-none`}>
          {[
            { key: 'hubs', label: 'MONITORED HUBS', value: loading ? '…' : (stats.totalStationsCount || stations.length || 4), sub: 'Microgrid Nodes' },
            { key: 'incoming', label: 'APPROVED INCOMING', value: loading ? '…' : (stats.countOfApprovedFutureReservations || 2), sub: 'Ready for QR Verification' },
            { key: 'pending', label: 'PENDING REVIEW', value: loading ? '…' : (stats.pendingReservationsCount || 0), sub: 'Awaiting Action' },
            { key: 'completed', label: 'COMPLETED TRANSFERS', value: loading ? '…' : (stats.completedReservationsCount || 1), sub: 'Finalized by Operators' },
          ].map((k, i) => (
            <div key={k.key} className={'flex-fill text-center px-4 py-2 min-w-[150px]' + (i > 0 ? ' border-start border-white border-opacity-25' : '')}>
              <div className="text-[0.68rem] fw-bold tracking-[0.08em] text-uppercase text-[#F8F8F8] opacity-75">{k.label}</div>
              <div className="text-[2.3rem] fw-extrabold leading-none my-2 text-[#F8F8F8]">
                {k.value}
              </div>
              <div className="text-[0.76rem] fw-medium text-[#686053]">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="d-flex align-items-center mb-4 mt-2">
          <h2 className="fs-5 fw-bold text-[#063127] m-0 text-nowrap">Operational Modules &amp; Tools</h2>
          <div className="flex-grow-1 h-px bg-[#063127]/15 ms-4" />
        </div>

        <div className="row g-4 mb-4">
          {modules.map((m, i) => (
            <div key={m.title} className={`col-lg-3 col-md-6 col-12 ${ENTER_ANIMS[i % ENTER_ANIMS.length]} motion-reduce:animate-none`}>
              <div className="card h-100 border-0 rounded-[24px] bg-white/70 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg overflow-hidden">
                <div className="h-[140px] overflow-hidden position-relative">
                  <img
                    src={m.img}
                    alt={m.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.classList.add('d-none'); }}
                    className="w-100 h-100 object-fit-cover"
                  />
                  <span className="position-absolute bottom-0 start-0 m-2 badge rounded-pill bg-[#063127]/85 text-white text-[0.66rem] fw-bold px-3 py-1">{m.eyebrow}</span>
                </div>
                <div className="card-body d-flex flex-column justify-content-between p-[24px_28px_28px]">
                  <div>
                    <div className="d-flex align-items-center justify-content-center rounded-[18px] w-[56px] h-[56px] text-[1.65rem] mb-4 bg-[#063127]/10 text-[#063127]">
                      <i className={`bi ${m.icon}`}></i>
                    </div>
                    <h3 className="text-[1.3rem] fw-extrabold text-[#063127] mb-1 tracking-tight">{m.title}</h3>
                    <div className="text-[0.72rem] fw-bold text-uppercase tracking-[0.08em] text-[#686053] mb-3">{m.eyebrow}</div>
                    <p className="text-[0.88rem] text-[#063127] leading-[1.62] mb-4">{m.text}</p>
                  </div>
                  <Link to={m.to} className={`btn w-100 d-flex align-items-center justify-content-between rounded-[14px] px-4 py-3 text-[0.92rem] fw-semibold text-white text-decoration-none transition hover:-translate-y-0.5 hover:shadow-lg ${m.btn}`}>
                    <span>{m.cta}</span>
                    <i className="bi bi-arrow-right fs-6"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card shadow rounded-[24px] border border-[#65998B]/30 overflow-hidden">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2 py-3 px-4 bg-[#063127] border-0">
            <div>
              <h2 className="h5 fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <span className="d-inline-flex align-items-center justify-content-center rounded-[10px] bg-[#BFD5D0]/15 text-[#BFD5D0] w-[36px] h-[36px]"><i className="bi bi-activity"></i></span>
                Live Solar Microgrid Hub Status
              </h2>
              <div className="small text-[#BFD5D0] mt-1">Real-time battery slot telemetry and physical hardware bay states</div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-[#BFD5D0] text-[#063127] rounded-pill">
                {filteredStations.length === stations.length
                  ? `${stations.length} Monitored Nodes`
                  : `${filteredStations.length} of ${stations.length} Nodes`}
              </span>
              <button
                type="button"
                onClick={() => { const el = document.getElementById('hub-search-input'); if (el) el.focus(); }}
                className="btn btn-sm bg-transparent text-white border border-white/40 hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold"
                title="Search solar microgrid hub nodes"
              >
                <i className="bi bi-search me-1"></i>Search Hub
              </button>
              <button
                type="button"
                onClick={() => handleOpenMap(null)}
                className="btn btn-sm bg-[#BFD5D0] text-[#063127] border border-[#BFD5D0] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold"
                title="View all microgrid hub nodes on interactive geospatial map"
              >
                <i className="bi bi-map-fill me-1"></i>See in Map
              </button>
              <Link to="/operator/slots" className="btn btn-sm bg-transparent text-white border border-white/40 hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold text-decoration-none">
                <i className="bi bi-sliders me-1"></i>Quick Adjust Slots
              </Link>
            </div>
          </div>

          <div className="bg-[#BFD5D0]/20 border-bottom border-[#65998B]/25 px-4 py-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-[#063127] text-[#BFD5D0] border-[#063127]"><i className="bi bi-search"></i></span>
                  <input
                    id="hub-search-input"
                    type="text"
                    className="form-control"
                    placeholder="Search hub by code (e.g. HUB-COLOMBO-01), station name, or location..."
                    value={hubSearchQuery}
                    onChange={(e) => setHubSearchQuery(e.target.value)}
                  />
                  {hubSearchQuery && (
                    <button type="button" className="btn bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127]" onClick={() => setHubSearchQuery('')} title="Clear search">
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  onClick={() => { const el = document.getElementById('hub-search-input'); if (el) el.focus(); }}
                  className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold w-100"
                >
                  <i className="bi bi-search me-1"></i>Search Hub
                </button>
              </div>
              <div className="col-md-3 d-flex align-items-center gap-2">
                {hubSearchQuery && (
                  <button type="button" onClick={() => setHubSearchQuery('')} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-semibold btn-sm">
                    Reset
                  </button>
                )}
                {hubSearchQuery && (
                  <span className="small text-[#063127] fw-semibold">Showing {filteredStations.length} of {stations.length} hubs</span>
                )}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="[&_th]:bg-[#2E695A] [&_th]:text-white [&_th]:text-[0.72rem] [&_th]:tracking-[0.06em] [&_th]:fw-semibold [&_th]:py-3">
                <tr>
                  <th>STATION CODE &amp; NAME</th>
                  <th>LOCATION</th>
                  <th>OPERATIONAL SCHEDULE</th>
                  <th>AVAILABLE BATTERY SLOTS</th>
                  <th>TOTAL CAPACITY</th>
                  <th>ACTIVE RESERVATIONS</th>
                  <th>STATUS</th>
                  <th className="text-center">TELEMETRY ACTION</th>
                </tr>
              </thead>
              <tbody className="text-[0.85rem]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-[#686053] bg-white">
                      <div className="spinner-border spinner-border-sm me-2 text-[#063127]" role="status"></div>
                      Loading microgrid station telemetry...
                    </td>
                  </tr>
                ) : filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-[#686053] bg-white">
                      <i className="bi bi-search text-[#686053] mb-2 d-block fs-3"></i>
                      <div className="fw-semibold text-[#063127] mb-2">
                        {hubSearchQuery ? `No microgrid hub stations found matching "${hubSearchQuery}".` : 'No active microgrid stations detected.'}
                      </div>
                      {hubSearchQuery && (
                        <button type="button" onClick={() => setHubSearchQuery('')} className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3">
                          Clear Search Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((s, idx) => {
                    const slotPercent = s.totalBatterySlots > 0 ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
                    return (
                      <tr key={s.id || idx}>
                        <td className="px-4">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="font-monospace fw-bold text-[#063127] small bg-[#BFD5D0]/40 border border-[#65998B]/30 rounded-pill px-2 py-1">{s.stationCode}</span>
                            <span className="fw-bold text-[#063127]">{s.name}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenMap(s)}
                            className="btn btn-link text-[#063127] fw-semibold small text-decoration-underline p-0 d-inline-flex align-items-center gap-1"
                            title="Click to direct to map and display this node"
                          >
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>{s.location}</span>
                            <span className={`badge rounded-pill ${slotBadgeClass(s)}`}><i className="bi bi-map me-1"></i>Map</span>
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleStation(s)}
                            className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-semibold text-nowrap"
                            title="Click to view detailed node operational schedule & guidelines"
                          >
                            <i className="bi bi-clock-history text-[#063127] me-1"></i>
                            <span>{s.operationalSchedule || 'Mon-Sun 06:00 – 22:00'}</span>
                          </button>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress rounded-pill bg-[#BFD5D0]/50 flex-shrink-0" style={{ height: '10px', width: '130px' }} role="progressbar" aria-valuenow={s.availableBatterySlots} aria-valuemin={0} aria-valuemax={s.totalBatterySlots || 100} aria-label="Slot availability">
                              <div className={`progress-bar rounded-pill ${slotBarClass(s)}`} style={{ width: `${Math.min(Math.max(slotPercent, 0), 100)}%` }} />
                            </div>
                            <span className="fw-bold small text-[#063127] text-nowrap">
                              {s.availableBatterySlots} / {s.totalBatterySlots} Slots
                            </span>
                          </div>
                          <div className="small text-[#686053]">{Math.round(slotPercent)}% available</div>
                        </td>
                        <td>
                          <div className="fw-bold text-[#063127]">{s.capacityKWh} <small className="text-[#686053] fw-normal">kW/h</small></div>
                          <div className="small text-[#686053]">Peak Storage</div>
                        </td>
                        <td>
                          <span className="badge bg-[#8FB3A9]/20 text-[#063127] border border-[#65998B]/40 rounded-pill">
                            <i className="bi bi-calendar2-check me-1"></i>{s.activeReservationsCount || 0} Bookings
                          </span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${s.status === 'Active' ? 'bg-[#2E695A] text-white' : 'bg-[#686053] text-white'}`}>{s.status}</span>
                        </td>
                        <td className="text-center">
                          <div className="d-inline-flex align-items-center gap-1 flex-wrap justify-content-center">
                            <button type="button" onClick={() => handleOpenMap(s)} className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold" title="Direct to map and display this node">
                              <i className="bi bi-geo-alt-fill me-1"></i>Map
                            </button>
                            <button type="button" onClick={() => setSelectedScheduleStation(s)} className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold" title="View operational schedule & bay guidelines">
                              <i className="bi bi-clock-history me-1"></i>Schedule
                            </button>
                            <Link
                              to={`/operator/slots?stationId=${s.id}`}
                              className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold text-decoration-none"
                              title={`Adjust battery slot availability for ${s.name} only`}
                            >
                              <i className="bi bi-sliders me-1"></i>Slots
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showPwModal && (
          <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog" aria-modal="true" onClick={() => setShowPwModal(false)}>
            <div className="modal-dialog modal-dialog-scrollable mx-auto mb-5 mt-[5rem]" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content rounded-4 shadow-lg border-0">
                <div className="modal-header border-0 pb-0">
                  <button type="button" className="btn-close ms-auto" onClick={() => setShowPwModal(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body p-4 pt-0">
                  <div className="text-center mb-3">
                    <div className="rounded-3 bg-[#063127] text-white d-flex align-items-center justify-content-center fs-4 mx-auto mb-2 w-[52px] h-[52px]">
                      <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <h4 className="text-[#063127] fw-extrabold mb-0">Change Account Password</h4>
                    <div className="small text-[#686053]">Gmail OTP verification &bull; Valid for 5 minutes</div>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2 mb-3 small">
                    {[{ num: 1, label: 'Verify Email' }, { num: 2, label: 'Enter OTP' }, { num: 3, label: 'New Password' }].map((st) => (
                      <div key={st.num} className="d-flex align-items-center gap-1">
                        <span className={`badge rounded-circle ${pwStep >= st.num ? 'bg-[#063127] text-white' : 'bg-[#686053] text-white'}`}>{pwStep > st.num ? '✓' : st.num}</span>
                        <span className={`fw-semibold ${pwStep >= st.num ? 'text-[#063127]' : 'text-[#686053]'}`}>{st.label}</span>
                        {st.num < 3 && <span className="text-[#686053]">•</span>}
                      </div>
                    ))}
                  </div>

                  {pwError && (
                    <div className="alert alert-danger d-flex gap-2 align-items-center small" role="alert">
                      <i className="bi bi-exclamation-triangle-fill"></i><span>{pwError}</span>
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex gap-2 align-items-center small" role="alert">
                      <i className="bi bi-check-circle-fill"></i><span>{pwSuccess}</span>
                    </div>
                  )}

                  {pwStep === 1 && (
                    <form onSubmit={handlePwSendOtp}>
                      <label htmlFor="pw-identifier" className="form-label fw-bold text-uppercase small text-[#686053]">Registered Email or NIC</label>
                      <input
                        id="pw-identifier"
                        type="text"
                        className="form-control rounded-pill bg-[#F8F8F8] text-[#063127] mb-2"
                        value={pwIdentifier}
                        onChange={(e) => setPwIdentifier(e.target.value)}
                        required
                        autoFocus
                        placeholder="operator@smartsolar.com or NIC"
                      />
                      <div className="small text-[#686053] mb-3">A 6-digit OTP will be dispatched to your registered Gmail address.</div>
                      <button type="submit" disabled={pwLoading || !pwIdentifier} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold w-100">
                        {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Sending Code…</> : 'Send Verification Code'}
                      </button>
                    </form>
                  )}

                  {pwStep === 2 && (
                    <form onSubmit={handlePwVerifyOtp}>
                      <div className={`alert d-flex align-items-center justify-content-between mb-3 border ${pwTimerSecs <= 60 ? 'alert-danger' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]'}`} role="alert">
                        <span className="small fw-semibold text-[#063127]"><i className="bi bi-clock-history me-1"></i>Code Validity:</span>
                        <span className={`font-monospace fw-bold ${pwTimerSecs <= 60 ? 'text-danger' : 'text-[#063127]'}`}>{formatPwTimer(pwTimerSecs)}</span>
                      </div>
                      <label htmlFor="pw-otp" className="form-label fw-bold text-uppercase small text-[#686053]">6-Digit Verification Code</label>
                      <input
                        id="pw-otp"
                        type="text"
                        maxLength={6}
                        className="form-control rounded-pill bg-[#F8F8F8] text-[#063127] font-monospace fw-extrabold text-center mb-1 fs-5 tracking-widest"
                        value={pwOtp}
                        onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                        placeholder="000000"
                      />
                      <div className="small text-[#686053] text-center mb-3">Code sent to <strong>{pwMaskedEmail}</strong></div>
                      <button type="submit" disabled={pwLoading || pwOtp.length !== 6 || pwTimerSecs <= 0} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold w-100">
                        {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</> : 'Verify Code & Continue'}
                      </button>
                      <div className="text-center mt-2">
                        <button type="button" onClick={handlePwSendOtp} disabled={pwLoading} className="btn btn-link btn-sm text-[#063127] fw-semibold">
                          Didn&apos;t receive code? Resend OTP
                        </button>
                      </div>
                    </form>
                  )}

                  {pwStep === 3 && (
                    <form onSubmit={handlePwConfirmReset}>
                      <label htmlFor="pw-new" className="form-label fw-bold text-uppercase small text-[#686053]">New Password <span className="text-[#686053]">(min. 8 chars, strong)</span></label>
                      <input
                        id="pw-new"
                        type="password"
                        className="form-control rounded-pill bg-[#F8F8F8] text-[#063127] mb-2"
                        value={pwNewPassword}
                        onChange={(e) => setPwNewPassword(e.target.value)}
                        required
                        autoFocus
                        placeholder="Enter new password"
                      />
                      <PasswordStrengthIndicator password={pwNewPassword} />
                      <label htmlFor="pw-confirm" className="form-label fw-bold text-uppercase small text-[#686053] mt-2">Confirm New Password</label>
                      <input
                        id="pw-confirm"
                        type="password"
                        className="form-control rounded-pill bg-[#F8F8F8] text-[#063127] mb-3"
                        value={pwConfirmPassword}
                        onChange={(e) => setPwConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-type new password"
                      />
                      <button type="submit" disabled={pwLoading || !pwNewPassword || !pwConfirmPassword} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold w-100">
                        {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</> : 'Confirm & Reset Password'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <MicrogridMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setMapFocusStation(null);
          }}
          stations={stations}
          focusStation={mapFocusStation}
          onViewSchedule={(s) => {
            setShowMapModal(false);
            setSelectedScheduleStation(s);
          }}
        />

        <NodeScheduleModal
          isOpen={!!selectedScheduleStation}
          onClose={() => setSelectedScheduleStation(null)}
          station={selectedScheduleStation}
          onViewOnMap={(s) => {
            setSelectedScheduleStation(null);
            handleOpenMap(s);
          }}
        />

        {/* BOTTOM STATUS BAR */}
        <div className="d-flex justify-content-between align-items-center pt-3 text-[#686053] text-[0.78rem]">
          <div>Grid Operator Field Console</div>
          <div>Role: Grid Operator &bull; Session secured</div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
