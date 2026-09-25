// ============================================================================
// File: LocationPickerModal.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: OSM-based interactive GPS picker modal for setting installation coordinates.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in bundled React/Vite environments
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom glowing pin icon for Solar Microgrid hubs
const solarHubIcon = L.divIcon({
  className: 'solar-hub-map-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      box-shadow: 0 0 16px rgba(22, 163, 74, 0.7), 0 4px 10px rgba(0,0,0,0.3);
      border: 2.5px solid #ffffff;
      color: #ffffff;
      font-size: 18px;
      cursor: grab;
      transform: translate(-50%, -50%);
    ">
      <i class="bi bi-geo-alt-fill"></i>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

const LocationPickerModal = ({
  isOpen,
  onClose,
  initialLocation = {
    address: '',
    latitude: 6.9271,
    longitude: 79.8612,
  },
  onApply,
  zIndex = 10000,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const normalizedInit =
    typeof initialLocation === 'string'
      ? {
          address: initialLocation,
          latitude: 6.9271,
          longitude: 79.8612,
        }
      : initialLocation || {
          address: '',
          latitude: 6.9271,
          longitude: 79.8612,
        };

  const [currentCoords, setCurrentCoords] = useState({
    latitude: normalizedInit.latitude || 6.9271,
    longitude: normalizedInit.longitude || 79.8612,
  });

  const [resolvedAddress, setResolvedAddress] = useState(
    normalizedInit.address || ''
  );

  // Reset location whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const init =
        typeof initialLocation === 'string'
          ? {
              address: initialLocation,
              latitude: 6.9271,
              longitude: 79.8612,
            }
          : initialLocation || {
              address: '',
              latitude: 6.9271,
              longitude: 79.8612,
            };

      const lat = init.latitude ? Number(init.latitude) : 6.9271;
      const lng = init.longitude ? Number(init.longitude) : 79.8612;

      setCurrentCoords({
        latitude: lat,
        longitude: lng,
      });

      setResolvedAddress(init.address || '');
    }
  }, [isOpen, initialLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = currentCoords.latitude || 6.9271;
      const initialLng = currentCoords.longitude || 79.8612;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({
        position: 'bottomright',
      }).addTo(map);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      const marker = L.marker(
        [initialLat, initialLng],
        {
          icon: solarHubIcon,
          draggable: true,
          title: 'Solar Microgrid Hub Location',
        }
      ).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #16a34a; display: block; font-size: 13px;">
            Solar Hub Site
          </strong>
          <span>Drag this marker to pin exact solar node.</span>
        </div>
      `);

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();

        setCurrentCoords({
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        });
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        marker.setLatLng([lat, lng]);

        setCurrentCoords({
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }, 150);

    return () => {
      clearTimeout(timer);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleApply = () => {
    onApply({
      location:
        resolvedAddress.trim() ||
        `GPS (${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)})`,
      latitude: parseFloat(currentCoords.latitude.toFixed(6)),
      longitude: parseFloat(currentCoords.longitude.toFixed(6)),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 16, 32, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: zIndex || 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '1.25rem',
              }}
            >
              <i className="bi bi-geo-alt-fill"></i>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Interactive Microgrid Map
              </h3>

              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  margin: '2px 0 0',
                }}
              >
                Click or drag the pin to select the solar station location.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(15, 23, 42, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '420px',
            background: '#e2e8f0',
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              zIndex: 500,
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <i className="bi bi-hand-index-thumb text-warning"></i>{' '}
            Click anywhere or drag green marker
          </div>
        </div>

        <div
          style={{
            padding: '18px 28px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ flex: '1 1 360px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                Selected Location:
              </span>

              <span
                style={{
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  borderRadius: '50px',
                  padding: '2px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                <i className="bi bi-crosshair me-1"></i>
                {currentCoords.latitude.toFixed(4)},{' '}
                {currentCoords.longitude.toFixed(4)}
              </span>
            </div>

            <input
              type="text"
              value={resolvedAddress}
              onChange={(e) => setResolvedAddress(e.target.value)}
              placeholder="Address / Area Name"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(15, 23, 42, 0.15)',
                fontSize: '0.88rem',
                color: '#0f172a',
                fontWeight: 600,
                outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(15, 23, 42, 0.06)',
                color: '#475569',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              style={{
                background:
                  'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 24px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-check2-circle me-1"></i>
              Apply Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;