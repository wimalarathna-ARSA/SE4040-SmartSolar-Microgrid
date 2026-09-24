import React from 'react';
import { Link } from 'react-router-dom';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const ReservationManagement = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #cde3ef 0%, #a2c6dd 20%, #468ac0 50%, #0d5a9d 78%, #03376c 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationMeshSVG />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <BackofficePageHero
          imageSrc="/images/Solar_3.jpg"
          eyebrow="SOLARX • Energy Bookings"
          title="Reservation Management"
          subtitle="7-day slot approvals, QR tokens and dispatch scheduling."
          breadcrumb={['Reservations']}
        />

        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link
            to="/backoffice"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              padding: '10px 24px',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            }}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Administration Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReservationManagement;