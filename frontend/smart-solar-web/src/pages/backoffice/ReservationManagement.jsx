import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

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

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            padding: '20px 28px',
            marginBottom: '28px',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            <div className="col-lg-5 col-md-12">
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  placeholder="Search by code, prosumer, or station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 18px 11px 44px',
                    borderRadius: '50px',
                    background: '#ffffff',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: '50px',
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <option value="">All Reservation Statuses</option>
                <option value="Approved">Approved (Ready with QR)</option>
                <option value="Pending">Pending Approval</option>
                <option value="Completed">Completed (Finalized by Operator)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6 d-flex gap-2">
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #0070f3 0%, #0051b3 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '11px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#475569',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: '50px',
                  padding: '11px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

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