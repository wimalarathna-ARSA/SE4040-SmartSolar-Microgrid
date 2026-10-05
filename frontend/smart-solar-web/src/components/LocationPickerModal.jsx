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

// Custom glowing pin icon for Solar Microgrid hubs (Bootstrap + Tailwind classes only)
const solarHubIcon = L.divIcon({
  className: 'solar-hub-map-marker',
  html: `
    <div class="d-flex align-items-center justify-content-center rounded-full border border-2 border-white text-white bg-[#063127] w-[38px] h-[38px] text-[18px] cursor-grab">
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

  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1',
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(searchQuery.trim()) + '&limit=5&countrycodes=lk&addressdetails=1',
        { headers: { 'Accept-Language': 'en' } }
      );

      let data = [];
      if (res.ok) {
        data = await res.json();
      }

      if (!data || data.length === 0) {
        const fallbackRes = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(searchQuery.trim()) + '&limit=5&addressdetails=1',
          { headers: { 'Accept-Language': 'en' } }
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

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name.split(',').slice(0, 3).join(',').trim();
    moveToLocation(lat, lng, label || result.display_name);
    setSearchResults([]);
    setSearchQuery(label || result.display_name);
  };

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

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        icon: solarHubIcon,
        draggable: true,
        title: 'Solar Microgrid Hub Location (Drag to reposition)',
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-1 small">
          <strong class="d-block text-[#063127] fs-6">Solar Hub Site</strong>
          <span>Drag this marker to pin exact solar node.</span>
        </div>
      `);

      marker.on('dragend', (e) => {
        const latlng = e.target.getLatLng();
        const lat = latlng.lat;
        const lng = latlng.lng;
        setCurrentCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) });
        reverseGeocode(lat, lng);
      });

      map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) });
        reverseGeocode(lat, lng);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApply = () => {
    onApply({
      location: resolvedAddress.trim() || ('GPS (' + currentCoords.latitude.toFixed(4) + ', ' + currentCoords.longitude.toFixed(4) + ')'),
      latitude: parseFloat(currentCoords.latitude.toFixed(6)),
      longitude: parseFloat(currentCoords.longitude.toFixed(6)),
    });
    onClose();
  };

  if (!isOpen) return null;

  const zClass = 'z-[10000]';

  return (
    <div
      className={'modal d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 overflow-auto p-3 ' + zClass}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-lg mx-auto my-3" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 overflow-hidden border border-light shadow-lg d-flex flex-column font-sans">
          {/* MODAL HEADER */}
          <div className="modal-header bg-white border-bottom d-flex justify-content-between align-items-center px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-[#063127] text-white w-[42px] h-[42px] fs-5 shadow-sm">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div>
                <h3 className="fs-5 fw-bolder text-[#063127] m-0">
                  Interactive Microgrid Map &amp; Place Search
                </h3>
                <p className="text-[0.8rem] text-[#686053] m-0 mt-1">
                  Search any location, click or drag the pin to set the exact solar station node coordinates.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-close bg-light rounded-full p-2 hover:bg-[#F8F8F8] hover:text-[#063127]"
              aria-label="Close"
            />
          </div>

          {/* SEARCH & PRESET BAR */}
          <div className="bg-light border-bottom px-4 pt-3 pb-2">
            <form onSubmit={handleSearch} className="position-relative">
              <div className="d-flex gap-2">
                <div className="position-relative flex-fill">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type="text"
                    placeholder="Search city, town, landmark, street (e.g. Negombo Beach, Galle Fort, Kandy Lake, Colombo 03)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control ps-5 pe-5 text-[0.9rem] rounded-3 border-info shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-2 hover:text-[#063127]"
                      aria-label="Clear search"
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-3 px-4 text-[0.88rem] fw-semibold d-flex align-items-center gap-2 shadow-sm flex-shrink-0 hover:shadow"
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

              {searchResults.length > 0 && (
                <div className="position-absolute top-100 start-0 w-100 mt-1 bg-white rounded-3 border shadow-lg overflow-auto z-[2000] max-h-[230px]">
                  <div className="px-3 py-2 text-[0.74rem] fw-bold text-[#686053] text-uppercase bg-light">
                    Matching Locations ({searchResults.length})
                  </div>
                  {searchResults.map((item, idx) => (
                    <div
                      key={item.place_id || idx}
                      onClick={() => handleSelectResult(item)}
                      className="px-3 py-2 d-flex align-items-center gap-3 border-bottom cursor-pointer hover:bg-[#063127] hover:bg-opacity-10"
                      role="button"
                      tabIndex={0}
                    >
                      <i className="bi bi-geo-alt-fill text-danger fs-5"></i>
                      <div className="flex-fill min-w-0">
                        <div className="text-[0.86rem] fw-semibold text-[#063127] text-truncate">
                          {item.display_name.split(',')[0]}
                        </div>
                        <div className="text-[0.75rem] text-[#686053] text-truncate">
                          {item.display_name}
                        </div>
                      </div>
                      <span className="badge bg-white text-[#686053] border small">
                        {parseFloat(item.lat).toFixed(3)}, {parseFloat(item.lon).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <div className="d-flex align-items-center gap-2 mt-2 flex-wrap text-[0.78rem]">
              <span className="text-[#686053] fw-semibold">Quick Zones:</span>
              {SRI_LANKA_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => moveToLocation(preset.lat, preset.lng, preset.name)}
                  className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-3 text-[0.75rem] fw-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* LEAFLET MAP CONTAINER */}
          <div className="position-relative w-100 bg-[#F8F8F8] h-[420px] w-100">
            <div ref={mapContainerRef} className="w-100 h-100 z-[1]" />

            <div className="position-absolute top-0 start-0 m-3 z-[500] bg-dark bg-opacity-75 text-white rounded-pill px-3 py-1 text-[0.75rem] fw-semibold d-flex align-items-center gap-1 shadow backdrop-blur">
              <i className="bi bi-hand-index-thumb text-warning"></i>
              <span>Click anywhere or drag green marker to pinpoint site</span>
            </div>

            {isGeocoding && (
              <div className="position-absolute top-0 end-0 m-3 z-[500] bg-white bg-opacity-95 rounded-pill px-3 py-1 text-[0.75rem] text-primary fw-semibold d-flex align-items-center gap-1 shadow">
                <div className="spinner-border spinner-border-sm text-primary w-[12px] h-[12px]" role="status"></div>
                <span>Detecting address...</span>
              </div>
            )}
          </div>

          {/* SELECTED LOCATION HUD & ACTIONS */}
          <div className="modal-footer bg-white border-top px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="flex-fill min-w-[360px]">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="text-[0.74rem] fw-bold text-[#686053] text-uppercase tracking-wide">
                  Selected Hub Location / Address:
                </span>
                <span className="badge bg-[#063127]/10 text-[#063127] border border-[#063127]/20 rounded-pill px-2 text-[0.72rem] animate-pulse">
                  <i className="bi bi-crosshair me-1"></i>
                  {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
                </span>
              </div>

              <input
                type="text"
                value={resolvedAddress}
                onChange={(e) => setResolvedAddress(e.target.value)}
                placeholder="Address / Area Name (e.g. Negombo Coastal Road, Negombo)"
                className="form-control bg-light text-[0.88rem] fw-semibold rounded-2"
              />
            </div>

            <div className="d-flex align-items-center gap-2 ms-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 text-[0.88rem] fw-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 text-[0.88rem] fw-bold d-flex align-items-center gap-2 shadow hover:shadow-lg hover:-translate-y-[1px] transition"
              >
                <i className="bi bi-check2-circle fs-5"></i>
                <span>Apply Location to Hub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
