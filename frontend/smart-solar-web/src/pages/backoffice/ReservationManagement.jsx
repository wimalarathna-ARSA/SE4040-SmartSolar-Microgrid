import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQr, setSelectedQr] = useState(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0d5a9d', padding: '36px 40px' }}>
      <ConstellationMeshSVG />
      <BackofficePageHero title="Reservation Management" eyebrow="SOLARX" subtitle="Oversight" breadcrumb={['Reservations']} />

      <table style={{ width: '100%', background: '#fff', borderRadius: '12px' }}>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id}>
              <td>{r.reservationCode}</td>
              <td>
                {r.qrCodeData && (
                  <button onClick={() => setSelectedQr(r)}>View QR</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedQr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
            <h3>Security Transaction QR Details</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedQr.reservationCode}</div>
            <p>Prosumer: {selectedQr.prosumerName}</p>
            <code>{selectedQr.qrCodeData}</code>
            <br />
            <button onClick={() => setSelectedQr(null)} style={{ marginTop: '16px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;