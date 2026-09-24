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

      const lat = init.latitude
        ? Number(init.latitude)
        : 6.9271;

      const lng = init.longitude
        ? Number(init.longitude)
        : 79.8612;

      setCurrentCoords({
        latitude: lat,
        longitude: lng,
      });

      setResolvedAddress(init.address || '');
    }
  }, [isOpen, initialLocation]);

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
          draggable: true,
          title: 'Solar Microgrid Hub Location',
        }
      ).addTo(map);

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
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
                margin: '4px 0 0',
              }}
            >
              Select the exact solar station location.
            </p>
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
            }}
          />
        </div>

        <div
          style={{
            padding: '18px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <strong>
              Coordinates:
            </strong>{' '}
            {currentCoords.latitude.toFixed(4)},{' '}
            {currentCoords.longitude.toFixed(4)}
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
            >
              Apply Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;