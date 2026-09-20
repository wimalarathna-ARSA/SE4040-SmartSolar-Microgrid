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
  const [searchParams] = useSearchParams();
  const filterStationId = searchParams.get('stationId');

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
  }, []);

  const displayedStations = stations.filter((s) => {
    if (filterStationId && s.id !== filterStationId) {
      return false;
    }

    return true;
  });

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
          subtitle="Monitor available battery slots across active microgrid stations."
          breadcrumb={['Slots']}
        />

        <div className="d-flex justify-content-end mb-4">
          <div className="d-flex align-items-center gap-2">
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
                className="bi bi-battery"
                style={{
                  fontSize: '2.5rem',
                  color: '#94a3b8',
                }}
              ></i>

              <div
                style={{
                  fontWeight: 700,
                  color: '#1e293b',
                  marginTop: '12px',
                }}
              >
                No microgrid stations available.
              </div>
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
                          s.status === 'Active' ? '#10b981' : '#64748b',
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