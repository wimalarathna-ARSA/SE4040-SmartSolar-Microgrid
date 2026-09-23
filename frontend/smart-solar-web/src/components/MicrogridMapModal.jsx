// ============================================================================
// File: MicrogridMapModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Leaflet map modal with station availability indicators.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useRef } from 'react';
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
          style="
            color: #ffffff;
            font-size: 18px;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          "
        ></i>

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

    const markers = [];

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

      const total = Number(station.totalBatterySlots ?? 0);
      const available = Number(station.availableBatterySlots ?? 0);

      const slotPercent =
        total > 0 ? (available / total) * 100 : 0;

      const popupHtml = `
        <div style="
          font-family: Arial, sans-serif;
          min-width: 250px;
          max-width: 320px;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          ">
            <span style="
              background: #0f172a;
              color: #34d399;
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 50px;
            ">
              ${station.stationCode || 'HUB'}
            </span>

            <span style="
              background: ${slotInfo.color};
              color: #ffffff;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 50px;
            ">
              ${slotInfo.shortLabel}
            </span>
          </div>

          <h4 style="
            margin: 0 0 5px;
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          ">
            ${station.name || 'Solar Station'}
          </h4>

          <div style="
            font-size: 12px;
            color: #475569;
            margin-bottom: 10px;
          ">
            <i
              class="bi bi-geo-alt-fill"
              style="color: ${slotInfo.color};"
            ></i>
            ${station.location || 'Unknown location'}
          </div>

          <div style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 8px 10px;
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              font-weight: 700;
              margin-bottom: 4px;
            ">
              <span>Battery Slots</span>
              <span style="color: ${slotInfo.color};">
                ${available} / ${total}
              </span>
            </div>

            <div style="
              width: 100%;
              height: 7px;
              background: #e2e8f0;
              border-radius: 50px;
              overflow: hidden;
            ">
              <div style="
                width: ${slotPercent}%;
                height: 100%;
                background: ${slotInfo.color};
              "></div>
            </div>

            <div style="
              font-size: 10px;
              color: #64748b;
              margin-top: 5px;
            ">
              ${slotInfo.label}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
      });

      marker.addTo(map);
      markers.push(marker);
    });

    if (focusStation) {
      const lat = parseFloat(focusStation.latitude);
      const lng = parseFloat(focusStation.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          map.setView([lat, lng], 15, {
            animate: true,
          });
        }, 200);
      }
    } else if (markers.length > 0) {
      const group = L.featureGroup(markers);
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 47, 0.72)',
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
              'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
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
                marginTop: '2px',
              }}
            >
              Interactive GIS view of solar microgrid nodes
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
          ref={mapContainerRef}
          style={{
            flex: 1,
            background: '#e2e8f0',
          }}
        />
      </div>
    </div>
  );
};

export default MicrogridMapModal;