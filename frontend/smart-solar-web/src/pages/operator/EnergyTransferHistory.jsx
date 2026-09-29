// ============================================================================
// File: EnergyTransferHistory.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator completed energy transfer history with search and filter.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import OperatorPageHero from '../../components/OperatorPageHero';

const EnergyTransferHistory = () => {
  const [transfers, setTransfers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // newest first

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'Completed' };
      if (stationFilter) params.stationId = stationFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [resTransfers, resStations] = await Promise.all([
        api.get('/reservations', { params }),
        api.get('/stations'),
      ]);

      setTransfers(resTransfers.data);
      setStations(resStations.data);
    } catch (err) {
      console.error('Failed to load energy transfer history', err);
    } finally {
      setLoading(false);
    }
  }, [stationFilter]);

  useEffect(() => {
    loadData();
  }, [stationFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  // Client-side filtering for type and date range
  const filtered = transfers.filter((t) => {
    if (typeFilter && t.reservationType !== typeFilter) return false;
    if (dateFrom) {
      const completed = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
      if (completed < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const completed = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (completed > toDate) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.completedAt || a.updatedAt);
    const db = new Date(b.completedAt || b.updatedAt);
    return sortOrder === 'desc' ? db - da : da - db;
  });

  // Summary stats from filtered set
  const totalKWh = filtered.reduce((s, t) => s + (t.energyAmountKWh || 0), 0);
  const totalAmount = filtered.reduce((s, t) => s + (t.totalCost || 0), 0);
  const dropOffs = filtered.filter((t) => t.reservationType === 'DropOff').length;
  const chargings = filtered.filter((t) => t.reservationType === 'Charging').length;

  const statusBadge = (status) => {
    const map = {
      Completed: { bg: '#0284c7', shadow: 'rgba(2,132,199,0.3)' },
    };
    const s = map[status] || { bg: '#64748b', shadow: 'rgba(0,0,0,0.1)' };
    return (
      <span style={{
        background: s.bg, color: '#fff', borderRadius: '50px', padding: '4px 14px',
        fontSize: '0.73rem', fontWeight: 700, display: 'inline-block',
        boxShadow: `0 2px 8px ${s.shadow}`,
      }}>
        {status}
      </span>
    );
  };

  const typeBadge = (type) => {
    if (type === 'DropOff') return (
      <span style={{
        background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc',
        borderRadius: '50px', padding: '4px 12px', fontSize: '0.73rem', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: '5px',
      }}>
        <i className="bi bi-arrow-down-left"></i> Drop-Off (Sell)
      </span>
    );
    return (
      <span style={{
        background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe',
        borderRadius: '50px', padding: '4px 12px', fontSize: '0.73rem', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: '5px',
      }}>
        <i className="bi bi-lightning-charge"></i> Charging (Buy)
      </span>
    );
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' }),
      time: d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #08391b 0%, #1f7556 18%, #34d399 45%, #059669 75%, #022c22 100%)',
      color: '#0f172a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '36px 40px 60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ConstellationMeshSVG theme="green" />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        <OperatorPageHero
          imageSrc="/images/house_5.png"
          eyebrow="SOLARX • Audit Trail"
          title="Energy Transfer History"
          subtitle="Completed trades with full verification and audit logs."
          breadcrumb={['History']}
        />
        {/* ── TOOLBAR: actions only ── */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={loadData}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50px',
                padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700,
                color: '#064e3b', cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.08)',
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>
            <Link to="/operator" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50px',
              padding: '10px 22px', fontSize: '0.85rem', fontWeight: 700,
              color: '#064e3b', textDecoration: 'none', boxShadow: '0 4px 14px rgba(4,120,87,0.08)',
            }}>
              <i className="bi bi-arrow-left"></i>
              <span>Back to Console</span>
            </Link>
          </div>
        </div>

        {/* ── SUMMARY STAT CARDS ──────────────────────────────────────────── */}
        <div className="row g-3 mb-4">
          {[
            { icon: 'bi-check2-circle', label: 'Total Transfers', value: filtered.length, color: '#059669', shadow: 'rgba(5,150,105,0.25)', bg: 'rgba(240,253,244,0.95)' },
            { icon: 'bi-lightning-fill', label: 'Total Energy (kWh)', value: totalKWh.toFixed(2), color: '#0284c7', shadow: 'rgba(2,132,199,0.2)', bg: 'rgba(240,249,255,0.95)' },
            { icon: 'bi-currency-dollar', label: 'Total Value (Rs.)', value: `Rs. ${totalAmount.toFixed(2)}`, color: '#d97706', shadow: 'rgba(217,119,6,0.2)', bg: 'rgba(255,251,235,0.95)' },
            { icon: 'bi-arrow-down-left', label: 'Drop-Off (Sell)', value: dropOffs, color: '#0891b2', shadow: 'rgba(8,145,178,0.2)', bg: 'rgba(236,254,255,0.95)' },
            { icon: 'bi-lightning-charge', label: 'Charging (Buy)', value: chargings, color: '#7c3aed', shadow: 'rgba(124,58,237,0.2)', bg: 'rgba(245,243,255,0.95)' },
          ].map((s) => (
            <div key={s.label} className="col-lg col-md-4 col-6">
              <div style={{
                background: s.bg, borderRadius: '18px', padding: '20px 22px',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: `0 8px 24px -4px ${s.shadow}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.2rem' }}></i>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
          borderRadius: '18px', padding: '16px 22px', marginBottom: '22px',
          boxShadow: '0 4px 18px rgba(4,120,87,0.08)', border: '1px solid rgba(255,255,255,0.9)',
        }}>
          <form onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              {/* Search */}
              <div className="col-lg-4 col-md-12">
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                  Search
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#059669', fontSize: '0.88rem' }}></i>
                  <input
                    type="text"
                    placeholder="Code, prosumer name, NIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px 10px 38px', borderRadius: '50px',
                      background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                      fontSize: '0.86rem', color: '#0f172a', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Station */}
              <div className="col-lg-3 col-md-6">
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                  Hub / Station
                </label>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 18px', borderRadius: '50px',
                    background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                    fontSize: '0.86rem', color: '#0f172a', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">All Stations</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.stationCode})</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="col-lg-2 col-md-6">
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                  Transfer Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 18px', borderRadius: '50px',
                    background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                    fontSize: '0.86rem', color: '#0f172a', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">All Types</option>
                  <option value="DropOff">Drop-Off (Sell)</option>
                  <option value="Charging">Charging (Buy)</option>
                </select>
              </div>

              {/* Sort */}
              <div className="col-lg-1 col-md-4">
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                  Sort
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 10px', borderRadius: '50px',
                    background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                    fontSize: '0.86rem', color: '#0f172a', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="desc">Newest</option>
                  <option value="asc">Oldest</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="col-lg-2 col-md-8 d-flex gap-2">
                <button
                  type="submit"
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#fff', border: 'none', borderRadius: '50px',
                    padding: '10px 16px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                  }}
                >
                  <i className="bi bi-search"></i>
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setStationFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setSortOrder('desc'); loadData(); }}
                  style={{
                    background: '#fff', border: '1px solid #cbd5e1', color: '#475569',
                    borderRadius: '50px', padding: '10px 14px', fontSize: '0.82rem',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                  title="Reset all filters"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </form>

          {/* Date Range Row */}
          <div className="row g-3 mt-1">
            <div className="col-lg-3 col-md-6">
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                Completed From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: '100%', padding: '9px 16px', borderRadius: '50px',
                  background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                  fontSize: '0.86rem', color: '#0f172a', outline: 'none',
                }}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b', display: 'block', marginBottom: '6px' }}>
                Completed To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: '100%', padding: '9px 16px', borderRadius: '50px',
                  background: '#ffffff', border: '1px solid rgba(5,150,105,0.35)',
                  fontSize: '0.86rem', color: '#0f172a', outline: 'none',
                }}
              />
            </div>
            <div className="col-lg-6 d-flex align-items-end">
              <span style={{ fontSize: '0.82rem', color: '#064e3b', fontWeight: 600 }}>
                Showing <strong>{sorted.length}</strong> of <strong>{transfers.length}</strong> completed energy transfers
              </span>
            </div>
          </div>
        </div>

        {/* ── HISTORY TABLE ────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)', borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 16px 40px -8px rgba(6,78,59,0.12)', overflow: 'hidden',
        }}>
          {/* Table Header Bar */}
          <div style={{
            padding: '22px 28px', borderBottom: '1px solid rgba(167,243,208,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          }}>
            <div>
              <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#064e3b', margin: 0, letterSpacing: '-0.01em' }}>
                <i className="bi bi-lightning-fill me-2" style={{ color: '#059669' }}></i>
                Completed Energy Transfer Records
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Physical energy handoffs verified by Grid Operator QR scan
              </div>
            </div>
            <span style={{
              background: '#059669', color: '#fff', borderRadius: '50px', padding: '6px 18px',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em',
              boxShadow: '0 2px 10px rgba(5,150,105,0.3)',
            }}>
              {sorted.length} Records
            </span>
          </div>

          {/* Table */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, background: 'transparent', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#dcfce7', borderTop: '1px solid rgba(167,243,208,0.8)', borderBottom: '1px solid rgba(167,243,208,0.8)' }}>
                  {['BOOKING CODE', 'PROSUMER', 'HUB / STATION', 'SCHEDULED SLOT', 'TYPE', 'ENERGY (kWh)', 'VALUE', 'COMPLETED AT', 'OPERATOR', 'STATUS'].map((col) => (
                    <th key={col} style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#dcfce7', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-success" role="status"></div>
                      Loading energy transfer history...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '56px 24px', background: '#f8fafc' }}>
                      <i className="bi bi-lightning" style={{ fontSize: '2.5rem', color: '#94a3b8', display: 'block', marginBottom: '12px' }}></i>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '6px' }}>No completed energy transfers found</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {transfers.length === 0
                          ? 'No reservations have been completed yet via QR verification.'
                          : 'No results match the current filters. Try adjusting your search.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((t, idx) => {
                    const rowBg = idx % 2 === 0 ? '#edf9f3' : '#f9fcfb';
                    const completedDT = formatDateTime(t.completedAt || t.updatedAt);
                    const scheduledDT = formatDateTime(t.scheduledDateTime);
                    return (
                      <tr
                        key={t.id || idx}
                        style={{ background: rowBg, borderBottom: idx === sorted.length - 1 ? 'none' : '1px solid rgba(167,243,208,0.6)', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#def3e7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* Booking Code */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <span style={{
                            color: '#047857', fontFamily: 'monospace', fontWeight: 700,
                            fontSize: '0.84rem', letterSpacing: '0.02em',
                          }}>
                            {t.reservationCode}
                          </span>
                        </td>

                        {/* Prosumer */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{t.prosumerName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#e11d48', fontWeight: 600, marginTop: '2px' }}>NIC: {t.prosumerNic}</div>
                        </td>

                        {/* Station */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#064e3b', fontWeight: 600, fontSize: '0.86rem' }}>
                            <i className="bi bi-broadcast" style={{ color: '#059669' }}></i>
                            <span>{t.stationName}</span>
                          </div>
                        </td>

                        {/* Scheduled Slot */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.86rem' }}>{scheduledDT.date}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{scheduledDT.time} · {t.durationHours}h</div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          {typeBadge(t.reservationType)}
                        </td>

                        {/* Energy */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#059669' }}>
                            {t.energyAmountKWh}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '4px', fontWeight: 500 }}>kWh</span>
                        </td>

                        {/* Value */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#d97706' }}>
                            {t.totalCost ? `Rs. ${Number(t.totalCost).toFixed(2)}` : '—'}
                          </span>
                        </td>

                        {/* Completed At */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.86rem' }}>{completedDT.date}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{completedDT.time}</div>
                        </td>

                        {/* Operator */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          {t.operatorNic ? (
                            <div>
                              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#047857' }}>{t.operatorNic}</div>
                              {t.operatorNotes && (
                                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '3px', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={t.operatorNotes}>
                                  <i className="bi bi-chat-left-text me-1"></i>{t.operatorNotes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px', background: 'transparent' }}>
                          {statusBadge(t.status)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link to="/operator" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: '#ffffff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
            padding: '10px 24px', borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
          }}>
            <i className="bi bi-arrow-left"></i>
            <span>Back to Operational Console</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default EnergyTransferHistory;
