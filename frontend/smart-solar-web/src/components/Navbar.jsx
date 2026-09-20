// ============================================================================
// File: Navbar.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Main navigation bar for the SmartSolar web application.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'active fw-bold' : '';

  return (
    <nav className="navbar navbar-expand-lg freq-navbar sticky-top py-3">
      <div className="container-fluid px-lg-5 px-3">
        <Link
          className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white fs-4"
          to="/"
        >
          <img
            src="/solarx-logo.png"
            alt="SØLΛR-X Logo"
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain'
            }}
          />

          <span
            className="text-white fw-bold tracking-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            SØLΛR<span style={{ color: '#00ffce' }}>-X</span>
          </span>
        </Link>

        <button
          className="navbar-toggler border-0 text-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2 text-white"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
            <li className="nav-item">
              <Link
                className={`nav-link freq-nav-link ${isActive('/')}`}
                to="/"
              >
                Home
              </Link>
            </li>

            <li className="nav-item">
              <a className="nav-link freq-nav-link" href="#hubs">
                Microgrid Hubs
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link freq-nav-link" href="#digital-twin">
                3D Digital Twin
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link freq-nav-link" href="#simulator">
                Yield Simulator
              </a>
            </li>

            <li className="nav-item">
              <a
                className="nav-link freq-nav-link d-flex align-items-center gap-1"
                href="#architecture"
              >
                Docs <span style={{ fontSize: '0.85rem' }}>↗</span>
              </a>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="freq-btn-header">
              Staff Portal <span style={{ fontSize: '0.85rem' }}>↗</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;