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
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import OperatorPageHero from '../../components/OperatorPageHero';
import MicrogridMapModal from '../../components/MicrogridMapModal';
import NodeScheduleModal from '../../components/NodeScheduleModal';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #08391b 0%, #1f7556 18%, #34d399 45%, #059669 75%, #022c22 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Constellation Mesh Network (Theme Green) */}
      <ConstellationMeshSVG theme="green" />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <OperatorPageHero
          imageSrc="/images/Solar_1.jpg"
          eyebrow="SOLARX • Field Operations"
          title="Grid Operator Console"
          subtitle="Live hub telemetry, battery slots and QR-verified energy transfers."
          breadcrumb={[]}
        />
        
        {/* =========================================================================
            TOP HEADER BAR
           ========================================================================= */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          {/* Right: Role Status Pill & Refresh */}
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                borderRadius: '50px',
                padding: '6px 8px 6px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 18px rgba(4, 120, 87, 0.08)',
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1rem' }}></i>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#064e3b' }}>
                  Field Operator Mode
                </span>
              </div>
              <span
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '4px 14px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                }}
              >
                {user?.nic || 'GRID-OP'}
              </span>
            </div>

            <button
              onClick={openPwModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50px',
                padding: '10px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#064e3b',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.08)',
                transition: 'all 0.2s ease',
              }}
              title="Change your account password"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>Change Password</span>
            </button>

            <button
              onClick={loadData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50px',
                padding: '10px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#064e3b',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.08)',
                transition: 'all 0.2s ease',
              }}
              title="Refresh telemetry and station status"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TOP KPI STAT CARDS (4 CARDS)
           ========================================================================= */}
        <div className="row g-3 mb-4">
          {/* 1. MONITORED HUBS */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '20px 22px',
                minHeight: '124px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(4, 120, 87, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                  MONITORED HUBS
                </span>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(167, 243, 208, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-broadcast" style={{ color: '#059669', fontSize: '0.82rem' }}></i>
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#059669', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.totalStationsCount || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                Microgrid Nodes
              </div>
            </div>
          </div>

          {/* 2. APPROVED INCOMING */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '20px 22px',
                minHeight: '124px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(4, 120, 87, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                  APPROVED INCOMING
                </span>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(187, 247, 208, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-qr-code-scan" style={{ color: '#16a34a', fontSize: '0.82rem' }}></i>
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#16a34a', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.countOfApprovedFutureReservations || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                Ready for QR Verification
              </div>
            </div>
          </div>

          {/* 3. PENDING REVIEW */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '20px 22px',
                minHeight: '124px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(4, 120, 87, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                  PENDING REVIEW
                </span>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(254, 243, 199, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-hourglass-split" style={{ color: '#d97706', fontSize: '0.82rem' }}></i>
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#d97706', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.pendingReservationsCount || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                Awaiting Action
              </div>
            </div>
          </div>

          {/* 4. COMPLETED TRANSFERS */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '20px 22px',
                minHeight: '124px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(4, 120, 87, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                  COMPLETED TRANSFERS
                </span>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(186, 230, 253, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-check2-all" style={{ color: '#0284c7', fontSize: '0.82rem' }}></i>
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0284c7', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.completedReservationsCount || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                Finalized by Operators
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION TITLE: Operational Modules & Tools
           ========================================================================= */}
        <div className="d-flex align-items-center mb-4 mt-2">
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Operational Modules &amp; Tools
          </h2>
          <div
            style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: 'rgba(6, 78, 59, 0.2)',
              marginLeft: '20px',
            }}
          />
        </div>

        {/* =========================================================================
            4 OPERATIONAL MODULE CARDS — COMPACT ONE ROW
           ========================================================================= */}
        <div className="row g-3 mb-5">

          {/* ── Tool 1: QR Verification ── */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '22px 20px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 28px -6px rgba(4, 120, 87, 0.11)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 36px -6px rgba(4, 120, 87, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 28px -6px rgba(4, 120, 87, 0.11)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                    background: 'rgba(209, 250, 229, 0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#059669', fontSize: '1.25rem',
                    boxShadow: '0 0 22px 4px rgba(16, 185, 129, 0.28)',
                  }}>
                    <i className="bi bi-qr-code-scan"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      QR Verification
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', marginTop: '2px' }}>
                      Field Authentication
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.79rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px', margin: '0 0 16px' }}>
                  Scan prosumer QR codes on-site and finalize energy transfers at the node.
                </p>
              </div>
              <Link
                to="/operator/verify-qr"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff', borderRadius: '50px', padding: '9px 16px',
                  fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(16, 185, 129, 0.32)',
                }}
              >
                <span>Open QR Scanner</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>

          {/* ── Tool 2: Battery Slot Availability ── */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '22px 20px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 28px -6px rgba(4, 120, 87, 0.11)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 36px -6px rgba(4, 120, 87, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 28px -6px rgba(4, 120, 87, 0.11)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                    background: 'rgba(220, 252, 231, 0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#16a34a', fontSize: '1.25rem',
                    boxShadow: '0 0 22px 4px rgba(34, 197, 94, 0.28)',
                  }}>
                    <i className="bi bi-battery-charging"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      Battery Slots
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#16a34a', marginTop: '2px' }}>
                      Capacity Telemetry
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.79rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px', margin: '0 0 16px' }}>
                  Update real-time battery slot availability across all solar microgrid hubs.
                </p>
              </div>
              <Link
                to="/operator/slots"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff', borderRadius: '50px', padding: '9px 16px',
                  fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(4, 120, 87, 0.3)',
                }}
              >
                <span>Manage Battery Slots</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>

          {/* ── Tool 3: Bookings Monitor ── */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '22px 20px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 28px -6px rgba(4, 120, 87, 0.11)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 36px -6px rgba(4, 120, 87, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 28px -6px rgba(4, 120, 87, 0.11)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                    background: 'rgba(224, 242, 254, 0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0284c7', fontSize: '1.25rem',
                    boxShadow: '0 0 22px 4px rgba(2, 132, 199, 0.28)',
                  }}>
                    <i className="bi bi-journal-check"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      Bookings Monitor
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#0284c7', marginTop: '2px' }}>
                      Queue Monitoring
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.79rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px', margin: '0 0 16px' }}>
                  Track pending &amp; approved power trading bookings across all solar nodes.
                </p>
              </div>
              <Link
                to="/operator/bookings"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff', borderRadius: '50px', padding: '9px 16px',
                  fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                }}
              >
                <span>Monitor Bookings</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>

          {/* ── Tool 4: Energy Transfer History ── */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '22px 20px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 28px -6px rgba(4, 120, 87, 0.11)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 36px -6px rgba(4, 120, 87, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 28px -6px rgba(4, 120, 87, 0.11)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                    background: 'rgba(254, 243, 199, 0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#d97706', fontSize: '1.25rem',
                    boxShadow: '0 0 22px 4px rgba(217, 119, 6, 0.24)',
                  }}>
                    <i className="bi bi-lightning-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      Transfer History
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#d97706', marginTop: '2px' }}>
                      Completed Transfers
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.79rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px', margin: '0 0 16px' }}>
                  Full audit log of all physical energy drop-off &amp; charging jobs verified by QR.
                </p>
              </div>
              <Link
                to="/operator/energy-history"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff', borderRadius: '50px', padding: '9px 16px',
                  fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(217, 119, 6, 0.28)',
                }}
              >
                <span>View History</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>

        </div>

        {/* =========================================================================
            LIVE SOLAR MICROGRID HUB STATUS (PURE LIGHT TABLE)
           ========================================================================= */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 16px 40px -8px rgba(6, 78, 59, 0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '24px 32px 20px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              background: 'transparent',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Live Solar Microgrid Hub Status
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Real-time battery slot telemetry and physical hardware bay states
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '6px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
                }}
              >
                {filteredStations.length === stations.length
                  ? `${stations.length} Monitored Nodes`
                  : `${filteredStations.length} of ${stations.length} Nodes`}
              </span>

              {/* Search Hub Button in Header */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('hub-search-input');
                  if (el) el.focus();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  color: '#064e3b',
                  borderRadius: '50px',
                  padding: '6px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
                title="Search solar microgrid hub nodes"
              >
                <i className="bi bi-search"></i>
                <span>Search Hub</span>
              </button>

              {/* See in Map Button */}
              <button
                type="button"
                onClick={() => handleOpenMap(null)}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '6px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.15s ease',
                }}
                title="View all microgrid hub nodes on interactive geospatial map"
              >
                <i className="bi bi-map-fill"></i>
                <span>See in Map</span>
              </button>

              <Link
                to="/operator/slots"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  color: '#064e3b',
                  borderRadius: '50px',
                  padding: '6px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <i className="bi bi-sliders"></i>
                <span>Quick Adjust Slots</span>
              </Link>
            </div>
          </div>

          {/* Search Hub Control Bar */}
          <div
            style={{
              padding: '14px 28px',
              background: '#f8fdfa',
              borderBottom: '1px solid rgba(167, 243, 208, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <i
                className="bi bi-search"
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#059669',
                  fontSize: '0.9rem',
                }}
              ></i>
              <input
                id="hub-search-input"
                type="text"
                placeholder="Search hub by code (e.g. HUB-COLOMBO-01), station name, or location..."
                value={hubSearchQuery}
                onChange={(e) => setHubSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 42px',
                  borderRadius: '50px',
                  background: '#ffffff',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  fontSize: '0.86rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
                }}
              />
              {hubSearchQuery && (
                <button
                  type="button"
                  onClick={() => setHubSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                  title="Clear search"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('hub-search-input');
                if (el) el.focus();
              }}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 22px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-search"></i>
              <span>Search Hub</span>
            </button>

            {hubSearchQuery && (
              <button
                type="button"
                onClick={() => setHubSearchQuery('')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '50px',
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}

            {hubSearchQuery && (
              <span style={{ fontSize: '0.82rem', color: '#064e3b', fontWeight: 600 }}>
                Showing {filteredStations.length} of {stations.length} hubs
              </span>
            )}
          </div>

          {/* Pure Light Table - No Bootstrap .table override */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderSpacing: 0,
                background: 'transparent',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: '#dcfce7', borderTop: '1px solid rgba(167, 243, 208, 0.8)', borderBottom: '1px solid rgba(167, 243, 208, 0.8)' }}>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    STATION CODE &amp; NAME
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    LOCATION
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    OPERATIONAL SCHEDULE
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    AVAILABLE BATTERY SLOTS
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    TOTAL CAPACITY
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    ACTIVE RESERVATIONS
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7', textAlign: 'center' }}>
                    TELEMETRY ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-success" role="status"></div>
                      Loading microgrid station telemetry...
                    </td>
                  </tr>
                ) : filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <i className="bi bi-search text-muted mb-2" style={{ fontSize: '1.8rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                        {hubSearchQuery ? `No microgrid hub stations found matching "${hubSearchQuery}".` : 'No active microgrid stations detected.'}
                      </div>
                      {hubSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setHubSearchQuery('')}
                          className="btn btn-sm btn-outline-success rounded-pill px-3"
                        >
                          Clear Search Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((s, idx) => {
                    const rowBg = idx % 2 === 0 ? '#edf9f3' : '#f9fcfb';
                    const slotPercent = s.totalBatterySlots > 0 ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
                    
                    // Slot availability color
                    const avail = Number(s.availableBatterySlots ?? 0);
                    const total = Number(s.totalBatterySlots ?? 0);
                    let slotColorHex = '#ef4444'; // Red: no slots
                    if (total > 0 && avail > total / 2) {
                      slotColorHex = '#10b981'; // Green: >50%
                    } else if (avail > 0) {
                      slotColorHex = '#f59e0b'; // Yellow: <50%
                    }

                    return (
                      <tr
                        key={s.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: idx === stations.length - 1 ? 'none' : '1px solid rgba(167, 243, 208, 0.6)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#def3e7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* Station */}
                        <td style={{ padding: '18px 28px', background: 'transparent' }}>
                          <div className="d-flex align-items-center gap-2">
                            <span
                              style={{
                                color: '#047857',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                letterSpacing: '0.02em',
                                display: 'inline-block',
                              }}
                            >
                              {s.stationCode}
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                              {s.name}
                            </span>
                          </div>
                        </td>

                        {/* Location (Clickable to direct to map) */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <div
                            onClick={() => handleOpenMap(s)}
                            style={{
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#064e3b',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              transition: 'all 0.15s ease',
                            }}
                            title="Click to direct to map and display this node"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#064e3b';
                            }}
                          >
                            <i className="bi bi-geo-alt-fill" style={{ fontSize: '1rem', color: slotColorHex }}></i>
                            <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{s.location}</span>
                            <span
                              style={{
                                background: `${slotColorHex}18`,
                                color: slotColorHex,
                                borderRadius: '50px',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginLeft: '4px',
                                border: `1px solid ${slotColorHex}40`,
                              }}
                            >
                              <i className="bi bi-map"></i>
                              <span>Map</span>
                            </span>
                          </div>
                        </td>

                        {/* Operational Schedule */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleStation(s)}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '50px',
                              padding: '5px 14px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#166534',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            }}
                            title="Click to view detailed node operational schedule & guidelines"
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dcfce7')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                          >
                            <i className="bi bi-clock-history text-success"></i>
                            <span>{s.operationalSchedule || 'Mon-Sun 06:00 – 22:00'}</span>
                          </button>
                        </td>

                        {/* Battery Slot Availability */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: '130px',
                                height: '9px',
                                background: '#e2e8f0',
                                borderRadius: '50px',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            >
                              <div
                                style={{
                                  width: `${slotPercent}%`,
                                  height: '100%',
                                  background: slotPercent < 25 ? '#ef4444' : slotPercent < 50 ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #059669)',
                                  borderRadius: '50px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#059669', whiteSpace: 'nowrap' }}>
                              {s.availableBatterySlots} / {s.totalBatterySlots} Slots
                            </span>
                          </div>
                        </td>

                        {/* Total Capacity */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {s.capacityKWh} <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>kW/h</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Peak Storage
                          </div>
                        </td>

                        {/* Active Reservations */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: '#ecfeff',
                              color: '#0891b2',
                              border: '1px solid #a5f3fc',
                              borderRadius: '50px',
                              padding: '5px 14px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="bi bi-calendar2-check"></i>
                            <span>{s.activeReservationsCount || 0} Bookings</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: s.status === 'Active' ? '#10b981' : '#64748b',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '5px 16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              display: 'inline-block',
                              boxShadow: s.status === 'Active' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                            }}
                          >
                            {s.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '18px 28px', background: 'transparent', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenMap(s)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #86efac',
                                color: '#059669',
                                borderRadius: '50px',
                                padding: '6px 12px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                transition: 'all 0.15s ease',
                              }}
                              title="Direct to map and display this node"
                            >
                              <i className="bi bi-geo-alt-fill" style={{ color: slotColorHex }}></i>
                              <span>Map</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedScheduleStation(s)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                borderRadius: '50px',
                                padding: '6px 12px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                transition: 'all 0.15s ease',
                              }}
                              title="View operational schedule & bay guidelines"
                            >
                              <i className="bi bi-clock-history"></i>
                              <span>Schedule</span>
                            </button>

                            <Link
                              to={`/operator/slots?stationId=${s.id}`}
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid rgba(5, 150, 105, 0.35)',
                                color: '#047857',
                                borderRadius: '50px',
                                padding: '6px 12px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Adjust battery slot availability for ${s.name} only`}
                            >
                              <i className="bi bi-sliders"></i>
                              <span>Slots</span>
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

        {/* ── Microgrid Geospatial Map Modal ── */}
        {/* ── PASSWORD RESET OTP MODAL ─────────────────────────────────────── */}
        {showPwModal && (
          <div
            onClick={() => setShowPwModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(2, 44, 34, 0.75)',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.96)',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '480px', width: '100%',
                boxShadow: '0 24px 60px rgba(4,120,87,0.25)',
                position: 'relative',
              }}
            >
              {/* Close */}
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(4,120,87,0.08)', border: 'none',
                  color: '#047857', width: '32px', height: '32px',
                  borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >&times;</button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', color: '#fff', margin: '0 auto 12px',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
                }}>
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h4 style={{ color: '#064e3b', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                  Change Account Password
                </h4>
                <div style={{ fontSize: '0.79rem', color: '#64748b', marginTop: '4px' }}>
                  Gmail OTP verification &bull; Valid for 5 minutes
                </div>
              </div>

              {/* Step Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {[{ num: 1, label: 'Verify Email' }, { num: 2, label: 'Enter OTP' }, { num: 3, label: 'New Password' }].map((s) => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: pwStep >= s.num ? '#059669' : 'rgba(0,0,0,0.08)',
                      color: pwStep >= s.num ? '#fff' : '#94a3b8',
                      fontSize: '0.72rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pwStep > s.num ? '✓' : s.num}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: pwStep >= s.num ? '#064e3b' : '#94a3b8', fontWeight: 600 }}>
                      {s.label}
                    </span>
                    {s.num < 3 && <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>•</span>}
                  </div>
                ))}
              </div>

              {/* Error / Success */}
              {pwError && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i className="bi bi-exclamation-triangle-fill"></i> <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#047857', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i className="bi bi-check-circle-fill"></i> <span>{pwSuccess}</span>
                </div>
              )}

              {/* Step 1 – Enter Email / NIC */}
              {pwStep === 1 && (
                <form onSubmit={handlePwSendOtp}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Registered Email or NIC
                  </label>
                  <input
                    type="text"
                    value={pwIdentifier}
                    onChange={(e) => setPwIdentifier(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '50px', border: '1.5px solid #d1fae5', background: '#f0fdf4', color: '#064e3b', fontSize: '0.92rem', outline: 'none', marginBottom: '8px' }}
                    placeholder="operator@smartsolar.com or NIC"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '18px' }}>
                    A 6-digit OTP will be dispatched to your registered Gmail address.
                  </div>
                  <button
                    type="submit"
                    disabled={pwLoading || !pwIdentifier}
                    style={{ width: '100%', padding: '13px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', opacity: pwLoading ? 0.7 : 1 }}
                  >
                    {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Sending Code…</> : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {/* Step 2 – Verify OTP */}
              {pwStep === 2 && (
                <form onSubmit={handlePwVerifyOtp}>
                  <div style={{
                    background: pwTimerSecs <= 60 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${pwTimerSecs <= 60 ? '#ef4444' : '#10b981'}`,
                    borderRadius: '12px', padding: '10px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={`bi bi-clock-history ${pwTimerSecs <= 60 ? 'text-danger' : 'text-success'}`}></i>
                      <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>Code Validity:</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: pwTimerSecs <= 60 ? '#ef4444' : '#059669' }}>
                      {formatPwTimer(pwTimerSecs)}
                    </span>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pwOtp}
                    onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    style={{ width: '100%', padding: '12px', borderRadius: '50px', border: '1.5px solid #d1fae5', background: '#f0fdf4', color: '#064e3b', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 800, textAlign: 'center', letterSpacing: '8px', outline: 'none', marginBottom: '6px' }}
                    placeholder="000000"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginBottom: '18px' }}>
                    Code sent to <strong>{pwMaskedEmail}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={pwLoading || pwOtp.length !== 6 || pwTimerSecs <= 0}
                    style={{ width: '100%', padding: '13px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', opacity: pwLoading ? 0.7 : 1 }}
                  >
                    {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</> : 'Verify Code & Continue'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <button type="button" onClick={handlePwSendOtp} disabled={pwLoading}
                      style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                      Didn't receive code? Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3 – New Password */}
              {pwStep === 3 && (
                <form onSubmit={handlePwConfirmReset}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    New Password <span style={{ color: '#94a3b8' }}>(min. 8 chars, strong)</span>
                  </label>
                  <input
                    type="password"
                    value={pwNewPassword}
                    onChange={(e) => setPwNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '50px', border: '1.5px solid #d1fae5', background: '#f0fdf4', color: '#064e3b', fontSize: '0.92rem', outline: 'none', marginBottom: '8px' }}
                    placeholder="Enter new password"
                  />
                  <PasswordStrengthIndicator password={pwNewPassword} />
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={pwConfirmPassword}
                    onChange={(e) => setPwConfirmPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '50px', border: '1.5px solid #d1fae5', background: '#f0fdf4', color: '#064e3b', fontSize: '0.92rem', outline: 'none', marginBottom: '18px' }}
                    placeholder="Re-type new password"
                  />
                  <button
                    type="submit"
                    disabled={pwLoading || !pwNewPassword || !pwConfirmPassword}
                    style={{ width: '100%', padding: '13px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', opacity: pwLoading ? 0.7 : 1 }}
                  >
                    {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</> : 'Confirm & Reset Password'}
                  </button>
                </form>
              )}
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

        {/* ── Node Operational Schedule Modal ── */}
        <NodeScheduleModal
          isOpen={!!selectedScheduleStation}
          onClose={() => setSelectedScheduleStation(null)}
          station={selectedScheduleStation}
          onViewOnMap={(s) => {
            setSelectedScheduleStation(null);
            handleOpenMap(s);
          }}
        />
      </div>
    </div>
  );
};

export default OperatorDashboard;
