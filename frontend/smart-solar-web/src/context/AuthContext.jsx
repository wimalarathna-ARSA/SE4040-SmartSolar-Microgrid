// ============================================================================
// File: AuthContext.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: React Auth context providing JWT token, user state and role-based session management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app load
    const savedToken =
      localStorage.getItem('token');

    const savedUser =
      localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error(
          'Failed to parse saved session',
          err
        );

        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Authenticate and persist the logged-in user session
  const login = (authData) => {
    const userData = {
      nic: authData.nic,
      fullName: authData.fullName,
      email: authData.email,
      role: authData.role,
      status: authData.status,
    };

    setToken(authData.token);
    setUser(userData);

    localStorage.setItem(
      'token',
      authData.token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(userData)
    );
  };

  // Clear authentication state and remove persisted credentials
  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update selected user properties while keeping local storage synchronized
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = {
        ...(prev || {}),
        ...patch,
      };

      localStorage.setItem(
        'user',
        JSON.stringify(next)
      );

      return next;
    });
  };

  // Role-specific access flags
  const isBackoffice =
    user?.role === 'Backoffice';

  const isOperator =
    user?.role === 'GridOperator';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,

        // Authentication state
        isAuthenticated: !!token,

        // Role-based access state
        isBackoffice,
        isOperator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);