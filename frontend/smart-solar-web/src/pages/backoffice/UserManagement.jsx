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

      const staffOnly = response.data.filter(
        (u) => u.role === 'Backoffice' || u.role === 'GridOperator'
      );

      setUsers(staffOnly);
    } catch (err) {
      console.error(err);

      setMessage({
        type: 'danger',
        text: 'Failed to load staff users.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      nic: '',
      fullName: '',
      email: '',
      password: '',
      role: 'GridOperator',
      phoneNumber: '',
      address: '',
    });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    setMessage({
      type: '',
      text: '',
    });

    try {
      const res = await api.post('/users/staff', formData);

      setMessage({
        type: 'success',
        text: res.data.message || 'Staff member created successfully!',
      });

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      const errText =
        err.response?.data?.message ||
        'Error creating staff user.';

      setMessage({
        type: 'danger',
        text: errText,
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(120deg, #cde3ef 0%, #a2c6dd 20%, #468ac0 50%, #0d5a9d 78%, #03376c 100%)',
        color: '#0f172a',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationMeshSVG />

      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <BackofficePageHero
          imageSrc="/images/Solar_5.jpg"
          eyebrow="SOLARX • Staff Access"
          title="Staff User Management"
          subtitle="Backoffice and Grid Operator accounts with role-based access control."
          breadcrumb={['Staff']}
        />

        <div className="d-flex justify-content-end mb-4">
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
              boxShadow:
                '0 4px 16px rgba(29, 114, 242, 0.35)',
              cursor: 'pointer',
            }}
          >
            <i className="bi bi-person-plus"></i>
            Create Staff User
          </button>
        </div>

        {message.text && (
          <div
            style={{
              background:
                message.type === 'danger'
                  ? 'rgba(254, 226, 226, 0.9)'
                  : 'rgba(220, 252, 231, 0.9)',
              borderRadius: '16px',
              padding: '14px 20px',
              marginBottom: '22px',
              color:
                message.type === 'danger'
                  ? '#b91c1c'
                  : '#15803d',
              fontWeight: 600,
            }}
          >
            {message.text}
          </div>
        )}

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.95)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '24px 32px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.18rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
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
              }}
            >
              {users.length} Registered Staff
            </span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ background: '#e3edf6' }}>
                  <th style={headerStyle}>NIC (PRIMARY KEY)</th>
                  <th style={headerStyle}>FULL NAME</th>
                  <th style={headerStyle}>EMAIL</th>
                  <th style={headerStyle}>ASSIGNED ROLE</th>
                  <th style={headerStyle}>PHONE</th>
                  <th style={headerStyle}>STATUS</th>
                  <th style={headerStyle}>CREATED DATE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={emptyStyle}
                    >
                      <div className="spinner-border spinner-border-sm me-2 text-primary" />
                      Loading staff records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={emptyStyle}
                    >
                      No staff users registered.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr
                      key={u.id || idx}
                      style={{
                        background:
                          idx % 2 === 0
                            ? '#ebf4fa'
                            : '#f8fafc',
                      }}
                    >
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: '#e11d48',
                            fontWeight: 700,
                          }}
                        >
                          {u.nic}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        <strong>{u.fullName}</strong>
                      </td>

                      <td style={cellStyle}>
                        {u.email}
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            background:
                              u.role === 'Backoffice'
                                ? '#8b5cf6'
                                : '#0284c7',
                            color: '#ffffff',
                            borderRadius: '50px',
                            padding: '5px 16px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        {u.phoneNumber || 'Not provided'}
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '50px',
                            padding: '5px 16px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.status || 'Active'}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        {u.createdAt
                          ? new Date(
                              u.createdAt
                            ).toLocaleDateString()
                          : 'Not available'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '28px' }}>
          <Link
            to="/backoffice"
            style={{
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Administration Console
          </Link>
        </div>
      </div>

      {showModal && (
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
              background: 'rgba(255, 255, 255, 0.96)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '580px',
              overflow: 'hidden',
              boxShadow:
                '0 25px 60px rgba(0, 30, 70, 0.25)',
            }}
          >
            <div
              style={{
                padding: '22px 28px',
                borderBottom:
                  '1px solid rgba(15,23,42,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
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
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ padding: '24px 28px' }}>
                <div className="mb-3">
                  <label style={labelStyle}>
                    National Identity Card (NIC) *
                  </label>

                  <input
                    name="nic"
                    value={formData.nic}
                    onChange={handleChange}
                    placeholder="e.g. 199212345678"
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="mb-3">
                  <label style={labelStyle}>
                    Full Name *
                  </label>

                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={labelStyle}>
                      Official Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@smartsolar.com"
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6">
                    <label style={labelStyle}>
                      Password *
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label style={labelStyle}>
                    System Role *
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="GridOperator">
                      Grid Operator
                    </option>

                    <option value="Backoffice">
                      Backoffice
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label style={labelStyle}>
                    Phone Number
                  </label>

                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+94771234567"
                    style={inputStyle}
                  />
                </div>

                <div className="mb-3">
                  <label style={labelStyle}>
                    Address / Office Location
                  </label>

                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Operations Center, Colombo"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '16px 28px 22px',
                  borderTop:
                    '1px solid rgba(15,23,42,0.08)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={createButtonStyle}
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

const headerStyle = {
  padding: '16px 24px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const cellStyle = {
  padding: '18px 24px',
  fontSize: '0.88rem',
  color: '#0f172a',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '48px 24px',
  color: '#64748b',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(15, 23, 42, 0.15)',
  background: 'rgba(255, 255, 255, 0.8)',
  color: '#0f172a',
  fontSize: '0.9rem',
  outline: 'none',
};

const cancelButtonStyle = {
  background: 'rgba(15, 23, 42, 0.06)',
  color: '#475569',
  border: 'none',
  borderRadius: '50px',
  padding: '10px 22px',
  fontWeight: 600,
  cursor: 'pointer',
};

const createButtonStyle = {
  background: '#1d72f2',
  color: '#ffffff',
  border: 'none',
  borderRadius: '50px',
  padding: '10px 24px',
  fontWeight: 600,
  cursor: 'pointer',
};

export default UserManagement;