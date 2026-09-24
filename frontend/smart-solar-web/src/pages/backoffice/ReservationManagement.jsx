import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/reservations', { params });
      setReservations(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error fetching reservation data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
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

        {message.text && (
          <div style={{ background: message.type === 'danger' ? '#fef2f2' : '#f0fdf4', padding: '14px', borderRadius: '12px', marginBottom: '20px' }}>
            {message.text}
          </div>
        )}

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
              <input
                type="text"
                placeholder="Search by code, prosumer, or station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '11px 18px', borderRadius: '50px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div className="col-lg-4 col-md-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '11px 20px', borderRadius: '50px', border: '1px solid #cbd5e1' }}
              >
                <option value="">All Reservation Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-6 d-flex gap-2">
              <button type="submit" style={{ flex: 1, padding: '11px', borderRadius: '50px', background: '#0070f3', color: '#fff', border: 'none' }}>
                Filter
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link to="/backoffice" style={{ color: '#fff', textDecoration: 'none' }}>Back to Administration Console</Link>
        </div>
      </div>
    </div>
  );
};

export default ReservationManagement;