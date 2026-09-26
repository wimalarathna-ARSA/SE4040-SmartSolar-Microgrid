// ============================================================================
// File: ProtectedRoute.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Route guard component enforcing authenticated and role-based access control.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger p-4 mx-auto" style={{ maxWidth: '600px' }}>
          <i className="bi bi-shield-lock-fill fs-1 text-danger mb-3 d-block"></i>
          <h4 className="alert-heading">Access Restricted</h4>
          <p>
            Your current role (<strong>{user?.role}</strong>) is not authorized to access this administration page.
          </p>
          <hr />
          <p className="mb-0">
            Please switch to an authorized staff account or return to Home.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;