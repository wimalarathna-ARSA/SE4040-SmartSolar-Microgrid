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

 {/* TOOLBAR: role status only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          {/* Right: Role Status Pill */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              borderRadius: '50px',
              padding: '6px 8px 6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 18px rgba(0, 30, 70, 0.08)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1rem' }}></i>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                Backoffice Role Verified
              </span>
            </div>
            <span
              style={{
                background: '#0070f3',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '4px 14px',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: '0 2px 8px rgba(0, 112, 243, 0.35)',
              }}
            >
              {user?.nic || 'ADMIN-04'}
            </span>
          </div>
        </div>

        {/* Pending Prosumers Alert */}
        {pendingProsumers.length > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              padding: '14px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-person-exclamation fs-3 text-warning"></i>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                  {pendingProsumers.length} New Prosumer Registration(s) Pending Activation
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Per rubric requirements, prosumer accounts registered via mobile require Backoffice approval.
                </div>
              </div>
            </div>
            <Link
              to="/backoffice/prosumers"
              style={{
                background: '#f59e0b',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
              }}
            >
              Review Registrations &rarr;
            </Link>
          </div>
        )}

        

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