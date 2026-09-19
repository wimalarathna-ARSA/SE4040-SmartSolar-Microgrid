// ============================================================================
// File: AuthContext.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: React Auth context providing JWT token, user state and session management.
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
    // Restore session on application load
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

  // Store authenticated user information after successful login
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

  // Clear the current authentication session
  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);