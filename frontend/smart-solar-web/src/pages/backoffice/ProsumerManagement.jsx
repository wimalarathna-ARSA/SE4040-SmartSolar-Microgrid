// ============================================================================
// File: ProsumerManagement.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice prosumer registration, activation, deactivation and email change management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LocationPickerModal from '../../components/LocationPickerModal';
import BackofficePageHero from '../../components/BackofficePageHero';
import { ENTER_UP } from '../../utils/enterAnimations';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../../utils/passwordValidator';

const thClass = 'text-uppercase text-[0.72rem] fw-bold text-[#F8F8F8] bg-[#063127] px-4 py-3';
const inputClass = 'form-control rounded-[10px] text-[0.9rem] bg-white';
const labelClass = 'form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide';

const ProsumerManagement = () => {
  const [prosumers, setProsumers] = useState([]);
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [emailRequests, setEmailRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [highlightedNic, setHighlightedNic] = useState(null);
  const dropdownRef = useRef(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nic: '', fullName: '', email: '', password: '', phoneNumber: '', address: '',
  });
  const [registerInstallLat, setRegisterInstallLat] = useState(null);
  const [registerInstallLng, setRegisterInstallLng] = useState(null);
  const [registerInstallAddr, setRegisterInstallAddr] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMsg, setRegisterMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes, emailReqRes] = await Promise.all([
        api.get('/users?role=Prosumer'),
        api.get('/users/pending-prosumers'),
        api.get('/users/email-update-requests'),
      ]);
      setProsumers(allRes.data);
      setPendingProsumers(pendingRes.data);
      setEmailRequests(emailReqRes.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error fetching prosumer profiles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deactivationRequests = prosumers.filter(p => p.deactivationRequested);
  const totalNotifications = deactivationRequests.length + emailRequests.length;

  const handleSelectEmailNotification = () => {
    setActiveTab('email-requests');
    setShowNotificationDropdown(false);
  };

  const handleSelectNotification = (p) => {
    setActiveTab('all');
    if (
      searchTerm &&
      !p.nic.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      setSearchTerm('');
    }
    setShowNotificationDropdown(false);
    setHighlightedNic(p.nic);
    setTimeout(() => {
      const el = document.getElementById(`prosumer-row-${p.nic}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedNic((curr) => (curr === p.nic ? null : curr));
    }, 5000);
  };

  const handleActivate = async (nic) => {
    try {
      const res = await api.put(`/users/${nic}/activate`);
      setMessage({ type: 'success', text: res.data.message || `Prosumer ${nic} activated successfully.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to activate account.' });
    }
  };

  const handleDeactivate = async (nic) => {
    if (!window.confirm(`Are you sure you want to deactivate prosumer ${nic}? Only a Backoffice officer can reactivate it.`)) {
      return;
    }
    try {
      const res = await api.put(`/users/${nic}/deactivate`, { note: 'Deactivated via Backoffice Portal' });
      setMessage({ type: 'warning', text: res.data.message || `Prosumer ${nic} has been deactivated.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to deactivate account.' });
    }
  };

  const handleReactivate = async (nic) => {
    try {
      const res = await api.put(`/users/${nic}/reactivate`);
      setMessage({ type: 'success', text: res.data.message || `Prosumer ${nic} reactivated successfully.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to reactivate account.' });
    }
  };

  const handleReviewEmailRequest = async (nic, action) => {
    const isAccept = action === 'Accept';
    const confirmText = isAccept
      ? `Are you sure you want to ACCEPT the request and grant email update access to prosumer ${nic}?`
      : `Are you sure you want to DENY the email update request for prosumer ${nic}?`;
    if (!window.confirm(confirmText)) {
      return;
    }
    const note = prompt(`Enter review note / comment (optional):`, isAccept ? 'Approved by Backoffice' : 'Denied by Backoffice') || '';
    try {
      const res = await api.put(`/users/${nic}/email-update-requests/review`, { action, note });
      setMessage({
        type: isAccept ? 'success' : 'warning',
        text: res.data.message || `Email update request ${action.toLowerCase()}ed successfully.`
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || `Failed to review email update request.`
      });
    }
  };

  const handleDirectEmailAccess = async (nic, grant) => {
    const actionLabel = grant ? 'GRANT email change access' : 'REVOKE email change access';
    if (!window.confirm(`Are you sure you want to ${actionLabel} for prosumer ${nic}?`)) {
      return;
    }
    try {
      const res = await api.put(`/users/${nic}/email-update-access`, {
        status: grant ? 'Active' : 'Deactivated',
        note: grant ? 'Access directly granted by Backoffice' : 'Access revoked by Backoffice'
      });
      setMessage({ type: 'success', text: res.data.message });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to modify email access.' });
    }
  };

  const handleRegisterProsumer = async (e) => {
    e.preventDefault();
    setRegisterMsg({ type: '', text: '' });
    const pwEval = evaluatePassword(registerForm.password);
    if (!pwEval.isStrong) {
      setRegisterMsg({
        type: 'danger',
        text: 'Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.',
      });
      return;
    }
    setRegisterLoading(true);
    try {
      const payload = {
        ...registerForm,
        ...(registerInstallLat != null && registerInstallLng != null
          ? { installationLatitude: registerInstallLat, installationLongitude: registerInstallLng }
          : {}),
      };
      const res = await api.post('/auth/register', payload);
      setRegisterMsg({ type: 'success', text: res.data.message || 'Prosumer registered successfully. Activate from the Pending tab.' });
      setRegisterForm({ nic: '', fullName: '', email: '', password: '', phoneNumber: '', address: '' });
      setRegisterInstallLat(null);
      setRegisterInstallLng(null);
      setRegisterInstallAddr('');
      fetchData();
    } catch (err) {
      setRegisterMsg({ type: 'danger', text: err.response?.data?.message || 'Registration failed.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleApplyMapLocation = ({ location, latitude, longitude }) => {
    setRegisterInstallLat(latitude);
    setRegisterInstallLng(longitude);
    setRegisterInstallAddr(location);
    setRegisterForm(f => ({ ...f, address: location || f.address }));
    setShowMapModal(false);
  };

  const filteredProsumers = prosumers.filter(p =>
    p.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabBtn = (tab) => ('btn rounded-pill px-4 py-2 text-[0.9rem] fw-semibold d-inline-flex align-items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg border ' + (activeTab === tab ? 'text-white bg-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm' : 'bg-white text-[#686053] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm'));

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <BackofficePageHero
          imageSrc="/images/solar-rooftop-home.jpg"
          eyebrow="SOLARX • Rooftop Network"
          title="Prosumer Management"
          subtitle="Approvals, registry and rooftop installations across the provinces."
          breadcrumb={['Prosumers']}
        />

        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => { setShowRegisterModal(true); setRegisterMsg({ type: '', text: '' }); }}
              title="Register a new prosumer account"
              className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Register New Prosumer</span>
            </button>
            <button
              onClick={fetchData}
              title="Refresh prosumer data"
              className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>

            {/* Notification Bell & Dropdown */}
            <div ref={dropdownRef} className="position-relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                title={totalNotifications > 0 ? `${totalNotifications} pending notification(s)` : 'No pending notifications'}
                className={'btn rounded-circle p-0 w-[46px] h-[46px] d-inline-flex align-items-center justify-content-center text-[1.25rem] shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:-translate-y-0.5 hover:shadow-lg ' + (totalNotifications > 0 ? 'bg-white text-[#063127] border border-2 border-[#063127]' : 'bg-white text-[#686053] border')}
              >
                <i className={'bi ' + (totalNotifications > 0 ? 'bi-bell-fill' : 'bi-bell')}></i>
                {totalNotifications > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-[#063127] border border-2 border-white text-[0.72rem] fw-extrabold min-w-[22px] h-[22px] d-flex align-items-center justify-content-center">
                    {totalNotifications}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="position-absolute end-0 card border-0 rounded-[24px] shadow-lg bg-white/95 backdrop-blur-xl w-[420px] max-w-[90vw] overflow-hidden z-[1100] mt-3">
                  <div className="card-header border-0 d-flex justify-content-between align-items-center px-4 py-3 bg-[#063127] text-white">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill text-[#F8F8F8] text-[1.05rem]"></i>
                      <h4 className="m-0 text-[0.95rem] fw-extrabold text-white">Deactivation Requests</h4>
                    </div>
                    <span className={'badge rounded-pill text-[0.72rem] fw-bold px-2 py-1 ' + (deactivationRequests.length > 0 ? 'bg-danger text-white' : 'bg-[#686053] text-white')}>
                      {deactivationRequests.length} {deactivationRequests.length === 1 ? 'Request' : 'Requests'}
                    </span>
                  </div>
                  <div className="card-body p-3 max-h-[380px] overflow-y-auto">
                    {deactivationRequests.length === 0 ? (
                      <div className="text-center px-3 py-4 text-[#686053]">
                        <div className="rounded-circle bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex align-items-center justify-content-center mx-auto mb-2 w-[48px] h-[48px] text-[1.4rem]">
                          <i className="bi bi-check-lg"></i>
                        </div>
                        <div className="fw-bold text-[#063127] text-[0.92rem] mb-1">No Pending Deactivation Requests</div>
                        <div className="text-[0.8rem]">All registered prosumer accounts are operating normally without pending deactivation flags.</div>
                        {emailRequests.length > 0 && (
                          <button onClick={handleSelectEmailNotification} className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] rounded-pill mt-3 fw-bold">
                            View {emailRequests.length} Email Update Request(s)
                          </button>
                        )}
                      </div>
                    ) : (
                      deactivationRequests.map((p) => (
                        <div key={p.nic} onClick={() => handleSelectNotification(p)} className="card bg-danger-subtle border-danger-subtle rounded-[16px] p-3 mb-2 cursor-pointer shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" role="button" tabIndex={0}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="fw-bold text-[#063127] text-[0.88rem]">{p.fullName}</div>
                            <span className={'badge rounded-pill text-[0.68rem] fw-bold px-2 py-1 ' + (p.status === 'Active' ? 'bg-[#063127] text-white' : 'bg-danger text-white')}>{p.status}</span>
                          </div>
                          <div className="text-[0.78rem] text-danger fw-bold mb-2">NIC: {p.nic}</div>
                          <div className="bg-white border border-danger-subtle rounded-[10px] px-3 py-2 text-[0.8rem] text-danger-emphasis d-flex align-items-start gap-2">
                            <i className="bi bi-chat-quote-fill text-danger text-[0.9rem] mt-[1px] shrink-0"></i>
                            <div className="break-words leading-[1.4]">
                              <span className="fw-bold d-block text-[0.72rem] text-uppercase tracking-wide mb-[2px]">Reason Submitted by Prosumer:</span>
                              <span>&quot;{p.deactivationReason || 'No detailed reason provided.'}&quot;</span>
                            </div>
                          </div>
                          <div className="mt-2 d-flex justify-content-end align-items-center gap-1 text-[0.74rem] text-[#063127] fw-bold">
                            <span>Direct to table row</span>
                            <i className="bi bi-arrow-right-short text-[1rem]"></i>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Alert Message */}
        {message.text && (
          <div className={'alert d-flex align-items-center justify-content-between rounded-[16px] shadow-sm mb-4 border ' + (message.type === 'danger' ? 'alert-danger' : message.type === 'warning' ? 'alert-warning' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]')}>
            <div className="d-flex align-items-center gap-2 fw-semibold text-[0.9rem]">
              <i className={'bi ' + (message.type === 'danger' ? 'bi-exclamation-triangle-fill' : message.type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill')}></i>
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="btn-close" aria-label="Close"></button>
          </div>
        )}

        {/* PILL TABS NAVIGATION */}
        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
          <button onClick={() => setActiveTab('pending')} className={tabBtn('pending')}>
            <i className="bi bi-clock-history"></i>
            <span>Pending Activations</span>
            <span className="badge rounded-pill bg-[#686053] text-white text-[0.74rem] fw-bold px-2 py-1">{pendingProsumers.length}</span>
          </button>
          <button onClick={() => setActiveTab('email-requests')} className={tabBtn('email-requests')}>
            <i className="bi bi-envelope-exclamation"></i>
            <span>Email Update Requests</span>
            <span className="badge rounded-pill bg-[#063127] text-white text-[0.74rem] fw-bold px-2 py-1">{emailRequests.length}</span>
          </button>
          <button onClick={() => setActiveTab('all')} className={tabBtn('all')}>
            <i className="bi bi-person-lines-fill"></i>
            <span>All Prosumers Registry</span>
            <span className="badge rounded-pill bg-[#686053] text-white text-[0.74rem] fw-bold px-2 py-1">{prosumers.length}</span>
          </button>
        </div>

        {/* TAB 1: PENDING ACTIVATIONS TABLE */}
        {activeTab === 'pending' && (
          <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center px-4 py-3 flex-wrap gap-2">
              <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0 d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split text-[#686053]"></i>
                <span>Registrations Awaiting Backoffice Activation</span>
              </h2>
              <span className="badge rounded-pill bg-[#686053] text-white text-[0.78rem] fw-bold px-3 py-2 shadow-sm">{pendingProsumers.length} Pending</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className={thClass}>NIC (PRIMARY KEY)</th>
                    <th className={thClass}>FULL NAME</th>
                    <th className={thClass}>EMAIL</th>
                    <th className={thClass}>PHONE</th>
                    <th className={thClass}>INSTALLATION ADDRESS</th>
                    <th className={thClass}>REGISTERED DATE</th>
                    <th className={thClass + ' text-center'}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="text-center px-4 py-5 text-[#686053] bg-white"><div className="spinner-border spinner-border-sm me-2 text-[#063127]"></div>Loading pending registrations...</td></tr>
                  ) : pendingProsumers.length === 0 ? (
                    <tr><td colSpan="7" className="text-center px-4 py-5 bg-white"><i className="bi bi-check-circle-fill text-[#063127] fs-2 d-block mb-2"></i>All registered prosumer accounts are activated and up to date!</td></tr>
                  ) : (
                    pendingProsumers.map((p, idx) => (
                      <tr key={p.id || idx} className="transition">
                        <td className="px-4 py-3"><span className="text-[#063127] fw-bold text-[0.9rem] tracking-wide d-inline-block">{p.nic}</span></td>
                        <td className="px-4 py-3 text-[#063127] fw-bold text-[0.92rem]">{p.fullName}</td>
                        <td className="px-4 py-3 text-[#686053] text-[0.88rem]">{p.email}</td>
                        <td className="px-4 py-3 text-[0.88rem]">{p.phoneNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-[0.88rem]">{p.address || 'N/A'}</td>
                        <td className="px-4 py-3 text-[#686053] text-[0.88rem]">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleActivate(p.nic)} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.8rem] fw-bold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                            <i className="bi bi-check-lg"></i><span>Activate Account</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: EMAIL UPDATE REQUESTS */}
        {activeTab === 'email-requests' && (
          <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center px-4 py-3 flex-wrap gap-2">
              <div>
                <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-envelope-check text-[#063127]"></i>
                  <span>Prosumer Email Update Requests</span>
                </h2>
                <p className="m-0 mt-1 text-[0.82rem] text-[#686053]">Accepting a request grants the prosumer one-time access to update their registered email. Max 3 updates per 24 hours.</p>
              </div>
              <span className="badge rounded-pill text-white text-[0.78rem] fw-bold px-3 py-2 bg-[#063127] shadow-sm">{emailRequests.length} Pending {emailRequests.length === 1 ? 'Request' : 'Requests'}</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className={thClass}>NIC</th>
                    <th className={thClass}>FULL NAME</th>
                    <th className={thClass}>CURRENT EMAIL</th>
                    <th className={thClass}>REQUESTED EMAIL</th>
                    <th className={thClass}>REASON / DATE</th>
                    <th className={thClass}>24H UPDATES</th>
                    <th className={thClass + ' text-center'}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {emailRequests.length === 0 ? (
                    <tr><td colSpan="7" className="text-center px-4 py-5 text-[#686053] bg-white">
                      <div className="rounded-circle bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex align-items-center justify-content-center mx-auto mb-2 w-[50px] h-[50px] text-[1.5rem]"><i className="bi bi-check-lg"></i></div>
                      <div className="fw-bold text-[#063127] text-[0.98rem]">No Pending Email Update Requests</div>
                      <div className="text-[0.84rem] mt-1">All prosumer email change requests have been processed.</div>
                    </td></tr>
                  ) : (
                    emailRequests.map((r) => {
                      const isLimitReached = r.updatesLast24Hours >= 3;
                      return (
                        <tr key={r.nic} className="transition">
                          <td className="px-4 py-3"><span className="text-[#063127] fw-bold text-[0.9rem] tracking-wide d-inline-block">{r.nic}</span></td>
                          <td className="px-4 py-3 text-[#063127] fw-bold text-[0.92rem]">{r.fullName}</td>
                          <td className="px-4 py-3 text-[#686053] text-[0.88rem]">{r.currentEmail}</td>
                          <td className="px-4 py-3 text-[#063127] fw-semibold text-[0.88rem]">
                            {r.requestedNewEmail ? (
                              <span className="text-[#063127] bg-[#063127]/10 px-2 py-1 rounded-[6px]">{r.requestedNewEmail}</span>
                            ) : (<span className="text-[#686053] fst-italic">Any new email</span>)}
                          </td>
                          <td className="px-4 py-3 text-[0.84rem]">
                            <div>{r.reason || 'No reason specified'}</div>
                            {r.requestDate && (<div className="text-[0.74rem] text-[#686053] mt-[2px]">{new Date(r.requestDate).toLocaleString()}</div>)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={'badge rounded-pill text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1 border ' + (isLimitReached ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-white text-[#063127] border-[#063127]/20')}>
                              <i className={'bi ' + (isLimitReached ? 'bi-exclamation-triangle-fill' : 'bi-shield-check')}></i>
                              <span>{r.updatesLast24Hours} / 3 in 24h</span>
                            </span>
                            {isLimitReached && (<div className="text-[0.72rem] text-danger fw-bold mt-1">Limit reached! Try later.</div>)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <button onClick={() => handleReviewEmailRequest(r.nic, 'Accept')} disabled={isLimitReached} className="btn rounded-pill px-3 py-1 text-[0.8rem] fw-bold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]">
                                <i className="bi bi-check-circle"></i><span>Accept & Grant Access</span>
                              </button>
                              <button onClick={() => handleReviewEmailRequest(r.nic, 'Deny')} className="btn bg-white text-danger border border-danger hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.8rem] fw-bold d-inline-flex align-items-center gap-1 transition hover:-translate-y-0.5 hover:shadow-lg">
                                <i className="bi bi-x-circle"></i><span>Deny</span>
                              </button>
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
        )}

        {/* TAB 2: ALL PROSUMERS REGISTRY TABLE */}
        {activeTab === 'all' && (
          <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center px-4 py-3 flex-wrap gap-2">
              <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0">All Solar Prosumers Directory</h2>
              <div className="position-relative w-[280px] max-w-full">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-[#686053]"></i>
                <input type="text" placeholder="Search NIC, name, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control rounded-pill ps-10 bg-white/85 text-[0.86rem]" />
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className={thClass}>NIC (PRIMARY KEY)</th>
                    <th className={thClass}>FULL NAME</th>
                    <th className={thClass}>EMAIL</th>
                    <th className={thClass}>PHONE</th>
                    <th className={thClass}>INSTALLATION ADDRESS</th>
                    <th className={thClass}>STATUS</th>
                    <th className={thClass}>DEACTIVATION FLAG</th>
                    <th className={thClass}>EMAIL ACCESS</th>
                    <th className={thClass}>REGISTERED DATE</th>
                    <th className={thClass + ' text-center'}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" className="text-center px-4 py-5 text-[#686053] bg-white"><div className="spinner-border spinner-border-sm me-2 text-[#063127]"></div>Loading prosumer directory...</td></tr>
                  ) : filteredProsumers.length === 0 ? (
                    <tr><td colSpan="10" className="text-center px-4 py-5 text-[#686053] bg-white">No matching prosumers found.</td></tr>
                  ) : (
                    filteredProsumers.map((p, idx) => {
                      const isHighlighted = highlightedNic === p.nic;
                      return (
                        <tr key={p.id || idx} id={`prosumer-row-${p.nic}`} className={(isHighlighted ? 'table-danger border border-3 border-danger shadow ' : '') + 'transition'}>
                          <td className="px-4 py-3"><span className="text-[#063127] fw-bold text-[0.9rem] tracking-wide d-inline-block">{p.nic}</span></td>
                          <td className="px-4 py-3 text-[#063127] fw-bold text-[0.92rem]">{p.fullName}</td>
                          <td className="px-4 py-3 text-[#686053] text-[0.88rem]">{p.email}</td>
                          <td className="px-4 py-3 text-[0.88rem]">{p.phoneNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-[0.86rem]">
                            <div className="fw-semibold text-[#063127]">{p.address || 'N/A'}</div>
                            {p.installationLatitude != null && p.installationLongitude != null && (
                              <div className="mt-1 text-[0.72rem] text-[#063127] d-inline-flex align-items-center gap-1 bg-[#063127]/10 px-2 py-[2px] rounded-[4px] fw-semibold">
                                <i className="bi bi-geo-alt-fill"></i>
                                <span>{p.installationLatitude.toFixed(4)}, {p.installationLongitude.toFixed(4)}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={'badge rounded-pill text-[0.75rem] fw-bold px-3 py-1 shadow-sm ' + (p.status === 'Active' ? 'bg-[#063127] text-white' : p.status === 'PendingApproval' ? 'bg-[#686053] text-white' : 'bg-danger text-white')}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {p.deactivationRequested ? (
                              <div>
                                <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1">
                                  <i className="bi bi-exclamation-octagon-fill"></i><span>Requested</span>
                                </span>
                                {p.deactivationReason && (
                                  <div className="mt-1 text-[0.76rem] bg-white border border-dashed border-danger rounded-[8px] px-2 py-1 max-w-[260px] leading-[1.35] shadow-sm">
                                    <div className="fw-bold text-[0.7rem] text-uppercase">Reason from user:</div>
                                    <span>&quot;{p.deactivationReason}&quot;</span>
                                  </div>
                                )}
                              </div>
                            ) : (<span className="text-[#686053] text-[0.82rem]">None</span>)}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              {p.emailUpdateAccessGranted ? (
                                <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1"><i className="bi bi-unlock-fill"></i><span>Access Granted</span></span>
                              ) : p.emailUpdateRequestStatus === 'Pending' ? (
                                <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1"><i className="bi bi-hourglass-split"></i><span>Request Pending</span></span>
                              ) : (<span className="text-[#686053] text-[0.8rem]">Locked (Default)</span>)}
                              <div className={'text-[0.72rem] mt-1 fw-semibold ' + ((p.emailUpdatesLast24Hours || 0) >= 3 ? 'text-danger' : 'text-[#686053]')}>
                                24h Updates: {p.emailUpdatesLast24Hours || 0} / 3 {(p.emailUpdatesLast24Hours || 0) >= 3 ? '(Limit Reached)' : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#686053] text-[0.85rem] text-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="d-flex flex-column align-items-center gap-1">
                              {p.status === 'Active' && (
                                <button onClick={() => handleDeactivate(p.nic)} className="btn bg-white text-danger border border-danger hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 transition hover:-translate-y-0.5 hover:shadow-lg">
                                  <i className="bi bi-person-x"></i> Deactivate
                                </button>
                              )}
                              {p.status === 'Deactivated' && (
                                <button onClick={() => handleReactivate(p.nic)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 transition hover:-translate-y-0.5 hover:shadow-lg">
                                  <i className="bi bi-arrow-repeat"></i> Reactivate
                                </button>
                              )}
                              {p.status === 'PendingApproval' && (
                                <button onClick={() => handleActivate(p.nic)} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                                  <i className="bi bi-check-circle"></i> Activate
                                </button>
                              )}
                              {p.status === 'Active' && (
                                <button onClick={() => handleDirectEmailAccess(p.nic, !p.emailUpdateAccessGranted)} title={p.emailUpdateAccessGranted ? 'Revoke email edit permission' : 'Grant email edit permission'} className={'btn rounded-pill px-2 py-[4px] text-[0.74rem] fw-semibold d-inline-flex align-items-center gap-1 transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg border ' + (p.emailUpdateAccessGranted ? 'bg-white text-danger border-danger' : 'bg-white text-[#063127] border-[#063127]')}>
                                  <i className={'bi ' + (p.emailUpdateAccessGranted ? 'bi-lock' : 'bi-unlock')}></i>
                                  <span>{p.emailUpdateAccessGranted ? 'Revoke Email' : 'Grant Email'}</span>
                                </button>
                              )}
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
        )}

        {/* BOTTOM BACK LINK */}
        <div className="mt-4">
          <Link to="/backoffice" className="d-inline-flex align-items-center gap-2 fw-semibold text-[0.9rem] text-decoration-none text-[#063127] transition">
            <i className="bi bi-arrow-left"></i>
            <span>Back to Administration Console</span>
          </Link>
        </div>

      </div>

      {/* REGISTER NEW PROSUMER MODAL */}
      {showRegisterModal && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterModal(false); }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[20px] border-0 shadow-lg p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 z-[3]">
                <div>
                  <h3 className="m-0 fw-extrabold text-[#063127] text-[1.3rem]">Register New Prosumer</h3>
                  <p className="m-0 mt-1 text-[0.8rem] text-[#686053]">Account will be created in <strong>PendingApproval</strong> status. Activate from the Pending tab.</p>
                </div>
                <button onClick={() => setShowRegisterModal(false)} className="btn-close" aria-label="Close"></button>
              </div>
              {registerMsg.text && (
                <div className={'alert rounded-[10px] text-[0.85rem] fw-semibold mb-3 border ' + (registerMsg.type === 'success' ? 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]' : 'alert-danger')}>{registerMsg.text}</div>
              )}
              <form onSubmit={handleRegisterProsumer}>
                <div className="mb-3">
                  <label className={labelClass}>NIC Identifier (Primary Key) *</label>
                  <input type="text" required value={registerForm.nic} onChange={e => setRegisterForm(f => ({ ...f, nic: e.target.value }))} placeholder="e.g. 199512345678" className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" required value={registerForm.fullName} onChange={e => setRegisterForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Kamal Perera" className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" required value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} placeholder="prosumer@example.com" className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Password (min 8 chars, strong) *</label>
                  <input type="password" required minLength={8} value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className={inputClass} />
                  <PasswordStrengthIndicator password={registerForm.password} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Phone Number *</label>
                  <input type="tel" required value={registerForm.phoneNumber} onChange={e => setRegisterForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+94 77 123 4567" className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Solar Installation Address</label>
                  <input type="text" value={registerForm.address} onChange={e => setRegisterForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 45 High Level Road, Maharagama" className={inputClass} />
                </div>
                <div className="bg-[#063127]/10 border border-[#063127]/20 rounded-[12px] p-3 mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                      <div className="fw-bold text-[0.85rem] text-[#063127]">📍 Solar Installation GPS Coordinates</div>
                      <div className="text-[0.75rem] text-[#686053] mt-[2px]">Enables &quot;Nearby Microgrid Nodes&quot; feature for this prosumer</div>
                    </div>
                    <button type="button" onClick={() => setShowMapModal(true)} className="btn btn-sm bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-[8px] fw-bold text-[0.8rem] text-nowrap">🗺 Pick on Map</button>
                  </div>
                  {registerInstallLat != null ? (
                    <div className="d-flex align-items-center gap-2 px-2 py-1 rounded-[8px] bg-[#063127] text-white text-[0.8rem] fw-semibold">
                      <i className="bi bi-geo-alt-fill"></i>
                      <span>{registerInstallAddr ? <>{registerInstallAddr} &nbsp;·&nbsp; </> : null}Lat {registerInstallLat.toFixed(5)}, Lng {registerInstallLng.toFixed(5)}</span>
                      <button type="button" onClick={() => { setRegisterInstallLat(null); setRegisterInstallLng(null); setRegisterInstallAddr(''); }} className="btn-close btn-close-white ms-auto" aria-label="Clear"></button>
                    </div>
                  ) : (
                    <div className="text-[0.78rem] text-[#686053] fst-italic">No location selected — click &quot;Pick on Map&quot; to set the GPS point</div>
                  )}
                </div>
                <button type="submit" disabled={registerLoading} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] w-100 rounded-[12px] p-3 fw-extrabold text-[1rem] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50">
                  {registerLoading ? 'Registering…' : 'Register Prosumer Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <LocationPickerModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialLocation={{
          address: registerForm.address || '',
          latitude: registerInstallLat || 6.9271,
          longitude: registerInstallLng || 79.8612,
        }}
        onApply={handleApplyMapLocation}
        zIndex={10000}
      />

    </div>
  );
};

export default ProsumerManagement;
