// ============================================================================
// File: Login.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Login page with role-based routing, OTP password reset flow, and strong password validation.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../utils/passwordValidator';

const S = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#080808',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  blobTopRight: {
    position: 'absolute',
    top: '-60px',
    right: '-80px',
    width: '520px',
    height: '420px',
    background: 'radial-gradient(ellipse 70% 60% at 65% 35%, rgba(140,30,200,0.55) 0%, rgba(80,10,140,0.3) 45%, transparent 75%)',
    filter: 'blur(2px)',
    zIndex: 0,
    animation: 'blobShift 8s ease-in-out infinite alternate',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: '-80px',
    left: '-60px',
    width: '420px',
    height: '360px',
    background: 'radial-gradient(ellipse 65% 55% at 35% 65%, rgba(30,60,220,0.5) 0%, rgba(10,20,120,0.28) 50%, transparent 78%)',
    filter: 'blur(2px)',
    zIndex: 0,
    animation: 'blobShift2 9s ease-in-out infinite alternate',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '100%',
    maxWidth: '840px',
    minHeight: '420px',
    borderRadius: '20px',
    background: 'rgba(22, 20, 28, 0.72)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06) inset',
    overflow: 'hidden',
    margin: '20px',
  },
  leftPanel: {
    flex: '1 1 42%',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0d1526',
  },
  leftBgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.45,
  },
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(8,8,12,0.55) 0%, rgba(8,8,12,0.35) 40%, rgba(8,8,12,0.88) 100%), linear-gradient(100deg, rgba(40,10,80,0.35) 0%, transparent 60%)',
  },
  leftGlow: {
    position: 'absolute',
    bottom: '-40px',
    left: '-40px',
    width: '320px',
    height: '260px',
    background: 'radial-gradient(ellipse 65% 55% at 30% 75%, rgba(100,20,180,0.45) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  divider: {
    width: '1px',
    alignSelf: 'stretch',
    background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent 100%)',
    flexShrink: 0,
  },
  rightPanel: {
    flex: '1 1 55%',
    padding: '52px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: '13px 18px',
    borderRadius: '50px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e2e8f0',
    fontSize: '0.92rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backdropFilter: 'blur(6px)',
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '50px',
    border: 'none',
    background: 'linear-gradient(135deg, rgba(100,30,180,0.9) 0%, rgba(60,20,130,0.95) 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 20px rgba(120,40,200,0.4)',
  },
};

const keyframesCSS = `
  @keyframes blobShift {
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(-30px, 30px) scale(1.12); }
  }
  @keyframes blobShift2 {
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(25px,-25px) scale(1.1); }
  }
  @keyframes waveFlow {
    0%   { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -400; }
  }
  .login-input::placeholder { color: rgba(200,200,220,0.4); }
  .login-input:focus {
    border-color: rgba(160,80,255,0.6) !important;
    box-shadow: 0 0 0 3px rgba(140,40,220,0.15) !important;
  }
  .login-submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(130,50,210,0.95) 0%, rgba(80,30,170,1) 100%) !important;
    box-shadow: 0 6px 28px rgba(140,40,220,0.55) !important;
    transform: translateY(-1px);
  }
  .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .wave-path { stroke-dasharray: 8 6; animation: waveFlow 3s linear infinite; }
  .wave-path-2 { stroke-dasharray: 6 8; animation: waveFlow 4s linear infinite reverse; }
`;

const Login = () => {
  const [emailOrNic, setEmailOrNic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Forgot Password Modal State ──────────────────────────────────────────
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Set Password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes

  // 5-minute countdown timer for OTP verification
  useEffect(() => {
    let interval = null;
    if (showForgotModal && forgotStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showForgotModal, forgotStep, timerSeconds]);

  const handleOpenForgot = () => {
    setForgotIdentifier(emailOrNic || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotStep(1);
    setTimerSeconds(300);
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/request-password-reset-otp', { emailOrNic: forgotIdentifier.trim() });
      setForgotMaskedEmail(res.data.maskedEmail || forgotIdentifier);
      setForgotStep(2);
      setTimerSeconds(300); // Reset to full 5 minutes
      setForgotSuccess(`6-digit verification code sent to ${res.data.maskedEmail || 'your email'}. Enter it within 5 minutes.`);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to dispatch verification code. Please check your Email/NIC.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (timerSeconds <= 0) {
      setForgotError('Verification code has expired. Please request a new code.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/verify-password-reset-otp', {
        emailOrNic: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
      });
      setForgotSuccess(res.data.message || 'Verification code confirmed! Choose your new password.');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const pwEval = evaluatePassword(forgotNewPassword);
    if (!pwEval.isStrong) {
      setForgotError('New password is too weak. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special symbols.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New password and confirmation password do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/confirm-password-reset', {
        emailOrNic: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword.trim(),
        confirmPassword: forgotConfirmPassword.trim(),
      });
      setForgotSuccess(res.data.message || 'Password successfully reset!');
      setTimeout(() => {
        setShowForgotModal(false);
        setEmailOrNic(forgotIdentifier);
        setPassword('');
        setSuccessBanner('✓ Password has been reset successfully! You can now log in with your new password.');
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const formatTimer = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessBanner('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { emailOrNic, password });
      const authData = response.data;
      login(authData);
      if (authData.role === 'Backoffice') navigate('/backoffice');
      else if (authData.role === 'GridOperator') navigate('/operator');
      else if (authData.role === 'Prosumer') {
        setError('Prosumer accounts use the SOLARX Mobile App (Android). Please log in with a Backoffice or Grid Operator staff account.');
      } else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const wavePathsRight = [0,1,2,3,4,5,6,7,8,9].map(i => ({
    key: `r${i}`,
    d: `M ${700+i*12} 0 C ${820+i*8} ${80+i*15}, ${900+i*6} ${200+i*12}, ${860+i*10} ${340+i*8} S ${780+i*14} ${480+i*5}, ${820+i*9} 540`,
    stroke: i % 2 === 0 ? '#a040e0' : '#6020b0',
    opacity: 0.7 - i * 0.04,
  }));

  const wavePathsLeft = [0,1,2,3,4,5,6].map(i => ({
    key: `l${i}`,
    d: `M 0 ${350+i*18} C ${80+i*10} ${380+i*12}, ${160+i*8} ${420+i*10}, ${120+i*14} 540`,
    stroke: i % 2 === 0 ? '#3050e0' : '#2030c0',
    opacity: 0.6 - i * 0.04,
  }));

  return (
    <>
      <style>{keyframesCSS}</style>
      <div style={S.page}>

        {/* Animated wave lines background */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.25, pointerEvents: 'none' }}
          viewBox="0 0 960 540"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          {wavePathsRight.map(p => (
            <path key={p.key} className="wave-path" d={p.d} stroke={p.stroke} strokeWidth="1.2" strokeOpacity={p.opacity} />
          ))}
          {wavePathsLeft.map(p => (
            <path key={p.key} className="wave-path-2" d={p.d} stroke={p.stroke} strokeWidth="1.1" strokeOpacity={p.opacity} />
          ))}
        </svg>

        {/* Ambient glow blobs */}
        <div style={S.blobTopRight} />
        <div style={S.blobBottomLeft} />

        {/* Main glass card */}
        <div style={S.card}>

          {/* LEFT: Branding panel */}
          <div style={S.leftPanel}>
            <img src="/images/solar-rooftop-home.jpg" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={S.leftBgImage} />
            <div style={S.leftOverlay} />
            <div style={S.leftGlow} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }}>
                <img src="/solarx-logo.png" alt="SOLARX" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                <span style={{ fontSize: '1.7rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' }}>
                  SOLARX
                </span>
              </div>
              {/* Tagline */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(200,180,255,0.7)', marginBottom: '10px' }}>
                  Staff Portal
                </div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2rem)', fontWeight: '800', color: '#fff', lineHeight: '1.2', letterSpacing: '-0.03em', marginBottom: '14px' }}>
                  Welcome<br /><span style={{ fontWeight: '900' }}>Back</span>
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'rgba(200,200,220,0.65)', lineHeight: '1.65', maxWidth: '240px', marginBottom: '0' }}>
                  Securely access the SOLARX enterprise dispatch platform. Backoffice and Grid Operator accounts only.
                </p>
              </div>
            </div>
            {/* Footer link */}
            <div style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', color: 'rgba(200,200,220,0.55)', letterSpacing: '0.02em' }}>
              solarx.energy
            </div>
          </div>

          {/* Vertical divider */}
          <div style={S.divider} />

          {/* RIGHT: Form panel */}
          <div style={S.rightPanel}>
            <h3 style={{ fontSize: '1.55rem', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '28px', letterSpacing: '-0.02em' }}>
              Login
            </h3>

            {error && (
              <div style={{
                background: 'rgba(220,40,40,0.12)',
                border: '1px solid rgba(220,40,40,0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {successBanner && (
              <div style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#6ee7b7',
                fontSize: '0.84rem',
                lineHeight: '1.5',
                marginBottom: '18px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.1rem', flexShrink: 0 }} />
                <span>{successBanner}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  className="login-input"
                  style={S.input}
                  placeholder="Username / Email / NIC"
                  value={emailOrNic}
                  onChange={(e) => setEmailOrNic(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="password"
                  className="login-input"
                  style={S.input}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00ffce',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 0',
                    outline: 'none',
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                style={S.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Authenticating...
                  </>
                ) : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* ── FORGOT PASSWORD 3-STEP MODAL ── */}
        {showForgotModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 5, 10, 0.82)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
            onClick={() => setShowForgotModal(false)}
          >
            <div
              style={{
                background: 'rgba(24, 22, 34, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,206,0.1) inset',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                &times;
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(0,255,206,0.2) 0%, rgba(16,185,129,0.3) 100%)',
                    border: '1px solid rgba(0,255,206,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#00ffce',
                    margin: '0 auto 14px',
                  }}
                >
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.35rem', margin: 0 }}>
                  Reset Account Password
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  Gmail OTP Verification (Valid for 5 minutes)
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {[
                  { num: 1, label: 'Email/NIC' },
                  { num: 2, label: 'Verify OTP' },
                  { num: 3, label: 'New Password' },
                ].map((s) => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: forgotStep >= s.num ? '#00ffce' : 'rgba(255,255,255,0.1)',
                        color: forgotStep >= s.num ? '#000' : '#64748b',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {forgotStep > s.num ? '✓' : s.num}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: forgotStep >= s.num ? '#e2e8f0' : '#64748b', fontWeight: 600 }}>
                      {s.label}
                    </span>
                    {s.num < 3 && <span style={{ color: '#475569', fontSize: '0.7rem' }}>&bull;</span>}
                  </div>
                ))}
              </div>

              {/* Error & Success Messages */}
              {forgotError && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '10px 14px', color: '#6ee7b7', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* ── STEP 1: Enter Email or NIC ── */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp}>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Registered Email or NIC *
                    </label>
                    <input
                      type="text"
                      className="login-input"
                      style={S.input}
                      placeholder="e.g. operator@smartsolar.com or NIC"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                      We will send a 6-digit one-time code to your registered Gmail address.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-submit-btn"
                    style={{ ...S.submitBtn, marginTop: '8px' }}
                    disabled={forgotLoading || !forgotIdentifier}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending 6-Digit Code...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>
              )}

              {/* ── STEP 2: Enter & Verify 5-Min OTP ── */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  {/* Countdown Timer Badge */}
                  <div
                    style={{
                      background: timerSeconds <= 60 ? 'rgba(239,68,68,0.15)' : 'rgba(0,255,206,0.1)',
                      border: `1px solid ${timerSeconds <= 60 ? '#ef4444' : '#00ffce'}`,
                      borderRadius: '12px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={`bi bi-clock-history ${timerSeconds <= 60 ? 'text-danger' : 'text-success'}`}></i>
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                        Code Validity Window:
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '1rem',
                        color: timerSeconds <= 60 ? '#ef4444' : '#00ffce',
                      }}
                    >
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Enter 6-Digit Verification Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="login-input"
                      style={{
                        ...S.input,
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '8px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                      }}
                      placeholder="000000"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                      Code sent to <strong>{forgotMaskedEmail}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-submit-btn"
                    style={{ ...S.submitBtn, marginTop: '8px' }}
                    disabled={forgotLoading || forgotOtp.length !== 6 || timerSeconds <= 0}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Verifying Code...
                      </>
                    ) : (
                      'Verify Code & Proceed'
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00ffce',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Didn't receive code? Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Enter New Password & Confirm ── */}
              {forgotStep === 3 && (
                <form onSubmit={handleConfirmReset}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>
                      New Password * (Min. 8 chars, Strong)
                    </label>
                    <input
                      type="password"
                      className="login-input"
                      style={S.input}
                      placeholder="Enter new password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <PasswordStrengthIndicator password={forgotNewPassword} isDark={true} />
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      className="login-input"
                      style={S.input}
                      placeholder="Re-type new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-submit-btn"
                    style={{ ...S.submitBtn, marginTop: '8px' }}
                    disabled={forgotLoading || !forgotNewPassword || !forgotConfirmPassword}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating Password...
                      </>
                    ) : (
                      'Confirm & Reset Password'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;

