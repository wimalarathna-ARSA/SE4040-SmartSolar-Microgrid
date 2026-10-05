// ============================================================================
// File: Login.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Staff login with split-screen marketing panel, role-based
// routing, OTP password reset flow, and strong password validation.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../utils/passwordValidator';

const Login = () => {
  const [emailOrNic, setEmailOrNic] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));
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
  const [forgotShowNewPw, setForgotShowNewPw] = useState(false);
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
      if (rememberMe) localStorage.setItem('rememberedEmail', emailOrNic.trim());
      else localStorage.removeItem('rememberedEmail');
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

  const inputClass = 'form-control rounded-[12px] bg-[#F8F8F8] text-[#063127] border border-[#BFD5D0] px-[18px] py-[13px] text-[0.92rem] focus:border-[#2E695A] focus:shadow-[0_0_0_3px_rgba(101,153,139,0.2)]';
  const labelClass = 'form-label d-block text-[0.78rem] fw-bold text-[#063127] mb-[6px]';

  return (
    <div className="min-vh-100 w-100 d-flex font-[Inter,sans-serif] bg-[#F8F8F8]">

      {/* LEFT: showcase panel */}
      <div className="d-none d-md-flex flex-column justify-content-between position-relative overflow-hidden text-white p-5 w-[55%]">
        <img src="/images/solar-hero-panels.jpg" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.classList.add('d-none'); }} className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover animate-[bl-kenburns_24s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-[linear-gradient(180deg,rgba(6,49,39,0.55)_0%,rgba(6,49,39,0.25)_45%,rgba(6,49,39,0.85)_100%)]" />
        <div className="position-relative d-flex align-items-center justify-content-between animate-[bl-fade-in_600ms_ease-out_100ms_both] motion-reduce:animate-none">
          <span className="d-flex align-items-center gap-2 fw-extrabold text-[1.15rem] tracking-[-0.02em]">
            <img src="/solarx-logo.png" alt="SOLARX" className="object-fit-contain w-[32px] h-[32px]" onError={(e) => { e.currentTarget.classList.add('d-none'); }} />
            SØLΛR-X
          </span>
          <Link to="/" className="text-white/85 text-decoration-none text-[0.85rem] fw-semibold hover:text-white">
            &larr; Back to Website
          </Link>
        </div>
        <div className="position-relative">
          <h1 className="fw-extrabold text-white lh-[1.08] tracking-[-0.02em] mb-3 text-[clamp(1.9rem,3vw,2.9rem)] animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_150ms_both] motion-reduce:animate-none">
            Trade Smarter. Charge Faster.<br />Power Anywhere.
          </h1>
          <p className="text-white/70 text-[0.92rem] lh-[1.65] max-w-[420px] mb-4 animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_250ms_both] motion-reduce:animate-none">
            From island microgrid hubs to rooftop prosumer arrays, our platform lets field teams monitor, verify, and finalize energy trades seamlessly.
          </p>
          <div className="d-flex align-items-center gap-2 animate-[bl-fade-in_600ms_ease-out_350ms_both] motion-reduce:animate-none" aria-hidden="true">
            <span className="d-inline-block rounded-full bg-white w-[28px] h-[4px]"></span>
            <span className="d-inline-block rounded-full bg-white/40 w-[8px] h-[4px]"></span>
          </div>
        </div>
      </div>

      {/* RIGHT: login card */}
      <div className="d-flex align-items-center justify-content-center flex-fill bg-[#F8F8F8] p-4">
        <div className="card border-0 rounded-[24px] shadow-lg bg-white p-[40px] w-100 max-w-[440px] animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_100ms_both] motion-reduce:animate-none">
          <div className="d-md-none text-center mb-3">
            <img src="/solarx-logo.png" alt="SOLARX" className="object-fit-contain w-[44px] h-[44px] mx-auto" onError={(e) => { e.currentTarget.classList.add('d-none'); }} />
          </div>
          <h2 className="fw-extrabold text-[#063127] tracking-[-0.02em] mb-1 text-[1.9rem] animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_200ms_both] motion-reduce:animate-none">Welcome Back!</h2>
          <p className="text-[0.88rem] text-[#686053] mb-4 animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_250ms_both] motion-reduce:animate-none">Log in to manage your solar microgrid operations with ease.</p>

          {error && (
            <div className="alert alert-danger d-flex gap-2 align-items-start rounded-[10px] text-[0.82rem] lh-[1.5] mb-[16px]">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-[2px]" />
              <span>{error}</span>
            </div>
          )}

          {successBanner && (
            <div className="alert d-flex gap-2 align-items-center rounded-[10px] text-[0.84rem] lh-[1.5] mb-[18px] bg-[#65998B]/20 border border-[#65998B]/50 text-[#063127]">
              <i className="bi bi-check-circle-fill fs-6 flex-shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="animate-[bl-fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_300ms_both] motion-reduce:animate-none">
            <div className="mb-[14px]">
              <label htmlFor="login-email" className={labelClass}>Email / NIC</label>
              <input
                id="login-email"
                type="text"
                className={inputClass}
                placeholder="Input your email or NIC"
                value={emailOrNic}
                onChange={(e) => setEmailOrNic(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="mb-[12px]">
              <label htmlFor="login-password" className={labelClass}>Password</label>
              <div className="position-relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pe-5`}
                  placeholder="Input your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="btn border-0 bg-transparent text-[#686053] position-absolute top-50 end-0 translate-middle-y me-2 p-1 hover:text-[#063127]"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-[18px]">
              <div className="form-check d-flex align-items-center gap-2 m-0">
                <input
                  id="login-remember"
                  type="checkbox"
                  className="form-check-input m-0 accent-[#063127]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="login-remember" className="form-check-label text-[0.82rem] text-[#686053]">Remember Me</label>
              </div>
              <button
                type="button"
                onClick={handleOpenForgot}
                className="btn btn-link text-decoration-none p-0 text-[0.82rem] fw-semibold text-[#2E695A] hover:text-[#063127]"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className={`btn rounded-pill w-100 fw-bold text-[0.95rem] py-[13px] border shadow-sm transition hover:-translate-y-[1px] disabled:opacity-60 ${loading ? 'bg-[#BFD5D0] text-[#063127] border-[#063127]' : 'text-white bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]'}`}
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

          <div className="d-flex align-items-center gap-3 my-4 animate-[bl-fade-in_600ms_ease-out_450ms_both] motion-reduce:animate-none" aria-hidden="true">
            <span className="flex-fill border-top border-[#BFD5D0]"></span>
            <span className="text-[0.75rem] text-[#686053]">Staff access only</span>
            <span className="flex-fill border-top border-[#BFD5D0]"></span>
          </div>

          <p className="text-center text-[0.82rem] text-[#686053] m-0 animate-[bl-fade-in_600ms_ease-out_550ms_both] motion-reduce:animate-none">
            Need an account? <span className="fw-bold text-[#063127]">Contact your backoffice administrator</span>
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD 3-STEP MODAL ── */}
      {showForgotModal && (
        <div
          className="modal d-block position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center overflow-y-auto bg-black/60 backdrop-blur-sm p-[20px] z-[9999]"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="modal-dialog w-100 max-w-[480px] mx-auto my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content position-relative bg-white border-0 rounded-[24px] shadow-lg p-[36px]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="btn position-absolute top-[20px] end-[20px] bg-[#BFD5D0]/40 border-0 text-[#063127] rounded-full w-[32px] h-[32px] d-flex align-items-center justify-content-center fs-5 p-0 transition hover:bg-[#BFD5D0]/70"
                aria-label="Close"
              >
                &times;
              </button>

              {/* Header */}
              <div className="text-center mb-[24px]">
                <div className="rounded-[16px] bg-[#063127] d-flex align-items-center justify-content-center fs-4 text-white mx-auto mb-[14px] w-[52px] h-[52px]">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h4 className="text-[#063127] fw-extrabold text-[1.35rem] m-0">
                  Reset Account Password
                </h4>
                <div className="text-[0.8rem] text-[#686053] mt-[4px]">
                  Gmail OTP Verification (Valid for 5 minutes)
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="d-flex align-items-center justify-content-center gap-2 mb-[24px]">
                {[
                  { num: 1, label: 'Email/NIC' },
                  { num: 2, label: 'Verify OTP' },
                  { num: 3, label: 'New Password' },
                ].map((s) => (
                  <div key={s.num} className="d-flex align-items-center gap-[6px]">
                    <div
                      className={`rounded-full d-flex align-items-center justify-content-center text-[0.72rem] fw-extrabold w-[24px] h-[24px] ${forgotStep >= s.num ? 'bg-[#063127] text-white' : 'bg-[#BFD5D0]/40 text-[#686053]'}`}
                    >
                      {forgotStep > s.num ? '✓' : s.num}
                    </div>
                    <span className={`text-[0.74rem] fw-semibold ${forgotStep >= s.num ? 'text-[#063127]' : 'text-[#686053]'}`}>
                      {s.label}
                    </span>
                    {s.num < 3 && <span className="text-[#686053] text-[0.7rem]">&bull;</span>}
                  </div>
                ))}
              </div>

              {/* Error & Success Messages */}
              {forgotError && (
                <div className="alert alert-danger d-flex gap-2 align-items-center rounded-[10px] text-[0.82rem] mb-[16px]">
                  <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="alert d-flex gap-2 align-items-center rounded-[10px] text-[0.82rem] mb-[16px] bg-[#65998B]/20 border border-[#65998B]/50 text-[#063127]">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* ── STEP 1: Enter Email or NIC ── */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-[18px]">
                    <label className="form-label d-block text-[0.78rem] fw-bold text-[#063127] mb-[6px]">
                      Registered Email or NIC *
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. operator@smartsolar.com or NIC"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="text-[0.75rem] text-[#686053] mt-[6px]">
                      We will send a 6-digit one-time code to your registered Gmail address.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn rounded-pill w-100 fw-bold text-white text-[0.95rem] py-[13px] mt-[8px] bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-[1px] disabled:opacity-60"
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
                  <div className="rounded-[12px] px-[16px] py-[10px] d-flex align-items-center justify-content-between mb-[18px] bg-[#BFD5D0]/30 border border-[#65998B]/40">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-clock-history text-[#2E695A]"></i>
                      <span className="text-[0.78rem] text-[#063127] fw-semibold">
                        Code Validity Window:
                      </span>
                    </div>
                    <span className={`font-monospace fw-extrabold text-[1rem] ${timerSeconds <= 60 ? 'text-danger' : 'text-[#063127]'}`}>
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  <div className="mb-[18px]">
                    <label className="form-label d-block text-[0.78rem] fw-bold text-[#063127] mb-[6px]">
                      Enter 6-Digit Verification Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className={`${inputClass} text-center font-monospace fw-extrabold tracking-[8px] text-[1.5rem]`}
                      placeholder="000000"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                    <div className="text-[0.75rem] text-[#686053] mt-[6px] text-center">
                      Code sent to <strong>{forgotMaskedEmail}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn rounded-pill w-100 fw-bold text-white text-[0.95rem] py-[13px] mt-[8px] bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-[1px] disabled:opacity-60"
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

                  <div className="text-center mt-[16px]">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading}
                      className="btn btn-link text-[0.78rem] fw-semibold text-[#2E695A] text-decoration-underline hover:text-[#063127] disabled:opacity-60"
                    >
                      Didn&apos;t receive code? Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Enter New Password & Confirm ── */}
              {forgotStep === 3 && (
                <form onSubmit={handleConfirmReset}>
                  <div className="mb-[14px]">
                    <label className="form-label d-block text-[0.78rem] fw-bold text-[#063127] mb-[6px]">
                      New Password * (Min. 8 chars, Strong)
                    </label>
                    <div className="position-relative">
                      <input
                        type={forgotShowNewPw ? 'text' : 'password'}
                        className={`${inputClass} pe-5`}
                        placeholder="Enter new password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowNewPw((s) => !s)}
                        aria-label={forgotShowNewPw ? 'Hide password' : 'Show password'}
                        className="btn border-0 bg-transparent text-[#686053] position-absolute top-50 end-0 translate-middle-y me-2 p-1 hover:text-[#063127]"
                      >
                        <i className={`bi ${forgotShowNewPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={forgotNewPassword} />
                  </div>

                  <div className="mb-[18px]">
                    <label className="form-label d-block text-[0.78rem] fw-bold text-[#063127] mb-[6px]">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Re-type new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn rounded-pill w-100 fw-bold text-white text-[0.95rem] py-[13px] mt-[8px] bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-[1px] disabled:opacity-60"
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
        </div>
      )}
    </div>
  );
};

export default Login;
