// ============================================================================
// File: ReservationManagement.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice energy reservation oversight: list, filter, update and cancel bookings.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const UNIT_RATE = 45; // Rs. per kWh — must match backend

const emptyCreateForm = () => ({
  prosumerNic: '',
  stationId: '',
  slotNumber: null,
  scheduledDateTime: '',
  durationHours: 1,
  energyAmountKWh: '',
  reservationType: 'DropOff',
});

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedQr, setSelectedQr] = useState(null);

  // ── Create Reservation state ──────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prosumersList, setProsumersList] = useState([]);
  const [stationsList, setStationsList] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/reservations', { params });
      setReservations(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error fetching reservation data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleCancelReservation = async (res) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${res.reservationCode}? (Notice rule: Must be >= 12 hours prior to scheduled time)`)) {
      return;
    }
    setMessage({ type: '', text: '' });

    try {
      const response = await api.delete(`/reservations/${res.id}?prosumerNic=${res.prosumerNic}`);
      setMessage({ type: 'success', text: response.data.message || 'Reservation cancelled successfully.' });
      try {
        const staRes = await api.get('/stations', { params: { status: 'Active' } });
        setStationsList(staRes.data);
      } catch (_) {}
      fetchReservations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to cancel reservation.';
      setMessage({ type: 'danger', text: errorMsg });
    }
  };

  // ── Open create modal — fetch prosumers + stations ────────────────────────
  const handleOpenCreateModal = async () => {
    setCreateForm(emptyCreateForm());
    setCreateError('');
    setShowCreateModal(true);
    try {
      const [prosRes, staRes] = await Promise.all([
        api.get('/users', { params: { role: 'Prosumer', status: 'Active' } }),
        api.get('/stations', { params: { status: 'Active' } }),
      ]);
      setProsumersList(prosRes.data);
      setStationsList(staRes.data);
    } catch (err) {
      setCreateError('Failed to load prosumers / stations. Please refresh and try again.');
    }
  };

  // ── Submit new reservation on behalf of prosumer ──────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.prosumerNic) { setCreateError('Please select a prosumer.'); return; }
    if (!createForm.stationId) { setCreateError('Please select a station hub.'); return; }
    if (!createForm.scheduledDateTime) { setCreateError('Please set the scheduled date and time.'); return; }
    if (!createForm.energyAmountKWh || parseFloat(createForm.energyAmountKWh) <= 0) {
      setCreateError('Energy amount must be greater than 0 kWh.'); return;
    }

    const scheduled = new Date(createForm.scheduledDateTime);
    const now = new Date();
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (scheduled <= now) { setCreateError('Scheduled time must be in the future.'); return; }
    if (scheduled > maxDate) { setCreateError('Reservation must be within 7 days from today.'); return; }

    setCreateLoading(true);
    try {
      const payload = {
        prosumerNic: createForm.prosumerNic,
        stationId: createForm.stationId,
        slotNumber: createForm.slotNumber ? parseInt(createForm.slotNumber, 10) : undefined,
        scheduledDateTime: scheduled.toISOString(),
        durationHours: parseInt(createForm.durationHours, 10),
        energyAmountKWh: parseFloat(createForm.energyAmountKWh),
        reservationType: createForm.reservationType,
      };

      const res = await api.post('/reservations/backoffice-create', payload);
      // Refresh stations list so available slot count is updated after booking
      try {
        const staRes = await api.get('/stations', { params: { status: 'Active' } });
        setStationsList(staRes.data);
      } catch (_) {}
      setShowCreateModal(false);
      setMessage({
        type: 'success',
        text: `✓ ${res.data.message || 'Reservation created!'} — Code: ${res.data.reservation?.reservationCode ?? ''}. It now appears in the prosumer's mobile app.`,
      });
      fetchReservations();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create reservation.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit Reservation state + handlers ─────────────────────────────────────
  const [editingReservation, setEditingReservation] = useState(null); // null = closed
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const handleEditOpen = async (r) => {
    // Ensure stations are available for station selector
    if (stationsList.length === 0) {
      try {
        const staRes = await api.get('/stations', { params: { status: 'Active' } });
        setStationsList(staRes.data);
      } catch (err) {
        console.error('Failed to load stations', err);
      }
    }

    // Pre-fill form from existing reservation data
    const dt = new Date(r.scheduledDateTime);
    // Format as datetime-local value (YYYY-MM-DDTHH:MM)
    const pad = (n) => String(n).padStart(2, '0');
    const localDt = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    setEditForm({
      stationId: r.stationId || '',
      scheduledDateTime: localDt,
      durationHours: r.durationHours || 1,
      energyAmountKWh: r.energyAmountKWh || '',
      reservationType: r.reservationType || 'DropOff',
      status: r.status || 'Approved',
    });
    setEditError('');
    setEditingReservation(r);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    const scheduled = new Date(editForm.scheduledDateTime);
    const now = new Date();
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (scheduled <= now) { setEditError('Scheduled time must be in the future.'); return; }
    if (scheduled > maxDate) { setEditError('Reservation must be within 7 days from today.'); return; }
    if (!editForm.energyAmountKWh || parseFloat(editForm.energyAmountKWh) <= 0) {
      setEditError('Energy amount must be greater than 0 kWh.'); return;
    }

    setEditLoading(true);
    try {
      const payload = {
        stationId: editForm.stationId,
        scheduledDateTime: scheduled.toISOString(),
        durationHours: parseInt(editForm.durationHours, 10),
        energyAmountKWh: parseFloat(editForm.energyAmountKWh),
        reservationType: editForm.reservationType,
        status: editForm.status,
      };
      // Pass prosumerNic blank so the service skips ownership check (backoffice override)
      const res = await api.put(`/reservations/${editingReservation.id}`, payload);
      setEditingReservation(null);
      setMessage({
        type: 'success',
        text: `✓ ${res.data.message || 'Reservation updated.'} — ${editingReservation.reservationCode}`,
      });
      fetchReservations();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update reservation.');
    } finally {
      setEditLoading(false);
    }
  };

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
          imageSrc="/images/Solar_3.jpg"
          eyebrow="SOLARX • Energy Bookings"
          title="Reservation Management"
          subtitle="7-day slot approvals, QR tokens and dispatch scheduling."
          breadcrumb={['Reservations']}
        />
        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={fetchReservations}
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
              title="Refresh reservations"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 22px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="bi bi-plus-circle-fill"></i>
              <span>New Reservation</span>
            </button>
            
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            style={{
              background: message.type === 'danger' ? 'rgba(254, 242, 242, 0.95)' : 'rgba(240, 253, 244, 0.95)',
              border: `1px solid ${message.type === 'danger' ? '#fca5a5' : '#86efac'}`,
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
              color: message.type === 'danger' ? '#991b1b' : '#166534',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'}`} style={{ fontSize: '1.15rem' }}></i>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* =========================================================================
            FILTERS BAR
           ========================================================================= */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 12px 32px -4px rgba(10, 35, 70, 0.1)',
            padding: '20px 28px',
            marginBottom: '28px',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-lg-5 col-md-12">
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-search"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Search by code, prosumer, or station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 18px 11px 44px',
                    borderRadius: '50px',
                    background: '#ffffff',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="col-lg-4 col-md-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: '50px',
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <option value="">All Reservation Statuses</option>
                <option value="Approved">Approved (Ready with QR)</option>
                <option value="Pending">Pending Approval</option>
                <option value="Completed">Completed (Finalized by Operator)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="col-lg-3 col-md-6 d-flex gap-2">
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #0070f3 0%, #0051b3 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '11px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 112, 243, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-funnel-fill"></i>
                <span>Apply Filter</span>
              </button>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#475569',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: '50px',
                  padding: '11px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            RESERVATIONS TABLE CARD
           ========================================================================= */}
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
              background: 'transparent',
            }}
          >
            <h2
              style={{
                fontSize: '1.18rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Power Trading Booking Records
            </h2>
            <span
              style={{
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '6px 18px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
              }}
            >
              {reservations.length} Active Bookings
            </span>
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
                <tr style={{ background: '#e3edf6', borderTop: '1px solid rgba(210, 230, 245, 0.8)', borderBottom: '1px solid rgba(210, 230, 245, 0.8)' }}>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    BOOKING CODE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    PROSUMER (NIC)
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    STATION HUB
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    SCHEDULED SLOT
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    DURATION &amp; ENERGY
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    TOTAL VALUE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    TYPE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6', textAlign: 'center' }}>
                    QR &amp; ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                      Loading energy reservation records...
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      No matching energy reservations found.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ebf4fa' : '#f8fafc';
                    return (
                      <tr
                        key={r.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: idx === reservations.length - 1 ? 'none' : '1px solid rgba(210, 230, 245, 0.7)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0edf8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* Booking Code */}
                        <td style={{ padding: '18px 28px', background: 'transparent' }}>
                          <span
                            style={{
                              background: '#0f172a',
                              color: '#38bdf8',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              padding: '5px 14px',
                              borderRadius: '50px',
                              display: 'inline-block',
                              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                            }}
                          >
                            {r.reservationCode}
                          </span>
                        </td>

                        {/* Prosumer */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {r.prosumerName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#e11d48', fontWeight: 600, marginTop: '2px' }}>
                            NIC: {r.prosumerNic}
                          </div>
                        </td>

                        {/* Target Station Hub & Battery Slot */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#0f172a', fontWeight: 600, fontSize: '0.88rem' }}>
                            <i className="bi bi-broadcast" style={{ color: '#0284c7' }}></i>
                            <span>{r.stationName}</span>
                          </div>
                          {r.slotNumber ? (
                            <div style={{ marginTop: '4px' }}>
                              <span
                                style={{
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  padding: '2px 10px',
                                  borderRadius: '50px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="bi bi-battery-charging"></i>
                                Bay Slot #{r.slotNumber}
                              </span>
                            </div>
                          ) : null}
                        </td>

                        {/* Scheduled Slot */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.88rem' }}>
                            {new Date(r.scheduledDateTime).toLocaleDateString()}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                            {new Date(r.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Duration & Energy */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                            {r.energyAmountKWh} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>kWh</span>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                            {r.durationHours} hr slot
                          </div>
                        </td>

                        {/* Total Value */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.98rem' }}>
                            Rs. {r.totalCost ? r.totalCost.toFixed(2) : '0.00'}
                          </span>
                        </td>

                        {/* Reservation Type */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          {r.reservationType === 'DropOff' ? (
                            <span
                              style={{
                                background: '#ecfeff',
                                color: '#0891b2',
                                border: '1px solid #a5f3fc',
                                borderRadius: '50px',
                                padding: '5px 14px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <i className="bi bi-arrow-down-left"></i>
                              <span>Drop-Off (Sell)</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe',
                                borderRadius: '50px',
                                padding: '5px 14px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <i className="bi bi-lightning-charge"></i>
                              <span>Charging (Buy)</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <span
                            style={{
                              background:
                                r.status === 'Approved' ? '#10b981' :
                                r.status === 'Pending' ? '#f59e0b' :
                                r.status === 'Completed' ? '#0284c7' : '#ef4444',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '5px 16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              display: 'inline-block',
                              boxShadow:
                                r.status === 'Approved' ? '0 2px 8px rgba(16, 185, 129, 0.3)' :
                                r.status === 'Pending' ? '0 2px 8px rgba(245, 158, 11, 0.3)' :
                                r.status === 'Completed' ? '0 2px 8px rgba(2, 132, 199, 0.3)' :
                                '0 2px 8px rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            {r.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '18px 28px', background: 'transparent', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            {r.qrCodeData && (
                              <button
                                onClick={() => setSelectedQr(r)}
                                title="View Secure QR Payload"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid rgba(148, 163, 184, 0.4)',
                                  color: '#0f172a',
                                  borderRadius: '50px',
                                  padding: '5px 14px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <i className="bi bi-qr-code" style={{ fontSize: '0.85rem' }}></i>
                                <span>QR</span>
                              </button>
                            )}

                            {(r.status === 'Approved' || r.status === 'Pending') && (
                              <>
                                {/* Edit button */}
                                <button
                                  onClick={() => handleEditOpen(r)}
                                  title="Edit Booking (Enforces 12h rule)"
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #93c5fd',
                                    color: '#1d4ed8',
                                    borderRadius: '50px',
                                    padding: '5px 14px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 6px rgba(29, 78, 216, 0.1)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                  <span>Edit</span>
                                </button>

                                {/* Cancel button */}
                                <button
                                  onClick={() => handleCancelReservation(r)}
                                  title="Cancel Booking (Enforces 12h rule)"
                                  style={{
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    borderRadius: '50px',
                                    padding: '5px 14px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i className="bi bi-x-circle"></i>
                                  <span>Cancel</span>
                                </button>
                              </>
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

        {/* Bottom Navigation Link */}
        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link
            to="/backoffice"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              padding: '10px 24px',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Administration Console</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          QR DETAILS MODAL
         ========================================================================= */}
      {selectedQr && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 25, 47, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => setSelectedQr(null)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(24px)',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px -12px rgba(10, 35, 70, 0.35)',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(210, 230, 245, 0.8)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-qr-code-scan" style={{ fontSize: '1.25rem', color: '#38bdf8' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  Security Transaction QR Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedQr(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
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
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px' }} className="text-center">
              {/* QR Icon Box */}
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  margin: '0 auto 20px',
                  background: '#f8fafc',
                  border: '2px dashed #94a3b8',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                <i className="bi bi-qr-code" style={{ fontSize: '7rem', color: '#0f172a' }}></i>
              </div>

              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {selectedQr.reservationCode}
              </div>

              <div style={{ color: '#475569', fontSize: '0.88rem', marginBottom: '20px' }}>
                Prosumer: <strong>{selectedQr.prosumerName}</strong> &middot; <span style={{ color: '#e11d48', fontWeight: 700 }}>NIC: {selectedQr.prosumerNic}</span>
              </div>

              {/* Encrypted payload box */}
              <div
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Encrypted Payload for Field Scanner:
                </div>
                <code
                  style={{
                    fontSize: '0.78rem',
                    color: '#0369a1',
                    wordBreak: 'break-all',
                    background: 'transparent',
                    display: 'block',
                  }}
                >
                  {selectedQr.qrCodeData}
                </code>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                <i className="bi bi-shield-lock-fill text-primary me-1"></i>
                Scanned on-site by Grid Operators to securely authenticate prosumer identity and authorize physical battery bay connection.
              </p>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 28px 22px',
                borderTop: '1px solid rgba(210, 230, 245, 0.8)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedQr(null)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 28px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE RESERVATION MODAL — Backoffice officer creates on behalf of prosumer
         ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 25, 47, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(24px)',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px -12px rgba(10, 35, 70, 0.35)',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Modal Header ── */}
            <div style={{
              padding: '22px 28px',
              borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
              borderRadius: '28px 28px 0 0',
            }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                }}>
                  <i className="bi bi-calendar2-plus" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Create Reservation
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px' }}>On behalf of a prosumer · 7-day rule applies</div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
              >&times;</button>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleCreateSubmit}>
              <div style={{ padding: '24px 28px' }}>

                {/* Error banner */}
                {createError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{createError}</span>
                  </div>
                )}

                {/* Mobile app info note */}
                <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="bi bi-phone-fill" style={{ color: '#059669', fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}></i>
                  <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600, lineHeight: 1.5 }}>
                    This reservation will appear <strong>immediately</strong> in the selected prosumer's mobile app under "My Reservations".
                  </span>
                </div>

                <div className="row g-3">

                  {/* ── Prosumer ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Prosumer *
                    </label>
                    <select
                      value={createForm.prosumerNic}
                      onChange={(e) => setCreateForm({ ...createForm, prosumerNic: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem', background: '#fff' }}
                    >
                      <option value="">— Select active prosumer —</option>
                      {prosumersList.map((p) => (
                        <option key={p.nic} value={p.nic}>
                          {p.fullName} · {p.nic}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ── Station ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Solar Hub Station *
                    </label>
                    <select
                      value={createForm.stationId}
                      onChange={(e) => {
                        const stId = e.target.value;
                        const sel = stationsList.find(s => s.id === stId);
                        let firstFree = null;
                        if (sel) {
                          const total = sel.totalBatterySlots || 10;
                          const occ = sel.occupiedSlotNumbers || [];
                          for (let i = 1; i <= total; i++) {
                            if (!occ.includes(i)) { firstFree = i; break; }
                          }
                        }
                        setCreateForm({ ...createForm, stationId: stId, slotNumber: firstFree });
                      }}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem', background: '#fff' }}
                    >
                      <option value="">— Select active hub station —</option>
                      {stationsList.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={s.availableBatterySlots <= 0}
                        >
                          {s.stationCode} · {s.name} — {s.availableBatterySlots <= 0 ? '⛔ FULL (0 slots)' : `✅ ${s.availableBatterySlots}/${s.totalBatterySlots} slots free`}
                        </option>
                      ))}
                    </select>

                    {/* Interactive Slot Bay Picker */}
                    {createForm.stationId && (() => {
                      const sel = stationsList.find(s => s.id === createForm.stationId);
                      if (!sel) return null;
                      const total = sel.totalBatterySlots || 10;
                      const occupied = sel.occupiedSlotNumbers || [];
                      const isFull = sel.availableBatterySlots <= 0 || occupied.length >= total;

                      return (
                        <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Select Physical Battery Bay Slot *
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isFull ? '#dc2626' : '#059669' }}>
                              {isFull ? '⛔ No Free Slots' : `${sel.availableBatterySlots} / ${total} Free`}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                            {Array.from({ length: total }, (_, idx) => {
                              const slotNum = idx + 1;
                              const isOccupied = occupied.includes(slotNum);
                              const isSelected = createForm.slotNumber === slotNum;

                              if (isOccupied) {
                                return (
                                  <div
                                    key={slotNum}
                                    title={`Slot #${slotNum} is currently reserved by an active booking`}
                                    style={{
                                      padding: '8px 4px',
                                      borderRadius: '10px',
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      color: '#991b1b',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      textAlign: 'center',
                                      cursor: 'not-allowed',
                                      opacity: 0.6,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                  >
                                    <span>#{slotNum}</span>
                                    <span style={{ fontSize: '0.64rem', color: '#dc2626' }}>🔒 Booked</span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={slotNum}
                                  type="button"
                                  onClick={() => setCreateForm({ ...createForm, slotNumber: slotNum })}
                                  style={{
                                    padding: '8px 4px',
                                    borderRadius: '10px',
                                    background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ffffff',
                                    border: `1.5px solid ${isSelected ? '#059669' : '#86efac'}`,
                                    color: isSelected ? '#ffffff' : '#065f46',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? '0 3px 10px rgba(16, 185, 129, 0.35)' : '0 1px 3px rgba(0,0,0,0.04)',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                  }}
                                >
                                  <span>#{slotNum}</span>
                                  <span style={{ fontSize: '0.64rem', color: isSelected ? '#ffffff' : '#059669' }}>
                                    {isSelected ? 'Selected' : 'Available'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {createForm.slotNumber ? (
                              <span style={{ color: '#059669', fontWeight: 700 }}>
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Battery Slot #{createForm.slotNumber} chosen for this reservation.
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                Please click an available green slot above to assign a battery bay.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Reservation Type ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      Reservation Type *
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {[
                        { value: 'DropOff', label: 'Drop-Off (Sell to Grid)', icon: 'bi-arrow-down-left-circle-fill', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                        { value: 'Charging', label: 'Charging (Buy from Grid)', icon: 'bi-lightning-charge-fill', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, reservationType: opt.value })}
                          style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: `2px solid ${createForm.reservationType === opt.value ? opt.color : 'rgba(15,23,42,0.12)'}`,
                            background: createForm.reservationType === opt.value ? opt.bg : '#f8fafc',
                            color: createForm.reservationType === opt.value ? opt.color : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <i className={`bi ${opt.icon}`} style={{ fontSize: '1rem' }}></i>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Scheduled Date & Time ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Scheduled Date & Time * <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(max 7 days ahead)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={createForm.scheduledDateTime}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      onChange={(e) => setCreateForm({ ...createForm, scheduledDateTime: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* ── Duration + Energy ── */}
                  <div className="col-md-5">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={createForm.durationHours}
                      onChange={(e) => setCreateForm({ ...createForm, durationHours: Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div className="col-md-7">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Energy Amount (kWh) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.1"
                      value={createForm.energyAmountKWh}
                      onChange={(e) => setCreateForm({ ...createForm, energyAmountKWh: e.target.value })}
                      placeholder="e.g. 25.5"
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* ── Estimated Cost Preview ── */}
                  {parseFloat(createForm.energyAmountKWh) > 0 && (
                    <div className="col-12">
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #86efac',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                          <i className="bi bi-calculator me-2"></i>
                          Estimated transaction value
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                          Rs. {(parseFloat(createForm.energyAmountKWh) * UNIT_RATE).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', paddingLeft: '4px' }}>
                        Rate: Rs. {UNIT_RATE}/kWh · Final cost computed by server
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── Modal Footer ── */}
              <div style={{ padding: '16px 28px 22px', borderTop: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderRadius: '0 0 28px 28px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'rgba(15, 23, 42, 0.06)', color: '#475569', border: 'none', borderRadius: '50px', padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    background: createLoading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 28px',
                    fontWeight: 700,
                    cursor: createLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: createLoading ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {createLoading ? (
                    <><div className="spinner-border spinner-border-sm" role="status"></div><span>Creating…</span></>
                  ) : (
                    <><i className="bi bi-check-circle-fill"></i><span>Create Reservation</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT RESERVATION MODAL — Backoffice officer updates an existing reservation
         ========================================================================= */}
      {editingReservation && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 25, 47, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => setEditingReservation(null)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(24px)',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px -12px rgba(10, 35, 70, 0.35)',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Modal Header ── */}
            <div style={{
              padding: '22px 28px',
              borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
              borderRadius: '28px 28px 0 0',
            }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                }}>
                  <i className="bi bi-pencil-square" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Edit Reservation: {editingReservation.reservationCode}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px' }}>
                    Prosumer: {editingReservation.prosumerName} ({editingReservation.prosumerNic})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingReservation(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
              >&times;</button>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: '24px 28px' }}>

                {/* Error banner */}
                {editError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{editError}</span>
                  </div>
                )}

                {/* Prosumer & QR synchronization info note */}
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="bi bi-arrow-repeat" style={{ color: '#1d4ed8', fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}></i>
                  <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 600, lineHeight: 1.5 }}>
                    Updates will automatically recalculate total cost, regenerate the secure verification QR code, and sync to the prosumer's mobile app.
                  </span>
                </div>

                <div className="row g-3">

                  {/* ── Hub Station ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Target Solar Hub Station *
                    </label>
                    <select
                      value={editForm.stationId}
                      onChange={(e) => setEditForm({ ...editForm, stationId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem', background: '#fff' }}
                    >
                      <option value="">— Select station hub —</option>
                      {stationsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stationCode} · {s.name} ({s.availableBatterySlots} slots available)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ── Reservation Type ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      Reservation Type *
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {[
                        { value: 'DropOff', label: 'Drop-Off (Sell to Grid)', icon: 'bi-arrow-down-left-circle-fill', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                        { value: 'Charging', label: 'Charging (Buy from Grid)', icon: 'bi-lightning-charge-fill', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, reservationType: opt.value })}
                          style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: `2px solid ${editForm.reservationType === opt.value ? opt.color : 'rgba(15,23,42,0.12)'}`,
                            background: editForm.reservationType === opt.value ? opt.bg : '#f8fafc',
                            color: editForm.reservationType === opt.value ? opt.color : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <i className={`bi ${opt.icon}`} style={{ fontSize: '1rem' }}></i>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Scheduled Date & Time ── */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Rescheduled Date & Time * <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(within 7 days)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduledDateTime}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      onChange={(e) => setEditForm({ ...editForm, scheduledDateTime: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* ── Duration + Energy ── */}
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={editForm.durationHours}
                      onChange={(e) => setEditForm({ ...editForm, durationHours: Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Energy (kWh) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.1"
                      value={editForm.energyAmountKWh}
                      onChange={(e) => setEditForm({ ...editForm, energyAmountKWh: e.target.value })}
                      placeholder="e.g. 25.5"
                      required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontSize: '0.88rem', background: '#fff' }}
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* ── Estimated Cost Preview ── */}
                  {parseFloat(editForm.energyAmountKWh) > 0 && (
                    <div className="col-12">
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #86efac',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                          <i className="bi bi-calculator me-2"></i>
                          Updated transaction value
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                          Rs. {(parseFloat(editForm.energyAmountKWh) * UNIT_RATE).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', paddingLeft: '4px' }}>
                        Rate: Rs. {UNIT_RATE}/kWh · Automatically synchronizes with central database
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── Modal Footer ── */}
              <div style={{ padding: '16px 28px 22px', borderTop: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderRadius: '0 0 28px 28px' }}>
                <button
                  type="button"
                  onClick={() => setEditingReservation(null)}
                  style={{ background: 'rgba(15, 23, 42, 0.06)', color: '#475569', border: 'none', borderRadius: '50px', padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    background: editLoading ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 28px',
                    fontWeight: 700,
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: editLoading ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {editLoading ? (
                    <><div className="spinner-border spinner-border-sm" role="status"></div><span>Saving Changes…</span></>
                  ) : (
                    <><i className="bi bi-check-circle-fill"></i><span>Update Reservation</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;
