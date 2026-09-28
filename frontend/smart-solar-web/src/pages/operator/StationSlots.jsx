// ============================================================================
// File: StationSlots.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator battery slot live monitoring and availability view per station.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import OperatorPageHero from '../../components/OperatorPageHero';

const StationSlots = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStationId = searchParams.get('stationId');
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingSlots, setEditingSlots] = useState({});

  const fetchStations = async () => {
    // [IT22106292] - Loads all stations and initialises editable battery slot count map
    setLoading(true);
    try {
      const res = await api.get('/stations');
      setStations(res.data);
      // Initialize editing slots map
      const initialMap = {};
      res.data.forEach(s => {
        initialMap[s.id] = s.availableBatterySlots;
      });
      setEditingSlots(initialMap);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to load station slot information.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();

    // Auto-refresh slot telemetry every 5 seconds so bookings/releases appear automatically
    const interval = setInterval(() => {
      api.get('/stations')
        .then(res => {
          setStations(res.data);
          setEditingSlots(prev => {
            const next = { ...prev };
            res.data.forEach(st => {
              next[st.id] = st.availableBatterySlots;
            });
            return next;
          });
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSlotChange = (stationId, delta) => {
    // [IT22106292] - Increments or decrements available battery slots within valid bounds
    setEditingSlots(prev => {
      const station = stations.find(s => s.id === stationId);
      const current = prev[stationId] ?? 0;
      const next = current + delta;
      if (next < 0 || (station && next > station.totalBatterySlots)) return prev;
      return { ...prev, [stationId]: next };
    });
  };

  const handleSaveSlot = async (station) => {
    // [IT22106292] - Persists updated battery slot count for a station to the API
    const newSlots = editingSlots[station.id];
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put(`/stations/${station.id}/battery-slots`, {
        availableBatterySlots: parseInt(newSlots, 10),
      });
      setMessage({ type: 'success', text: res.data.message || `Updated battery slots for ${station.name}.` });
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update battery slots.' });
    }
  };

  const displayedStations = stations.filter((s) => {
    // If targeted stationId filter is active, only show that station
    if (filterStationId && s.id !== filterStationId) {
      return false;
    }
    // If search query is entered, match stationCode, name, or location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.stationCode && s.stationCode.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

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
          imageSrc="/images/Solar_2.jpg"
          eyebrow="SOLARX • Battery Slots"
          title="Station Slot Management"
          subtitle="Real-time available battery slots with 5-second live telemetry."
          breadcrumb={['Slots']}
        />
        {/* =========================================================================
            HEADER BAR
           ========================================================================= */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={fetchStations}
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
              title="Refresh telemetry"
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

        {/* Search Bar */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            padding: '14px 22px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 18px rgba(4, 120, 87, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#059669',
                fontSize: '0.9rem',
              }}
            ></i>
            <input
              type="text"
              placeholder="Search hub by code, station name, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 38px 10px 42px',
                borderRadius: '50px',
                background: '#ffffff',
                border: '1px solid rgba(5, 150, 105, 0.35)',
                fontSize: '0.86rem',
                color: '#0f172a',
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 22px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <i className="bi bi-search"></i>
            <span>Search Hub</span>
          </button>

          {(filterStationId || searchQuery) && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '50px',
                padding: '10px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
              <span>Show All Hubs</span>
            </button>
          )}

          <span style={{ fontSize: '0.82rem', color: '#064e3b', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {displayedStations.length === stations.length
              ? `${stations.length} Hubs`
              : `${displayedStations.length} of ${stations.length} Hubs`}
          </span>
        </div>

        {/* Filtered Station Banner */}
        {filterStationId && displayedStations.length > 0 && (
          <div
            style={{
              background: 'rgba(240, 253, 244, 0.92)',
              border: '1px solid #86efac',
              borderRadius: '16px',
              padding: '12px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              >
                <i className="bi bi-battery-charging"></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#064e3b' }}>
                  Showing Battery Slot Card for: <strong>{displayedStations[0]?.name}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 500 }}>
                  <span style={{ fontFamily: 'monospace' }}>{displayedStations[0]?.stationCode}</span>
                  {' · '}
                  <i className="bi bi-geo-alt-fill text-danger"></i> {displayedStations[0]?.location}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '8px 18px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
              <span>Show All Hubs</span>
            </button>
          </div>
        )}

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
            STATIONS GRID
           ========================================================================= */}
        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-success me-2" role="status"></div>
              <span style={{ color: '#064e3b', fontWeight: 600 }}>Loading battery storage telemetry...</span>
            </div>
          ) : displayedStations.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="bi bi-search" style={{ fontSize: '2.5rem', color: '#94a3b8', display: 'block', marginBottom: '12px' }}></i>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '6px' }}>
                {searchQuery ? `No hubs found matching "${searchQuery}"` : 'No microgrid stations available.'}
              </div>
              {(filterStationId || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                  className="btn btn-sm btn-outline-success rounded-pill px-4 mt-2"
                >
                  Show All Hubs
                </button>
              )}
            </div>
          ) : (
            displayedStations.map((s) => {
              const currentSlots = editingSlots[s.id] ?? s.availableBatterySlots;
              const slotPercent = s.totalBatterySlots > 0 ? (currentSlots / s.totalBatterySlots) * 100 : 0;
              return (
                <div key={s.id} className={filterStationId ? 'col-md-8 col-lg-6 mx-auto' : 'col-md-6 col-lg-6'}>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.95)',
                      padding: '28px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 12px 32px -4px rgba(4, 120, 87, 0.12)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 18px 38px -6px rgba(4, 120, 87, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(4, 120, 87, 0.12)';
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span
                          style={{
                            background: '#0f172a',
                            color: '#34d399',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            padding: '4px 12px',
                            borderRadius: '50px',
                            display: 'inline-block',
                          }}
                        >
                          {s.stationCode}
                        </span>
                        <span
                          style={{
                            background: s.status === 'Active' ? '#10b981' : '#64748b',
                            color: '#ffffff',
                            borderRadius: '50px',
                            padding: '4px 14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            boxShadow: s.status === 'Active' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                          }}
                        >
                          {s.status}
                        </span>
                      </div>

                      {/* Station Name & Location */}
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: '6px',
                          letterSpacing: '-0.015em',
                        }}
                      >
                        {s.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#475569',
                          fontSize: '0.86rem',
                          marginBottom: '20px',
                        }}
                      >
                        <i className="bi bi-geo-alt" style={{ color: '#059669' }}></i>
                        <span>{s.location}</span>
                      </div>

                      {/* Occupancy Card */}
                      <div
                        style={{
                          background: 'rgba(240, 253, 244, 0.8)',
                          border: '1px solid rgba(167, 243, 208, 0.7)',
                          borderRadius: '18px',
                          padding: '16px 20px',
                          marginBottom: '22px',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Battery Slots Occupancy
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#059669' }}>
                            {currentSlots} Available <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>/ {s.totalBatterySlots} Total</span>
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '10px',
                            background: '#e2e8f0',
                            borderRadius: '50px',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          <div
                            style={{
                              width: `${slotPercent}%`,
                              height: '100%',
                              background: slotPercent < 25 ? '#ef4444' : slotPercent < 50 ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #059669)',
                              borderRadius: '50px',
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                        <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          <span>Capacity: {s.capacityKWh} kW/h</span>
                          <span>Schedule: {s.operationalSchedule || '24/7 Grid'}</span>
                        </div>

                        {/* Live Physical Battery Slot Bay Status Matrix */}
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed rgba(167, 243, 208, 0.8)' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><i className="bi bi-grid-3x3-gap-fill me-1"></i>Live Slot Bay Telemetry</span>
                            <span style={{ color: '#059669', fontSize: '0.68rem', fontWeight: 700, background: '#d1fae5', padding: '1px 8px', borderRadius: '50px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginRight: '4px' }}></span>
                              Live Sync
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.from({ length: s.totalBatterySlots || 10 }, (_, idx) => {
                              const slotNum = idx + 1;
                              const isOccupied = (s.occupiedSlotNumbers || []).includes(slotNum);
                              return (
                                <span
                                  key={slotNum}
                                  title={isOccupied ? `Battery Bay #${slotNum}: Reserved / Occupied` : `Battery Bay #${slotNum}: Free / Available`}
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: isOccupied ? '#fee2e2' : '#ffffff',
                                    color: isOccupied ? '#b91c1c' : '#047857',
                                    border: `1px solid ${isOccupied ? '#fca5a5' : '#86efac'}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOccupied ? '#ef4444' : '#10b981', display: 'inline-block' }}></span>
                                  #{slotNum} {isOccupied ? 'Busy' : 'Free'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(167, 243, 208, 0.6)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Stepper */}
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSlotChange(s.id, -1)}
                          disabled={currentSlots <= 0}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid #fca5a5',
                            background: '#ffffff',
                            color: '#dc2626',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            cursor: currentSlots <= 0 ? 'not-allowed' : 'pointer',
                            opacity: currentSlots <= 0 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          style={{
                            width: '64px',
                            padding: '6px 8px',
                            borderRadius: '50px',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: '#0f172a',
                            outline: 'none',
                            background: '#ffffff',
                          }}
                          value={currentSlots}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0 && val <= s.totalBatterySlots) {
                              setEditingSlots({ ...editingSlots, [s.id]: val });
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSlotChange(s.id, 1)}
                          disabled={currentSlots >= s.totalBatterySlots}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid #86efac',
                            background: '#ffffff',
                            color: '#16a34a',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            cursor: currentSlots >= s.totalBatterySlots ? 'not-allowed' : 'pointer',
                            opacity: currentSlots >= s.totalBatterySlots ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveSlot(s)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '10px 22px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <i className="bi bi-cloud-arrow-up"></i>
                        <span>Update Slots</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Navigation Link */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
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

export default StationSlots;
