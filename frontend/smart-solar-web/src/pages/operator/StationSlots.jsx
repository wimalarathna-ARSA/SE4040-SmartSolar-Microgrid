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

  const fetchStations = async () => {
    setLoading(true);

    try {
      const res = await api.get('/stations');
      setStations(res.data);
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
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
                }}
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
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
              whiteSpace: 'nowrap',
            }}
          >
            {displayedStations.length === stations.length
              ? `${stations.length} Hubs`
              : `${displayedStations.length} of ${stations.length} Hubs`}
          </span>
        </div>

        {message.text && (
          <div
            className={`alert ${
              message.type === 'danger'
                ? 'alert-danger'
                : 'alert-success'
            }`}
          >
            {message.text}
          </div>
        )}

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
            displayedStations.map((s) => (
              <div key={s.id} className="col-md-6 col-lg-6">
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.95)',
                    padding: '28px',
                    height: '100%',
                    boxShadow:
                      '0 12px 32px -4px rgba(4, 120, 87, 0.12)',
                  }}
                >
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

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      marginTop: '16px',
                    }}
                  >
                    {s.name}
                  </h3>

                  <div
                    style={{
                      color: '#475569',
                      fontSize: '0.86rem',
                    }}
                  >
                    <i
                      className="bi bi-geo-alt me-2"
                      style={{ color: '#059669' }}
                    ></i>
                    {s.location}
                  </div>
                </div>
              </div>
            ))
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