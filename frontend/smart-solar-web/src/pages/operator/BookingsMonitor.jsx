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
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import OperatorPageHero from '../../components/OperatorPageHero';

const BookingsMonitor = () => {
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    loadData();
  }, [statusFilter, stationFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #dcfce7 0%, #a7f3d0 18%, #34d399 45%, #059669 75%, #022c22 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Constellation Mesh Network */}
      <ConstellationMeshSVG theme="green" />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <OperatorPageHero
          imageSrc="/images/Solar_3.jpg"
          eyebrow="SOLARX • Live Queues"
          title="Bookings Monitor"
          subtitle="Drop-off and charging queues across every solar hub."
          breadcrumb={['Bookings']}
        />
        {/* =========================================================================
            HEADER BAR
           ========================================================================= */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={loadData}
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
                color: '#064e3b',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.08)',
                transition: 'all 0.2s ease',
              }}
              title="Refresh bookings"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>
            <Link
              to="/operator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50px',
                padding: '10px 22px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#064e3b',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="bi bi-arrow-left"></i>
              <span>Back to Console</span>
            </Link>
          </div>
        </div>

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
            boxShadow: '0 12px 32px -4px rgba(4, 120, 87, 0.1)',
            padding: '20px 28px',
            marginBottom: '28px',
          }}
        >
          <form onSubmit={handleSearch} className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-lg-4 col-md-12">
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
                  placeholder="Search code, prosumer, station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 18px 11px 44px',
                    borderRadius: '50px',
                    background: '#ffffff',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-lg-3 col-md-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: '50px',
                  background: '#ffffff',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved (Ready for QR Scan)</option>
                <option value="Pending">Pending Approval</option>
                <option value="Completed">Completed (Finalized)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Station Filter */}
            <div className="col-lg-3 col-md-6">
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: '50px',
                  background: '#ffffff',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <option value="">All Solar Stations</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.stationCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="col-lg-2 col-md-12 d-flex gap-2">
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '11px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-funnel-fill"></i>
                <span>Search</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setStationFilter('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#475569',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: '50px',
                  padding: '11px 18px',
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
            BOOKINGS LIST (PURE LIGHT TABLE)
           ========================================================================= */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 16px 40px -8px rgba(4, 120, 87, 0.12)',
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
              Active &amp; Historical Energy Bookings
            </h2>
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
              {bookings.length} Bookings Found
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
                <tr style={{ background: '#dcfce7', borderTop: '1px solid rgba(167, 243, 208, 0.8)', borderBottom: '1px solid rgba(167, 243, 208, 0.8)' }}>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    BOOKING CODE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    PROSUMER DETAILS
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    STATION NODE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    SCHEDULED SLOT
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    TRADE TYPE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    ENERGY (KWH)
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    TOTAL AMOUNT
                  </th>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7' }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-success" role="status"></div>
                      Loading booking telemetry...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      No energy bookings found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, idx) => {
                    const rowBg = idx % 2 === 0 ? '#edf9f3' : '#f9fcfb';
                    return (
                      <tr
                        key={b.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: idx === bookings.length - 1 ? 'none' : '1px solid rgba(167, 243, 208, 0.6)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#def3e7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* Booking Code */}
                        <td style={{ padding: '18px 28px', background: 'transparent' }}>
                          <span
                            style={{
                              background: '#0f172a',
                              color: '#34d399',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              padding: '5px 14px',
                              borderRadius: '50px',
                              display: 'inline-block',
                              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                            }}
                          >
                            {b.reservationCode}
                          </span>
                        </td>

                        {/* Prosumer Details */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {b.prosumerName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#e11d48', fontWeight: 600, marginTop: '2px' }}>
                            NIC: {b.prosumerNic}
                          </div>
                        </td>

                        {/* Station Node */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#0f172a', fontWeight: 600, fontSize: '0.88rem' }}>
                            <i className="bi bi-broadcast" style={{ color: '#059669' }}></i>
                            <span>{b.stationName}</span>
                          </div>
                        </td>

                        {/* Scheduled Slot */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.88rem' }}>
                            {new Date(b.scheduledDateTime).toLocaleDateString()}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                            {new Date(b.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Trade Type */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          {b.reservationType === 'DropOff' ? (
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

                        {/* Energy */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                            {b.energyAmountKWh} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>kWh</span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: '18px 20px', background: 'transparent' }}>
                          <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.96rem' }}>
                            Rs. {b.totalCost ? b.totalCost.toFixed(2) : '0.00'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '18px 28px', background: 'transparent' }}>
                          <span
                            style={{
                              background:
                                b.status === 'Approved' ? '#10b981' :
                                b.status === 'Pending' ? '#f59e0b' :
                                b.status === 'Completed' ? '#0284c7' : '#ef4444',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '5px 16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              display: 'inline-block',
                              boxShadow:
                                b.status === 'Approved' ? '0 2px 8px rgba(16, 185, 129, 0.3)' :
                                b.status === 'Pending' ? '0 2px 8px rgba(245, 158, 11, 0.3)' :
                                b.status === 'Completed' ? '0 2px 8px rgba(2, 132, 199, 0.3)' :
                                '0 2px 8px rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            {b.status}
                          </span>
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
            to="/operator"
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
            <span>Back to Operational Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingsMonitor;
