// ============================================================================
// File: ProtectedRoute.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Route guard component enforcing authenticated access.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;