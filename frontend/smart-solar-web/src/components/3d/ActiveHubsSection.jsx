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

function projectCoords(lat, lng) {
  const minLat = 5.8, maxLat = 9.9;
  const minLng = 79.5, maxLng = 82.0;

  const clampedLat = Math.max(
    minLat,
    Math.min(maxLat, lat || 6.9)
  );

  const clampedLng = Math.max(
    minLng,
    Math.min(maxLng, lng || 79.8)
  );

  const y =
    35 +
    ((maxLat - clampedLat) /
      (maxLat - minLat)) *
      (360 - 35);

  const x =
    30 +
    ((clampedLng - minLng) /
      (maxLng - minLng)) *
      (230 - 30);

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

function getStationProvince(station) {
  const loc = (station?.location || '').toLowerCase();
  const name = (station?.name || '').toLowerCase();

  if (
    loc.includes('colombo') ||
    loc.includes('western') ||
    name.includes('colombo')
  ) return 'Western Province';

  if (
    loc.includes('kandy') ||
    loc.includes('central') ||
    loc.includes('peradeniya') ||
    name.includes('kandy')
  ) return 'Central Province';

  if (
    loc.includes('galle') ||
    loc.includes('southern') ||
    loc.includes('matara') ||
    name.includes('galle')
  ) return 'Southern Province';

  if (
    loc.includes('jaffna') ||
    loc.includes('northern') ||
    name.includes('jaffna')
  ) return 'Northern Province';

  if (station?.latitude > 8.5) {
    return 'Northern Province';
  }

  if (station?.latitude < 6.4) {
    return 'Southern Province';
  }

  if (station?.longitude > 80.4) {
    return 'Central Province';
  }

  return 'Western Province';
}

function getStationVisualMeta(station) {
  const code =
    (station?.stationCode || '').toUpperCase();

  const name =
    (station?.name || '').toLowerCase();

  if (
    code.includes('JAFFNA') ||
    name.includes('jaffna')
  ) {
    return {
      type: 'High-Irradiance Utility Solar Park',
      weather: '33°C • Intense Solar Field',
      irradiance: '990 W/m²',
      icon: 'bi-sun-fill',
      tag: 'Northern Utility Scale Hub',
      accentColor: '#a855f7',
    };
  }

  if (
    code.includes('KANDY') ||
    name.includes('kandy')
  ) {
    return {
      type: 'Hillside High-Altitude PV Array',
      weather: '26°C • Partly Cloudy',
      irradiance: '820 W/m²',
      icon: 'bi-tree-fill',
      tag: 'Central Highland Hybrid Node',
      accentColor: '#10b981',
    };
  }

  if (
    code.includes('GALLE') ||
    name.includes('galle')
  ) {
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

  const hubList =
    stations && stations.length > 0
      ? stations
      : fallbackStations;

  const [selectedId, setSelectedId] = useState(
    hubList[0]?.id || hubList[0]?.stationCode
  );

  useEffect(() => {
    if (
      hubList.length > 0 &&
      !hubList.some(
        (station) =>
          station.id === selectedId ||
          station.stationCode === selectedId
      )
    ) {
      setSelectedId(
        hubList[0].id ||
        hubList[0].stationCode
      );
    }
  }, [hubList, selectedId]);

  const activeStation =
    hubList.find(
      (station) =>
        station.id === selectedId ||
        station.stationCode === selectedId
    ) || hubList[0];

  const activeProvince =
    getStationProvince(activeStation);

  const activeMeta =
    getStationVisualMeta(activeStation);

  const estimatedRealtimeOutputKw =
    (activeStation.capacityKWh * 0.86).toFixed(1);

  const occupiedSlots =
    activeStation.totalBatterySlots -
    activeStation.availableBatterySlots;

  const mappedStations = hubList.map((station) => ({
    ...station,
    coords: projectCoords(
      station.latitude,
      station.longitude
    ),
    meta: getStationVisualMeta(station),
    province: getStationProvince(station),
  }));

  const sortedByLat = [...mappedStations].sort(
    (a, b) => b.latitude - a.latitude
  );

  if (!activeStation) {
    return null;
  }

  return (
    <section className="container my-5">

      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">

        <div>
          <h2 className="display-6 fw-bold text-white mb-1">
            Active Microgrid Hubs{' '}
            <span className="text-info glow-text-cyan">
              (Sri Lanka)
            </span>
          </h2>

          <p className="text-secondary mb-0">
            Real-time GPS nodes with dual-axis PV generation,
            battery slot capacity, and autonomous trading schedules.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">

          {hubList.map((station) => {

            const isCurrent =
              activeStation?.id === station.id ||
              activeStation?.stationCode ===
                station.stationCode;

            const shortName =
              station.name.split(' ')[0];

            return (
              <button
                key={
                  station.id ||
                  station.stationCode
                }
                onClick={() =>
                  setSelectedId(
                    station.id ||
                    station.stationCode
                  )
                }
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${
                  isCurrent
                    ? 'btn-primary text-white shadow-lg border border-info'
                    : 'glass-panel text-secondary border-0'
                }`}
                style={{
                  boxShadow: isCurrent
                    ? '0 0 15px rgba(56, 189, 248, 0.5)'
                    : undefined,
                }}
              >
                <i
                  className={`bi bi-${
                    isCurrent
                      ? 'check-circle-fill text-warning'
                      : 'circle text-secondary'
                  }`}
                />

                <span>{shortName}</span>

                <span className="badge bg-dark bg-opacity-75 text-info ms-1 small">
                  {station.capacityKWh} kW
                </span>
              </button>
            );
          })}

        </div>
      </div>

      <div className="row g-4">

        <div className="col-lg-5">

          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">

            <div className="d-flex justify-content-between align-items-center mb-2">

              <span className="text-uppercase small text-secondary fw-bold">
                <i className="bi bi-radar me-1 text-info" />
                Geographic Island Grid Radar
              </span>

              <span className="badge bg-primary bg-opacity-25 text-info border border-primary border-opacity-50 px-2 py-1 small">
                Click Any Node to Inspect
              </span>

            </div>

            <div
              className="position-relative d-flex justify-content-center my-2"
              style={{ height: '370px' }}
            >

              <svg
                viewBox="0 0 260 390"
                className="w-100 h-100"
                style={{
                  filter:
                    'drop-shadow(0 0 20px rgba(2, 132, 199, 0.25))',
                }}
              >

                <defs>

                  <linearGradient
                    id="gridPulseLive"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="#38bdf8"
                      stopOpacity="0.9"
                    />
                    <stop
                      offset="50%"
                      stopColor="#0284c7"
                      stopOpacity="0.4"
                    />
                    <stop
                      offset="100%"
                      stopColor="#38bdf8"
                      stopOpacity="0.9"
                    />
                  </linearGradient>

                  <linearGradient
                    id="islandGradLive"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="#0c2540"
                    />
                    <stop
                      offset="100%"
                      stopColor="#071728"
                    />
                  </linearGradient>

                </defs>

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

                {sortedByLat.map((station, index) => {

                  if (
                    index ===
                    sortedByLat.length - 1
                  ) {
                    return null;
                  }

                  const nextStation =
                    sortedByLat[index + 1];

                  return (
                    <line
                      key={`gridline-${station.id}-${nextStation.id}`}
                      x1={station.coords.x}
                      y1={station.coords.y}
                      x2={nextStation.coords.x}
                      y2={nextStation.coords.y}
                      stroke="url(#gridPulseLive)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="40;0"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </line>
                  );
                })}

                {mappedStations.map((station) => {

                  const isSelected =
                    activeStation?.id === station.id ||
                    activeStation?.stationCode ===
                      station.stationCode;

                  const avail = Number(
                    station.availableBatterySlots ?? 0
                  );

                  const total = Number(
                    station.totalBatterySlots ?? 0
                  );

                  let slotColor = '#ef4444';
                  let slotStatusText =
                    '0 Slots (Full)';

                  if (
                    total > 0 &&
                    avail > total / 2
                  ) {
                    slotColor = '#10b981';
                    slotStatusText =
                      `${avail}/${total} (>50%)`;
                  } else if (avail > 0) {
                    slotColor = '#f59e0b';
                    slotStatusText =
                      `${avail}/${total} (<50%)`;
                  }

                  const shortTitle =
                    station.name.split(' ')[0];

                  return (
                    <g
                      key={
                        station.id ||
                        station.stationCode
                      }
                      onClick={() =>
                        setSelectedId(
                          station.id ||
                          station.stationCode
                        )
                      }
                      style={{
                        cursor: 'pointer',
                      }}
                    >

                      {isSelected && (
                        <circle
                          cx={station.coords.x}
                          cy={station.coords.y}
                          r="18"
                          fill={slotColor}
                          fillOpacity="0.3"
                          className="radar-ring"
                        />
                      )}

                      <circle
                        cx={station.coords.x}
                        cy={station.coords.y}
                        r={
                          isSelected
                            ? '9'
                            : '7'
                        }
                        fill={slotColor}
                        stroke="#ffffff"
                        strokeWidth={
                          isSelected
                            ? '2.5'
                            : '1.8'
                        }
                      />

                      <circle
                        cx={station.coords.x}
                        cy={station.coords.y}
                        r={
                          isSelected
                            ? '3.5'
                            : '2.5'
                        }
                        fill="#ffffff"
                      />

                      <text
                        x={
                          station.coords.x +
                          (station.coords.x > 140
                            ? -14
                            : 14)
                        }
                        y={
                          station.coords.y + 4
                        }
                        fill={
                          isSelected
                            ? '#38bdf8'
                            : '#e2e8f0'
                        }
                        fontSize="12"
                        fontWeight={
                          isSelected
                            ? 'bold'
                            : '600'
                        }
                        textAnchor={
                          station.coords.x > 140
                            ? 'end'
                            : 'start'
                        }
                      >
                        {shortTitle}
                      </text>

                      <text
                        x={
                          station.coords.x +
                          (station.coords.x > 140
                            ? -14
                            : 14)
                        }
                        y={
                          station.coords.y + 17
                        }
                        fill={slotColor}
                        fontSize="9.5"
                        fontWeight="700"
                        textAnchor={
                          station.coords.x > 140
                            ? 'end'
                            : 'start'
                        }
                      >
                        {slotStatusText}
                      </text>

                    </g>
                  );
                })}

              </svg>

            </div>

            <div className="d-flex justify-content-center align-items-center gap-3 pt-2 pb-1 small flex-wrap">

              <div className="d-flex align-items-center gap-1">
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block',
                  }}
                />
                <span className="text-light">
                  &gt; 50% Slots (Green)
                </span>
              </div>

              <div className="d-flex align-items-center gap-1">
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    display: 'inline-block',
                  }}
                />
                <span className="text-light">
                  &lt; 50% Slots (Yellow)
                </span>
              </div>

              <div className="d-flex align-items-center gap-1">
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    display: 'inline-block',
                  }}
                />
                <span className="text-light">
                  0 Slots (Red)
                </span>
              </div>

            </div>

            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 small text-secondary">

              <span>
                <i className="bi bi-geo-alt-fill me-1 text-info" />
                Active:{' '}
                <strong className="text-info">
                  {activeStation.name}
                </strong>
              </span>

              <span className="text-success fw-semibold">
                <i className="bi bi-check2-all me-1" />
                {mappedStations.length}/
                {mappedStations.length}
                {' '}Grid Nodes Online
              </span>

            </div>

          </div>

        </div>

        <div className="col-lg-7">

          <Card3D
            maxTilt={10}
            className="glass-panel-glow p-4 h-100 d-flex flex-column justify-content-between text-white"
          >

            <div>

              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">

                <div>

                  <div className="d-flex align-items-center gap-2 mb-1">

                    <span className="badge bg-primary fs-6 px-3 py-1 fw-bold">
                      {activeStation.stationCode}
                    </span>

                    <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1 small">
                      <i className="bi bi-check-circle-fill me-1" />
                      {activeStation.status} (Operational)
                    </span>

                    <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary px-2 py-1 small">
                      {activeProvince}
                    </span>

                  </div>

                  <h3 className="fw-bold text-white mb-0 mt-1">
                    {activeStation.name}
                  </h3>

                  <div className="text-secondary small mt-1">
                    <i className="bi bi-tag me-1 text-info" />
                    {activeMeta.type}
                    {' • '}
                    <span className="text-warning">
                      {activeMeta.tag}
                    </span>
                  </div>

                </div>

                <Link
                  to="/login"
                  className="btn btn-outline-info btn-sm rounded-pill px-3"
                >
                  <i className="bi bi-cpu me-1" />
                  Full Telemetry
                </Link>

              </div>

              {/* Battery Slot Array */}

              <div
                className="p-3 rounded-3 mb-4"
                style={{
                  backgroundColor:
                    'rgba(7, 14, 26, 0.75)',
                  border:
                    '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span className="text-uppercase small fw-bold text-secondary">
                    <i className="bi bi-battery-charging text-success me-1" />
                    Battery Slot Array (LiFePO4 BESS)
                  </span>

                  <span className="small text-light">
                    <strong className="text-success">
                      {activeStation.availableBatterySlots}
                    </strong>
                    {' '}Available /{' '}
                    {activeStation.totalBatterySlots}
                    {' '}Total
                  </span>

                </div>

                <div className="d-flex gap-2 flex-wrap">

                  {Array.from({
                    length:
                      activeStation.totalBatterySlots ||
                      10,
                  }).map((_, index) => {

                    const isAvailable =
                      index <
                      (
                        activeStation.availableBatterySlots ||
                        0
                      );

                    return (
                      <div
                        key={index}
                        className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-2 ${
                          isAvailable
                            ? 'border border-success bg-success bg-opacity-10 text-success'
                            : 'border border-primary bg-primary bg-opacity-25 text-info'
                        }`}
                        style={{
                          minWidth: '46px',
                          minHeight: '52px',
                        }}
                        title={`Slot #${index + 1}: ${
                          isAvailable
                            ? 'Free for Prosumer Booking'
                            : 'Occupied / Energy Trading'
                        }`}
                      >

                        <i
                          className={`bi bi-${
                            isAvailable
                              ? 'battery-half'
                              : 'lightning-fill'
                          } fs-6`}
                        />

                        <span
                          className="fw-bold mt-1"
                          style={{
                            fontSize: '0.68rem',
                          }}
                        >
                          #{index + 1}
                        </span>

                      </div>
                    );
                  })}

                </div>

                <div
                  className="d-flex justify-content-between text-secondary mt-2"
                  style={{
                    fontSize: '0.72rem',
                  }}
                >
                  <span>
                    <i className="bi bi-square-fill text-success me-1" />
                    Green = Free ({activeStation.availableBatterySlots})
                  </span>

                  <span>
                    <i className="bi bi-square-fill text-info me-1" />
                    Blue = Occupied ({occupiedSlots})
                  </span>
                </div>

              </div>

              {/* Core Telemetry */}

              <div className="row g-3 mb-4">

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small text-uppercase">
                      Instant Output
                    </div>

                    <div className="fs-5 fw-bold text-warning mt-1">
                      {estimatedRealtimeOutputKw} kW
                    </div>

                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      Rated: {activeStation.capacityKWh} kW/h
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small text-uppercase">
                      Irradiance
                    </div>

                    <div className="fs-5 fw-bold text-info mt-1">
                      {activeMeta.irradiance}
                    </div>

                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      {activeMeta.weather}
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small text-uppercase">
                      Active Bookings
                    </div>

                    <div className="fs-5 fw-bold text-success mt-1">
                      {activeStation.activeReservationsCount || 0}
                    </div>

                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      Verified on Grid
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small text-uppercase">
                      Schedule
                    </div>

                    <div className="small fw-bold text-light mt-2">
                      {activeStation.operationalSchedule}
                    </div>

                    <div className="text-success" style={{ fontSize: '0.7rem' }}>
                      7-Day Rule Enforced
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25 flex-wrap gap-2">

              <div className="small text-secondary">
                <i className="bi bi-geo-alt-fill text-info me-1" />
                {activeStation.location}
                {' • GPS: '}
                {activeStation.latitude?.toFixed(4)},
                {' '}
                {activeStation.longitude?.toFixed(4)}
              </div>

              <Link
                to="/login"
                className="btn btn-warning fw-bold btn-sm px-3 shadow"
              >
                <i className="bi bi-calendar-plus me-1" />
                Book Slot via Mobile App
              </Link>

            </div>

          </Card3D>

        </div>

      </div>

    </section>
  );
};

export default ActiveHubsSection;