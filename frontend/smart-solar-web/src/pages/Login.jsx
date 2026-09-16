// ============================================================================
// File: Login.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Staff login page with API authentication and SmartSolar branding.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const S = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#080808',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },

  card: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '100%',
    maxWidth: '840px',
    minHeight: '420px',
    borderRadius: '20px',
    background: 'rgba(22, 20, 28, 0.72)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    margin: '20px',
  },

  leftPanel: {
    flex: '1 1 42%',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0d1526',
  },

  leftBgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.45,
  },

  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(8,8,12,0.55) 0%, rgba(8,8,12,0.35) 40%, rgba(8,8,12,0.88) 100%)',
  },

  divider: {
    width: '1px',
    alignSelf: 'stretch',
    background:
      'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent 100%)',
    flexShrink: 0,
  },

  rightPanel: {
    flex: '1 1 55%',
    padding: '52px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  input: {
    width: '100%',
    padding: '13px 18px',
    borderRadius: '50px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e2e8f0',
    fontSize: '0.92rem',
    outline: 'none',
  },

  submitBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '50px',
    border: 'none',
    background:
      'linear-gradient(135deg, rgba(100,30,180,0.9) 0%, rgba(60,20,130,0.95) 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

const Login = () => {
  const [emailOrNic, setEmailOrNic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        emailOrNic,
        password,
      });

      const authData = response.data;

      login(authData);

      if (authData.role === 'Backoffice') {
        navigate('/backoffice');
      } else if (authData.role === 'GridOperator') {
        navigate('/operator');
      } else if (authData.role === 'Prosumer') {
        setError(
          'Prosumer accounts use the SOLARX Mobile App (Android). Please log in with a Backoffice or Grid Operator staff account.'
        );
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Branding Panel */}
        <div style={S.leftPanel}>
          <img
            src="/images/solar-rooftop-home.jpg"
            alt=""
            aria-hidden="true"
            style={S.leftBgImage}
          />

          <div style={S.leftOverlay} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '36px',
              }}
            >
              <img
                src="/solarx-logo.png"
                alt="SOLARX"
                style={{
                  width: '44px',
                  height: '44px',
                  objectFit: 'contain',
                }}
              />

              <span
                style={{
                  fontSize: '1.7rem',
                  fontWeight: '800',
                  color: '#fff',
                  letterSpacing: '-0.03em',
                }}
              >
                SOLARX
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'rgba(200,180,255,0.7)',
                  marginBottom: '10px',
                }}
              >
                Staff Portal
              </div>

              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#fff',
                  lineHeight: '1.2',
                  marginBottom: '14px',
                }}
              >
                Welcome<br />
                <span>Back</span>
              </h2>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(200,200,220,0.65)',
                  lineHeight: '1.65',
                  maxWidth: '240px',
                }}
              >
                Securely access the SOLARX enterprise dispatch platform.
              </p>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: '0.78rem',
              color: 'rgba(200,200,220,0.55)',
            }}
          >
            solarx.energy
          </div>
        </div>

        <div style={S.divider} />

        {/* Login Form */}
        <div style={S.rightPanel}>
          <h3
            style={{
              fontSize: '1.55rem',
              fontWeight: '700',
              color: '#fff',
              textAlign: 'center',
              marginBottom: '28px',
            }}
          >
            Login
          </h3>

          {error && (
            <div
              style={{
                background: 'rgba(220,40,40,0.12)',
                border: '1px solid rgba(220,40,40,0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                style={S.input}
                placeholder="Username / Email / NIC"
                value={emailOrNic}
                onChange={(e) =>
                  setEmailOrNic(e.target.value)
                }
                required
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <input
                type="password"
                style={S.input}
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              style={S.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Authenticating...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;