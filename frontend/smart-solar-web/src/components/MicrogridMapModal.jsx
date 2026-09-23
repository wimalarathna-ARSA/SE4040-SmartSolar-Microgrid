// ============================================================================
// File: MicrogridMapModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Basic Leaflet map modal for displaying active solar stations.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useRef } from 'react';
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

    const defaultZoom = focusStation ? 14 : 8;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
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

      const marker = L.marker([lat, lng]).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 220px;">
          <strong>${station.name || 'Solar Station'}</strong>
          <br />
          <span>${station.location || 'Unknown location'}</span>
          <br />
          <span>
            Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </span>
        </div>
      `);

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
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1200px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 24px',
            background: '#064e3b',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontWeight: 800 }}>
              Solar Microgrid Nodes Map
            </h3>

            <div
              style={{
                fontSize: '0.8rem',
                color: '#a7f3d0',
                marginTop: '3px',
              }}
            >
              Interactive map of solar microgrid stations
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
              fontSize: '1.2rem',
            }}
          >
            &times;
          </button>
        </div>

        <div
          ref={mapContainerRef}
          style={{
            flex: 1,
            width: '100%',
            background: '#e2e8f0',
          }}
        />
      </div>
    </div>
  );
};

export default MicrogridMapModal;