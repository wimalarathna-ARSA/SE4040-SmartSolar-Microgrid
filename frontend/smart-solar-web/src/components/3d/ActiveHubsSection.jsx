// ============================================================================
// File: ActiveHubsSection.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Active Sri Lanka solar microgrid hubs section.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card3D from './Card3D';

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

  const hubList = stations && stations.length > 0
    ? stations
    : fallbackStations;

  const [selectedId, setSelectedId] = useState(
    hubList[0]?.id || hubList[0]?.stationCode
  );

  const activeStation =
    hubList.find(
      (station) =>
        station.id === selectedId ||
        station.stationCode === selectedId
    ) || hubList[0];

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

            const shortName = station.name.split(' ')[0];

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
                Active Nodes
              </span>
            </div>

            <div
              className="rounded-4 p-4 text-center"
              style={{
                minHeight: '370px',
                background:
                  'radial-gradient(circle, rgba(2,132,199,.15), rgba(7,23,40,.8))',
              }}
            >
              <i
                className="bi bi-map text-info"
                style={{ fontSize: '5rem' }}
              />

              <h5 className="text-white mt-4">
                Sri Lanka Microgrid Network
              </h5>

              <p className="text-secondary">
                {hubList.length} active grid nodes connected
              </p>

              <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
                {hubList.map((station) => (
                  <span
                    key={station.id || station.stationCode}
                    className="badge bg-success bg-opacity-25 text-success border border-success"
                  >
                    {station.stationCode}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="col-lg-7">

          <Card3D
            maxTilt={10}
            className="glass-panel-glow p-4 h-100 d-flex flex-column justify-content-between text-white"
          >

            <div>

              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="badge bg-primary fs-6 px-3 py-1">
                    {activeStation.stationCode}
                  </span>

                  <h3 className="fw-bold text-white mb-1 mt-2">
                    {activeStation.name}
                  </h3>

                  <div className="text-secondary small">
                    <i className="bi bi-geo-alt me-1 text-info" />
                    {activeStation.location}
                  </div>
                </div>

                <span className="badge bg-success bg-opacity-25 text-success border border-success">
                  <i className="bi bi-check-circle-fill me-1" />
                  {activeStation.status}
                </span>
              </div>

              <div className="row g-3">

                <div className="col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 text-center">
                    <div className="text-secondary small">
                      Solar Capacity
                    </div>
                    <div className="fs-4 fw-bold text-info">
                      {activeStation.capacityKWh} kW
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 text-center">
                    <div className="text-secondary small">
                      Battery Slots
                    </div>
                    <div className="fs-4 fw-bold text-success">
                      {activeStation.availableBatterySlots}/
                      {activeStation.totalBatterySlots}
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 text-center">
                    <div className="text-secondary small">
                      Active Bookings
                    </div>
                    <div className="fs-4 fw-bold text-warning">
                      {activeStation.activeReservationsCount || 0}
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-50 text-center">
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

            <div className="border-top border-secondary border-opacity-25 pt-3 mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2">

              <span className="small text-secondary">
                <i className="bi bi-geo-alt-fill text-success me-1" />
                GPS: {activeStation.latitude?.toFixed(4)}, {activeStation.longitude?.toFixed(4)}
              </span>

              <Link
                to="/login"
                className="btn btn-warning btn-sm fw-bold"
              >
                <i className="bi bi-calendar-plus me-1" />
                Book Slot
              </Link>

            </div>

          </Card3D>

        </div>

      </div>

    </section>
  );
};

export default ActiveHubsSection;