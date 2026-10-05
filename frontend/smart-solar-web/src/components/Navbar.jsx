// ============================================================================
// File: Navbar.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Navigation bar with role-aware links and authentication state.
// Rendering: pure flex-wrap layout (no Bootstrap collapse dependency) so links
// stay visible on every screen size without JS or icon fonts.
// ============================================================================
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isBackoffice, isOperator, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active fw-bold bg-white/10 text-white shadow-sm' : '';
  const initial = ((user?.fullName || 'S').trim().charAt(0) || 'S').toUpperCase();

  const linkClass = 'nav-link text-[0.92rem] text-slate-300 hover:text-white px-3 py-2 rounded-full transition hover:bg-white/10 text-decoration-none';

  return (
    <nav className="sticky-top py-3 bg-[#020202]/90 backdrop-blur-xl border-bottom border-[#65998B]/25 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="container-fluid px-lg-5 px-3 d-flex align-items-center flex-wrap gap-2">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white fs-4 tracking-[-0.02em] text-decoration-none me-2 transition hover:opacity-85" to="/">
          <img src="/solarx-logo.png" alt="SØLΛR-X Logo" className="w-[36px] h-[36px] object-contain drop-shadow-[0_0_12px_rgba(143,179,169,0.5)]" onError={(e) => e.currentTarget.classList.add('d-none')} />
          <span className="text-white fw-bold tracking-[-0.02em]">SØLΛR<span className="text-[#8FB3A9]">-X</span></span>
        </Link>

        <div className="d-flex align-items-center flex-wrap gap-x-3 gap-y-1 mx-lg-auto">
          <Link className={`${linkClass} ${isActive('/')}`} to="/">
            Home
          </Link>

          {isBackoffice && (
            <>
              <Link className={`${linkClass} ${isActive('/backoffice')}`} to="/backoffice">
                Backoffice
              </Link>
              <Link className={`${linkClass} ${isActive('/backoffice/stations')}`} to="/backoffice/stations">
                Hubs Admin
              </Link>
            </>
          )}

          {isOperator && (
            <>
              <Link className={`${linkClass} ${isActive('/operator')}`} to="/operator">
                Grid Monitor
              </Link>
              <Link className={`${linkClass} ${isActive('/operator/slots')}`} to="/operator/slots">
                Slots
              </Link>
              <Link className={`${linkClass} ${isActive('/operator/energy-history')}`} to="/operator/energy-history">
                Transfer History
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className={`${linkClass} d-flex align-items-center gap-1 bg-transparent border-0`}>
              Logout <span className="text-[0.85rem]">↗</span>
            </button>
          ) : (
            <a className={`${linkClass} d-flex align-items-center gap-1`} href="#architecture">
              Docs <span className="text-[0.85rem]">↗</span>
            </a>
          )}
        </div>

        <div className="d-flex align-items-center gap-3 ms-lg-auto">
          {isAuthenticated ? (
            <Link
              to={isBackoffice ? '/backoffice/profile' : isOperator ? '/operator/profile' : '/profile'}
              className="d-flex align-items-center gap-3 text-decoration-none"
              title="Open profile"
            >
              <div className="text-end text-light">
                <div className="small fw-semibold">{user?.fullName}</div>
                <span className={`badge text-white ${isBackoffice ? 'bg-[#063127] border border-light border-opacity-25' : 'bg-[#686053]'}`}>
                  {user?.role}
                </span>
              </div>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold w-[38px] h-[38px] text-[0.95rem] bg-[rgba(143,179,169,0.15)] text-[#8FB3A9] border-solid border-[1.5px] border-[rgba(143,179,169,0.55)] shadow-[0_0_16px_rgba(143,179,169,0.25)]"
              >
                {initial}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="btn fw-bold d-inline-flex align-items-center gap-2 text-[0.95rem] px-4 py-2 rounded-[10px] bg-[#F8F8F8] text-[#063127] border border-white/20 shadow-lg transition hover:-translate-y-[1px]">
              Staff Portal <span className="text-[0.85rem]">↗</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
