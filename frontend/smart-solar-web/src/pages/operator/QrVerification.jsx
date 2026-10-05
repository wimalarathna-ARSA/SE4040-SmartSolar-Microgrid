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
import OperatorPageHero from '../../components/OperatorPageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

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
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1080px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <OperatorPageHero
          imageSrc="/images/solar-hero-panels.jpg"
          eyebrow="SOLARX • QR Security"
          title="QR Verification & Finalize"
          subtitle="Cryptographically verify battery handoff tokens on site."
          breadcrumb={['Verify QR']}
        />

        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <Link to="/operator" className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg text-decoration-none">
            <i className="bi bi-arrow-left"></i>Back to Console
          </Link>
        </div>

        <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl mb-4 overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
                <div className="fw-semibold small">{error}</div>
              </div>
            )}

            {result && (
              <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] rounded-4 p-4 mb-4" role="alert">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="rounded-circle bg-[#063127] text-white d-flex align-items-center justify-content-center fs-5 flex-shrink-0 w-[42px] h-[42px]">
                    <i className="bi bi-check2"></i>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-extrabold text-[#063127] fs-5">{result.message}</h4>
                    <span className="small text-[#063127] fw-semibold">Official Energy Trade Finalization Record</span>
                  </div>
                </div>

                <hr className="border-[#063127]/20" />

                <div className="row g-3 small">
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Booking Reference</span>
                    <div className="fw-extrabold text-[#063127] font-monospace">{result.reservation?.reservationCode}</div>
                  </div>
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Solar Prosumer</span>
                    <div className="fw-bold text-[#063127]">
                      {result.reservation?.prosumerName} &bull; <span className="text-danger">NIC: {result.reservation?.prosumerNic}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Energy Transferred</span>
                    <div className="fw-extrabold text-[#063127]">
                      {result.reservation?.energyAmountKWh} kWh ({result.reservation?.reservationType})
                    </div>
                  </div>
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Transaction Value</span>
                    <div className="fw-extrabold text-[#063127]">
                      Rs. {result.reservation?.totalCost ? result.reservation?.totalCost.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Finalized At</span>
                    <div className="text-[#063127] fw-semibold">
                      {new Date(result.reservation?.completedAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <span className="text-[#686053] small fw-bold text-uppercase d-block">Finalizing Operator</span>
                    <div className="text-[#063127] fw-semibold">{result.reservation?.operatorNic || user?.nic}</div>
                  </div>
                  <div className="col-12 mt-3">
                    <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex align-items-center gap-2 mb-0 fw-bold small">
                      <i className="bi bi-unlock-fill text-[#063127] fs-5"></i>
                      <div>
                        Battery Bay Slot {result.reservation?.slotNumber ? `#${result.reservation.slotNumber}` : ''} at {result.reservation?.stationName} has been <strong>automatically freed &amp; released</strong> for new bookings!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyAndFinalize}>
              <div className="mb-4">
                <label htmlFor="qr-payload" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">
                  Prosumer QR Code Payload String *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-[#063127] text-[#BFD5D0] border-[#063127]"><i className="bi bi-qr-code"></i></span>
                  <input
                    id="qr-payload"
                    type="text"
                    className="form-control font-monospace rounded-[10px] text-[0.9rem] bg-white"
                    placeholder="e.g. SMARTSOLAR-TX|RES-12345|199512345678|..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text ms-2">
                  In production Android, the camera scanner reads this payload directly. For web operator testing, paste or click a ready booking below.
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="qr-notes" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">
                  Operator Field Inspection Notes
                </label>
                <textarea
                  id="qr-notes"
                  className="form-control rounded-[10px] text-[0.9rem] bg-white"
                  rows="2"
                  placeholder="e.g. Battery connected to Bay 04, voltage check normal, physical transfer completed."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading || !qrInput} className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    <span>Verifying with Central Web API...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-square fs-5"></i>
                    <span>Verify QR &amp; Finalize Job as Done</span>
                  </>
                )}
              </button>
            </form>

            {approvedReservations.length > 0 && (
              <div className="mt-4 p-3 bg-white border border-dashed border-[#063127] rounded-[16px]">
                <div className="small fw-bold text-[#063127] text-uppercase d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-lightning-charge text-[#686053]"></i>
                  <span>Ready-to-Verify Prosumer Bookings (Click to Populate Token):</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {approvedReservations.slice(0, 3).map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleQuickSelectQr(res.qrCodeData)}
                      className="btn bg-white text-[#063127] border border-[#063127]/20 hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill text-start d-flex align-items-center justify-content-between gap-2"
                    >
                      <div className="small text-truncate">
                        <strong className="font-monospace text-[#063127]">{res.reservationCode}</strong>
                        <span className="text-[#686053] mx-2">&bull;</span>
                        <span className="fw-semibold">{res.prosumerName}</span>
                        <span className="text-[#686053] small ms-1">({res.energyAmountKWh} kWh)</span>
                      </div>
                      <span className="badge bg-[#063127] text-white rounded-pill flex-shrink-0">Select QR Token</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link to="/operator" className="d-inline-flex align-items-center gap-2 text-[#063127] text-decoration-none fw-bold text-[0.9rem] bg-white px-4 py-2 rounded-pill border shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-left"></i>Back to Operational Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QrVerification;
