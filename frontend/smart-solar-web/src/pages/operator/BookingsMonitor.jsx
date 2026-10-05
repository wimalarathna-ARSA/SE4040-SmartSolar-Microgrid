// ============================================================================
// File: BookingsMonitor.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator live booking monitor: current and pending reservations across all stations.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import OperatorPageHero from '../../components/OperatorPageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

const statusBadgeClass = (status) => {
  if (status === 'Approved') return 'badge bg-[#063127] text-white border border-[#063127] rounded-pill px-2.5 py-1 shadow-sm';
  if (status === 'Pending') return 'badge bg-[#BFD5D0] text-[#063127] border border-[#8FB3A9] rounded-pill px-2.5 py-1 shadow-sm';
  if (status === 'Completed') return 'badge bg-[#3B796A] text-white rounded-pill px-2.5 py-1 shadow-sm';
  if (status === 'Missed') return 'badge bg-amber-100 text-amber-900 border border-amber-400 rounded-pill px-2.5 py-1 shadow-sm';
  return 'badge bg-[#686053] text-white rounded-pill px-2.5 py-1 shadow-sm';
};

const BookingsMonitor = () => {
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (stationFilter) params.stationId = stationFilter;
      if (searchTerm) params.search = searchTerm;

      const [resBookings, resStations] = await Promise.all([
        api.get('/reservations', { params }),
        api.get('/stations'),
      ]);

      setBookings(resBookings.data);
      setStations(resStations.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (b) => {
    const slotText = b.slotNumber ? ` and release Battery Slot #${b.slotNumber}` : '';
    if (!window.confirm(`Are you sure you want to cancel booking ${b.reservationCode} for ${b.prosumerName}${slotText}?`)) {
      return;
    }
    setMessage({ type: '', text: '' });
    try {
      const res = await api.delete(`/reservations/${b.id}`);
      setMessage({ type: 'success', text: res.data.message || `Booking ${b.reservationCode} cancelled and slot released.` });
      await loadData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to cancel booking.' });
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, stationFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <OperatorPageHero
          imageSrc="/images/Solar_3.jpg"
          eyebrow="SOLARX • Live Queues"
          title="Bookings Monitor"
          subtitle="Drop-off and charging queues across every solar hub."
          breadcrumb={['Bookings']}
        />

        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <button onClick={loadData} className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" title="Refresh bookings">
            <i className="bi bi-arrow-clockwise"></i>Refresh
          </button>
          <Link to="/operator" className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg text-decoration-none">
            <i className="bi bi-arrow-left"></i>Back to Console
          </Link>
        </div>

        <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl mb-4 overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-body p-4">
            <form onSubmit={handleSearch} className="row g-3 align-items-end">
              <div className="col-md-4">
                <label htmlFor="bm-search" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Search</label>
                <div className="input-group">
                  <span className="input-group-text bg-[#063127] text-[#BFD5D0] border-[#063127]"><i className="bi bi-search"></i></span>
                  <input
                    id="bm-search"
                    type="text"
                    className="form-control rounded-[10px] text-[0.9rem] bg-white"
                    placeholder="Search code, prosumer, station..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label htmlFor="bm-status" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Status</label>
                <select id="bm-status" className="form-select rounded-[10px] text-[0.9rem] bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved (Ready for QR Scan)</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Completed">Completed (Finalized)</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Missed">Missed (No-Show)</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="bm-station" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Station</label>
                <select id="bm-station" className="form-select rounded-[10px] text-[0.9rem] bg-white" value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}>
                  <option value="">All Solar Stations</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.stationCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold flex-fill">
                  <i className="bi bi-funnel-fill me-1"></i>Search
                </button>
                <button
                  type="button"
                  className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-semibold"
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); setStationFilter(''); }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {message.text && (
          <div className={`alert border d-flex align-items-center gap-2 mb-4 ${message.type === 'danger' ? 'alert-danger' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]'} alert-dismissible rounded-[16px]`} role="alert">
            <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'} fs-5`}></i>
            <span className="fw-semibold small flex-grow-1">{message.text}</span>
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })} aria-label="Close"></button>
          </div>
        )}

        <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm backdrop-blur-xl overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3">
            <h2 className="h5 fw-bold text-[#063127] mb-0">Active &amp; Historical Energy Bookings</h2>
            <span className="badge bg-[#063127] text-white rounded-pill fs-6 fw-bold">{bookings.length} Bookings Found</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="[&_th]:bg-[#063127] [&_th]:text-[#F8F8F8] [&_th]:text-uppercase [&_th]:text-[0.72rem] [&_th]:fw-bold [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th>BOOKING CODE</th>
                  <th>BAY SLOT</th>
                  <th>PROSUMER DETAILS</th>
                  <th>STATION NODE</th>
                  <th>SCHEDULED TIME</th>
                  <th>TRADE TYPE</th>
                  <th>ENERGY</th>
                  <th>STATUS</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-[0.85rem]">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-[#686053]">
                      <div className="spinner-border spinner-border-sm me-2 text-[#063127]" role="status"></div>
                      Loading booking telemetry...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-[#686053]">
                      No energy bookings found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, idx) => (
                    <tr key={b.id || idx}>
                      <td><span className="badge bg-[#063127] text-[#F8F8F8] font-monospace">{b.reservationCode}</span></td>
                      <td>
                        <span className="badge bg-[#063127]/10 text-[#063127] border border-[#063127]/20 rounded-pill px-2.5 py-1 fw-bold">
                          {b.slotNumber ? `Slot #${b.slotNumber}` : 'Auto'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-[#063127]">{b.prosumerName}</div>
                        <div className="small text-danger fw-semibold">NIC: {b.prosumerNic}</div>
                      </td>
                      <td>
                        <span className="fw-semibold"><i className="bi bi-broadcast text-[#063127] me-1"></i>{b.stationName}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{new Date(b.scheduledDateTime).toLocaleDateString()}</div>
                        <div className="small text-[#686053]">{new Date(b.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>
                        {b.reservationType === 'DropOff' ? (
                          <span className="badge bg-[#063127] text-white rounded-pill">
                            <i className="bi bi-arrow-down-left me-1"></i>Drop-Off (Sell)
                          </span>
                        ) : (
                          <span className="badge bg-[#65998B] text-white rounded-pill">
                            <i className="bi bi-lightning-charge me-1"></i>Charging (Buy)
                          </span>
                        )}
                      </td>
                      <td><span className="fw-bold">{b.energyAmountKWh} <small className="text-[#686053] fw-normal">kWh</small></span></td>
                      <td>
                        <span className={statusBadgeClass(b.status)}>
                          {b.status === 'Pending' && <i className="bi bi-hourglass-split me-1 text-[#3B796A]"></i>}
                          {b.status === 'Approved' && <i className="bi bi-qr-code me-1 text-white"></i>}
                          {b.status === 'Completed' && <i className="bi bi-patch-check-fill me-1 text-emerald-300"></i>}
                          {b.status === 'Cancelled' && <i className="bi bi-x-circle me-1 text-white"></i>}
                          {b.status === 'Missed' && <i className="bi bi-clock-history me-1 text-amber-700"></i>}
                          {b.status === 'Pending' ? 'Pending Approval' : b.status === 'Approved' ? 'Approved (Active)' : b.status === 'Missed' ? 'Missed (No-Show)' : b.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {(b.status === 'Pending' || b.status === 'Approved') ? (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b)}
                            title="Cancel booking and release battery slot back to available"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold text-[0.78rem]"
                          >
                            <i className="bi bi-x-circle me-1"></i>Cancel &amp; Release
                          </button>
                        ) : (
                          <span className="text-[#686053] small">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/operator" className="d-inline-flex align-items-center gap-2 text-[#063127] text-decoration-none fw-bold text-[0.9rem] bg-white px-4 py-2 rounded-pill border shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-left"></i>Back to Operational Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingsMonitor;
