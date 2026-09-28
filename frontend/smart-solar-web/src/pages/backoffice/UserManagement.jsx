// ============================================================================
// File: UserManagement.jsx
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice staff user creation and management with RBAC.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import BackofficePageHero from '../../components/BackofficePageHero';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../../utils/passwordValidator';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    email: '',
    password: '',
    role: 'GridOperator',
    phoneNumber: '',
    address: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const staffOnly = response.data.filter(u => u.role === 'Backoffice' || u.role === 'GridOperator');
      setUsers(staffOnly);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to load staff users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const pwEval = evaluatePassword(formData.password);
    if (!pwEval.isStrong) {
      setMessage({
        type: 'danger',
        text: 'Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.',
      });
      return;
    }

    try {
      const res = await api.post('/users/staff', formData);
      setMessage({ type: 'success', text: res.data.message || 'Staff member created successfully!' });
      setShowModal(false);
      setFormData({
        nic: '',
        fullName: '',
        email: '',
        password: '',
        role: 'GridOperator',
        phoneNumber: '',
        address: '',
      });
      fetchUsers();
    } catch (err) {
      const errText = err.response?.data?.message || 'Error creating staff user.';
      setMessage({ type: 'danger', text: errText });
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
          imageSrc="/images/Solar_5.jpg"
          eyebrow="SOLARX • Staff Access"
          title="Staff User Management"
          subtitle="Backoffice and Grid Operator accounts with role-based access control."
          breadcrumb={['Staff']}
        />
        
        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">

          {/* Right: Create Staff User Pill Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#1d72f2',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50px',
              padding: '11px 24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(29, 114, 242, 0.35)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 114, 242, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(29, 114, 242, 0.35)';
            }}
          >
            <i className="bi bi-person-plus" style={{ fontSize: '1.05rem' }}></i>
            <span>Create Staff User</span>
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            style={{
              background: message.type === 'danger' ? 'rgba(254, 226, 226, 0.9)' : 'rgba(220, 252, 231, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: `1px solid ${message.type === 'danger' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
              padding: '14px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: message.type === 'danger' ? '#b91c1c' : '#15803d',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
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
            FROSTED GLASS CARD: ACTIVE STAFF ACCOUNTS TABLE (PURE LIGHT THEME)
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
              background: 'transparent',
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
              Active Staff Accounts
            </h2>
            <span
              style={{
                background: '#1d72f2',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '6px 18px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 10px rgba(29, 114, 242, 0.3)',
              }}
            >
              {users.length} Registered Staff
            </span>
          </div>

          {/* Pure Light Table - No Bootstrap .table override */}
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
                  <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    NIC (PRIMARY KEY)
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    FULL NAME
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    EMAIL
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    ASSIGNED ROLE
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    PHONE
                  </th>
                  <th style={{ padding: '16px 24px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px 32px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e3edf6' }}>
                    CREATED DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                      Loading staff records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b', background: '#f8fafc' }}>
                      No staff users registered.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ebf4fa' : '#f8fafc';
                    return (
                      <tr
                        key={u.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: idx === users.length - 1 ? 'none' : '1px solid rgba(210, 230, 245, 0.7)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0edf8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        {/* NIC */}
                        <td style={{ padding: '18px 32px', background: 'transparent' }}>
                          <span style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em', display: 'inline-block' }}>
                            {u.nic}
                          </span>
                        </td>

                        {/* Full Name */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>
                          {u.fullName}
                        </td>

                        {/* Email */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#475569', fontSize: '0.88rem' }}>
                          {u.email}
                        </td>

                        {/* Assigned Role Pill Button */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: u.role === 'Backoffice' ? '#8b5cf6' : '#0284c7',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '5px 16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              display: 'inline-block',
                              boxShadow: u.role === 'Backoffice' ? '0 2px 8px rgba(139, 92, 246, 0.3)' : '0 2px 8px rgba(2, 132, 199, 0.3)',
                            }}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '18px 24px', background: 'transparent', color: '#334155', fontSize: '0.88rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-telephone" style={{ color: '#64748b', fontSize: '0.85rem' }}></i>
                            <span>{u.phoneNumber || '+94 77 123 4567'}</span>
                          </span>
                        </td>

                        {/* Status Pill Button */}
                        <td style={{ padding: '18px 24px', background: 'transparent' }}>
                          <span
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              borderRadius: '50px',
                              padding: '5px 16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              display: 'inline-block',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {u.status || 'Active'}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: '18px 32px', background: 'transparent', color: '#475569', fontSize: '0.88rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-calendar3" style={{ color: '#64748b', fontSize: '0.85rem' }}></i>
                            <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '9/17/2026'}</span>
                          </span>
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
          CREATE STAFF MODAL (Frosted Glass)
         ========================================================================= */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 30, 60, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px rgba(0, 30, 70, 0.25)',
              width: '100%',
              maxWidth: '580px',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
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
                Create New Staff User
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateStaff}>
              <div style={{ padding: '24px 28px' }}>
                <div className="mb-3">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    National Identity Card (NIC) *
                  </label>
                  <input
                    type="text"
                    name="nic"
                    placeholder="e.g. 199212345678"
                    value={formData.nic}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                      Official Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@smartsolar.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(15, 23, 42, 0.15)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Min 8 characters (Strong)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(15, 23, 42, 0.15)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Real-time Password Strength Meter */}
                <PasswordStrengthIndicator password={formData.password} />

                <div className="mb-3">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    System Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value="GridOperator">Grid Operator (Operational Tools & QR Scanner)</option>
                    <option value="Backoffice">Backoffice (Full System Administration)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="+94771234567"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Address / Office Location
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Operations Center, Colombo"
                    value={formData.address}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 28px 22px',
                  borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.06)',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 22px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#1d72f2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(29, 114, 242, 0.35)',
                  }}
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
