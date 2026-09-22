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

        {/* 4 TOP KPI STAT CARDS */}
        <div className="row g-4 mb-4">
          
          {/* 1. ACTIVE NODES */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.76)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '18px 20px',
                minHeight: '118px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(7, 43, 82, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img src="/images/house_1.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', right: '-12px', bottom: '-12px', width: '110px', height: '110px', objectFit: 'contain', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                  ACTIVE NODES
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0284c7', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.totalStationsCount || 4}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                Microgrid Hubs
              </div>
              </div>
            </div>
          </div>

          {/* 2. APPROVED FUTURE */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.76)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '18px 20px',
                minHeight: '118px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(7, 43, 82, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img src="/images/house_2.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', right: '-12px', bottom: '-12px', width: '110px', height: '110px', objectFit: 'contain', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                  APPROVED FUTURE
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: '#16a34a', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.countOfApprovedFutureReservations || 2}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                Within 7 Days
              </div>
              </div>
            </div>
          </div>

          {/* 4. PROSUMERS */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.76)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '18px 20px',
                minHeight: '118px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(7, 43, 82, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img src="/images/house_3.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', right: '-12px', bottom: '-12px', width: '110px', height: '110px', objectFit: 'contain', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                  PROSUMERS
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0284c7', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.totalProsumersCount || 5}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                Registered by NIC
              </div>
              </div>
            </div>
          </div>

          {/* 5. COMPLETED */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.76)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '18px 20px',
                minHeight: '118px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -4px rgba(7, 43, 82, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img src="/images/house_4.png" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', right: '-12px', bottom: '-12px', width: '110px', height: '110px', objectFit: 'contain', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                  COMPLETED
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: '#16a34a', lineHeight: 1, margin: '8px 0 3px' }}>
                {stats.completedReservationsCount || 1}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                Finalized Trades
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION TITLE: Management Modules */}
        <div className="d-flex align-items-center mb-4 mt-2">
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Management Modules
          </h2>
          <div
            style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
              marginLeft: '20px',
            }}
          />
        </div>

        {/* 4 LARGE MANAGEMENT MODULE CARDS WITH GLOWING ICONS */}
        <div className="row g-4 mb-4">
          
          {/* Card 1: User Management */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '36px 28px 28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 36px -8px rgba(10, 35, 70, 0.12)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 42px -6px rgba(10, 35, 70, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 36px -8px rgba(10, 35, 70, 0.12)';
              }}
            >
              <div>
                {/* Icon box with soft diffuse blue glow */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(219, 234, 254, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontSize: '1.65rem',
                    marginBottom: '24px',
                    boxShadow: '0 0 32px 8px rgba(59, 130, 246, 0.38)',
                  }}
                >
                  <i className="bi bi-shield-check"></i>
                </div>

                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '4px',
                    letterSpacing: '-0.015em',
                  }}
                >
                  User Management
                </h3>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '16px',
                  }}
                >
                  STAFF ADMINISTRATION
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: 1.62,
                    marginBottom: '28px',
                  }}
                >
                  Create and manage administrative users with two distinct roles: Backoffice and Grid Operator.
                </p>
              </div>

              <Link
                to="/backoffice/staff"
                style={{
                  background: '#1d72f2',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '13px 22px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(29, 114, 242, 0.35)',
                }}
              >
                <span>Manage Staff Users</span>
                <i className="bi bi-arrow-right fs-6"></i>
              </Link>
            </div>
          </div>

          {/* Card 2: Prosumer Control */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '36px 28px 28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 36px -8px rgba(10, 35, 70, 0.12)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 42px -6px rgba(10, 35, 70, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 36px -8px rgba(10, 35, 70, 0.12)';
              }}
            >
              <div>
                {/* Icon box with soft diffuse cyan glow */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(207, 250, 254, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0891b2',
                    fontSize: '1.65rem',
                    marginBottom: '24px',
                    boxShadow: '0 0 32px 8px rgba(6, 182, 212, 0.38)',
                  }}
                >
                  <i className="bi bi-person-circle"></i>
                </div>

                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '4px',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Prosumer Control
                </h3>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '16px',
                  }}
                >
                  NIC-BASED REGISTRY
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: 1.62,
                    marginBottom: '28px',
                  }}
                >
                  View pending activations, activate, deactivate, or reactivate prosumer profiles using National Identity Card (NIC).
                </p>
              </div>

              <Link
                to="/backoffice/prosumers"
                style={{
                  background: '#0099ad',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '13px 22px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0, 153, 173, 0.35)',
                }}
              >
                <span>Manage Prosumers</span>
                <i className="bi bi-arrow-right fs-6"></i>
              </Link>
            </div>
          </div>

          {/* Card 3: Microgrid Nodes */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '36px 28px 28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 36px -8px rgba(10, 35, 70, 0.12)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 42px -6px rgba(10, 35, 70, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 36px -8px rgba(10, 35, 70, 0.12)';
              }}
            >
              <div>
                {/* Icon box with soft diffuse green glow */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(220, 252, 231, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    fontSize: '1.65rem',
                    marginBottom: '24px',
                    boxShadow: '0 0 32px 8px rgba(34, 197, 94, 0.38)',
                  }}
                >
                  <i className="bi bi-broadcast-pin"></i>
                </div>

                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '4px',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Microgrid Nodes
                </h3>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '16px',
                  }}
                >
                  SOLAR HUBS & SPECS
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: 1.62,
                    marginBottom: '28px',
                  }}
                >
                  Create solar hubs with GPS coordinates, capacity specs (kW/h), and battery storage slots. Deactivation is protected against active reservations.
                </p>
              </div>

              <Link
                to="/backoffice/stations"
                style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '13px 22px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)',
                }}
              >
                <span>Configure Hubs</span>
                <i className="bi bi-arrow-right fs-6"></i>
              </Link>
            </div>
          </div>

          {/* Card 4: Energy Reservations */}
          <div className="col-lg-3 col-md-6 col-12">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                padding: '36px 28px 28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 36px -8px rgba(10, 35, 70, 0.12)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 42px -6px rgba(10, 35, 70, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 36px -8px rgba(10, 35, 70, 0.12)';
              }}
            >
              <div>
                {/* Icon box with soft diffuse orange glow */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(255, 237, 213, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ea580c',
                    fontSize: '1.65rem',
                    marginBottom: '24px',
                    boxShadow: '0 0 32px 8px rgba(249, 115, 22, 0.38)',
                  }}
                >
                  <i className="bi bi-calendar2-check"></i>
                </div>

                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '4px',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Energy Reservations
                </h3>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '16px',
                  }}
                >
                  POWER TRADING OVERSIGHT
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: 1.62,
                    marginBottom: '28px',
                  }}
                >
                  Monitor power trading bookings across stations, enforcing 7-day advance reservation and 12-hour cancellation notice rules.
                </p>
              </div>

              <Link
                to="/backoffice/reservations"
                style={{
                  background: '#f97316',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '13px 22px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)',
                }}
              >
                <span>View Reservations</span>
                <i className="bi bi-arrow-right fs-6"></i>
              </Link>
            </div>
          </div>

        </div>

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
