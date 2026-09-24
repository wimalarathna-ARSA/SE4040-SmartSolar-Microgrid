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

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 16px 40px -8px rgba(10, 35, 70, 0.12)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px 32px 20px', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.18rem', fontWeight: 700, margin: 0 }}>Power Trading Booking Records</h2>
            <span style={{ background: '#0284c7', color: '#fff', borderRadius: '50px', padding: '6px 18px', fontSize: '0.78rem', fontWeight: 700 }}>
              {reservations.length} Active Bookings
            </span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#e3edf6' }}>
                  <th style={{ padding: '16px 28px', fontSize: '0.72rem', fontWeight: 700 }}>BOOKING CODE</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>PROSUMER (NIC)</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>STATION HUB</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>SCHEDULED SLOT</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>DURATION & ENERGY</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>TOTAL VALUE</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.72rem', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                      Loading energy reservation records...
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                      No matching energy reservations found.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r, idx) => (
                    <tr key={r.id || idx} style={{ background: idx % 2 === 0 ? '#ebf4fa' : '#f8fafc' }}>
                      <td style={{ padding: '18px 28px' }}>{r.reservationCode}</td>
                      <td style={{ padding: '18px 20px' }}>{r.prosumerName} ({r.prosumerNic})</td>
                      <td style={{ padding: '18px 20px' }}>{r.stationName}</td>
                      <td style={{ padding: '18px 20px' }}>{new Date(r.scheduledDateTime).toLocaleString()}</td>
                      <td style={{ padding: '18px 20px' }}>{r.energyAmountKWh} kWh ({r.durationHours} hrs)</td>
                      <td style={{ padding: '18px 20px' }}>Rs. {r.totalCost ? r.totalCost.toFixed(2) : '0.00'}</td>
                      <td style={{ padding: '18px 20px' }}>{r.reservationType}</td>
                      <td style={{ padding: '18px 20px' }}>{r.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link to="/backoffice" style={{ color: '#ffffff', textDecoration: 'none' }}>Back to Administration Console</Link>
        </div>
      </div>
    </div>
  );
};

export default ReservationManagement;