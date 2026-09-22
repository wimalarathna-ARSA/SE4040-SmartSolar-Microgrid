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
    setLoading(true);

    try {
      const res = await api.get('/stations');
      setStations(res.data);

      const initialMap = {};

      res.data.forEach((s) => {
        initialMap[s.id] = s.availableBatterySlots;
      });

      setEditingSlots(initialMap);
    } catch (err) {
      console.error(err);

      setMessage({
        type: 'danger',
        text: 'Failed to load station slot information.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();

    const interval = setInterval(() => {
      api
        .get('/stations')
        .then((res) => {
          setStations(res.data);

          setEditingSlots((prev) => {
            const next = { ...prev };

            res.data.forEach((st) => {
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
    setEditingSlots((prev) => {
      const station = stations.find(
        (s) => s.id === stationId
      );

      const current = prev[stationId] ?? 0;
      const next = current + delta;

      if (
        next < 0 ||
        (station && next > station.totalBatterySlots)
      ) {
        return prev;
      }

      return {
        ...prev,
        [stationId]: next,
      };
    });
  };

  const handleSaveSlot = async (station) => {
    const newSlots = editingSlots[station.id];

    setMessage({
      type: '',
      text: '',
    });

    try {
      const res = await api.put(
        `/stations/${station.id}/battery-slots`,
        {
          availableBatterySlots: parseInt(newSlots, 10),
        }
      );

      setMessage({
        type: 'success',
        text:
          res.data.message ||
          `Updated battery slots for ${station.name}.`,
      });

      fetchStations();
    } catch (err) {
      setMessage({
        type: 'danger',
        text:
          err.response?.data?.message ||
          'Failed to update battery slots.',
      });
    }
  };

  const displayedStations = stations.filter((s) => {
    if (filterStationId && s.id !== filterStationId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.stationCode &&
          s.stationCode.toLowerCase().includes(q)) ||
        (s.location &&
          s.location.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(120deg, #dcfce7 0%, #a7f3d0 18%, #34d399 45%, #059669 75%, #022c22 100%)',
        color: '#0f172a',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationMeshSVG theme="green" />

      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <OperatorPageHero
          imageSrc="/images/Solar_2.jpg"
          eyebrow="SOLARX • Battery Slots"
          title="Station Slot Management"
          subtitle="Real-time available battery slots with 5-second live telemetry."
          breadcrumb={['Slots']}
        />

        <div className="d-flex justify-content-end mb-4 flex-wrap gap-3">
          <button
            onClick={fetchStations}
            className="btn btn-light rounded-pill px-4 fw-bold"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>

          <Link
            to="/operator"
            className="btn btn-light rounded-pill px-4 fw-bold"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Console
          </Link>
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
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '240px',
            }}
          >
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#059669',
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
                background: '#fff',
                border: '1px solid rgba(5, 150, 105, 0.35)',
                fontSize: '0.86rem',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            style={{
              background:
                'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 22px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <i className="bi bi-search me-2"></i>
            Search Hub
          </button>

          {(filterStationId || searchQuery) && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-light rounded-pill px-3 fw-semibold"
            >
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>
              Show All Hubs
            </button>
          )}

          <span
            style={{
              fontSize: '0.82rem',
              color: '#064e3b',
              fontWeight: 600,
            }}
          >
            {displayedStations.length === stations.length
              ? `${stations.length} Hubs`
              : `${displayedStations.length} of ${stations.length} Hubs`}
          </span>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            style={{
              background:
                message.type === 'danger'
                  ? 'rgba(254, 242, 242, 0.95)'
                  : 'rgba(240, 253, 244, 0.95)',
              border: `1px solid ${
                message.type === 'danger'
                  ? '#fca5a5'
                  : '#86efac'
              }`,
              borderRadius: '16px',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color:
                message.type === 'danger'
                  ? '#991b1b'
                  : '#166534',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i
                className={`bi ${
                  message.type === 'danger'
                    ? 'bi-exclamation-octagon-fill'
                    : 'bi-check-circle-fill'
                }`}
              ></i>

              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {message.text}
              </span>
            </div>

            <button
              onClick={() =>
                setMessage({
                  type: '',
                  text: '',
                })
              }
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Stations Grid */}
        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div
                className="spinner-border text-success me-2"
                role="status"
              ></div>

              <span
                style={{
                  color: '#064e3b',
                  fontWeight: 600,
                }}
              >
                Loading battery storage telemetry...
              </span>
            </div>
          ) : displayedStations.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i
                className="bi bi-search"
                style={{
                  fontSize: '2.5rem',
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: '12px',
                }}
              ></i>

              <div
                style={{
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                {searchQuery
                  ? `No hubs found matching "${searchQuery}"`
                  : 'No microgrid stations available.'}
              </div>

              {(filterStationId || searchQuery) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-sm btn-outline-success rounded-pill px-4 mt-3"
                >
                  Show All Hubs
                </button>
              )}
            </div>
          ) : (
            displayedStations.map((s) => {
              const currentSlots =
                editingSlots[s.id] ??
                s.availableBatterySlots;

              const slotPercent =
                s.totalBatterySlots > 0
                  ? (currentSlots / s.totalBatterySlots) * 100
                  : 0;

              return (
                <div
                  key={s.id}
                  className={
                    filterStationId
                      ? 'col-md-8 col-lg-6 mx-auto'
                      : 'col-md-6 col-lg-6'
                  }
                >
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: '24px',
                      border:
                        '1px solid rgba(255, 255, 255, 0.95)',
                      padding: '28px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow:
                        '0 12px 32px -4px rgba(4, 120, 87, 0.12)',
                    }}
                  >
                    <div>
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
                          }}
                        >
                          {s.stationCode}
                        </span>

                        <span
                          style={{
                            background:
                              s.status === 'Active'
                                ? '#10b981'
                                : '#64748b',
                            color: '#fff',
                            borderRadius: '50px',
                            padding: '4px 14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          {s.status}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: '6px',
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
                        <i
                          className="bi bi-geo-alt"
                          style={{ color: '#059669' }}
                        ></i>
                        {s.location}
                      </div>

                      <div
                        style={{
                          background:
                            'rgba(240, 253, 244, 0.8)',
                          border:
                            '1px solid rgba(167, 243, 208, 0.7)',
                          borderRadius: '18px',
                          padding: '16px 20px',
                          marginBottom: '22px',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#064e3b',
                              textTransform: 'uppercase',
                            }}
                          >
                            Battery Slots Occupancy
                          </span>

                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              color: '#059669',
                            }}
                          >
                            {currentSlots} Available
                            <span
                              style={{
                                color: '#64748b',
                                fontWeight: 500,
                                fontSize: '0.8rem',
                              }}
                            >
                              {' '}
                              / {s.totalBatterySlots} Total
                            </span>
                          </span>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '10px',
                            background: '#e2e8f0',
                            borderRadius: '50px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${slotPercent}%`,
                              height: '100%',
                              background:
                                slotPercent < 25
                                  ? '#ef4444'
                                  : slotPercent < 50
                                  ? '#f59e0b'
                                  : 'linear-gradient(90deg, #10b981, #059669)',
                              borderRadius: '50px',
                              transition:
                                'width 0.25s ease',
                            }}
                          />
                        </div>

                        <div
                          className="d-flex justify-content-between mt-2"
                          style={{
                            fontSize: '0.74rem',
                            color: '#64748b',
                          }}
                        >
                          <span>
                            Capacity: {s.capacityKWh} kW/h
                          </span>

                          <span>
                            Schedule:{' '}
                            {s.operationalSchedule ||
                              '24/7 Grid'}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop:
                              '1px dashed rgba(167, 243, 208, 0.8)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#065f46',
                              textTransform: 'uppercase',
                              marginBottom: '8px',
                              display: 'flex',
                              justifyContent:
                                'space-between',
                            }}
                          >
                            <span>
                              <i className="bi bi-grid-3x3-gap-fill me-1"></i>
                              Live Slot Bay Telemetry
                            </span>

                            <span
                              style={{
                                color: '#059669',
                                background: '#d1fae5',
                                padding: '1px 8px',
                                borderRadius: '50px',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#10b981',
                                  marginRight: '4px',
                                }}
                              ></span>
                              Live Sync
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            {Array.from({
                              length:
                                s.totalBatterySlots || 10,
                            }).map((_, idx) => {
                              const slotNum = idx + 1;
                              const isOccupied = (
                                s.occupiedSlotNumbers || []
                              ).includes(slotNum);

                              return (
                                <span
                                  key={slotNum}
                                  title={
                                    isOccupied
                                      ? `Battery Bay #${slotNum}: Reserved / Occupied`
                                      : `Battery Bay #${slotNum}: Free / Available`
                                  }
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: isOccupied
                                      ? '#fee2e2'
                                      : '#fff',
                                    color: isOccupied
                                      ? '#b91c1c'
                                      : '#047857',
                                    border: `1px solid ${
                                      isOccupied
                                        ? '#fca5a5'
                                        : '#86efac'
                                    }`,
                                  }}
                                >
                                  <span
                                    style={{
                                      display:
                                        'inline-block',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background:
                                        isOccupied
                                          ? '#ef4444'
                                          : '#10b981',
                                      marginRight: '4px',
                                    }}
                                  ></span>
                                  #{slotNum}{' '}
                                  {isOccupied
                                    ? 'Busy'
                                    : 'Free'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slot Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        paddingTop: '16px',
                        borderTop:
                          '1px solid rgba(167, 243, 208, 0.6)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSlotChange(s.id, -1)
                          }
                          disabled={currentSlots <= 0}
                          className="btn btn-outline-danger rounded-circle fw-bold"
                          style={{
                            width: '36px',
                            height: '36px',
                          }}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          value={currentSlots}
                          onChange={(e) => {
                            const val = parseInt(
                              e.target.value,
                              10
                            );

                            if (
                              !isNaN(val) &&
                              val >= 0 &&
                              val <= s.totalBatterySlots
                            ) {
                              setEditingSlots({
                                ...editingSlots,
                                [s.id]: val,
                              });
                            }
                          }}
                          style={{
                            width: '64px',
                            padding: '6px 8px',
                            borderRadius: '50px',
                            border:
                              '1px solid rgba(16, 185, 129, 0.4)',
                            textAlign: 'center',
                            fontWeight: 800,
                            color: '#0f172a',
                            outline: 'none',
                          }}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleSlotChange(s.id, 1)
                          }
                          disabled={
                            currentSlots >=
                            s.totalBatterySlots
                          }
                          className="btn btn-outline-success rounded-circle fw-bold"
                          style={{
                            width: '36px',
                            height: '36px',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveSlot(s)}
                        className="btn btn-success rounded-pill px-4 fw-bold"
                      >
                        <i className="bi bi-cloud-arrow-up me-2"></i>
                        Update Slots
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            marginTop: '40px',
            textAlign: 'center',
          }}
        >
          <Link
            to="/operator"
            className="btn btn-outline-light rounded-pill px-4 fw-bold"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Operational Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StationSlots;