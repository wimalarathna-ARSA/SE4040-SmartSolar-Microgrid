// ============================================================================
// File: StationManagement.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice solar station CRUD: create, configure, activate and deactivate microgrid hubs.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import LocationPickerModal from '../../components/LocationPickerModal';
import BackofficePageHero from '../../components/BackofficePageHero';

const StationManagement = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Interactive map picker state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalTarget, setMapModalTarget] = useState('create'); // 'create' or 'edit'
  const [appliedMapBadge, setAppliedMapBadge] = useState(false);

  const [formData, setFormData] = useState({
    stationCode: '',
    name: '',
    location: '',
    latitude: 6.9271,
    longitude: 79.8612,
    capacityKWh: 200.0,
    totalBatterySlots: 20,
    availableBatterySlots: 15,
    operationalSchedule: 'Mon-Sun 06:00-22:00',
  });

  const fetchStations = async () => {
    // [IT22106292] - Fetches all solar microgrid hub stations from the API and updates state
    setLoading(true);
    try {
      const response = await api.get('/stations');
      setStations(response.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to fetch microgrid stations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleChange = (e) => {
    // [IT22106292] - Handles form field changes; parses numeric fields (lat, lng, kWh, slots)
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'latitude' || name === 'longitude' || name === 'capacityKWh' 
        ? parseFloat(value) 
        : name === 'totalBatterySlots' || name === 'availableBatterySlots' 
        ? parseInt(value, 10) 
        : value
    });
  };

  const handleOpenMapPicker = (target = 'create') => {
    // [IT22106292] - Opens the interactive map picker modal for create or edit mode
    setMapModalTarget(target);
    setShowMapModal(true);
  };

  const handleApplyMapLocation = ({ location, latitude, longitude }) => {
    // [IT22106292] - Applies map-selected GPS coordinates and address to the active form
    if (mapModalTarget === 'create') {
      setFormData((prev) => ({
        ...prev,
        location,
        latitude,
        longitude,
      }));
      setAppliedMapBadge(true);
    } else if (mapModalTarget === 'edit' && editingStation) {
      setEditingStation((prev) => ({
        ...prev,
        location,
        latitude,
        longitude,
      }));
    }
  };

  const handleCreate = async (e) => {
    // [IT22106292] - Submits new solar hub creation form to API and resets form state
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/stations', formData);
      setMessage({ type: 'success', text: res.data.message || 'Solar microgrid station hub created successfully!' });
      setShowCreateModal(false);
      setAppliedMapBadge(false);
      setFormData({
        stationCode: '',
        name: '',
        location: '',
        latitude: 6.9271,
        longitude: 79.8612,
        capacityKWh: 200.0,
        totalBatterySlots: 20,
        availableBatterySlots: 15,
        operationalSchedule: 'Mon-Sun 06:00-22:00',
      });
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error creating solar station.' });
    }
  };

  const handleEditOpen = (station) => {
    // [IT22106292] - Populates the edit modal with existing station data for modification
    setEditingStation({
      ...station,
      stationCode: station.stationCode || '',
      name: station.name || '',
      location: station.location || '',
      latitude: station.latitude ?? 6.9271,
      longitude: station.longitude ?? 79.8612,
      capacityKWh: station.capacityKWh ?? 200.0,
      totalBatterySlots: station.totalBatterySlots ?? 20,
      availableBatterySlots: station.availableBatterySlots ?? 15,
      operationalSchedule: station.operationalSchedule || 'Mon-Sun 06:00-22:00',
      status: station.status || 'Active',
      activeReservationsCount: station.activeReservationsCount ?? 0,
    });
  };

  const handleEditSubmit = async (e) => {
    // [IT22106292] - Validates slot constraints and active reservations, then submits hub update
    e.preventDefault();
    const isTargetingInactive = editingStation.status === 'Inactive' || editingStation.status === 'Deactivated';
    if (isTargetingInactive && editingStation.activeReservationsCount > 0) {
      setMessage({
        type: 'danger',
        text: `Cannot deactivate node "${editingStation.name}": There are ${editingStation.activeReservationsCount} active energy reservation(s) on this station. All active reservations must be completed or cancelled before deactivation.`
      });
      return;
    }

    const avail = parseInt(editingStation.availableBatterySlots, 10);
    const total = parseInt(editingStation.totalBatterySlots, 10);
    if (avail > total) {
      setMessage({
        type: 'danger',
        text: `Available battery slots (${avail}) cannot exceed total battery slots (${total}).`
      });
      return;
    }

    try {
      const res = await api.put(`/stations/${editingStation.id}`, {
        stationCode: editingStation.stationCode?.trim().toUpperCase(),
        name: editingStation.name?.trim(),
        location: editingStation.location?.trim(),
        latitude: parseFloat(editingStation.latitude),
        longitude: parseFloat(editingStation.longitude),
        capacityKWh: parseFloat(editingStation.capacityKWh),
        totalBatterySlots: total,
        availableBatterySlots: avail,
        operationalSchedule: editingStation.operationalSchedule?.trim(),
        status: editingStation.status,
      });
      setMessage({ type: 'success', text: res.data.message || 'Station updated successfully!' });
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update station.' });
    }
  };

  const handleDeactivate = async (station) => {
    // [IT22106292] - Deactivates a hub node after checking for active reservations
    // Strictly block deactivation if active reservations exist
    if (station.activeReservationsCount > 0) {
      setMessage({
        type: 'danger',
        text: `Cannot deactivate node "${station.name}": There are ${station.activeReservationsCount} active energy reservation(s) on this station. Complete or cancel all active bookings before deactivating this node.`
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate hub ${station.name}?`)) {
      return;
    }
    setMessage({ type: '', text: '' });

    try {
      const res = await api.delete(`/stations/${station.id}`);
      setMessage({ type: 'warning', text: res.data.message || `Station ${station.name} deactivated.` });
      fetchStations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to deactivate station.';
      setMessage({ type: 'danger', text: errorMsg });
    }
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
      {/* Background Constellation Mesh */}
      <ConstellationMeshSVG />

      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <BackofficePageHero
          imageSrc="/images/Solar_2.jpg"
          eyebrow="SOLARX • Microgrid Hubs"
          title="Solar Station Hubs"
          subtitle="Capacity, battery slots and operational schedules for every grid node."
          breadcrumb={['Stations']}
        />
        
        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50px',
              padding: '11px 24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(22, 163, 74, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(22, 163, 74, 0.35)';
            }}
          >
            <i className="bi bi-plus-circle" style={{ fontSize: '1.05rem' }}></i>
            <span>Register New Solar Hub</span>
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            style={{
              background: message.type === 'danger' ? 'rgba(254, 226, 226, 0.9)' : message.type === 'warning' ? 'rgba(254, 243, 199, 0.9)' : 'rgba(220, 252, 231, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: `1px solid ${message.type === 'danger' ? 'rgba(239, 68, 68, 0.4)' : message.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
              padding: '14px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: message.type === 'danger' ? '#b91c1c' : message.type === 'warning' ? '#92400e' : '#15803d',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : message.type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}`}></i>
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* =========================================================================
            FROSTED GLASS CARD: CONFIGURED SOLAR MICROGRID HUBS TABLE
           ========================================================================= */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 16px 40px -8px rgba(10, 35, 70, 0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '24px 32px 20px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h2
              style={{
                fontSize: '1.18rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Configured Solar Microgrid Hubs
            </h2>
            <span
              style={{
                background: '#16a34a',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '6px 18px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 10px rgba(22, 163, 74, 0.3)',
              }}
            >
              {stations.length} Total Stations
            </span>
          </div>

          {/* Table */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderSpacing: 0,
                background: 'transparent',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: '#e3edf6', borderTop: '1px solid rgba(210, 230, 245, 0.8)', borderBottom: '1px solid rgba(210, 230, 245, 0.8)' }}>
                  <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>HUB CODE</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>STATION NAME & LOCATION</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>GPS COORDINATES</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>CAPACITY</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>BATTERY SLOTS</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>SCHEDULE</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>BOOKINGS</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>STATUS</th>
                  <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-primary"></div>
                      Loading solar hubs...
                    </td>
                  </tr>
                ) : stations.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      No solar stations found. Click "Register New Solar Hub" to create one.
                    </td>
                  </tr>
                ) : (
                  stations.map((s, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ebf4fa' : '#f8fafc';
                    return (
                      <tr
                        key={s.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: idx === stations.length - 1 ? 'none' : '1px solid rgba(210, 230, 245, 0.7)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0edf8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* Hub Code */}
                        <td style={{ padding: '18px 32px', background: 'transparent' }}>
                          <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.02em', display: 'inline-block' }}>
                            {s.stationCode}
                          </span>
                        </td>

                        {/* Station Name & Location */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>{s.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <i className="bi bi-geo-alt text-danger"></i>
                            <span>{s.location}</span>
                          </div>
                        </td>

                        {/* GPS */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                          {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                        </td>

                        {/* Capacity */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#0284c7', fontWeight: 700, fontSize: '0.88rem' }}>
                          {s.capacityKWh} kW/h
                        </td>

                        {/* Battery Slots */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#059669',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '50px',
                              padding: '4px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {s.availableBatterySlots} / {s.totalBatterySlots} Free
                          </span>
                        </td>

                        {/* Schedule */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#475569', fontSize: '0.82rem' }}>
                          {s.operationalSchedule}
                        </td>

                        {/* Active Bookings */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          {s.activeReservationsCount > 0 ? (
                            <span
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                borderRadius: '50px',
                                padding: '4px 12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                display: 'inline-block',
                              }}
                              title="Active bookings block deactivation"
                            >
                              {s.activeReservationsCount} Active
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>0 Active</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: s.status === 'Active' ? '#10b981' : '#94a3b8',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '4px 14px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {s.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '18px 32px', background: 'transparent', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEditOpen(s)}
                              style={{
                                background: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284c7',
                                border: '1px solid rgba(2, 132, 199, 0.25)',
                                borderRadius: '50px',
                                width: '32px',
                                height: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease',
                              }}
                              title="Edit Hub"
                            >
                              <i className="bi bi-pencil" style={{ fontSize: '0.85rem' }}></i>
                            </button>
                            {s.status === 'Active' && (
                              s.activeReservationsCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessage({
                                      type: 'danger',
                                      text: `Deactivation Blocked: Node "${s.name}" currently has ${s.activeReservationsCount} active energy reservation(s). Complete or cancel all active bookings before deactivating this node.`,
                                    });
                                  }}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    border: '1px dashed rgba(239, 68, 68, 0.45)',
                                    borderRadius: '50px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'not-allowed',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={`Deactivation strictly blocked: ${s.activeReservationsCount} active energy reservation(s) exist`}
                                >
                                  <i className="bi bi-shield-lock-fill" style={{ fontSize: '0.85rem' }}></i>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivate(s)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: '50px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease',
                                  }}
                                  title="Deactivate Hub"
                                >
                                  <i className="bi bi-power" style={{ fontSize: '0.85rem' }}></i>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM BACK LINK
           ========================================================================= */}
        <div style={{ marginTop: '28px' }}>
          <Link
            to="/backoffice"
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Administration Console</span>
          </Link>
        </div>

      </div>

      {/* =========================================================================
          CREATE STATION MODAL (Frosted Glass)
         ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 30, 60, 0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px rgba(0, 30, 70, 0.25)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-broadcast-pin text-success"></i>
                <span>Register New Solar Microgrid Hub</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ padding: '24px 28px' }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Station Code *</label>
                    <input
                      type="text"
                      name="stationCode"
                      placeholder="e.g. HUB-NEGOMBO-05"
                      value={formData.stationCode}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Station Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Negombo Coastal Microgrid"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>

                  {/* Interactive Map Picker Section */}
                  <div className="col-12">
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%)',
                        border: '1.5px dashed rgba(2, 132, 199, 0.35)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #16a34a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '1.25rem',
                            boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                            flexShrink: 0,
                          }}
                        >
                          <i className="bi bi-map-fill"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                            Interactive Map &amp; Place Search
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Search places, pinpoint solar hub site, and auto-apply address &amp; GPS coordinates.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenMapPicker('create')}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '9px 20px',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <i className="bi bi-geo-alt-fill"></i>
                        <span>Select Location on Map</span>
                      </button>
                    </div>

                    {appliedMapBadge && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'rgba(22, 163, 74, 0.12)',
                          border: '1px solid rgba(22, 163, 74, 0.25)',
                          color: '#15803d',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-check-circle-fill"></i>
                          <span>Location &amp; GPS coordinates applied from interactive map!</span>
                        </div>
                        <span className="font-monospace small">
                          ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                        Location / Address *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenMapPicker('create')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <i className="bi bi-search"></i>
                        <span>Search on Map</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Main Beach Road, Negombo"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>GPS Latitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>GPS Longitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Capacity (kW/h) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="capacityKWh"
                      value={formData.capacityKWh}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Total Battery Slots *</label>
                    <input
                      type="number"
                      name="totalBatterySlots"
                      value={formData.totalBatterySlots}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Available Slots *</label>
                    <input
                      type="number"
                      name="availableBatterySlots"
                      value={formData.availableBatterySlots}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Operational Schedule</label>
                    <input
                      type="text"
                      name="operationalSchedule"
                      value={formData.operationalSchedule}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 28px 22px', borderTop: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'rgba(15, 23, 42, 0.06)', color: '#475569', border: 'none', borderRadius: '50px', padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '50px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)' }}
                >
                  Create Solar Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT STATION MODAL (Frosted Glass)
         ========================================================================= */}
      {editingStation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 30, 60, 0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px rgba(0, 30, 70, 0.25)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Edit Microgrid Station: {editingStation.stationCode}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStation(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: '24px 28px' }}>
                <div className="row g-3">
                  {/* Hub Code + Station Name */}
                  <div className="col-md-5">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Hub Code *</label>
                    <input
                      type="text"
                      value={editingStation.stationCode}
                      onChange={(e) => setEditingStation({ ...editingStation, stationCode: e.target.value })}
                      required
                      placeholder="e.g. HUB-COL-001"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div className="col-md-7">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Station Name *</label>
                    <input
                      type="text"
                      value={editingStation.name}
                      onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                        Physical Location *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenMapPicker('edit')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <i className="bi bi-geo-alt-fill"></i>
                        <span>Select on Map</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingStation.location}
                      onChange={(e) => setEditingStation({ ...editingStation, location: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>GPS Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingStation.latitude || 6.9271}
                      onChange={(e) => setEditingStation({ ...editingStation, latitude: parseFloat(e.target.value) })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>GPS Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingStation.longitude || 79.8612}
                      onChange={(e) => setEditingStation({ ...editingStation, longitude: parseFloat(e.target.value) })}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  {/* Capacity + Total Slots + Available Slots */}
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Capacity (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingStation.capacityKWh ?? ''}
                      onChange={(e) => setEditingStation({ ...editingStation, capacityKWh: parseFloat(e.target.value) })}
                      placeholder="e.g. 50"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Total Battery Slots</label>
                    <input
                      type="number"
                      min="0"
                      value={editingStation.totalBatterySlots ?? ''}
                      onChange={(e) => setEditingStation({ ...editingStation, totalBatterySlots: parseInt(e.target.value, 10) })}
                      placeholder="e.g. 10"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                        Available Slots
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <i className="bi bi-lock-fill"></i> Readonly
                      </span>
                    </div>
                    <input
                      type="number"
                      readOnly
                      value={editingStation.availableBatterySlots ?? ''}
                      title="Available slots are managed exclusively in real-time by Grid Operators upon physical battery swap verification."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        outline: 'none',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 700,
                        cursor: 'not-allowed',
                      }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                      Managed live by Grid Operators upon physical battery bay connection.
                    </div>
                  </div>
                  {/* Operational Schedule */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Operational Schedule</label>
                    <input
                      type="text"
                      value={editingStation.operationalSchedule ?? ''}
                      onChange={(e) => setEditingStation({ ...editingStation, operationalSchedule: e.target.value })}
                      placeholder="e.g. 06:00 – 22:00 daily"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    />
                  </div>
                  {/* Status */}
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Status</label>
                    <select
                      value={editingStation.status === 'Active' ? 'Active' : 'Inactive'}
                      onChange={(e) => setEditingStation({ ...editingStation, status: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.15)', outline: 'none' }}
                    >
                      <option value="Active">Active</option>
                      <option
                        value="Inactive"
                        disabled={editingStation.activeReservationsCount > 0}
                      >
                        {editingStation.activeReservationsCount > 0
                          ? `Inactive (Blocked: ${editingStation.activeReservationsCount} active reservations)`
                          : 'Inactive (Deactivated)'}
                      </option>
                    </select>
                    {editingStation.activeReservationsCount > 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="bi bi-shield-lock-fill"></i>
                        <span>Deactivation is blocked: {editingStation.activeReservationsCount} active energy reservation(s) exist.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 28px 22px', borderTop: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  style={{ background: 'rgba(15, 23, 42, 0.06)', color: '#475569', border: 'none', borderRadius: '50px', padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '50px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MAP & PLACE SEARCH MODAL
         ========================================================================= */}
      <LocationPickerModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialLocation={
          mapModalTarget === 'create'
            ? {
                address: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
              }
            : {
                address: editingStation?.location || '',
                latitude: editingStation?.latitude || 6.9271,
                longitude: editingStation?.longitude || 79.8612,
              }
        }
        onApply={handleApplyMapLocation}
      />

    </div>
  );
};

export default StationManagement;
