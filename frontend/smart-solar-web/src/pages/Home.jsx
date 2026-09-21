// ============================================================================
// File: Home.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Public landing page with solar microgrid platform introduction.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import FrequenzConstellation3D from '../components/3d/FrequenzConstellation3D';
import FloatingDotNavigation from '../components/FloatingDotNavigation';

const Home = () => {
  const { isAuthenticated, user, isBackoffice, isOperator } = useAuth();

  const [stats, setStats] = useState({
    activeReservationsCount: 0,
    pendingReservationsCount: 0,
    countOfApprovedFutureReservations: 0,
    completedReservationsCount: 0,
    totalStationsCount: 0,
    totalProsumersCount: 0,
  });

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, stationsRes] = await Promise.all([
          api.get('/reservations/dashboard-stats'),
          api.get('/stations?status=Active'),
        ]);

        setStats(statsRes.data);
        setStations(stationsRes.data);
      } catch (err) {
        console.warn(
          'Backend currently initializing, using default metrics',
          err
        );

        setStations([
          {
            id: '6aab52c1d031de95baf2ff7b',
            stationCode: 'HUB-COLOMBO-01',
            name: 'Colombo Central Solar Hub',
            location: 'Union Place, Colombo 02',
            capacityKWh: 250,
            availableBatterySlots: 14,
            totalBatterySlots: 20,
            operationalSchedule: 'Mon-Sun 06:00-22:00',
            latitude: 6.9175,
            longitude: 79.8654,
            status: 'Active',
            activeReservationsCount: 2,
          },
          {
            id: '6aab52c1d031de95baf2ff7c',
            stationCode: 'HUB-KANDY-02',
            name: 'Kandy Hill Microgrid Hub',
            location: 'Peradeniya Road, Kandy',
            capacityKWh: 180,
            availableBatterySlots: 11,
            totalBatterySlots: 15,
            operationalSchedule: 'Mon-Sat 06:00-20:00',
            latitude: 7.2906,
            longitude: 80.6337,
            status: 'Active',
            activeReservationsCount: 0,
          },
          {
            id: '6aab52c1d031de95baf2ff7d',
            stationCode: 'HUB-GALLE-03',
            name: 'Galle Coastal Solar Station',
            location: 'Matara Road, Galle',
            capacityKWh: 300,
            availableBatterySlots: 20,
            totalBatterySlots: 25,
            operationalSchedule: 'Mon-Sun 07:00-21:00',
            latitude: 6.0535,
            longitude: 80.221,
            status: 'Active',
            activeReservationsCount: 0,
          },
          {
            id: '6aab52c1d031de95baf2ff7e',
            stationCode: 'HUB-JAFFNA-04',
            name: 'Jaffna Peninsula Solar Array',
            location: 'Hospital Road, Jaffna',
            capacityKWh: 350,
            availableBatterySlots: 27,
            totalBatterySlots: 30,
            operationalSchedule: 'Mon-Sun 06:00-22:00',
            latitude: 9.6615,
            longitude: 80.0255,
            status: 'Active',
            activeReservationsCount: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#020202',
        minHeight: '100vh',
        color: '#f1f5f9',
        position: 'relative',
      }}
    >
      <FloatingDotNavigation />

      {/* ========================================================================
          HERO SECTION
          ======================================================================== */}

      <section
        id="hero"
        className="frequenz-hero-container position-relative py-5 px-3"
        style={{ isolation: 'isolate' }}
      >
        <div
          aria-hidden="true"
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ zIndex: 0 }}
        >
          <img
            src="/images/solar-hero-panels.jpg"
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.32,
            }}
          />

          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background:
                'linear-gradient(100deg, rgba(2,2,2,0.94) 30%, rgba(2,2,2,0.72) 55%, rgba(2,2,2,0.35) 100%), linear-gradient(0deg, #020202 2%, transparent 30%, transparent 70%, rgba(2,2,2,0.6) 100%)',
            }}
          />
        </div>

        <div className="container-fluid px-lg-5 px-3 py-lg-4">
          <div
            className="row align-items-center position-relative"
            style={{ zIndex: 2 }}
          >
            <div className="col-lg-7 col-md-12 ps-lg-5 py-4">
              <h1 className="freq-hero-title">
                Power reimagined.
              </h1>

              <h2
                style={{
                  fontWeight: 'normal',
                  fontStyle: 'italic',
                }}
              >
                Manage. Store. Trade.
              </h2>

              <p className="freq-hero-desc mb-3">
                SØLΛR-X empowers enterprise developers and prosumers with
                innovative tools to orchestrate Decentralized Energy Resources
                (DERs) efficiently. Harness the power of Machine Learning (ML)
                models to harmonize local energy assets with external factors
                and markets in real-time.
              </p>

              <p className="freq-hero-desc mb-4 text-white text-opacity-90">
                Join us revolutionizing the way the world manages, stores and
                trades power.
              </p>

              <div
                id="hero-explore"
                className="d-flex align-items-center gap-3 flex-wrap pt-2"
              >
                {isAuthenticated ? (
                  <Link
                    to={
                      isBackoffice
                        ? '/backoffice'
                        : isOperator
                        ? '/operator'
                        : '/'
                    }
                    className="freq-btn-cyan"
                  >
                    <span>↗</span> Open {user?.role} Portal
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="freq-btn-cyan">
                      <span>↗</span> Get started
                    </Link>

                    <a
                      href="#digital-twin"
                      className="freq-btn-secondary"
                    >
                      <i
                        className="bi bi-box-fill text-info me-1"
                        style={{ color: '#00ffce' }}
                      ></i>
                      3D Digital Twin
                    </a>

                    <a
                      href="#hubs"
                      className="freq-btn-secondary"
                    >
                      <i
                        className="bi bi-radar text-info me-1"
                        style={{ color: '#00ffce' }}
                      ></i>
                      Active Hubs
                    </a>
                  </>
                )}
              </div>
            </div>

            <div
              className="col-lg-5 col-md-12 ms-auto position-relative"
              style={{ minHeight: '520px' }}
            >
              <FrequenzConstellation3D />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;