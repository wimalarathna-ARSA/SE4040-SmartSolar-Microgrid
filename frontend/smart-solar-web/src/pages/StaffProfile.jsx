// ============================================================================
// File: StaffProfile.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Staff profile page for editing personal details and OTP-gated password change.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../utils/passwordValidator';

const StaffProfile = () => {
  const { user, updateUser, logout, isBackoffice } = useAuth();
  const navigate = useNavigate();

  // ── Edit details ─────────────────────────────────────────────
  const [details, setDetails] = useState({ fullName: '', phoneNumber: '', address: '' });
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState({ type: '', text: '' });

  // ── Change password (OTP flow, same backend as Login) ────────
  const [pwStep, setPwStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    let t = null;
    if (pwStep === 2 && timer > 0) t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => { if (t) clearInterval(t); };
  }, [pwStep, timer]);

  // Load freshest profile from backend
  useEffect(() => {
    const load = async () => {
      if (!user?.nic) { setDetailsLoading(false); return; }
      setDetailsLoading(true);
      try {
        const res = await api.get(`/users/${encodeURIComponent(user.nic)}`);
        const p = res.data || {};
        setDetails({
          fullName: p.fullName || user.fullName || '',
          phoneNumber: p.phoneNumber || '',
          address: p.address || '',
        });
        if (p.email) updateUser({ email: p.email, fullName: p.fullName });
      } catch {
        setDetails({
          fullName: user.fullName || '',
          phoneNumber: '',
          address: '',
        });
      } finally {
        setDetailsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.nic]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setDetailsMsg({ type: '', text: '' });
    if (!details.fullName.trim() || !details.phoneNumber.trim()) {
      setDetailsMsg({ type: 'danger', text: 'Full name and phone number are required.' });
      return;
    }
    setDetailsSaving(true);
    try {
      const res = await api.put(`/users/${encodeURIComponent(user.nic)}/profile`, {
        fullName: details.fullName.trim(),
        phoneNumber: details.phoneNumber.trim(),
        address: details.address.trim(),
      });
      updateUser({ fullName: details.fullName.trim() });
      setDetailsMsg({ type: 'success', text: res.data?.message || 'Profile details updated.' });
    } catch (err) {
      setDetailsMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setDetailsSaving(false);
    }
  };

  const identifier = user?.email || user?.nic || '';

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setPwMsg({ type: '', text: '' });
    setPwLoading(true);
    try {
      await api.post('/auth/request-password-reset-otp', { emailOrNic: identifier });
      setPwStep(2);
      setTimer(300);
      setPwMsg({ type: 'success', text: 'Verification code sent to your registered email. Valid for 5 minutes.' });
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to send verification code.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (timer <= 0) { setPwMsg({ type: 'danger', text: 'Code expired. Please request a new one.' }); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/verify-password-reset-otp', { emailOrNic: identifier, otp: otp.trim() });
      setPwStep(3);
      setPwMsg({ type: 'success', text: 'Code verified. Choose your new password.' });
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.response?.data?.message || 'Invalid or expired code.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleConfirmPassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    const pwEval = evaluatePassword(newPw);
    if (!pwEval.isStrong) {
      setPwMsg({ type: 'danger', text: 'New password is too weak. It must be at least 8 characters and include uppercase, lowercase, a number, and a special character.' });
      return;
    }
    if (newPw !== confirmPw) { setPwMsg({ type: 'danger', text: 'Passwords do not match.' }); return; }
    setPwLoading(true);
    try {
      const res = await api.post('/auth/confirm-password-reset', {
        emailOrNic: identifier,
        otp: otp.trim(),
        newPassword: newPw.trim(),
        confirmPassword: confirmPw.trim(),
      });
      setPwMsg({ type: 'success', text: res.data?.message || 'Password updated successfully.' });
      setOtp(''); setNewPw(''); setConfirmPw('');
      setPwStep(1);
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || 'S X').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const dashboardPath = isBackoffice ? '/backoffice' : '/operator';
  const accentGradient = 'bg-[#063127]';

  const msgBox = (m) => m.text && (
    <div className={`rounded-[10px] px-[14px] py-[10px] text-[0.83rem] mb-[14px] border ${m.type === 'danger' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-[#063127]/10 border-[#063127]/30 text-[#063127]'}`}>{m.text}</div>
  );

  return (
    <div className="min-vh-100 bg-[#F8F8F8] text-[#063127] px-[20px] pt-[36px] pb-[60px]">
      <div className="mx-auto max-w-[960px]">

        {/* Header card */}
        <div className="card bg-white border rounded-[18px] shadow p-0 position-relative overflow-hidden mb-4">
          <div className="position-relative h-[150px] bg-[#063127]">
            <img
              src="/images/solar-hero-panels.jpg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={(e) => { e.currentTarget.classList.add('d-none'); }}
              className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover opacity-25"
            />
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-to-r from-[#063127] via-[#063127]/60 to-transparent" />
            <Link to={dashboardPath} className="position-absolute top-[14px] start-[16px] z-[2] text-[#F8F8F8] opacity-75 text-[0.82rem] text-decoration-none fw-semibold transition">
              &larr; Back to console
            </Link>
          </div>
          <div className="d-flex flex-column flex-md-row align-items-md-end gap-3 px-4 pb-4 position-relative z-[1] mt-[-44px]">
            <div className={`flex-shrink-0 d-flex align-items-center justify-content-center text-[1.9rem] fw-extrabold text-white border-[3px] border-white shadow-lg w-[88px] h-[88px] rounded-[24px] ${accentGradient}`}>{initials}</div>
            <div className="flex-grow-1">
              <h2 className="fw-bold text-[#063127] mb-1 tracking-[-0.02em]">{user?.fullName || 'Staff Account'}</h2>
              <div className="d-flex align-items-center gap-2 flex-wrap small">
                <span className={`badge text-white ${isBackoffice ? 'bg-[#063127]' : 'bg-[#686053]'}`}>{user?.role}</span>
                <span className="text-[#686053]">NIC: <strong className="text-[#063127]">{user?.nic}</strong></span>
                <span className="text-[#686053]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Edit details */}
          <div className="col-lg-6">
            <div className="card bg-white border rounded-[18px] shadow p-4 h-100">
              <h5 className="fw-bold text-[#063127] mb-1"><i className="bi bi-person-gear me-2 text-[#063127]"></i>Profile details</h5>
              <p className="small mb-3 text-[#686053]">Update your name, phone and address. Email changes require backoffice approval.</p>
              {msgBox(detailsMsg)}
              {detailsLoading ? (
                <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-[#063127]" /></div>
              ) : (
                <form onSubmit={handleSaveDetails}>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Full name *</label>
                    <input className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100" value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Email (read-only)</label>
                    <input className="form-control bg-[#F8F8F8] text-[#686053] border rounded-[12px] px-3 py-2 w-100 opacity-75" value={user?.email || ''} readOnly disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Phone number *</label>
                    <input className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100" value={details.phoneNumber} onChange={(e) => setDetails({ ...details, phoneNumber: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Address</label>
                    <textarea className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100 min-h-[76px]" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">NIC (read-only)</label>
                    <input className="form-control bg-[#F8F8F8] text-[#686053] border rounded-[12px] px-3 py-2 w-100 opacity-75" value={user?.nic || ''} readOnly disabled />
                  </div>
                  <button type="submit" className="btn w-100 fw-bold rounded-[12px] py-[11px] text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] transition hover:-translate-y-[1px] disabled:opacity-60" disabled={detailsSaving}>
                    {detailsSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Change password + logout */}
          <div className="col-lg-6 d-flex flex-column gap-4">
            <div className="card bg-white border rounded-[18px] shadow p-4">
              <h5 className="fw-bold text-[#063127] mb-1"><i className="bi bi-shield-lock-fill me-2 text-[#063127]"></i>Change password</h5>
              <p className="small mb-3 text-[#686053]">Verified by a 6-digit code sent to your registered email (5-minute window).</p>
              {msgBox(pwMsg)}

              {pwStep === 1 && (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Account identifier</label>
                    <input className="form-control bg-[#F8F8F8] text-[#686053] border rounded-[12px] px-3 py-2 w-100 opacity-75" value={identifier} readOnly disabled />
                  </div>
                  <button type="submit" className="btn w-100 fw-bold rounded-[12px] py-[11px] transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-[1px] bg-white text-[#063127] border border-[#063127]" disabled={pwLoading}>
                    {pwLoading ? 'Sending…' : 'Send verification code'}
                  </button>
                </form>
              )}

              {pwStep === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em] mb-0">6-digit code *</label>
                    <span className={`font-monospace fw-extrabold ${timer <= 60 ? 'text-danger' : 'text-[#063127]'}`}>
                      {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <input className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100 text-center font-monospace fw-extrabold tracking-[8px] text-[1.3rem]"
                    maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" required autoFocus />
                  <button type="submit" className="btn w-100 fw-bold mt-3 rounded-[12px] py-[11px] transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-[1px] disabled:opacity-60 bg-white text-[#063127] border border-[#063127]" disabled={pwLoading || otp.length !== 6 || timer <= 0}>
                    {pwLoading ? 'Verifying…' : 'Verify code'}
                  </button>
                  <button type="button" onClick={handleSendOtp} disabled={pwLoading}
                    className="btn btn-link text-[0.8rem] fw-semibold text-[#063127] text-decoration-underline mt-[10px] disabled:opacity-60 hover:bg-[#F8F8F8] hover:text-[#063127]">
                    Resend code
                  </button>
                </form>
              )}

              {pwStep === 3 && (
                <form onSubmit={handleConfirmPassword}>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">New password * (min 8 chars, strong)</label>
                    <input type="password" className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100" value={newPw} onChange={(e) => setNewPw(e.target.value)} required autoFocus />
                    <PasswordStrengthIndicator password={newPw} isDark={false} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.72rem] fw-bold text-uppercase text-[#686053] tracking-[0.08em]">Confirm new password *</label>
                    <input type="password" className="form-control bg-[#F8F8F8] text-[#063127] border rounded-[12px] px-3 py-2 w-100" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn w-100 fw-bold rounded-[12px] py-[11px] text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] transition hover:-translate-y-[1px] disabled:opacity-60" disabled={pwLoading}>
                    {pwLoading ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              )}
            </div>

            <div className="card bg-white border border-danger/30 rounded-[18px] shadow p-4">
              <h5 className="fw-bold text-[#063127] mb-1"><i className="bi bi-box-arrow-right me-2 text-danger"></i>Session</h5>
              <p className="small mb-3 text-[#686053]">Signed in as <strong className="text-[#063127]">{user?.email || user?.nic}</strong>. Logging out ends this session on this device.</p>
              <button onClick={handleLogout} className="btn bg-white text-danger border border-danger hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] w-100 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-[12px] py-[11px] transition hover:-translate-y-[1px]">
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
