// ============================================================================
// File: App.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Root React application component with route definitions and layout.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#020202', color: '#e2e8f0' }}>
          <Navbar />
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




              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;