// ============================================================================
// File: NodeScheduleModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Node operational timetable and bay protocol modal for station schedule display.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

const NodeScheduleModal = ({ isOpen, onClose, station, onViewOnMap }) => {
  if (!isOpen || !station) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 47, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 25px 60px -12px rgba(10, 35, 70, 0.35)',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            color: '#ffffff',
            borderRadius: '28px 28px 0 0',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              <i className="bi bi-clock-history"></i>
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                Node Operational Schedule
              </h3>

              <div
                style={{
                  fontSize: '0.76rem',
                  color: '#a7f3d0',
                  marginTop: '1px',
                }}
              >
                Operational timetable &amp; hardware bay protocol
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          {/* Station Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    background: '#0f172a',
                    color: '#34d399',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '50px',
                  }}
                >
                  {station.stationCode}
                </span>

                <span
                  style={{
                    background:
                      station.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                    color:
                      station.status === 'Active' ? '#15803d' : '#475569',
                    border: `1px solid ${
                      station.status === 'Active' ? '#86efac' : '#cbd5e1'
                    }`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '50px',
                  }}
                >
                  {station.status === 'Active'
                    ? 'Operational'
                    : station.status}
                </span>
              </div>

              <h4
                style={{
                  margin: '4px 0 2px',
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {station.name}
              </h4>

              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <i className="bi bi-geo-alt-fill text-success"></i>
                <span>{station.location}</span>
              </div>
            </div>

            {onViewOnMap && (
              <button
                type="button"
                onClick={() => onViewOnMap(station)}
                style={{
                  background:
                    'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <i className="bi bi-geo-alt"></i>
                <span>Locate on Map</span>
              </button>
            )}
          </div>

          {/* Timetable */}
          <div
            style={{
              background:
                'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1.5px solid #6ee7b7',
              borderRadius: '18px',
              padding: '18px 22px',
              marginBottom: '20px',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-clock-fill text-success"></i>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#065f46',
                  textTransform: 'uppercase',
                }}
              >
                Published Operational Timetable
              </span>
            </div>

            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                color: '#064e3b',
              }}
            >
              {station.operationalSchedule ||
                'Mon-Sun 06:00 – 22:00 Daily'}
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                color: '#047857',
                marginTop: '4px',
              }}
            >
              Physical battery swaps, energy drop-offs, and prosumer bay
              access are authorized during these hours.
            </div>
          </div>

          {/* Telemetry */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Battery Bay Occupancy
                </div>

                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#059669',
                  }}
                >
                  {station.availableBatterySlots} /{' '}
                  {station.totalBatterySlots} Slots
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginTop: '2px',
                  }}
                >
                  Managed live by Grid Operators
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Storage Capacity
                </div>

                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  {station.capacityKWh}{' '}
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#64748b',
                    }}
                  >
                    kWh
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginTop: '2px',
                  }}
                >
                  Peak grid storage capability
                </div>
              </div>
            </div>
          </div>

          {/* Operator Bay Guidelines */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="bi bi-shield-check text-success"></i>
              <span>Operator Bay Guidelines &amp; Protocol</span>
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '0.8rem',
                color: '#334155',
                lineHeight: 1.6,
              }}
            >
              <li>
                <strong>QR Authentication:</strong> Scan and authenticate the
                prosumer's secure QR code prior to physical battery bay
                release.
              </li>

              <li>
                <strong>Slot Synchronization:</strong> Immediately adjust slot
                availability upon battery swap completion to maintain system
                inventory accuracy.
              </li>

              <li>
                <strong>12-Hour Notice Policy:</strong> Booking modifications
                or cancellations require at least 12 hours' notice prior to
                slot start time.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px 22px',
            borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#f8fafc',
            borderRadius: '0 0 28px 28px',
          }}
        >
          <Link
            to="/operator/slots"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #cbd5e1',
              color: '#334155',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '0.86rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <i className="bi bi-sliders"></i>
            <span>Adjust Slots</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            style={{
              background:
                'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 24px',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeScheduleModal;