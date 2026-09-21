// ============================================================================
// File: ActiveHubsSection.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Interactive solar microgrid hub showcase with dynamic station metadata.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card3D from './Card3D';

function getStationProvince(station) {
  const loc = (station?.location || '').toLowerCase();
  const name = (station?.name || '').toLowerCase();

  if (
    loc.includes('colombo') ||
    loc.includes('western') ||
    name.includes('colombo')
  ) {
    return 'Western Province';
  }

  if (
    loc.includes('kandy') ||
    loc.includes('central') ||
    loc.includes('peradeniya') ||
    name.includes('kandy')
  ) {
    return 'Central Province';
  }

  if (
    loc.includes('galle') ||
    loc.includes('southern') ||
    loc.includes('matara') ||
    name.includes('galle')
  ) {
    return 'Southern Province';
  }

  if (
    loc.includes('jaffna') ||
    loc.includes('northern') ||
    name.includes('jaffna')
  ) {
    return 'Northern Province';
  }

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
  const code = (station?.stationCode || '').toUpperCase();
  const name = (station?.name || '').toLowerCase();

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
        hubList[0].id || hubList[0].stationCode
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
              activeStation?.stationCode === station.stationCode;

            const shortName =
              station.name.split(' ')[0];

            return (
              <button
                key={station.id || station.stationCode}
                onClick={() =>
                  setSelectedId(
                    station.id || station.stationCode
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

          <div className="glass-panel p-4 h-100">

            <div className="d-flex justify-content-between align-items-center mb-3">

              <span className="text-uppercase small text-secondary fw-bold">
                <i className="bi bi-radar me-1 text-info" />
                Geographic Island Grid Radar
              </span>

              <span className="badge bg-primary bg-opacity-25 text-info border border-primary border-opacity-50">
                Click Any Node to Inspect
              </span>

            </div>

            <div
              className="rounded-4 d-flex flex-column align-items-center justify-content-center text-center"
              style={{
                height: '370px',
                background:
                  'radial-gradient(circle, rgba(2,132,199,.18), rgba(7,23,40,.8))',
              }}
            >
              <i
                className={`bi ${activeMeta.icon} text-info`}
                style={{ fontSize: '5rem' }}
              />

              <h5 className="text-white mt-4">
                {activeProvince}
              </h5>

              <p className="text-secondary mb-2">
                {activeMeta.type}
              </p>

              <span
                className="badge"
                style={{
                  backgroundColor:
                    `${activeMeta.accentColor}30`,
                  color: activeMeta.accentColor,
                  border:
                    `1px solid ${activeMeta.accentColor}`,
                }}
              >
                {activeMeta.tag}
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

                    <span className="badge bg-primary fs-6 px-3 py-1">
                      {activeStation.stationCode}
                    </span>

                    <span className="badge bg-success bg-opacity-25 text-success border border-success">
                      <i className="bi bi-check-circle-fill me-1" />
                      {activeStation.status}
                    </span>

                    <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary">
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
                  className="btn btn-outline-info btn-sm rounded-pill"
                >
                  <i className="bi bi-cpu me-1" />
                  Full Telemetry
                </Link>

              </div>

              <div className="row g-3">

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small">
                      Capacity
                    </div>
                    <div className="fs-5 fw-bold text-warning mt-1">
                      {activeStation.capacityKWh} kW
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small">
                      Irradiance
                    </div>
                    <div className="fs-5 fw-bold text-info mt-1">
                      {activeMeta.irradiance}
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small">
                      Bookings
                    </div>
                    <div className="fs-5 fw-bold text-success mt-1">
                      {activeStation.activeReservationsCount || 0}
                    </div>
                  </div>
                </div>

                <div className="col-sm-3 col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                    <div className="text-secondary small">
                      Schedule
                    </div>
                    <div className="small fw-bold text-light mt-2">
                      {activeStation.operationalSchedule}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 mt-4 border-top border-secondary border-opacity-25 flex-wrap gap-2">

              <div className="small text-secondary">
                <i className="bi bi-geo-alt-fill text-info me-1" />
                {activeStation.location}
              </div>

              <Link
                to="/login"
                className="btn btn-warning fw-bold btn-sm px-3"
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