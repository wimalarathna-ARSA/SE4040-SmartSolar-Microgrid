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

// Sri Lanka popular microgrid regional presets
const SRI_LANKA_PRESETS = [
  { name: 'Colombo Central', lat: 6.9271, lng: 79.8612, label: 'Colombo' },
  { name: 'Kandy Highland', lat: 7.2906, lng: 80.6337, label: 'Kandy' },
  { name: 'Galle Coastal', lat: 6.0535, lng: 80.2210, label: 'Galle' },
  { name: 'Jaffna Peninsula', lat: 9.6615, lng: 80.0255, label: 'Jaffna' },
  { name: 'Negombo Coastal', lat: 7.2008, lng: 79.8737, label: 'Negombo' },
  { name: 'Trincomalee Bay', lat: 8.5874, lng: 81.2152, label: 'Trincomalee' },
  { name: 'Hambantota Solar Zone', lat: 6.1429, lng: 81.1212, label: 'Hambantota' },
  { name: 'Kurunegala Grid', lat: 7.4863, lng: 80.3623, label: 'Kurunegala' },
];

const LocationPickerModal = ({
  isOpen,
  onClose,
  initialLocation = { address: '', latitude: 6.9271, longitude: 79.8612 },
  onApply,
  zIndex = 10000,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const normalizedInit = typeof initialLocation === 'string'
    ? { address: initialLocation, latitude: 6.9271, longitude: 79.8612 }
    : (initialLocation || { address: '', latitude: 6.9271, longitude: 79.8612 });

  const [currentCoords, setCurrentCoords] = useState({
    latitude: normalizedInit.latitude || 6.9271,
    longitude: normalizedInit.longitude || 79.8612,
  });
  const [resolvedAddress, setResolvedAddress] = useState(normalizedInit.address || '');

  // Reset or update state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const init = typeof initialLocation === 'string'
        ? { address: initialLocation, latitude: 6.9271, longitude: 79.8612 }
        : (initialLocation || { address: '', latitude: 6.9271, longitude: 79.8612 });
      const lat = init.latitude ? Number(init.latitude) : 6.9271;
      const lng = init.longitude ? Number(init.longitude) : 79.8612;
      setCurrentCoords({ latitude: lat, longitude: lng });
      setResolvedAddress(init.address || '');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, initialLocation]);

  // Reverse geocode latitude and longitude to get an address using OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format a clean address string
          const addr = data.address || {};
          const mainPart =
            addr.road || addr.suburb || addr.neighbourhood || addr.industrial || addr.commercial || addr.village || addr.city_district || '';
          const cityPart = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || '';
          const provincePart = addr.state || '';
          
          let cleanStr = [mainPart, cityPart, provincePart].filter(Boolean).join(', ');
          if (!cleanStr) {
            cleanStr = data.display_name.split(',').slice(0, 3).join(',').trim();
          }
          setResolvedAddress(cleanStr || data.display_name);
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Search places using OpenStreetMap Nominatim API
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      // Prioritize Sri Lanka, but allow global search if needed
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5&countrycodes=lk&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      let data = [];
      if (res.ok) {
        data = await res.json();
      }

      // If no Sri Lanka specific results, fallback to general search
      if (!data || data.length === 0) {
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }

      setSearchResults(data || []);
    } catch (err) {
      console.error('Place search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Move map & marker to given coordinates
  const moveToLocation = (lat, lng, addressName = null) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    setCurrentCoords({ latitude: latNum, longitude: lngNum });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latNum, lngNum], 15, { duration: 1.2 });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([latNum, lngNum]);
    }

    if (addressName) {
      setResolvedAddress(addressName);
    } else {
      reverseGeocode(latNum, lngNum);
    }
  };

  // When user clicks a search suggestion
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name.split(',').slice(0, 3).join(',').trim();
    moveToLocation(lat, lng, label || result.display_name);
    setSearchResults([]);
    setSearchQuery(label || result.display_name);
  };

  // Initialize and manage Leaflet map instance
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = currentCoords.latitude || 6.9271;
      const initialLng = currentCoords.longitude || 79.8612;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
      });

      // Add modern zoom controls in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add Draggable marker
      const marker = L.marker([initialLat, initialLng], {
        icon: solarHubIcon,
        draggable: true,
        title: 'Solar Microgrid Hub Location (Drag to reposition)',
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #16a34a; display: block; font-size: 13px;">Solar Hub Site</strong>
          <span>Drag this marker to pin exact solar node.</span>
        </div>
      `);

      // Event: Marker dragged
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setCurrentCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) });
        reverseGeocode(lat, lng);
      });

      // Event: Click on map to move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) });
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size to ensure tiles render properly in modal
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

  // Handle Apply button
  const handleApply = () => {
    onApply({
      location: resolvedAddress.trim() || `GPS (${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)})`,
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
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 25px 70px rgba(0, 20, 50, 0.35)',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            MODAL HEADER
           ===================================================================== */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
              }}
            >
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Interactive Microgrid Map &amp; Place Search
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Search any location, click or drag the pin to set the exact solar station node coordinates.
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            &times;
          </button>
        </div>

        {/* =====================================================================
            SEARCH & PRESET BAR
           ===================================================================== */}
        <div
          style={{
            padding: '16px 28px 12px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <div className="d-flex gap-2">
              <div style={{ position: 'relative', flex: 1 }}>
                <i
                  className="bi bi-search"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Search city, town, landmark, street (e.g. Negombo Beach, Galle Fort, Kandy Lake, Colombo 03)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(2, 132, 199, 0.25)',
                    background: '#ffffff',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(2, 132, 199, 0.25)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 12px rgba(2, 132, 199, 0.3)',
                  flexShrink: 0,
                }}
              >
                {isSearching ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-search"></i>
                    <span>Find Place</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Search Autocomplete Results Dropdown */}
            {searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  boxShadow: '0 12px 32px rgba(0, 20, 50, 0.15)',
                  zIndex: 2000,
                  maxHeight: '230px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '8px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', background: '#f1f5f9' }}>
                  Matching Locations ({searchResults.length})
                </div>
                {searchResults.map((item, idx) => (
                  <div
                    key={item.place_id || idx}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <i className="bi bi-geo-alt-fill text-danger" style={{ fontSize: '1.1rem' }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.display_name.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.display_name}
                      </div>
                    </div>
                    <span className="badge bg-light text-secondary border small">
                      {parseFloat(item.lat).toFixed(3)}, {parseFloat(item.lon).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Quick Preset Regional Buttons */}
          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap" style={{ fontSize: '0.78rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Quick Zones:</span>
            {SRI_LANKA_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => moveToLocation(preset.lat, preset.lng, preset.name)}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  color: '#334155',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0f2fe';
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.color = '#0369a1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================================
            LEAFLET MAP CONTAINER
           ===================================================================== */}
        <div style={{ position: 'relative', width: '100%', height: '420px', background: '#e2e8f0' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

          {/* Map Helper Badge Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              zIndex: 500,
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <i className="bi bi-hand-index-thumb text-warning"></i>
            <span>Click anywhere or drag green marker to pinpoint site</span>
          </div>

          {/* Geocoding indicator */}
          {isGeocoding && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '14px',
                zIndex: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                color: '#0284c7',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div className="spinner-border spinner-border-sm text-primary" style={{ width: '12px', height: '12px' }}></div>
              <span>Detecting address...</span>
            </div>
          )}
        </div>

        {/* =====================================================================
            SELECTED LOCATION HUD & ACTIONS
           ===================================================================== */}
        <div
          style={{
            padding: '18px 28px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Resolved Place & Coordinates Preview */}
          <div style={{ flex: '1 1 360px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Selected Hub Location / Address:
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
                {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
              </span>
            </div>

            <input
              type="text"
              value={resolvedAddress}
              onChange={(e) => setResolvedAddress(e.target.value)}
              placeholder="Address / Area Name (e.g. Negombo Coastal Road, Negombo)"
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

          {/* Action Buttons */}
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
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 24px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <i className="bi bi-check2-circle" style={{ fontSize: '1.1rem' }}></i>
              <span>Apply Location to Hub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
