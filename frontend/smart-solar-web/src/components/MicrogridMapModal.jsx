// ============================================================================
// File: MicrogridMapModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Interactive Leaflet map with station search and navigation.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const getSlotAvailabilityInfo = (station) => {
  const available = Number(station?.availableBatterySlots ?? 0);
  const total = Number(station?.totalBatterySlots ?? 0);

  if (available <= 0) {
    return {
      status: 'none',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      pulseRgba: 'rgba(239, 68, 68, 0.5)',
      label: 'No Slots Available (Full)',
      shortLabel: '0 Slots Free',
    };
  }

  if (total > 0 && available > total / 2) {
    return {
      status: 'high',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      pulseRgba: 'rgba(16, 185, 129, 0.5)',
      label: 'High Availability (> 50% Slots)',
      shortLabel: `${available}/${total} Free (>50%)`,
    };
  }

  return {
    status: 'low',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    pulseRgba: 'rgba(245, 158, 11, 0.5)',
    label: 'Limited Availability (< 50% Slots)',
    shortLabel: `${available}/${total} Free (<50%)`,
  };
};

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
        ${pulseEffect}
      ">
        <i
          class="bi bi-geo-alt-fill"
          style="color:#ffffff;font-size:18px;"
        ></i>

        <div style="
          position:absolute;
          bottom:-6px;
          right:-6px;
          background:#0f172a;
          color:${slotInfo.color};
          font-size:9px;
          font-weight:800;
          padding:1px 5px;
          border-radius:10px;
          border:1.5px solid #ffffff;
        ">
          ${station.availableBatterySlots ?? 0}
        </div>
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
      ? [
          focusStation.latitude || 6.9271,
          focusStation.longitude || 79.8612,
        ]
      : [7.8731, 80.7718];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: focusStation ? 14 : 8,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    L.control.zoom({
      position: 'topright',
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersMapRef.current = {};

    const markerGroup = [];

    stations.forEach((station) => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const isFocused =
        focusStation && focusStation.id === station.id;

      const marker = L.marker([lat, lng], {
        icon: createStationIcon(station, isFocused),
      });

      const slotInfo = getSlotAvailabilityInfo(station);

      marker.bindPopup(`
        <div style="font-family:Arial,sans-serif;min-width:250px;">
          <strong>${station.name || 'Solar Station'}</strong>
          <br />
          <span>${station.location || 'Unknown location'}</span>
          <br /><br />
          <strong style="color:${slotInfo.color};">
            ${slotInfo.shortLabel}
          </strong>
        </div>
      `);

      marker.on('click', () => {
        setSelectedStation(station);
      });

      marker.addTo(map);

      markersMapRef.current[station.id] = marker;
      markerGroup.push(marker);
    });

    if (focusStation) {
      const lat = parseFloat(focusStation.latitude);
      const lng = parseFloat(focusStation.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          map.setView([lat, lng], 15, {
            animate: true,
          });

          const marker =
            markersMapRef.current[focusStation.id];

          if (marker) {
            marker.openPopup();
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
      map.flyTo([lat, lng], 15, {
        duration: 1.2,
      });

      setTimeout(() => {
        const marker =
          markersMapRef.current[station.id];

        if (marker) {
          marker.openPopup();
        }
      }, 1200);
    }
  };

  const filteredStations = stations.filter((station) => {
    const name = String(station.name || '').toLowerCase();
    const location = String(station.location || '').toLowerCase();
    const code = String(station.stationCode || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      name.includes(query) ||
      location.includes(query) ||
      code.includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10,25,47,0.72)',
        backdropFilter: 'blur(10px)',
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
          background: '#ffffff',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '1280px',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 28px',
            background:
              'linear-gradient(135deg,#064e3b 0%,#047857 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontWeight: 800 }}>
              Solar Microgrid Nodes Geospatial Map
            </h3>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#a7f3d0',
              }}
            >
              Interactive GIS view of active solar nodes
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              flex: 1,
              background: '#e2e8f0',
            }}
          />

          <div
            style={{
              width: '340px',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <input
                type="text"
                placeholder="Search station or location..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
              }}
            >
              {filteredStations.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 12px',
                    color: '#94a3b8',
                  }}
                >
                  No stations match your search.
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isSelected =
                    selectedStation?.id === station.id;

                  const slotInfo =
                    getSlotAvailabilityInfo(station);

                  return (
                    <div
                      key={station.id}
                      onClick={() =>
                        handleFlyToStation(station)
                      }
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        background: isSelected
                          ? '#ecfdf5'
                          : '#f8fafc',
                        border: isSelected
                          ? '1.5px solid #10b981'
                          : '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '5px',
                        }}
                      >
                        <strong>
                          {station.stationCode}
                        </strong>

                        <span
                          style={{
                            color: slotInfo.color,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {slotInfo.shortLabel}
                        </span>
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {station.name}
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          marginTop: '3px',
                        }}
                      >
                        {station.location}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrogridMapModal;