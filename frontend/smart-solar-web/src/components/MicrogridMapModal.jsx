// ============================================================================
// File: MicrogridMapModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Leaflet.js interactive map modal rendering all active stations from GPS coordinates.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Helper to determine slot availability color and metadata
export const getSlotAvailabilityInfo = (station) => {
  const available = Number(station?.availableBatterySlots ?? 0);
  const total = Number(station?.totalBatterySlots ?? 0);

  if (available <= 0) {
    return {
      status: 'none',
      color: '#ef4444',
      darkColor: '#b91c1c',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      pulseRgba: 'rgba(239, 68, 68, 0.5)',
      badgeBg: '#7f1d1d',
      badgeColor: '#fca5a5',
      badgeBorder: '#ef4444',
      textClass: 'text-danger',
      label: 'No Slots Available (Full)',
      shortLabel: '0 Slots Free',
    };
  }

  if (total > 0 && available > total / 2) {
    return {
      status: 'high',
      color: '#10b981',
      darkColor: '#047857',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      pulseRgba: 'rgba(16, 185, 129, 0.5)',
      badgeBg: '#064e3b',
      badgeColor: '#6ee7b7',
      badgeBorder: '#10b981',
      textClass: 'text-success',
      label: 'High Availability (> 50% Slots)',
      shortLabel: available + '/' + total + ' Free (>50%)',
    };
  }

  return {
    status: 'low',
    color: '#f59e0b',
    darkColor: '#b45309',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    pulseRgba: 'rgba(245, 158, 11, 0.5)',
    badgeBg: '#78350f',
    badgeColor: '#fde68a',
    badgeBorder: '#f59e0b',
    textClass: 'text-warning',
    label: 'Limited Availability (< 50% Slots)',
    shortLabel: available + '/' + total + ' Free (<50%)',
  };
};

// Helper to generate custom styled Leaflet divIcon for a station
// Bootstrap + Tailwind utility classes only (status-mapped, no inline styles).
const pinBgByStatus = (status) =>
  status === 'high' ? 'bg-success' : status === 'low' ? 'bg-warning' : 'bg-danger';
const textByStatus = (status) =>
  status === 'high' ? 'text-success' : status === 'low' ? 'text-warning' : 'text-danger';
const createStationIcon = (station, isSelected = false) => {
  const slotInfo = getSlotAvailabilityInfo(station);

  return L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div class="d-flex align-items-center justify-content-center rounded-full border border-2 border-white text-white w-[40px] h-[40px] text-[18px] cursor-pointer ${pinBgByStatus(slotInfo.status)}">
        <i class="bi bi-geo-alt-fill text-white text-[18px]"></i>
        ${
          station.availableBatterySlots !== undefined
            ? `<div class="position-absolute badge bg-dark border border-white rounded-pill fw-bold bottom-[-6px] end-[-6px] text-[9px] ${textByStatus(slotInfo.status)}">${station.availableBatterySlots}</div>`
            : ''
        }
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

const MicrogridMapModal = ({
  isOpen,
  onClose,
  stations = [],
  focusStation = null,
  onViewSchedule = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersMapRef = useRef({});
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedStation(focusStation || null);
      setSearchQuery('');
    }
  }, [isOpen, focusStation]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter = focusStation
      ? [focusStation.latitude || 6.9271, focusStation.longitude || 79.8612]
      : [7.8731, 80.7718];
    const defaultZoom = focusStation ? 14 : 8;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersMapRef.current = {};
    const markerGroup = [];

    stations.forEach((s) => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isFocused = focusStation && focusStation.id === s.id;
      const marker = L.marker([lat, lng], {
        icon: createStationIcon(s, isFocused),
      });

      const slotInfo = getSlotAvailabilityInfo(s);
      const slotPct = s.totalBatterySlots > 0 ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
      const slotBarClass = slotPct >= 75 ? 'w-100' : slotPct >= 50 ? 'w-75' : slotPct >= 25 ? 'w-50' : slotPct > 0 ? 'w-25' : 'w-0';
      const popupHtml = `
        <div class="p-1 min-w-[260px] max-w-[320px]">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="badge bg-[#063127] text-[#F8F8F8] font-monospace rounded-pill">${s.stationCode || 'HUB'}</span>
            <span class="badge text-white rounded-pill ${pinBgByStatus(slotInfo.status)}">${slotInfo.shortLabel}</span>
          </div>
          <h4 class="fw-bold text-[#063127] mb-1 fs-6">${s.name}</h4>
          <div class="d-flex align-items-center gap-1 text-[#686053] small mb-2">
            <i class="bi bi-geo-alt-fill ${textByStatus(slotInfo.status)}"></i>
            <span class="fw-semibold">${s.location}</span>
          </div>
          <div class="bg-[#063127]/10 border border-[#063127]/20 rounded p-2 mb-2">
            <div class="d-flex align-items-center gap-1 small fw-bold text-[#063127] mb-1">
              <i class="bi bi-clock-history"></i>
              <span>OPERATIONAL SCHEDULE</span>
            </div>
            <div class="small fw-bold text-[#063127]">${s.operationalSchedule || 'Mon-Sun 06:00 - 22:00'}</div>
          </div>
          <div class="bg-light border rounded p-2 mb-2">
            <div class="d-flex justify-content-between small fw-bold text-dark mb-1">
              <span>Battery Slot Status:</span>
              <span class="${textByStatus(slotInfo.status)}">${s.availableBatterySlots} / ${s.totalBatterySlots} Free</span>
            </div>
            <div class="progress w-100 h-[7px] rounded-pill overflow-hidden">
              <div class="progress-bar ${pinBgByStatus(slotInfo.status)} h-100 rounded-pill ${slotBarClass}"></div>
            </div>
            <div class="d-flex justify-content-between small text-secondary mt-1">
              <span>${slotInfo.label}</span>
              <strong class="text-dark">${s.capacityKWh || 0} kWh</strong>
            </div>
          </div>
          <div class="d-flex gap-1 mt-2">
            <a href="/operator/slots?stationId=${s.id}" class="btn btn-sm text-white fw-bold flex-fill ${pinBgByStatus(slotInfo.status)}">
              <i class="bi bi-sliders me-1"></i>Manage Slots
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('click', () => {
        setSelectedStation(s);
      });

      marker.addTo(map);
      markersMapRef.current[s.id] = marker;
      markerGroup.push(marker);
    });

    if (focusStation) {
      const lat = parseFloat(focusStation.latitude);
      const lng = parseFloat(focusStation.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          map.setView([lat, lng], 15, { animate: true });
          const m = markersMapRef.current[focusStation.id];
          if (m) {
            m.openPopup();
          }
        }, 200);
      }
    } else if (markerGroup.length > 0) {
      const group = L.featureGroup(markerGroup);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, stations, focusStation]);

  const handleFlyToStation = (station) => {
    setSelectedStation(station);
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 15, { duration: 1.2 });
      setTimeout(() => {
        const m = markersMapRef.current[station.id];
        if (m) {
          m.openPopup();
        }
      }, 1200);
    }
  };

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  void onViewSchedule;

  if (!isOpen) return null;

  return (
    <div
      className="modal d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 overflow-auto p-3 z-[1050]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-xl mx-auto mb-3 mt-[5rem]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 overflow-hidden border border-light shadow-lg d-flex flex-column h-[88vh]">
          {/* ── Modal Header ── */}
          <div className="modal-header bg-[#063127] text-white d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded bg-white bg-opacity-25 w-[42px] h-[42px] fs-5">
                <i className="bi bi-map-fill"></i>
              </div>
              <div>
                <h3 className="m-0 fs-5 fw-bolder tracking-tight text-white">
                  Solar Microgrid Nodes Geospatial Map
                </h3>
                <div className="text-white text-opacity-75 text-[0.78rem]">
                  Interactive GIS view of all active solar microgrid nodes and battery storage hubs
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-white bg-opacity-25 text-white rounded-pill px-3 text-[0.76rem]">
                {stations.length} Hub Nodes Plotted
              </span>
              <button
                onClick={onClose}
                className="btn-close btn-close-white bg-white bg-opacity-25 rounded-full"
                title="Close Map"
                aria-label="Close"
              />
            </div>
          </div>

          {/* ── Modal Body: Map + Sidebar ── */}
          <div className="modal-body p-0 flex-fill d-flex position-relative overflow-hidden">
            {/* Map Container */}
            <div ref={mapContainerRef} className="flex-fill bg-[#F8F8F8] position-relative z-[1] h-[420px] w-100" />

            {/* Floating Map Legend */}
            <div className="position-absolute bottom-0 start-0 m-3 z-[500] bg-white bg-opacity-95 border rounded-3 px-3 py-2 shadow d-flex align-items-center gap-3 flex-wrap text-[0.74rem] fw-bold">
              <span className="text-[#063127] fw-bolder d-inline-flex align-items-center gap-1">
                <i className="bi bi-geo-alt-fill text-[#063127]"></i>
                <span>Slot Availability:</span>
              </span>
              <div className="d-flex align-items-center gap-1">
                <span className="d-inline-block rounded-full bg-success w-[10px] h-[10px] shadow animate-pulse"></span>
                <span className="text-success-emphasis">&gt; 50% Slots (Green)</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="d-inline-block rounded-full bg-warning w-[10px] h-[10px] shadow animate-pulse"></span>
                <span className="text-warning-emphasis">&lt; 50% Slots (Yellow)</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="d-inline-block rounded-full bg-danger w-[10px] h-[10px] shadow animate-pulse"></span>
                <span className="text-danger-emphasis">0 Slots / Full (Red)</span>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="d-none d-md-flex flex-column bg-white border-start shadow w-[340px] z-[10] h-100">
              <div className="p-3 border-bottom">
                <div className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-[#686053]"></i>
                  <input
                    type="text"
                    placeholder="Search station or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control ps-5 text-[0.84rem] rounded-3"
                  />
                </div>
              </div>

              <div className="flex-fill overflow-auto p-2">
                {filteredStations.length === 0 ? (
                  <div className="text-center p-4 text-[#686053] text-[0.84rem]">
                    No stations match your search.
                  </div>
                ) : (
                  filteredStations.map((s) => {
                    const isSelected = selectedStation?.id === s.id;
                    const slotInfo = getSlotAvailabilityInfo(s);
                    const badgeClass = 'badge rounded-pill px-2 text-[0.7rem] fw-bold border ' + slotInfo.textClass + ' bg-light';
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleFlyToStation(s)}
                        className={'p-3 rounded-3 mb-2 cursor-pointer border transition hover:bg-[#F8F8F8] ' + (isSelected ? 'bg-[#063127]/10 border-[#063127]/20 shadow-sm' : 'bg-white border')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-[#063127] text-[#F8F8F8] font-monospace text-[0.72rem] rounded-pill px-2">
                            {s.stationCode}
                          </span>
                          <span className={badgeClass}>
                            {slotInfo.shortLabel}
                          </span>
                        </div>

                        <div className="fw-bold text-[#063127] text-[0.88rem] mb-1">
                          {s.name}
                        </div>

                        <div className="text-[0.78rem] text-[#686053] d-flex align-items-center gap-1 mb-2">
                          <i className={'bi bi-geo-alt-fill ' + slotInfo.textClass}></i>
                          <span>{s.location}</span>
                        </div>

                        <div className="bg-white border border-[#063127]/20 rounded p-1 px-2 text-[0.74rem] text-[#063127] fw-semibold d-flex align-items-center gap-1">
                          <i className="bi bi-clock"></i>
                          <span>{s.operationalSchedule || '06:00 – 22:00'}</span>
                        </div>

                        <div className="mt-2 d-flex justify-content-between align-items-center text-[0.74rem]">
                          <span className={'fw-bold d-inline-flex align-items-center gap-1 ' + slotInfo.textClass}>
                            <span className="d-inline-block rounded-full w-[8px] h-[8px] bg-current"></span>
                            {s.availableBatterySlots} / {s.totalBatterySlots} slots free
                          </span>
                          <span className="text-[#063127] fw-semibold d-flex align-items-center gap-1">
                            <span>Locate on Map</span>
                            <i className="bi bi-arrow-right-short fs-6"></i>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center">
                <button
                  onClick={() => {
                    const map = mapInstanceRef.current;
                    if (!map) return;
                    const markers = Object.values(markersMapRef.current);
                    if (markers.length > 0) {
                      const group = L.featureGroup(markers);
                      map.fitBounds(group.getBounds().pad(0.15));
                    }
                  }}
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 text-[0.74rem] fw-semibold hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127]"
                >
                  <i className="bi bi-arrows-fullscreen me-1"></i> Fit All Nodes
                </button>
                <span className="text-[0.72rem] text-secondary">Leaflet / OpenStreetMap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrogridMapModal;
