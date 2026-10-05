// ============================================================================
// File: App.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Root React application component with route definitions and layout.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import StaffProfile from './pages/StaffProfile';

// Backoffice Administration Pages
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import UserManagement from './pages/backoffice/UserManagement';
import ProsumerManagement from './pages/backoffice/ProsumerManagement';
import StationManagement from './pages/backoffice/StationManagement';
import ReservationManagement from './pages/backoffice/ReservationManagement';

// Grid Operator Pages
import OperatorDashboard from './pages/operator/OperatorDashboard';
import StationSlots from './pages/operator/StationSlots';
import BookingsMonitor from './pages/operator/BookingsMonitor';
import QrVerification from './pages/operator/QrVerification';
import EnergyTransferHistory from './pages/operator/EnergyTransferHistory';

function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname === '/' || location.pathname === '/login';
  return (
    <div className={hideChrome ? 'd-flex flex-column min-vh-100 bg-white' : 'd-flex flex-column min-vh-100 bg-[#020202] text-slate-200'}>
      {!hideChrome && <Navbar />}
      <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Backoffice Protected Routes */}
              <Route
                path="/backoffice"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <BackofficeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/staff"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/prosumers"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <ProsumerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/stations"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <StationManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/reservations"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <ReservationManagement />
                  </ProtectedRoute>
                }
              />

              {/* Grid Operator Protected Routes */}
              <Route
                path="/operator"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <OperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/slots"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <StationSlots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/bookings"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <BookingsMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/verify-qr"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <QrVerification />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/energy-history"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <EnergyTransferHistory />
                  </ProtectedRoute>
                }
              />

              {/* Staff profile (Backoffice + Grid Operator) */}
              <Route
                path="/backoffice/profile"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <StaffProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/profile"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <StaffProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice', 'GridOperator']}>
                    <StaffProfile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Shell />
      </Router>
    </AuthProvider>
  );
}

export default App;