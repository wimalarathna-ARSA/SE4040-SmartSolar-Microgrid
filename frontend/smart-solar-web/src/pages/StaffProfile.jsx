// ============================================================================
// File: StaffProfile.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Staff profile page for viewing and editing personal details.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e2e8f0',
  fontSize: '0.9rem',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
};

const cardStyle = {
  background: 'rgba(12, 18, 28, 0.85)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '18px',
  boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
};

const StaffProfile = () => {
  const { user, updateUser, isBackoffice } = useAuth();

  const [details, setDetails] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });

  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState({
    type: '',
    text: '',
  });

  const dashboardPath = isBackoffice ? '/backoffice' : '/operator';
  const accent = isBackoffice ? '#7c3aed' : '#10b981';

  useEffect(() => {
    const load = async () => {
      if (!user?.nic) {
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);

      try {
        const res = await api.get(
          `/users/${encodeURIComponent(user.nic)}`
        );

        const profile = res.data || {};

        setDetails({
          fullName: profile.fullName || user.fullName || '',
          phoneNumber: profile.phoneNumber || '',
          address: profile.address || '',
        });

        if (profile.email) {
          updateUser({
            email: profile.email,
            fullName: profile.fullName,
          });
        }
      } catch {
        setDetails({
          fullName: user.fullName || '',
          phoneNumber: '',
          address: '',
        });
      } finally {
        setDetailsLoading(false);
      }
    };

    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.nic]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();

    setDetailsMsg({
      type: '',
      text: '',
    });

    if (!details.fullName.trim() || !details.phoneNumber.trim()) {
      setDetailsMsg({
        type: 'danger',
        text: 'Full name and phone number are required.',
      });
      return;
    }

    setDetailsSaving(true);

    try {
      const res = await api.put(
        `/users/${encodeURIComponent(user.nic)}/profile`,
        {
          fullName: details.fullName.trim(),
          phoneNumber: details.phoneNumber.trim(),
          address: details.address.trim(),
        }
      );

      updateUser({
        fullName: details.fullName.trim(),
      });

      setDetailsMsg({
        type: 'success',
        text: res.data?.message || 'Profile details updated.',
      });
    } catch (err) {
      setDetailsMsg({
        type: 'danger',
        text:
          err.response?.data?.message ||
          'Failed to update profile.',
      });
    } finally {
      setDetailsSaving(false);
    }
  };

  const initials = (user?.fullName || 'S X')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const msgBox = (message) =>
    message.text && (
      <div
        style={{
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.83rem',
          marginBottom: '14px',
          background:
            message.type === 'danger'
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(16,185,129,0.12)',
          border: `1px solid ${
            message.type === 'danger'
              ? 'rgba(239,68,68,0.35)'
              : 'rgba(16,185,129,0.35)'
          }`,
          color:
            message.type === 'danger'
              ? '#fca5a5'
              : '#6ee7b7',
        }}
      >
        {message.text}
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#020202',
        color: '#e2e8f0',
        padding: '36px 20px 60px',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        <div
          className="position-relative overflow-hidden mb-4"
          style={{ ...cardStyle, padding: 0 }}
        >
          <div
            style={{
              height: '150px',
              position: 'relative',
            }}
          >
            <img
              src="/images/Solar_1.jpg"
              alt=""
              aria-hidden="true"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.55,
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(2,6,12,0.25) 0%, rgba(2,6,12,0.88) 100%)',
              }}
            />

            <Link
              to={dashboardPath}
              style={{
                position: 'absolute',
                top: '14px',
                left: '16px',
                zIndex: 2,
                color: '#cbd5e1',
                fontSize: '0.82rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              &larr; Back to console
            </Link>
          </div>

          <div
            className="d-flex flex-column flex-md-row align-items-md-end gap-3 px-4 pb-4"
            style={{
              marginTop: '-44px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accent} 0%, #0f172a 130%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#fff',
                border: '3px solid #020202',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {initials}
            </div>

            <div className="flex-grow-1">
              <h2
                className="fw-bold text-white mb-1"
                style={{ letterSpacing: '-0.02em' }}
              >
                {user?.fullName || 'Staff Account'}
              </h2>

              <div className="d-flex align-items-center gap-2 flex-wrap small">
                <span
                  className={`badge ${
                    isBackoffice
                      ? 'badge-role-backoffice'
                      : 'badge-role-operator'
                  }`}
                >
                  {user?.role}
                </span>

                <span style={{ color: '#94a3b8' }}>
                  NIC:{' '}
                  <strong style={{ color: '#e2e8f0' }}>
                    {user?.nic}
                  </strong>
                </span>

                <span style={{ color: '#94a3b8' }}>
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="p-4 h-100" style={cardStyle}>
              <h5 className="fw-bold text-white mb-1">
                <i
                  className="bi bi-person-gear me-2"
                  style={{ color: '#00ffce' }}
                />
                Profile details
              </h5>

              <p
                className="small mb-3"
                style={{ color: '#94a3b8' }}
              >
                Update your name, phone and address.
              </p>

              {msgBox(detailsMsg)}

              {detailsLoading ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-info" />
                </div>
              ) : (
                <form onSubmit={handleSaveDetails}>
                  <div className="mb-3">
                    <label style={labelStyle}>
                      Full name *
                    </label>

                    <input
                      style={inputStyle}
                      value={details.fullName}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label style={labelStyle}>
                      Email (read-only)
                    </label>

                    <input
                      style={{
                        ...inputStyle,
                        opacity: 0.55,
                      }}
                      value={user?.email || ''}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label style={labelStyle}>
                      Phone number *
                    </label>

                    <input
                      style={inputStyle}
                      value={details.phoneNumber}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          phoneNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label style={labelStyle}>
                      Address
                    </label>

                    <textarea
                      style={{
                        ...inputStyle,
                        borderRadius: '12px',
                        minHeight: '76px',
                      }}
                      value={details.address}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label style={labelStyle}>
                      NIC (read-only)
                    </label>

                    <input
                      style={{
                        ...inputStyle,
                        opacity: 0.55,
                      }}
                      value={user?.nic || ''}
                      readOnly
                      disabled
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 fw-bold"
                    disabled={detailsSaving}
                    style={{
                      background:
                        'linear-gradient(135deg, #00ffce 0%, #00c9a7 100%)',
                      color: '#022c26',
                      borderRadius: '12px',
                      padding: '11px',
                    }}
                  >
                    {detailsSaving
                      ? 'Saving…'
                      : 'Save changes'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;