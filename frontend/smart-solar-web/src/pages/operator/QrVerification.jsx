// ============================================================================
// File: QrVerification.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator QR verification page: paste or scan QR payload and finalize job.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import OperatorPageHero from '../../components/OperatorPageHero';

const QrVerification = () => {
  const { user } = useAuth();
  const [qrInput, setQrInput] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [approvedReservations, setApprovedReservations] = useState([]);

  // Fetch ready-to-scan reservations for easy demo/testing
  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await api.get('/reservations?status=Approved');
        setApprovedReservations(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchApproved();
  }, [result]);

  const handleVerifyAndFinalize = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await api.post(`/reservations/verify-qr?operatorNic=${user?.nic || 'OPERATOR-01'}`, {
        qrCodeData: qrInput.trim(),
        operatorNotes: operatorNotes.trim() || 'Physical battery inspection passed and energy transfer completed.',
      });

      setResult(response.data);
      setQrInput('');
      setOperatorNotes('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Invalid or expired QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectQr = (qrData) => {
    setQrInput(qrData);
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

      <div style={{ maxWidth: '1080px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <OperatorPageHero
          imageSrc="/images/solar-hero-panels.jpg"
          eyebrow="SOLARX • QR Security"
          title="QR Verification & Finalize"
          subtitle="Cryptographically verify battery handoff tokens on site."
          breadcrumb={['Verify QR']}
        />
        {/* =========================================================================
            HEADER BAR
           ========================================================================= */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

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

        {/* =========================================================================
            MAIN VERIFICATION CARD
           ========================================================================= */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.86)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 45px -8px rgba(4, 120, 87, 0.15)',
            padding: '36px 40px',
            marginBottom: '32px',
          }}
        >
          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: 'rgba(254, 242, 242, 0.95)',
                border: '1px solid #fca5a5',
                borderRadius: '16px',
                padding: '14px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#991b1b',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
              }}
            >
              <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{error}</div>
            </div>
          )}

          {/* Success Receipt Card */}
          {result && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(220, 252, 231, 0.95) 100%)',
                border: '1px solid #86efac',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
              }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-check2"></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#064e3b', fontSize: '1.15rem' }}>
                    {result.message}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                    Official Energy Trade Finalization Record
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  margin: '16px 0',
                }}
              />

              <div className="row g-3" style={{ fontSize: '0.88rem' }}>
                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Booking Reference
                  </span>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.96rem' }}>
                    {result.reservation?.reservationCode}
                  </div>
                </div>

                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Solar Prosumer
                  </span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {result.reservation?.prosumerName} &bull; <span style={{ color: '#e11d48' }}>NIC: {result.reservation?.prosumerNic}</span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Energy Transferred
                  </span>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.96rem' }}>
                    {result.reservation?.energyAmountKWh} kWh ({result.reservation?.reservationType})
                  </div>
                </div>

                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Transaction Value
                  </span>
                  <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.96rem' }}>
                    Rs. {result.reservation?.totalCost ? result.reservation?.totalCost.toFixed(2) : '0.00'}
                  </div>
                </div>

                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Finalized At
                  </span>
                  <div style={{ color: '#334155', fontWeight: 600 }}>
                    {new Date(result.reservation?.completedAt || Date.now()).toLocaleString()}
                  </div>
                </div>

                <div className="col-sm-6">
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Finalizing Operator
                  </span>
                  <div style={{ color: '#334155', fontWeight: 600 }}>
                    {result.reservation?.operatorNic || user?.nic}
                  </div>
                </div>

                {/* Slot Released Banner */}
                <div className="col-12 mt-3">
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      border: '1px solid #6ee7b7',
                      borderRadius: '14px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#065f46',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                    }}
                  >
                    <i className="bi bi-unlock-fill text-success" style={{ fontSize: '1.2rem' }}></i>
                    <div>
                      Battery Bay Slot {result.reservation?.slotNumber ? `#${result.reservation.slotNumber}` : ''} at {result.reservation?.stationName} has been <strong>automatically freed &amp; released</strong> for new bookings!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerifyAndFinalize}>
            <div className="mb-4">
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1e3a2f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Prosumer QR Code Payload String *
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-qr-code"
                  style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#059669',
                    fontSize: '1.1rem',
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="e.g. SMARTSOLAR-TX|RES-12345|199512345678|..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '13px 20px 13px 48px',
                    borderRadius: '50px',
                    background: '#ffffff',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', marginLeft: '12px' }}>
                In production Android, the camera scanner reads this payload directly. For web operator testing, paste or click a ready booking below.
              </div>
            </div>

            <div className="mb-4">
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1e3a2f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Operator Field Inspection Notes
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Battery connected to Bay 04, voltage check normal, physical transfer completed."
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !qrInput}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '14px 24px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading || !qrInput ? 'not-allowed' : 'pointer',
                opacity: loading || !qrInput ? 0.7 : 1,
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span>Verifying with Central Web API...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-square" style={{ fontSize: '1.1rem' }}></i>
                  <span>Verify QR &amp; Finalize Job as Done</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for Demo / Testing */}
          {approvedReservations.length > 0 && (
            <div
              style={{
                marginTop: '32px',
                padding: '20px',
                background: 'rgba(240, 253, 244, 0.75)',
                border: '1px dashed #86efac',
                borderRadius: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="bi bi-lightning-charge text-warning"></i>
                <span>Ready-to-Verify Prosumer Bookings (Click to Populate Token):</span>
              </div>
              <div className="d-flex flex-column gap-2">
                {approvedReservations.slice(0, 3).map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleQuickSelectQr(res.qrCodeData)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '50px',
                      padding: '10px 18px',
                      fontSize: '0.84rem',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ecfdf5';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                    }}
                  >
                    <div>
                      <strong style={{ fontFamily: 'monospace', color: '#059669' }}>{res.reservationCode}</strong>
                      <span style={{ margin: '0 8px', color: '#94a3b8' }}>&bull;</span>
                      <span style={{ fontWeight: 600 }}>{res.prosumerName}</span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '6px' }}>({res.energyAmountKWh} kWh)</span>
                    </div>
                    <span
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '50px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                      }}
                    >
                      Select QR Token
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Link */}
        <div style={{ textAlign: 'center' }}>
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

export default QrVerification;
