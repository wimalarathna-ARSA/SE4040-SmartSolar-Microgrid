// ============================================================================
// File: ActiveHubsSection.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Interactive 3D and SVG station map showcasing active Sri Lanka solar microgrid hubs.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card3D from './Card3D';

// Helper to project Sri Lanka GPS coordinates to SVG viewBox (0 0 260 390)
function projectCoords(lat, lng) {
  const minLat = 5.8, maxLat = 9.9;
  const minLng = 79.5, maxLng = 82.0;

  const clampedLat = Math.max(minLat, Math.min(maxLat, lat || 6.9));
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng || 79.8));

  // Inverted Y: higher latitude is North (top of map, lower SVG Y)
  const y = 35 + ((maxLat - clampedLat) / (maxLat - minLat)) * (360 - 35);
  const x = 30 + ((clampedLng - minLng) / (maxLng - minLng)) * (230 - 30);
  return { x: Math.round(x), y: Math.round(y) };
}

// Dynamically resolve Province from location or coordinates
function getStationProvince(station) {
  const loc = (station?.location || '').toLowerCase();
  const name = (station?.name || '').toLowerCase();

  if (loc.includes('colombo') || loc.includes('western') || name.includes('colombo')) return 'Western Province';
  if (loc.includes('kandy') || loc.includes('central') || loc.includes('peradeniya') || name.includes('kandy')) return 'Central Province';
  if (loc.includes('galle') || loc.includes('southern') || loc.includes('matara') || name.includes('galle')) return 'Southern Province';
  if (loc.includes('jaffna') || loc.includes('northern') || name.includes('jaffna')) return 'Northern Province';

  // Coordinate fallback
  if (station?.latitude > 8.5) return 'Northern Province';
  if (station?.latitude < 6.4) return 'Southern Province';
  if (station?.longitude > 80.4) return 'Central Province';
  return 'Western Province';
}

// Dynamic station metadata (weather, icon, system type)
function getStationVisualMeta(station) {
  const code = (station?.stationCode || '').toUpperCase();
  const name = (station?.name || '').toLowerCase();

  if (code.includes('JAFFNA') || name.includes('jaffna')) {
    return {
      type: 'High-Irradiance Utility Solar Park',
      weather: '33°C • Intense Solar Field',
      irradiance: '990 W/m²',
      icon: 'bi-sun-fill',
      tag: 'Northern Utility Scale Hub',
      accentColor: '#a855f7',
    };
  }
  if (code.includes('KANDY') || name.includes('kandy')) {
    return {
      type: 'Hillside High-Altitude PV Array',
      weather: '26°C • Partly Cloudy',
      irradiance: '820 W/m²',
      icon: 'bi-tree-fill',
      tag: 'Central Highland Hybrid Node',
      accentColor: '#10b981',
    };
  }
  if (code.includes('GALLE') || name.includes('galle')) {
    return {
      type: 'Coastal Maritime Microgrid & BESS',
      weather: '29°C • Clear Coastal Sky',
      irradiance: '945 W/m²',
      icon: 'bi-water',
      tag: 'Southern Maritime Node',
      accentColor: '#f59e0b',
    };
  }
  return {
    type: 'Commercial Rooftop & Port BESS',
    weather: '31°C • Sunny Maritime',
    irradiance: '925 W/m²',
    icon: 'bi-buildings-fill',
    tag: 'Western Urban Logistics Hub',
    accentColor: '#0284c7',
  };
}

const ActiveHubsSection = ({ stations = [] }) => {
  // Real database seeded fallback stations
  const fallbackStations = [
    {
      id: '6aab52c1d031de95baf2ff7b',
      stationCode: 'HUB-COLOMBO-01',
      name: 'Colombo Central Solar Hub',
      location: 'Union Place, Colombo 02',
      latitude: 6.9175,
      longitude: 79.8654,
      capacityKWh: 250,
      availableBatterySlots: 14,
      totalBatterySlots: 20,
      operationalSchedule: 'Mon-Sun 06:00-22:00',
      status: 'Active',
      activeReservationsCount: 2,
    },
    {
      id: '6aab52c1d031de95baf2ff7c',
      stationCode: 'HUB-KANDY-02',
      name: 'Kandy Hill Microgrid Hub',
      location: 'Peradeniya Road, Kandy',
      latitude: 7.2906,
      longitude: 80.6337,
      capacityKWh: 180,
      availableBatterySlots: 11,
      totalBatterySlots: 15,
      operationalSchedule: 'Mon-Sat 06:00-20:00',
      status: 'Active',
      activeReservationsCount: 0,
    },
    {
      id: '6aab52c1d031de95baf2ff7d',
      stationCode: 'HUB-GALLE-03',
      name: 'Galle Coastal Solar Station',
      location: 'Matara Road, Galle',
      latitude: 6.0535,
      longitude: 80.221,
      capacityKWh: 300,
      availableBatterySlots: 20,
      totalBatterySlots: 25,
      operationalSchedule: 'Mon-Sun 07:00-21:00',
      status: 'Active',
      activeReservationsCount: 0,
    },
    {
      id: '6aab52c1d031de95baf2ff7e',
      stationCode: 'HUB-JAFFNA-04',
      name: 'Jaffna Peninsula Solar Array',
      location: 'Hospital Road, Jaffna',
      latitude: 9.6615,
      longitude: 80.0255,
      capacityKWh: 350,
      availableBatterySlots: 27,
      totalBatterySlots: 30,
      operationalSchedule: 'Mon-Sun 06:00-22:00',
      status: 'Active',
      activeReservationsCount: 0,
    },
  ];

  const hubList = stations && stations.length > 0 ? stations : fallbackStations;

  // Selected station ID
  const [selectedId, setSelectedId] = useState(hubList[0]?.id || hubList[0]?.stationCode);
  const [inspectModalHub, setInspectModalHub] = useState(null);

  // Sync if stations array updates
  useEffect(() => {
    if (hubList.length > 0 && !hubList.some((s) => s.id === selectedId || s.stationCode === selectedId)) {
      setSelectedId(hubList[0].id || hubList[0].stationCode);
    }
  }, [hubList, selectedId]);

  // Find the active station from real database list
  const activeStation =
    hubList.find((s) => s.id === selectedId || s.stationCode === selectedId) || hubList[0];

  const activeProvince = getStationProvince(activeStation);
  const activeMeta = getStationVisualMeta(activeStation);

  // Real-time calculated output based on capacity
  const estimatedRealtimeOutputKw = (activeStation.capacityKWh * 0.86).toFixed(1);
  const occupiedSlots = activeStation.totalBatterySlots - activeStation.availableBatterySlots;

  // Compute map coordinates for all stations
  const mappedStations = hubList.map((st) => ({
    ...st,
    coords: projectCoords(st.latitude, st.longitude),
    meta: getStationVisualMeta(st),
    province: getStationProvince(st),
  }));

  // Sort stations from North to South for drawing the transmission grid line
  const sortedByLat = [...mappedStations].sort((a, b) => b.latitude - a.latitude);

  return (
    <section className="container my-5">
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
        <div>
          <h2 className="display-6 fw-bold text-white mb-1">
            Active Microgrid Hubs <span className="text-info glow-text-cyan">(Sri Lanka)</span>
          </h2>
          <p className="text-secondary mb-0">
            Real-time GPS nodes with dual-axis PV generation, battery slot capacity, and autonomous trading schedules.
          </p>
        </div>

        {/* Dynamic Station Selector Pills */}
        <div className="d-flex gap-2 flex-wrap">
          {hubList.map((st) => {
            const isCurrent = activeStation?.id === st.id || activeStation?.stationCode === st.stationCode;
            const shortName = st.name.split(' ')[0]; // e.g. "Colombo", "Kandy"
            return (
              <button
                key={st.id || st.stationCode}
                onClick={() => setSelectedId(st.id || st.stationCode)}
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                  isCurrent
                    ? 'btn-primary text-white shadow-lg border border-info'
                    : 'glass-panel text-secondary border-0'
                }`}
                style={{
                  boxShadow: isCurrent ? '0 0 15px rgba(56, 189, 248, 0.5)' : undefined,
                }}
              >
                <i className={`bi bi-${isCurrent ? 'check-circle-fill text-warning' : 'circle text-secondary'}`}></i>
                <span>{shortName}</span>
                <span className="badge bg-dark bg-opacity-75 text-info ms-1 small">
                  {st.capacityKWh} kW
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Showcase: Sri Lanka Microgrid Radar Map + Selected Node Telemetry Cockpit */}
      <div className="row g-4">
        {/* Left: Interactive Sri Lanka Radar Map */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase small text-secondary fw-bold">
                <i className="bi bi-radar me-1 text-info"></i> Geographic Island Grid Radar
              </span>
              <span className="badge bg-primary bg-opacity-25 text-info border border-primary border-opacity-50 px-2 py-1 small">
                Click Any Node to Inspect
              </span>
            </div>

            {/* Futuristic Sri Lanka Silhouette Map SVG */}
            <div className="position-relative d-flex justify-content-center my-2" style={{ height: '370px' }}>
              <svg viewBox="0 0 260 390" className="w-100 h-100" style={{ filter: 'drop-shadow(0 0 20px rgba(2, 132, 199, 0.25))' }}>
                <defs>
                  {/* Glowing electric grid path gradient */}
                  <linearGradient id="gridPulseLive" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Island fill gradient */}
                  <linearGradient id="islandGradLive" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0c2540" />
                    <stop offset="100%" stopColor="#071728" />
                  </linearGradient>
                </defs>

                {/* Sri Lanka Geographic Island Silhouette Path */}
                <path
                  d="M 110 30 
                     C 125 35, 140 55, 135 75 
                     C 130 95, 160 120, 165 150 
                     C 170 180, 185 215, 170 255 
                     C 160 285, 140 335, 115 360 
                     C 100 375, 85 355, 75 335 
                     C 65 305, 55 265, 60 225 
                     C 65 185, 70 145, 80 105 
                     C 85 75, 95 45, 110 30 Z"
                  fill="url(#islandGradLive)"
                  stroke="#1e3a5f"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Dynamic Inter-Connecting Power Transmission Lines */}
                {sortedByLat.map((st, i) => {
                  if (i === sortedByLat.length - 1) return null;
                  const nextSt = sortedByLat[i + 1];
                  return (
                    <line
                      key={`gridline-${st.id}-${nextSt.id}`}
                      x1={st.coords.x}
                      y1={st.coords.y}
                      x2={nextSt.coords.x}
                      y2={nextSt.coords.y}
                      stroke="url(#gridPulseLive)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    >
                      <animate attributeName="stroke-dashoffset" values="40;0" dur="2s" repeatCount="indefinite" />
                    </line>
                  );
                })}

                {/* Dynamic Station Node Markers from Real Database */}
                {mappedStations.map((st) => {
                  const isSelected = activeStation?.id === st.id || activeStation?.stationCode === st.stationCode;
                  
                  // Calculate slot availability color
                  const avail = Number(st.availableBatterySlots ?? 0);
                  const total = Number(st.totalBatterySlots ?? 0);
                  let slotColor = '#ef4444'; // Red: no slots
                  let slotStatusText = '0 Slots (Full)';
                  if (total > 0 && avail > total / 2) {
                    slotColor = '#10b981'; // Green: > 50%
                    slotStatusText = `${avail}/${total} (>50%)`;
                  } else if (avail > 0) {
                    slotColor = '#f59e0b'; // Yellow: < 50%
                    slotStatusText = `${avail}/${total} (<50%)`;
                  }

                  const shortTitle = st.name.split(' ')[0];

                  return (
                    <g
                      key={st.id || st.stationCode}
                      onClick={() => setSelectedId(st.id || st.stationCode)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Pulsing Radar Ring on Selected */}
                      {isSelected && (
                        <circle
                          cx={st.coords.x}
                          cy={st.coords.y}
                          r="18"
                          fill={slotColor}
                          fillOpacity="0.3"
                          className="radar-ring"
                        />
                      )}
                      {/* Marker Outer Circle with Slot Availability Color */}
                      <circle
                        cx={st.coords.x}
                        cy={st.coords.y}
                        r={isSelected ? '9' : '7'}
                        fill={slotColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                      />
                      {/* Center Pin Indicator */}
                      <circle
                        cx={st.coords.x}
                        cy={st.coords.y}
                        r={isSelected ? '3.5' : '2.5'}
                        fill="#ffffff"
                      />
                      {/* Station Label */}
                      <text
                        x={st.coords.x + (st.coords.x > 140 ? -14 : 14)}
                        y={st.coords.y + 4}
                        fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                        fontSize="12"
                        fontWeight={isSelected ? 'bold' : '600'}
                        textAnchor={st.coords.x > 140 ? 'end' : 'start'}
                      >
                        {shortTitle}
                      </text>
                      <text
                        x={st.coords.x + (st.coords.x > 140 ? -14 : 14)}
                        y={st.coords.y + 17}
                        fill={slotColor}
                        fontSize="9.5"
                        fontWeight="700"
                        textAnchor={st.coords.x > 140 ? 'end' : 'start'}
                      >
                        {slotStatusText}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Radar Map Slot Availability Legend */}
            <div className="d-flex justify-content-center align-items-center gap-3 pt-2 pb-1 small flex-wrap" style={{ fontSize: '0.72rem' }}>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                <span className="text-light">&gt; 50% Slots (Green)</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                <span className="text-light">&lt; 50% Slots (Yellow)</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                <span className="text-light">0 Slots (Red)</span>
              </div>
            </div>

            {/* Radar Coordinates & Interconnection Status */}
            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 small text-secondary">
              <span>
                {(() => {
                  const avail = Number(activeStation.availableBatterySlots ?? 0);
                  const total = Number(activeStation.totalBatterySlots ?? 0);
                  const color = avail <= 0 ? '#ef4444' : (total > 0 && avail > total / 2) ? '#10b981' : '#f59e0b';
                  return <i className="bi bi-geo-alt-fill me-1" style={{ color }}></i>;
                })()}
                Active: <strong className="text-info">{activeStation.name}</strong>
              </span>
              <span className="text-success fw-semibold">
                <i className="bi bi-check2-all me-1"></i> {mappedStations.length}/{mappedStations.length} Grid Nodes Online
              </span>
            </div>
          </div>
        </div>

        {/* Right: Selected Hub High-Precision 3D Telemetry Cockpit */}
        <div className="col-lg-7">
          <Card3D maxTilt={10} className="glass-panel-glow p-4 h-100 d-flex flex-column justify-content-between text-white">
            <div>
              {/* Header with Real Database Hub Code & Status */}
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-primary fs-6 px-3 py-1 fw-bold">
                      {activeStation.stationCode}
                    </span>
                    <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1 small">
                      <i className="bi bi-check-circle-fill me-1"></i> {activeStation.status} (Operational)
                    </span>
                    <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary px-2 py-1 small">
                      {activeProvince}
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-0 mt-1">{activeStation.name}</h3>
                  <div className="text-secondary small mt-1">
                    <i className="bi bi-tag me-1 text-info"></i> {activeMeta.type} &bull; <span className="text-warning">{activeMeta.tag}</span>
                  </div>
                </div>

                <button
                  onClick={() => setInspectModalHub(activeStation)}
                  className="btn btn-outline-info btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
                >
                  <i className="bi bi-cpu"></i> Full Telemetry
                </button>
              </div>

              {/* Realistic 3D Battery Slot Rack Visualizer */}
              <div
                className="p-3 rounded-3 mb-4"
                style={{
                  backgroundColor: 'rgba(7, 14, 26, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-uppercase small fw-bold text-secondary d-flex align-items-center gap-1">
                    <i className="bi bi-battery-charging text-success"></i> Battery Slot Array (LiFePO4 BESS)
                  </span>
                  <span className="small text-light">
                    <strong className="text-success">{activeStation.availableBatterySlots}</strong> Available / {activeStation.totalBatterySlots} Total
                  </span>
                </div>

                {/* Individual Battery Slots Visual Grid */}
                <div className="d-flex gap-2 flex-wrap">
                  {Array.from({ length: activeStation.totalBatterySlots || 10 }).map((_, idx) => {
                    const isAvailable = idx < (activeStation.availableBatterySlots || 0);
                    return (
                      <div
                        key={idx}
                        className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-2 ${
                          isAvailable
                            ? 'border border-success bg-success bg-opacity-10 text-success'
                            : 'border border-primary bg-primary bg-opacity-25 text-info'
                        }`}
                        style={{ minWidth: '46px', minHeight: '52px', transition: 'all 0.2s ease' }}
                        title={`Slot #${idx + 1}: ${isAvailable ? 'Free for Prosumer Booking' : 'Occupied / Energy Trading'}`}
                      >
                        <i className={`bi bi-${isAvailable ? 'battery-half' : 'lightning-fill'} fs-6`}></i>
                        <span className="smaller fw-bold mt-1" style={{ fontSize: '0.68rem' }}>
                          #{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="d-flex justify-content-between smaller text-secondary mt-2" style={{ fontSize: '0.72rem' }}>
                  <span><i className="bi bi-square-fill text-success me-1"></i> Green = Free for 7-Day Booking ({activeStation.availableBatterySlots})</span>
                  <span><i className="bi bi-square-fill text-info me-1"></i> Blue = Occupied &amp; Trading ({occupiedSlots})</span>
                </div>
              </div>

              {/* 4 Core Real-Time Telemetry Counters */}
              <div className="row g-3 mb-4">
                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary smaller text-uppercase">Instant Output</div>
                    <div className="fs-5 fw-bold text-warning mt-1">{estimatedRealtimeOutputKw} kW</div>
                    <div className="smaller text-secondary" style={{ fontSize: '0.7rem' }}>
                      Rated: {activeStation.capacityKWh} kW/h
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary smaller text-uppercase">Irradiance</div>
                    <div className="fs-5 fw-bold text-info mt-1">{activeMeta.irradiance}</div>
                    <div className="smaller text-secondary" style={{ fontSize: '0.7rem' }}>
                      {activeMeta.weather}
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary smaller text-uppercase">Active Bookings</div>
                    <div className="fs-5 fw-bold text-success mt-1">{activeStation.activeReservationsCount || 0}</div>
                    <div className="smaller text-secondary" style={{ fontSize: '0.7rem' }}>
                      Verified on Grid
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary smaller text-uppercase">Schedule</div>
                    <div className="fs-6 fw-bold text-light mt-1">{activeStation.operationalSchedule}</div>
                    <div className="smaller text-success" style={{ fontSize: '0.7rem' }}>
                      7-Day Rule Enforced
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer: Location & Booking CTA */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="small text-secondary">
                {(() => {
                  const avail = Number(activeStation.availableBatterySlots ?? 0);
                  const total = Number(activeStation.totalBatterySlots ?? 0);
                  const color = avail <= 0 ? '#ef4444' : (total > 0 && avail > total / 2) ? '#10b981' : '#f59e0b';
                  return <i className="bi bi-geo-alt-fill me-1" style={{ color }}></i>;
                })()}
                {activeStation.location} &bull; GPS: {activeStation.latitude?.toFixed(4)}, {activeStation.longitude?.toFixed(4)}
              </div>
              <Link to="/login" className="btn btn-warning fw-bold btn-sm px-3 shadow">
                <i className="bi bi-calendar-plus me-1"></i> Book Slot via Mobile App
              </Link>
            </div>
          </Card3D>
        </div>
      </div>

      {/* Deep-Dive Inspection Modal */}
      {inspectModalHub && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)', zIndex: 1050, backdropFilter: 'blur(8px)' }}
          onClick={() => setInspectModalHub(null)}
        >
          <div
            className="glass-panel-glow p-4 rounded-4 text-white position-relative"
            style={{ maxWidth: '640px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary fs-6 px-3 py-1">{inspectModalHub.stationCode}</span>
                <h4 className="fw-bold mb-0 text-white">{inspectModalHub.name}</h4>
              </div>
              <button
                onClick={() => setInspectModalHub(null)}
                className="btn btn-sm btn-outline-secondary rounded-circle"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <p className="text-secondary small mb-3">
              {(() => {
                const avail = Number(inspectModalHub.availableBatterySlots ?? 0);
                const total = Number(inspectModalHub.totalBatterySlots ?? 0);
                const color = avail <= 0 ? '#ef4444' : (total > 0 && avail > total / 2) ? '#10b981' : '#f59e0b';
                return <i className="bi bi-geo-alt-fill me-1" style={{ color }}></i>;
              })()}
              {inspectModalHub.location} &bull; Coordinates: {inspectModalHub.latitude}, {inspectModalHub.longitude}
            </p>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <div className="text-secondary smaller">Rated Solar Capacity</div>
                  <div className="fs-4 fw-bold text-info">{inspectModalHub.capacityKWh} kW/h</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <div className="text-secondary smaller">Battery Rack Status</div>
                  <div className="fs-4 fw-bold text-success">
                    {inspectModalHub.availableBatterySlots} / {inspectModalHub.totalBatterySlots} Free
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <div className="text-secondary smaller">Operational Daily Window</div>
                  <div className="fs-5 fw-bold text-warning">{inspectModalHub.operationalSchedule}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <div className="text-secondary smaller">Active Reservations</div>
                  <div className="fs-5 fw-bold text-light">{inspectModalHub.activeReservationsCount || 0} Scheduled</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 mb-4 small text-secondary">
              <div className="text-white fw-bold mb-1">
                <i className="bi bi-shield-check text-success me-1"></i> FAT Service Architecture Notice
              </div>
              All slot reservations and battery dispatch schedules are cryptographically signed using HMAC-SHA256 and verified through the Grid Operator mobile camera scanner. Cancellations must be performed at least 12 hours before schedule.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button onClick={() => setInspectModalHub(null)} className="btn btn-outline-secondary btn-sm px-3">
                Close
              </button>
              <Link to="/login" className="btn btn-warning btn-sm px-4 fw-bold">
                Book This Station
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ActiveHubsSection;
