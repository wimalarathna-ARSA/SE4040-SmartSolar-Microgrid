// ============================================================================
// File: ReservationManagement.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice energy reservation oversight: list, filter, update and cancel bookings.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import BackofficePageHero from '../../components/BackofficePageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

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

const thClass = 'text-uppercase text-[0.72rem] fw-bold text-[#F8F8F8] bg-[#063127] px-4 py-3';
const inputClass = 'form-control rounded-[10px] text-[0.88rem] bg-white';
const labelClass = 'form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide';
const typeOptions = [
  { value: 'DropOff', label: 'Drop-Off (Sell to Grid)', icon: 'bi-arrow-down-left-circle-fill' },
  { value: 'Charging', label: 'Charging (Buy from Grid)', icon: 'bi-lightning-charge-fill' },
];

const ReservationManagement = () => {
  const location = useLocation();
  const queryStatus = new URLSearchParams(location.search).get('status') || '';
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(queryStatus);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedQr, setSelectedQr] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

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
    const s = new URLSearchParams(location.search).get('status');
    if (s !== null) {
      setStatusFilter(s);
    }
  }, [location.search]);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleApproveReservation = async (res) => {
    setMessage({ type: '', text: '' });
    setApprovingId(res.id);
    try {
      try {
        await api.post(`/reservations/${res.id}/approve`);
      } catch (postErr) {
        // Fallback to standard PUT update if dedicated endpoint is not yet available in running server
        const payload = {
          stationId: res.stationId,
          scheduledDateTime: new Date(res.scheduledDateTime).toISOString(),
          durationHours: res.durationHours || 1,
          energyAmountKWh: res.energyAmountKWh,
          reservationType: res.reservationType || 'DropOff',
          status: 'Approved',
        };
        await api.put(`/reservations/${res.id}`, payload);
      }
      setMessage({
        type: 'success',
        text: `✓ Booking ${res.reservationCode} approved! Transaction QR pass generated and dispatched to prosumer (${res.prosumerName}).`,
      });
      fetchReservations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to approve reservation.';
      setMessage({ type: 'danger', text: errorMsg });
    } finally {
      setApprovingId(null);
    }
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

  const [editingReservation, setEditingReservation] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const handleEditOpen = async (r) => {
    if (stationsList.length === 0) {
      try {
        const staRes = await api.get('/stations', { params: { status: 'Active' } });
        setStationsList(staRes.data);
      } catch (err) {
        console.error('Failed to load stations', err);
      }
    }
    const dt = new Date(r.scheduledDateTime);
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

  const statusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-[#BFD5D0] text-[#063127] border border-[#8FB3A9] d-inline-flex align-items-center gap-1">
            <i className="bi bi-hourglass-split text-[#3B796A]"></i>Pending Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-[#063127] text-white border border-[#063127] d-inline-flex align-items-center gap-1">
            <i className="bi bi-check-circle-fill text-[#BFD5D0]"></i>Approved (QR Ready)
          </span>
        );
      case 'Completed':
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-[#3B796A] text-white border border-[#3B796A] d-inline-flex align-items-center gap-1">
            <i className="bi bi-patch-check-fill text-[#BFD5D0]"></i>Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-neutral-200 text-neutral-700 border border-neutral-300 d-inline-flex align-items-center gap-1">
            <i className="bi bi-x-circle text-neutral-500"></i>Cancelled
          </span>
        );
      case 'Missed':
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-amber-100 text-amber-900 border border-amber-400 d-inline-flex align-items-center gap-1">
            <i className="bi bi-clock-history text-amber-700"></i>Missed (No-Show)
          </span>
        );
      default:
        return (
          <span className="badge rounded-pill text-[0.74rem] fw-bold px-3 py-1 shadow-sm tracking-wide bg-[#686053] text-white">
            {status}
          </span>
        );
    }
  };

  const selectedCreateStation = stationsList.find(s => s.id === createForm.stationId);

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
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
            <button onClick={fetchReservations} title="Refresh reservations" className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <i className="bi bi-arrow-clockwise"></i><span>Refresh</span>
            </button>
            <button onClick={handleOpenCreateModal} className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <i className="bi bi-plus-circle-fill"></i><span>New Reservation</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={'alert d-flex align-items-center justify-content-between rounded-[16px] shadow-sm mb-4 border ' + (message.type === 'danger' ? 'alert-danger' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]')}>
            <div className="d-flex align-items-center gap-2">
              <i className={'bi text-[1.15rem] ' + (message.type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill')}></i>
              <span className="fw-semibold text-[0.9rem]">{message.text}</span>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="btn-close" aria-label="Close"></button>
          </div>
        )}

        {/* FILTERS BAR */}
        <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl p-4 md:px-[28px] md:py-[20px] mb-4 ${ENTER_UP} motion-reduce:animate-none`}>
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            <div className="col-lg-5 col-md-12">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-[#686053] text-[0.95rem]"></i>
                <input type="text" placeholder="Search by code, prosumer, or station..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control rounded-pill ps-10 bg-white text-[0.88rem] shadow-sm" />
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select rounded-pill bg-white text-[0.88rem] fw-medium shadow-sm">
                <option value="">All Reservation Statuses</option>
                <option value="Approved">Approved (Ready with QR)</option>
                <option value="Pending">Pending Approval</option>
                <option value="Completed">Completed (Finalized by Operator)</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Missed">Missed (No-Show)</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-6 d-flex gap-2">
              <button type="submit" className="btn flex-fill rounded-pill px-4 py-2 text-[0.85rem] fw-bold text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm d-inline-flex align-items-center justify-content-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg">
                <i className="bi bi-funnel-fill"></i><span>Apply Filter</span>
              </button>
              <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 py-2 text-[0.85rem] fw-semibold transition hover:-translate-y-0.5 hover:shadow-lg">Reset</button>
            </div>
          </form>
        </div>

        {/* RESERVATIONS TABLE CARD */}
        <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3">
            <div>
              <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0 tracking-tight">Power Trading Booking Records</h2>
              <div className="text-[0.78rem] text-[#686053]">Approve pending prosumer bookings to issue transaction QR passes</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {reservations.some(r => r.status === 'Pending') && (
                <span className="badge rounded-pill bg-[#BFD5D0] text-[#063127] border border-[#8FB3A9] text-[0.78rem] fw-bold px-3 py-1.5 shadow-sm">
                  <i className="bi bi-hourglass-split me-1 text-[#3B796A]"></i>
                  {reservations.filter(r => r.status === 'Pending').length} Pending Approval
                </span>
              )}
              <span className="badge rounded-pill text-white text-[0.78rem] fw-bold px-3 py-1.5 bg-[#063127] shadow-sm">
                {reservations.length} {statusFilter ? `${statusFilter} Records` : 'Total Records'}
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className={thClass}>BOOKING CODE</th>
                  <th className={thClass}>PROSUMER (NIC)</th>
                  <th className={thClass}>STATION HUB</th>
                  <th className={thClass}>SCHEDULED SLOT</th>
                  <th className={thClass}>DURATION &amp; ENERGY</th>
                  <th className={thClass}>TOTAL VALUE</th>
                  <th className={thClass}>TYPE</th>
                  <th className={thClass}>STATUS</th>
                  <th className={thClass + ' text-center'}>QR &amp; ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center px-4 py-5 text-[#686053] bg-white"><div className="spinner-border spinner-border-sm me-2 text-[#063127]" role="status"></div>Loading energy reservation records...</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan="9" className="text-center px-4 py-5 text-[#686053] bg-white">No matching energy reservations found.</td></tr>
                ) : (
                  reservations.map((r, idx) => (
                    <tr key={r.id || idx} className="transition">
                      <td className="px-4 py-3">
                        <span className="badge rounded-pill bg-[#063127] text-[#686053] font-monospace fw-bold text-[0.84rem] px-3 py-1 shadow-sm">{r.reservationCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="fw-bold text-[#063127] text-[0.92rem]">{r.prosumerName}</div>
                        <div className="text-[0.78rem] text-danger fw-semibold mt-[2px]">NIC: {r.prosumerNic}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-1 text-[#063127] fw-semibold text-[0.88rem]">
                          <i className="bi bi-broadcast text-[#063127]"></i><span>{r.stationName}</span>
                        </div>
                        {r.slotNumber ? (
                          <div className="mt-1">
                            <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.72rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1">
                              <i className="bi bi-battery-charging"></i>Bay Slot #{r.slotNumber}
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#063127] fw-semibold text-[0.88rem]">{new Date(r.scheduledDateTime).toLocaleDateString()}</div>
                        <div className="text-[#686053] text-[0.78rem] mt-[2px]">{new Date(r.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#063127] fw-bold text-[0.9rem]">{r.energyAmountKWh} <span className="text-[0.75rem] text-[#686053] fw-medium">kWh</span></div>
                        <div className="text-[#686053] text-[0.78rem] mt-[2px]">{r.durationHours} hr slot</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-[#063127] fw-extrabold text-[0.98rem]">Rs. {r.totalCost ? r.totalCost.toFixed(2) : '0.00'}</span></td>
                      <td className="px-4 py-3">
                        {r.reservationType === 'DropOff' ? (
                          <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-arrow-down-left"></i><span>Drop-Off (Sell)</span>
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.75rem] fw-bold px-2 py-1 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-lightning-charge"></i><span>Charging (Buy)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-inline-flex align-items-center gap-2 flex-wrap justify-content-center">
                          {r.status === 'Pending' && (
                            <button
                              onClick={() => handleApproveReservation(r)}
                              disabled={approvingId === r.id}
                              title="Approve booking and generate QR code for prosumer mobile app"
                              className="btn btn-sm text-white bg-[#063127] hover:bg-[#3B796A] border border-[#063127] rounded-pill px-3 py-1 text-[0.78rem] fw-bold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                            >
                              {approvingId === r.id ? (
                                <>
                                  <div className="spinner-border spinner-border-sm" role="status"></div>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check2-circle text-[#BFD5D0] text-[0.95rem]"></i>
                                  <span>Approve &amp; Issue QR</span>
                                </>
                              )}
                            </button>
                          )}
                          {r.qrCodeData && (
                            <button
                              onClick={() => setSelectedQr(r)}
                              title="View Secure QR Payload"
                              className="btn btn-sm bg-[#BFD5D0]/30 text-[#063127] border border-[#8FB3A9] hover:bg-[#BFD5D0] rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              <i className="bi bi-qr-code text-[#3B796A] text-[0.85rem]"></i>
                              <span>View QR</span>
                            </button>
                          )}
                          {(r.status === 'Approved' || r.status === 'Pending') && (
                            <>
                              <button
                                onClick={() => handleEditOpen(r)}
                                title="Edit Booking (Enforces 12h rule)"
                                className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleCancelReservation(r)}
                                title="Cancel Booking (Enforces 12h rule)"
                                className="btn btn-sm bg-white text-danger border border-danger hover:bg-danger hover:text-white rounded-pill px-3 py-1 text-[0.78rem] fw-semibold d-inline-flex align-items-center gap-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                <i className="bi bi-x-circle"></i>
                                <span>Cancel</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Navigation Link */}
        <div className="mt-4 text-center">
          <Link to="/backoffice" className="d-inline-flex align-items-center gap-2 text-[#063127] text-decoration-none fw-bold text-[0.9rem] bg-white px-4 py-2 rounded-pill border shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-left"></i><span>Back to Administration Console</span>
          </Link>
        </div>
      </div>

      {/* QR DETAILS MODAL */}
      {selectedQr && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/65 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog" onClick={() => setSelectedQr(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[28px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header text-white border-0 px-4 py-3 d-flex justify-content-between align-items-center bg-[#063127]">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-qr-code-scan text-[1.25rem] text-[#063127]"></i>
                  <h3 className="m-0 text-[1.15rem] fw-extrabold tracking-tight text-white">Security Transaction QR Details</h3>
                </div>
                <button onClick={() => setSelectedQr(null)} className="btn btn-sm btn-outline-light rounded-circle p-0 w-[32px] h-[32px] d-flex align-items-center justify-content-center text-[1.2rem]" aria-label="Close">&times;</button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="mx-auto mb-3 bg-white border border-2 border-dashed border-[#063127]/20 rounded-[20px] d-flex align-items-center justify-content-center w-[160px] h-[160px] shadow-sm">
                  <i className="bi bi-qr-code text-[7rem] text-[#063127]"></i>
                </div>
                <div className="text-[1.3rem] fw-extrabold text-[#063127] tracking-wide mb-1 font-monospace">{selectedQr.reservationCode}</div>
                <div className="text-[#686053] text-[0.88rem] mb-3">Prosumer: <strong>{selectedQr.prosumerName}</strong> &middot; <span className="text-danger fw-bold">NIC: {selectedQr.prosumerNic}</span></div>
                <div className="bg-white border rounded-[16px] px-3 py-2 text-start mb-3">
                  <div className="text-[0.72rem] fw-bold text-[#686053] text-uppercase tracking-wide mb-1">Encrypted Payload for Field Scanner:</div>
                  <code className="text-[0.78rem] text-[#063127] break-words d-block bg-transparent">{selectedQr.qrCodeData}</code>
                </div>
                <p className="text-[#686053] text-[0.8rem] m-0 leading-[1.5]">
                  <i className="bi bi-shield-lock-fill text-[#063127] me-1"></i>
                  Scanned on-site by Grid Operators to securely authenticate prosumer identity and authorize physical battery bay connection.
                </p>
              </div>
              <div className="modal-footer bg-white border-top d-flex justify-content-end px-4 py-3">
                <button type="button" onClick={() => setSelectedQr(null)} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-bold text-[0.88rem] shadow-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RESERVATION MODAL */}
      {showCreateModal && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/65 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[28px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header text-white border-0 px-4 py-3 d-flex justify-content-between align-items-center bg-[#063127]">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-[12px] w-[40px] h-[40px] d-flex align-items-center justify-content-center bg-[#063127] shadow-sm">
                    <i className="bi bi-calendar2-plus text-white text-[1.1rem]"></i>
                  </div>
                  <div>
                    <h3 className="m-0 text-[1.1rem] fw-extrabold text-white tracking-tight">Create Reservation</h3>
                    <div className="text-[0.75rem] text-white-50 mt-[1px]">On behalf of a prosumer · 7-day rule applies</div>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-sm btn-outline-light rounded-circle p-0 w-[32px] h-[32px] d-flex align-items-center justify-content-center text-[1.1rem]" aria-label="Close">&times;</button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {createError && (
                    <div className="alert alert-danger rounded-[12px] px-3 py-2 mb-3 d-flex align-items-center gap-2 text-[0.85rem] fw-semibold">
                      <i className="bi bi-exclamation-triangle-fill"></i><span>{createError}</span>
                    </div>
                  )}
                  <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] rounded-[12px] px-3 py-2 mb-3 d-flex align-items-start gap-2">
                    <i className="bi bi-phone-fill mt-[1px] shrink-0"></i>
                    <span className="text-[0.82rem] fw-semibold leading-[1.5]">This reservation will appear <strong>immediately</strong> in the selected prosumer&apos;s mobile app under &quot;My Reservations&quot;.</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className={labelClass}>Prosumer *</label>
                      <select value={createForm.prosumerNic} onChange={(e) => setCreateForm({ ...createForm, prosumerNic: e.target.value })} required className="form-select rounded-[10px] text-[0.88rem] bg-white">
                        <option value="">— Select active prosumer —</option>
                        {prosumersList.map((p) => (
                          <option key={p.nic} value={p.nic}>{p.fullName} · {p.nic}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Solar Hub Station *</label>
                      <select
                        value={createForm.stationId}
                        onChange={(e) => {
                          const stId = e.target.value;
                          const sel = stationsList.find(s => s.id === stId);
                          let firstFree = null;
                          if (sel) {
                            const total = sel.totalBatterySlots || 10;
                            const occ = sel.occupiedSlotNumbers || [];
                            const busy = sel.busySlotNumbers || [];
                            for (let i = 1; i <= total; i++) {
                              if (!occ.includes(i) && !busy.includes(i)) { firstFree = i; break; }
                            }
                          }
                          setCreateForm({ ...createForm, stationId: stId, slotNumber: firstFree });
                        }}
                        required
                        className="form-select rounded-[10px] text-[0.88rem] bg-white"
                      >
                        <option value="">— Select active hub station —</option>
                        {stationsList.map((s) => (
                          <option key={s.id} value={s.id} disabled={s.availableBatterySlots <= 0}>
                            {s.stationCode} · {s.name} — {s.availableBatterySlots <= 0 ? '⛔ FULL (0 slots)' : `✅ ${s.availableBatterySlots}/${s.totalBatterySlots} slots free`}
                          </option>
                        ))}
                      </select>
                      {selectedCreateStation && (() => {
                        const sel = selectedCreateStation;
                        const total = sel.totalBatterySlots || 10;
                        const occupied = sel.occupiedSlotNumbers || [];
                        const busy = sel.busySlotNumbers || [];
                        const isFull = sel.availableBatterySlots <= 0 || (occupied.length + busy.length) >= total;
                        return (
                          <div className="mt-3 bg-white border rounded-[16px] p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-[0.78rem] fw-bold text-uppercase tracking-wide">Select Physical Battery Bay Slot *</span>
                              <span className={'text-[0.78rem] fw-bold ' + (isFull ? 'text-danger' : 'text-[#063127]')}>{isFull ? '⛔ No Free Slots' : `${sel.availableBatterySlots} / ${total} Free`}</span>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              {Array.from({ length: total }, (_, idx) => {
                                const slotNum = idx + 1;
                                const isOccupied = occupied.includes(slotNum);
                                const isBusy = busy.includes(slotNum);
                                const isSelected = createForm.slotNumber === slotNum;
                                if (isBusy) {
                                  return (
                                    <div key={slotNum} title={`Slot #${slotNum} is marked Busy by the operator and cannot be booked`} className="rounded-[10px] bg-amber-50 border border-amber-300 text-amber-900 text-[0.75rem] fw-bold text-center px-2 py-1 opacity-70 d-flex flex-column align-items-center gap-[2px] min-w-[68px]">
                                      <span>#{slotNum}</span>
                                      <span className="text-[0.64rem]">⚠️ Busy (Op)</span>
                                    </div>
                                  );
                                }
                                if (isOccupied) {
                                  return (
                                    <div key={slotNum} title={`Slot #${slotNum} is currently reserved by an active booking`} className="rounded-[10px] bg-danger-subtle border border-danger-subtle text-danger text-[0.75rem] fw-bold text-center px-2 py-1 opacity-50 d-flex flex-column align-items-center gap-[2px] min-w-[68px]">
                                      <span>#{slotNum}</span>
                                      <span className="text-[0.64rem]">🔒 Booked</span>
                                    </div>
                                  );
                                }
                                return (
                                  <button key={slotNum} type="button" onClick={() => setCreateForm({ ...createForm, slotNumber: slotNum })} className={'btn btn-sm rounded-[10px] text-[0.75rem] fw-bold text-center px-2 py-1 d-flex flex-column align-items-center gap-[2px] min-w-[68px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ' + (isSelected ? 'bg-[#063127] text-white border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127]' : 'bg-white text-[#063127] border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127]')}>
                                    <span>#{slotNum}</span>
                                    <span className="text-[0.64rem]">{isSelected ? 'Selected' : 'Available'}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[0.75rem] text-[#686053]">
                              {createForm.slotNumber ? (
                                <span className="text-[#063127] fw-bold"><i className="bi bi-check-circle-fill me-1"></i>Battery Slot #{createForm.slotNumber} chosen for this reservation.</span>
                              ) : (<span className="text-danger fw-semibold">Please click an available green slot above to assign a battery bay.</span>)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Reservation Type *</label>
                      <div className="d-flex gap-2">
                        {typeOptions.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setCreateForm({ ...createForm, reservationType: opt.value })} className={'btn flex-fill rounded-[12px] px-3 py-2 fw-bold text-[0.82rem] d-flex align-items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg ' + (createForm.reservationType === opt.value ? 'bg-[#063127] text-white border-2 border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127]' : 'bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127]')}>
                            <i className={'bi ' + opt.icon + ' text-[1rem]'}></i><span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Scheduled Date & Time * <span className="fw-normal text-capitalize text-[#686053]">(max 7 days ahead)</span></label>
                      <input type="datetime-local" value={createForm.scheduledDateTime} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} onChange={(e) => setCreateForm({ ...createForm, scheduledDateTime: e.target.value })} required className={inputClass} />
                    </div>
                    <div className="col-md-5">
                      <label className={labelClass}>Duration (hours) *</label>
                      <input type="number" min="1" max="12" value={createForm.durationHours} onChange={(e) => setCreateForm({ ...createForm, durationHours: Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)) })} required className={inputClass} />
                    </div>
                    <div className="col-md-7">
                      <label className={labelClass}>Energy Amount (kWh) *</label>
                      <input type="number" min="0.1" max="1000" step="0.1" value={createForm.energyAmountKWh} onChange={(e) => setCreateForm({ ...createForm, energyAmountKWh: e.target.value })} placeholder="e.g. 25.5" required className={inputClass} />
                    </div>
                    {parseFloat(createForm.energyAmountKWh) > 0 && (
                      <div className="col-12">
                        <div className="bg-[#063127]/10 border border-[#063127]/20 rounded-[12px] px-3 py-2 d-flex align-items-center justify-content-between">
                          <div className="text-[0.82rem] text-[#063127] fw-semibold"><i className="bi bi-calculator me-2"></i>Estimated transaction value</div>
                          <div className="text-[1.25rem] fw-black text-[#063127]">Rs. {(parseFloat(createForm.energyAmountKWh) * UNIT_RATE).toFixed(2)}</div>
                        </div>
                        <div className="text-[0.72rem] text-[#686053] mt-1 ps-1">Rate: Rs. {UNIT_RATE}/kWh · Final cost computed by server</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer bg-white border-top d-flex justify-content-end gap-2 px-4 py-3 rounded-b-[28px]">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold text-[0.88rem]">Cancel</button>
                  <button type="submit" disabled={createLoading} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-bold text-[0.88rem] shadow-sm d-inline-flex align-items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50">
                    {createLoading ? (<><div className="spinner-border spinner-border-sm" role="status"></div><span>Creating…</span></>) : (<><i className="bi bi-check-circle-fill"></i><span>Create Reservation</span></>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RESERVATION MODAL */}
      {editingReservation && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/65 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog" onClick={() => setEditingReservation(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[28px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header text-white border-0 px-4 py-3 d-flex justify-content-between align-items-center bg-[#063127]">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-[12px] w-[40px] h-[40px] d-flex align-items-center justify-content-center bg-[#F8F8F8] shadow-sm">
                    <i className="bi bi-pencil-square text-[#063127] text-[1.1rem]"></i>
                  </div>
                  <div>
                    <h3 className="m-0 text-[1.1rem] fw-extrabold text-white tracking-tight">Edit Reservation: {editingReservation.reservationCode}</h3>
                    <div className="text-[0.75rem] text-white-50 mt-[1px]">Prosumer: {editingReservation.prosumerName} ({editingReservation.prosumerNic})</div>
                  </div>
                </div>
                <button onClick={() => setEditingReservation(null)} className="btn btn-sm btn-outline-light rounded-circle p-0 w-[32px] h-[32px] d-flex align-items-center justify-content-center text-[1.1rem]" aria-label="Close">&times;</button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger rounded-[12px] px-3 py-2 mb-3 d-flex align-items-center gap-2 text-[0.85rem] fw-semibold">
                      <i className="bi bi-exclamation-triangle-fill"></i><span>{editError}</span>
                    </div>
                  )}
                  <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] rounded-[12px] px-3 py-2 mb-3 d-flex align-items-start gap-2">
                    <i className="bi bi-arrow-repeat mt-[1px] shrink-0"></i>
                    <span className="text-[0.82rem] fw-semibold leading-[1.5]">Updates will automatically recalculate total cost, regenerate the secure verification QR code, and sync to the prosumer&apos;s mobile app.</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className={labelClass}>Target Solar Hub Station *</label>
                      <select value={editForm.stationId} onChange={(e) => setEditForm({ ...editForm, stationId: e.target.value })} required className="form-select rounded-[10px] text-[0.88rem] bg-white">
                        <option value="">— Select station hub —</option>
                        {stationsList.map((s) => (
                          <option key={s.id} value={s.id}>{s.stationCode} · {s.name} ({s.availableBatterySlots} slots available)</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Reservation Type *</label>
                      <div className="d-flex gap-2">
                        {typeOptions.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setEditForm({ ...editForm, reservationType: opt.value })} className={'btn flex-fill rounded-[12px] px-3 py-2 fw-bold text-[0.82rem] d-flex align-items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg ' + (editForm.reservationType === opt.value ? 'bg-[#063127] text-white border-2 border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127]' : 'bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127]')}>
                            <i className={'bi ' + opt.icon + ' text-[1rem]'}></i><span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Rescheduled Date & Time * <span className="fw-normal text-capitalize text-[#686053]">(within 7 days)</span></label>
                      <input type="datetime-local" value={editForm.scheduledDateTime} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} onChange={(e) => setEditForm({ ...editForm, scheduledDateTime: e.target.value })} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Duration (hours) *</label>
                      <input type="number" min="1" max="12" value={editForm.durationHours} onChange={(e) => setEditForm({ ...editForm, durationHours: Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)) })} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Energy (kWh) *</label>
                      <input type="number" min="0.1" max="1000" step="0.1" value={editForm.energyAmountKWh} onChange={(e) => setEditForm({ ...editForm, energyAmountKWh: e.target.value })} placeholder="e.g. 25.5" required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="form-select rounded-[10px] text-[0.88rem] bg-white">
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    {parseFloat(editForm.energyAmountKWh) > 0 && (
                      <div className="col-12">
                        <div className="bg-[#063127]/10 border border-[#063127]/20 rounded-[12px] px-3 py-2 d-flex align-items-center justify-content-between">
                          <div className="text-[0.82rem] text-[#063127] fw-semibold"><i className="bi bi-calculator me-2"></i>Updated transaction value</div>
                          <div className="text-[1.25rem] fw-black text-[#063127]">Rs. {(parseFloat(editForm.energyAmountKWh) * UNIT_RATE).toFixed(2)}</div>
                        </div>
                        <div className="text-[0.72rem] text-[#686053] mt-1 ps-1">Rate: Rs. {UNIT_RATE}/kWh · Automatically synchronizes with central database</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer bg-white border-top d-flex justify-content-end gap-2 px-4 py-3 rounded-b-[28px]">
                  <button type="button" onClick={() => setEditingReservation(null)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold text-[0.88rem]">Cancel</button>
                  <button type="submit" disabled={editLoading} className="btn rounded-pill px-4 fw-bold text-[0.88rem] text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm d-inline-flex align-items-center gap-2 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50">
                    {editLoading ? (<><div className="spinner-border spinner-border-sm" role="status"></div><span>Saving Changes…</span></>) : (<><i className="bi bi-check-circle-fill"></i><span>Update Reservation</span></>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;
