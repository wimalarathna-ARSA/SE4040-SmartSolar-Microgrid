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
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import LocationPickerModal from '../../components/LocationPickerModal';
import BackofficePageHero from '../../components/BackofficePageHero';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../../utils/passwordValidator';

const ProsumerManagement = () => {
  const [prosumers, setProsumers] = useState([]);
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [emailRequests, setEmailRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // ── Notification State ────────────────────────────────────────────────────
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [highlightedNic, setHighlightedNic] = useState(null);
  const dropdownRef = useRef(null);

  // ── Register New Prosumer Modal State ─────────────────────────────────────
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


  // Close notification dropdown when clicking outside
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

  // Filter prosumers with pending deactivation requests
  const deactivationRequests = prosumers.filter(p => p.deactivationRequested);
  const totalNotifications = deactivationRequests.length + emailRequests.length;

  const handleSelectEmailNotification = () => {
    setActiveTab('email-requests');
    setShowNotificationDropdown(false);
  };

  // ── Jump to row when notification item clicked ───────────────────────────
  const handleSelectNotification = (p) => {
    // 1. Switch to 'All Prosumers Registry' tab
    setActiveTab('all');

    // 2. Clear search filter if it would hide this prosumer
    if (
      searchTerm &&
      !p.nic.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      setSearchTerm('');
    }

    // 3. Close the notification dropdown
    setShowNotificationDropdown(false);

    // 4. Mark this prosumer's NIC as highlighted
    setHighlightedNic(p.nic);

    // 5. Scroll smoothly to the related row in the table
    setTimeout(() => {
      const el = document.getElementById(`prosumer-row-${p.nic}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // 6. Automatically clear highlight after 5 seconds
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

  // ── Register New Prosumer (Backoffice-initiated) ───────────────────────────
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
        // Include GPS if selected from map picker
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
    // Auto-fill address field with selected location string
    setRegisterForm(f => ({ ...f, address: location || f.address }));
    setShowMapModal(false);
  };

  const filteredProsumers = prosumers.filter(p =>
    p.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #cde3ef 0%, #a2c6dd 20%, #468ac0 50%, #0d5a9d 78%, #03376c 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
          {/* Background Constellation Mesh */}
      <ConstellationMeshSVG />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <BackofficePageHero
          imageSrc="/images/solar-rooftop-home.jpg"
          eyebrow="SOLARX • Rooftop Network"
          title="Prosumer Management"
          subtitle="Approvals, registry and rooftop installations across the provinces."
          breadcrumb={['Prosumers']}
        />
        
        {/* TOOLBAR: actions only (duplicate title removed, hero above is the page title) */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          {/* Header Action Controls */}
          <div className="d-flex align-items-center gap-3">
            {/* Register New Prosumer Button */}
            <button
              onClick={() => { setShowRegisterModal(true); setRegisterMsg({ type: '', text: '' }); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                transition: 'all 0.2s ease',
              }}
              title="Register a new prosumer account"
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Register New Prosumer</span>
            </button>

            <button
              onClick={fetchData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(7, 43, 74, 0.08)',
                transition: 'all 0.2s ease',
              }}
              title="Refresh prosumer data"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>


            {/* Notification Bell Icon & Dropdown for Deactivation Requests */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: totalNotifications > 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: totalNotifications > 0 ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: totalNotifications > 0 ? '0 4px 16px rgba(14, 165, 233, 0.3)' : '0 4px 14px rgba(7, 43, 74, 0.08)',
                  color: totalNotifications > 0 ? '#0284c7' : '#475569',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={totalNotifications > 0 ? `${totalNotifications} pending notification(s)` : 'No pending notifications'}
              >
                <i className={totalNotifications > 0 ? 'bi bi-bell-fill' : 'bi bi-bell'}></i>
                {totalNotifications > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      borderRadius: '50px',
                      minWidth: '22px',
                      height: '22px',
                      padding: '0 6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.5)',
                      border: '2px solid #ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {totalNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotificationDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 12px)',
                    width: '420px',
                    maxWidth: '90vw',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 20px 50px -10px rgba(10, 35, 70, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                    zIndex: 1100,
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <div
                    style={{
                      padding: '16px 22px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '1.05rem' }}></i>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                        Deactivation Requests
                      </h4>
                    </div>
                    <span
                      style={{
                        background: deactivationRequests.length > 0 ? '#ef4444' : '#64748b',
                        color: '#ffffff',
                        borderRadius: '50px',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {deactivationRequests.length} {deactivationRequests.length === 1 ? 'Request' : 'Requests'}
                    </span>
                  </div>

                  {/* Dropdown Content */}
                  <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '16px' }}>
                    {deactivationRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            fontSize: '1.4rem',
                          }}
                        >
                          <i className="bi bi-check-lg"></i>
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: '4px' }}>
                          No Pending Deactivation Requests
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          All registered prosumer accounts are operating normally without pending deactivation flags.
                        </div>
                      </div>
                    ) : (
                      deactivationRequests.map((p) => (
                        <div
                          key={p.nic}
                          onClick={() => handleSelectNotification(p)}
                          style={{
                            background: '#fff5f5',
                            border: '1px solid #fecaca',
                            borderRadius: '16px',
                            padding: '14px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.05)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff5f5';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.05)';
                          }}
                        >
                          {/* Prosumer Info Row */}
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.88rem' }}>
                              {p.fullName}
                            </div>
                            <span
                              style={{
                                background: p.status === 'Active' ? '#10b981' : '#ef4444',
                                color: '#ffffff',
                                borderRadius: '50px',
                                padding: '2px 8px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              {p.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#e11d48', fontWeight: 700, marginBottom: '8px' }}>
                            NIC: {p.nic}
                          </div>

                          {/* Request Reason Body */}
                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fca5a5',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: '#7f1d1d',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                            }}
                          >
                            <i className="bi bi-chat-quote-fill" style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1px', flexShrink: 0 }}></i>
                            <div style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 700, display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#991b1b', marginBottom: '2px' }}>
                                Reason Submitted by Prosumer:
                              </span>
                              <span>"{p.deactivationReason || 'No detailed reason provided.'}"</span>
                            </div>
                          </div>

                          {/* Direct to Row Prompt */}
                          <div
                            style={{
                              marginTop: '8px',
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              color: '#0284c7',
                              fontWeight: 700,
                            }}
                          >
                            <span>Direct to table row</span>
                            <i className="bi bi-arrow-right-short" style={{ fontSize: '1rem' }}></i>
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
          <div
            style={{
              background: message.type === 'danger' ? 'rgba(254, 226, 226, 0.9)' : message.type === 'warning' ? 'rgba(254, 243, 199, 0.9)' : 'rgba(220, 252, 231, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: `1px solid ${message.type === 'danger' ? 'rgba(239, 68, 68, 0.4)' : message.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
              padding: '14px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: message.type === 'danger' ? '#b91c1c' : message.type === 'warning' ? '#92400e' : '#15803d',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : message.type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}`}></i>
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              &times;
            </button>
          </div>
        )}
    
    
        {/* =========================================================================
            PILL TABS NAVIGATION
           ========================================================================= */}
        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: activeTab === 'pending' ? '#1d72f2' : 'rgba(255, 255, 255, 0.7)',
              color: activeTab === 'pending' ? '#ffffff' : '#334155',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: activeTab === 'pending' ? '0 4px 14px rgba(29, 114, 242, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="bi bi-clock-history"></i>
            <span>Pending Activations</span>
            <span
              style={{
                background: activeTab === 'pending' ? '#fbbf24' : '#f59e0b',
                color: '#1e293b',
                borderRadius: '50px',
                padding: '2px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              {pendingProsumers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email-requests')}
            style={{
              background: activeTab === 'email-requests' ? '#1d72f2' : 'rgba(255, 255, 255, 0.7)',
              color: activeTab === 'email-requests' ? '#ffffff' : '#334155',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: activeTab === 'email-requests' ? '0 4px 14px rgba(29, 114, 242, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="bi bi-envelope-exclamation"></i>
            <span>Email Update Requests</span>
            <span
              style={{
                background: activeTab === 'email-requests' ? '#38bdf8' : '#0284c7',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '2px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              {emailRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? '#1d72f2' : 'rgba(255, 255, 255, 0.7)',
              color: activeTab === 'all' ? '#ffffff' : '#334155',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: activeTab === 'all' ? '0 4px 14px rgba(29, 114, 242, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="bi bi-person-lines-fill"></i>
            <span>All Prosumers Registry</span>
            <span
              style={{
                background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 23, 42, 0.12)',
                color: activeTab === 'all' ? '#ffffff' : '#475569',
                borderRadius: '50px',
                padding: '2px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              {prosumers.length}
            </span>
          </button>
        </div>
        {/* =========================================================================
            TAB 1: PENDING ACTIVATIONS TABLE (Pure Light Frosted Glass)
           ========================================================================= */}
        {activeTab === 'pending' && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 16px 40px -8px rgba(10, 35, 70, 0.12)',
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
              }}
            >
              <h2
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="bi bi-hourglass-split text-warning"></i>
                <span>Registrations Awaiting Backoffice Activation</span>
              </h2>
              <span
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '6px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                }}
              >
                {pendingProsumers.length} Pending
              </span>
            </div>

            {/* Table */}
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
                  <tr style={{ background: '#e3edf6', borderTop: '1px solid rgba(210, 230, 245, 0.8)', borderBottom: '1px solid rgba(210, 230, 245, 0.8)' }}>
                    <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>NIC (PRIMARY KEY)</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>FULL NAME</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>EMAIL</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>PHONE</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>INSTALLATION ADDRESS</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>REGISTERED DATE</th>
                    <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                        <div className="spinner-border spinner-border-sm me-2 text-primary"></div>
                        Loading pending registrations...
                      </td>
                    </tr>
                  ) : pendingProsumers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px', color: '#475569', background: '#f8fafc' }}>
                        <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                        All registered prosumer accounts are activated and up to date!
                      </td>
                    </tr>
                  ) : (
                    pendingProsumers.map((p, idx) => {
                      const rowBg = idx % 2 === 0 ? '#ebf4fa' : '#f8fafc';
                      return (
                        <tr
                          key={p.id || idx}
                          style={{
                            background: rowBg,
                            borderBottom: idx === pendingProsumers.length - 1 ? 'none' : '1px solid rgba(210, 230, 245, 0.7)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0edf8')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                        >
                          <td style={{ padding: '18px 32px', background: 'transparent' }}>
                            <span style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em', display: 'inline-block' }}>
                              {p.nic}
                            </span>
                          </td>
                          <td style={{ padding: '18px 24px', background: 'transparent', color: '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>
                            {p.fullName}
                          </td>
                          <td style={{ padding: '18px 24px', background: 'transparent', color: '#475569', fontSize: '0.88rem' }}>
                            {p.email}
                          </td>
                          <td style={{ padding: '18px 24px', background: 'transparent', color: '#334155', fontSize: '0.88rem' }}>
                            {p.phoneNumber || 'N/A'}
                          </td>
                          <td style={{ padding: '18px 24px', background: 'transparent', color: '#334155', fontSize: '0.88rem' }}>
                            {p.address || 'N/A'}
                          </td>
                          <td style={{ padding: '18px 24px', background: 'transparent', color: '#475569', fontSize: '0.88rem' }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '18px 32px', background: 'transparent', textAlign: 'center' }}>
                            <button
                              onClick={() => handleActivate(p.nic)}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '6px 18px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                                transition: 'transform 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                            >
                              <i className="bi bi-check-lg"></i>
                              <span>Activate Account</span>
                            </button>
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

    </div>
    </div>
  );
};

export default ProsumerManagement;