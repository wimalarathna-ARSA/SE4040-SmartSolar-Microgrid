// ============================================================================
// File: MicrogridMapModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Leaflet.js interactive map modal rendering all active stations from GPS coordinates.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
      shortLabel: `${available}/${total} Free (>50%)`,
    };
  }

  // available > 0 && available <= total / 2
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
    shortLabel: `${available}/${total} Free (<50%)`,
  };
};

// Helper to generate custom styled Leaflet divIcon for a station
const createStationIcon = (station, isSelected = false) => {
  const slotInfo = getSlotAvailabilityInfo(station);

  const pulseEffect = isSelected
    ? `box-shadow: 0 0 0 7px ${slotInfo.pulseRgba}, 0 8px 24px rgba(0,0,0,0.35); transform: translate(-50%, -50%) scale(1.18);`
    : `box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 12px ${slotInfo.pulseRgba}; transform: translate(-50%, -50%);`;

  return L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${slotInfo.gradient};
        border: 2.5px solid #ffffff;
        color: #ffffff;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s ease;
        ${pulseEffect}
      ">
        <i class="bi bi-geo-alt-fill" style="color: #ffffff; font-size: 18px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></i>
        ${
          station.availableBatterySlots !== undefined
            ? `
          <div style="
            position: absolute;
            bottom: -6px;
            right: -6px;
            background: #0f172a;
            color: ${slotInfo.color};
            font-size: 9px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 10px;
            border: 1.5px solid #ffffff;
            line-height: 1.2;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${station.availableBatterySlots}
          </div>
        `
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
  const markersMapRef = useRef({}); // stationId -> L.marker
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize focused station when modal opens or focusStation changes
  useEffect(() => {
    if (isOpen) {
      setSelectedStation(focusStation || null);
      setSearchQuery('');
    }
  }, [isOpen, focusStation]);

  // Initialize and update the Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing instance if container changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter = focusStation
      ? [focusStation.latitude || 6.9271, focusStation.longitude || 79.8612]
      : [7.8731, 80.7718]; // Center of Sri Lanka
    const defaultZoom = focusStation ? 14 : 8;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add OpenStreetMap tile layer with high-contrast cartography
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Clear previous marker references
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

      // Build rich popup HTML content
      const slotInfo = getSlotAvailabilityInfo(s);
      const slotPercent =
        s.totalBatterySlots > 0 ? (s.availableBatterySlots / s.totalBatterySlots) * 100 : 0;
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 260px; max-width: 320px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: #0f172a; color: #34d399; font-family: monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 50px;">
              ${s.stationCode || 'HUB'}
            </span>
            <span style="background: ${slotInfo.color}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 50px;">
              ${slotInfo.shortLabel}
            </span>
          </div>

          <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 800; color: #0f172a;">
            ${s.name}
          </h4>

          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; margin-bottom: 10px;">
            <i class="bi bi-geo-alt-fill" style="color: ${slotInfo.color}; font-size: 14px;"></i>
            <span style="font-weight: 600;">${s.location}</span>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #166534; margin-bottom: 2px;">
              <i class="bi bi-clock-history"></i>
              <span>OPERATIONAL SCHEDULE</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #065f46;">
              ${s.operationalSchedule || 'Mon-Sun 06:00 - 22:00'}
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;">
              <span>Battery Slot Status:</span>
              <span style="color: ${slotInfo.color}; font-weight: 800;">${s.availableBatterySlots} / ${s.totalBatterySlots} Free</span>
            </div>
            <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 50px; overflow: hidden; margin-bottom: 4px;">
              <div style="width: ${slotPercent}%; height: 100%; background: ${slotInfo.color}; border-radius: 50px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; margin-top: 4px;">
              <span>${slotInfo.label}</span>
              <strong style="color: #0f172a;">${s.capacityKWh || 0} kWh</strong>
            </div>
          </div>

          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="/operator/slots?stationId=${s.id}" style="flex: 1; text-align: center; background: ${slotInfo.color}; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 6px 10px; border-radius: 6px; display: inline-block;">
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

    // Handle initial focusing on a station
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
      // Fit all markers in view
      const group = L.featureGroup(markerGroup);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    // Force map to recalculate size after DOM layout
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

  // Navigate directly to a specific station on the map
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

  // Filter stations in the side panel search
  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          maxWidth: '1280px',
          width: '100%',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '18px 28px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            color: '#ffffff',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              <i className="bi bi-map-fill"></i>
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.015em',
                  color: '#ffffff',
                }}
              >
                Solar Microgrid Nodes Geospatial Map
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '2px' }}>
                Interactive GIS view of all active solar microgrid nodes and battery storage hubs
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '5px 14px',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              {stations.length} Hub Nodes Plotted
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.15s ease',
              }}
              title="Close Map"
            >
              &times;
            </button>
          </div>
        </div>

        {/* ── Modal Body: Map + Sidebar ── */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* Map Container */}
          <div
            ref={mapContainerRef}
            style={{
              flex: 1,
              height: '100%',
              background: '#e2e8f0',
              position: 'relative',
              zIndex: 1,
            }}
          />

          {/* Floating Map Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 500,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '10px 18px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <i className="bi bi-geo-alt-fill text-primary"></i>
              <span>Slot Availability:</span>
            </span>
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }}></span>
              <span style={{ color: '#065f46' }}>&gt; 50% Slots (Green)</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }}></span>
              <span style={{ color: '#92400e' }}>&lt; 50% Slots (Yellow)</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }}></span>
              <span style={{ color: '#991b1b' }}>0 Slots / Full (Red)</span>
            </div>
          </div>

          {/* Right Sidebar: Hubs List & Quick Navigation */}
          <div
            style={{
              width: '340px',
              height: '100%',
              background: '#ffffff',
              borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.05)',
            }}
          >
            {/* Sidebar Search Bar */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-search"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '9px',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Search station or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Hubs Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {filteredStations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '0.84rem' }}>
                  No stations match your search.
                </div>
              ) : (
                filteredStations.map((s) => {
                  const isSelected = selectedStation?.id === s.id;
                  const slotInfo = getSlotAvailabilityInfo(s);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleFlyToStation(s)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        background: isSelected ? '#ecfdf5' : '#f8fafc',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                        boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span
                          style={{
                            background: '#0f172a',
                            color: '#34d399',
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '50px',
                          }}
                        >
                          {s.stationCode}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: slotInfo.color,
                            background: `${slotInfo.color}15`,
                            padding: '1px 8px',
                            borderRadius: '50px',
                            border: `1px solid ${slotInfo.color}40`,
                          }}
                        >
                          {slotInfo.shortLabel}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: '2px' }}>
                        {s.name}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <i className="bi bi-geo-alt-fill" style={{ color: slotInfo.color, fontSize: '0.9rem' }}></i>
                        <span>{s.location}</span>
                      </div>

                      {/* Schedule pill */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #dcfce7',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.74rem',
                          color: '#166534',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <i className="bi bi-clock"></i>
                        <span>{s.operationalSchedule || '06:00 – 22:00'}</span>
                      </div>

                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.74rem',
                        }}
                      >
                        <span style={{ color: slotInfo.color, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slotInfo.color, display: 'inline-block' }}></span>
                          {s.availableBatterySlots} / {s.totalBatterySlots} slots free
                        </span>
                        <span style={{ color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span>Locate on Map</span>
                          <i className="bi bi-arrow-right-short" style={{ fontSize: '1rem' }}></i>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
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
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                <i className="bi bi-arrows-fullscreen me-1"></i> Fit All Nodes
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Leaflet / OpenStreetMap</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrogridMapModal;
