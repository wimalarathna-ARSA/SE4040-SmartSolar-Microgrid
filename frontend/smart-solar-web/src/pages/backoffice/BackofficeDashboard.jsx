// ============================================================================
// File: BackofficeDashboard.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice main dashboard: live pending prosumers, approved future reservations and stats.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const BackofficeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeReservationsCount: 0,
    pendingReservationsCount: 0,
    countOfApprovedFutureReservations: 0,
    completedReservationsCount: 0,
    totalStationsCount: 0,
    totalProsumersCount: 0,
  });
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/reservations/dashboard-stats'),
          api.get('/users/pending-prosumers'),
        ]);
        setStats(statsRes.data);
        setPendingProsumers(pendingRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #052d41 0%, #106396 20%, #468ac0 50%, #0d5a9d 78%, #03376c 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Constellation Mesh Network */}
      <ConstellationMeshSVG />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <BackofficePageHero
          imageSrc="/images/Solar_1.jpg"
          eyebrow="SOLARX • Command Center"
          title="Backoffice Command Center"
          subtitle="Live reservations, stations and prosumers across the island microgrid network."
          breadcrumb={[]}
        />



        {/* BOTTOM STATUS BAR */}
        <div className="d-flex justify-content-between align-items-center pt-3 text-white text-opacity-75" style={{ fontSize: '0.78rem' }}>
          <div>
            Backoffice Administration Console
          </div>
          <div>
            Role: Administrator &bull; Session secured
          </div>
        </div>

      </div>
    </div>
  );
};

export default BackofficeDashboard;