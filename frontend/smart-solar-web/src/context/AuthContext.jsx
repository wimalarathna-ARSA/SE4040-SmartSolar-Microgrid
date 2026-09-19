// ============================================================================
// File: AuthContext.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: React authentication context providing centralized user session state.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);