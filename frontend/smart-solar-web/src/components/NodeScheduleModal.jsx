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
      className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-auto bg-dark bg-opacity-75 backdrop-blur p-3 z-[1050]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-dialog modal-lg mx-auto mb-5 mt-[5rem]"
        style={{ marginTop: '6rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content rounded-4 overflow-hidden border border-light shadow-lg">
          {/* ── Modal Header ── */}
          <div className="modal-header bg-[#063127] text-white border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded bg-white bg-opacity-25 w-[42px] h-[42px] fs-5">
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <h3 className="m-0 fs-5 fw-bolder tracking-tight text-white">
                  Node Operational Schedule
                </h3>
                <div className="text-white text-opacity-75 text-[0.76rem]">
                  Operational timetable &amp; hardware bay protocol
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-close bg-[#F8F8F8] rounded-full p-2 hover:bg-[#F8F8F8] hover:text-[#063127]"
              title="Close"
              aria-label="Close"
            />
          </div>

          {/* ── Modal Content ── */}
          <div className="modal-body bg-white p-4">
            {/* Station Identification Card */}
            <div className="bg-light border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-[#063127] text-[#F8F8F8] font-monospace text-[0.78rem] rounded-pill px-3">
                    {station.stationCode}
                  </span>
                  <span className={'badge rounded-pill px-3 text-[0.72rem] border ' + (station.status === 'Active' ? 'bg-[#063127]/10 text-[#063127] border-[#063127]/20' : 'bg-[#686053]/10 text-[#686053] border-[#686053]/30')}>
                    {station.status === 'Active' ? 'Operational' : station.status}
                  </span>
                </div>
                <h4 className="my-1 fs-5 fw-bolder text-[#063127]">
                  {station.name}
                </h4>
                <div className="text-[#686053] text-[0.82rem] d-flex align-items-center gap-1">
                  <i className="bi bi-geo-alt-fill text-[#063127]"></i>
                  <span>{station.location}</span>
                  {station.latitude && station.longitude && (
                    <span className="text-[#686053] text-opacity-75 text-[0.75rem]">
                      ({station.latitude.toFixed(4)}, {station.longitude.toFixed(4)})
                    </span>
                  )}
                </div>
              </div>

              {onViewOnMap && (
                <button
                  type="button"
                  onClick={() => onViewOnMap(station)}
                  className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 text-[0.78rem] fw-bold d-inline-flex align-items-center gap-1 shadow-sm hover:shadow"
                >
                  <i className="bi bi-geo-alt"></i>
                  <span>Locate on Map</span>
                </button>
              )}
            </div>

            {/* Operating Hours Featured Banner */}
            <div className="bg-[#063127]/10 border border-[#063127]/20 rounded-3 p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-clock-fill text-[#063127] fs-5"></i>
                <span className="text-[0.75rem] fw-bolder text-[#063127] text-uppercase tracking-wide">
                  Published Operational Timetable
                </span>
              </div>
              <div className="fs-4 fw-black text-[#063127] tracking-tight">
                {station.operationalSchedule || 'Mon-Sun 06:00 – 22:00 Daily'}
              </div>
              <div className="text-[#063127] text-[0.8rem] mt-1 fw-medium">
                Physical battery swaps, energy drop-offs, and prosumer bay access are authorized during these hours.
              </div>
            </div>

            {/* Two-column Telemetry Matrix */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="bg-white border rounded-3 p-3 shadow-sm">
                  <div className="text-[0.72rem] fw-bold text-[#686053] text-uppercase mb-1">
                    Battery Bay Occupancy
                  </div>
                  <div className="fs-5 fw-bolder text-[#063127]">
                    {station.availableBatterySlots} / {station.totalBatterySlots} Slots
                  </div>
                  <div className="text-[0.75rem] text-[#686053] mt-1">
                    Managed live by Grid Operators
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="bg-white border rounded-3 p-3 shadow-sm">
                  <div className="text-[0.72rem] fw-bold text-[#686053] text-uppercase mb-1">
                    Storage Capacity
                  </div>
                  <div className="fs-5 fw-bolder text-[#063127]">
                    {station.capacityKWh} <span className="text-[0.85rem] text-[#686053]">kWh</span>
                  </div>
                  <div className="text-[0.75rem] text-[#686053] mt-1">
                    Peak grid storage capability
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Operator Bay Guidelines */}
            <div className="bg-light border rounded-3 p-3 mb-2">
              <div className="text-[0.78rem] fw-bolder text-[#063127] text-uppercase tracking-wide mb-2 d-flex align-items-center gap-1">
                <i className="bi bi-shield-check text-[#063127]"></i>
                <span>Operator Bay Guidelines &amp; Protocol</span>
              </div>
              <ul className="m-0 ps-4 text-[0.8rem] text-[#686053] leading-relaxed">
                <li>
                  <strong>QR Authentication:</strong> Scan and authenticate the prosumer&apos;s secure QR code prior to physical battery bay release.
                </li>
                <li>
                  <strong>Slot Synchronization:</strong> Immediately adjust slot availability upon battery swap completion to maintain system inventory accuracy.
                </li>
                <li>
                  <strong>12-Hour Notice Policy:</strong> Booking modifications or cancellations require at least 12 hours&apos; notice prior to slot start time.
                </li>
              </ul>
            </div>
          </div>

          {/* ── Modal Footer ── */}
          <div className="modal-footer bg-light border-top d-flex justify-content-end gap-2 px-4 py-3">
            <Link
              to="/operator/slots"
              className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 text-[0.86rem] fw-bold d-inline-flex align-items-center gap-1"
            >
              <i className="bi bi-sliders"></i>
              <span>Adjust Slots</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 text-[0.86rem] fw-bold shadow hover:shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeScheduleModal;
