import React, { createContext, useState, useContext, useEffect } from 'react';
import { localAuth } from '@/lib/localApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ standalone: true });

  useEffect(() => {
    const currentUser = localAuth.getUser();
    setUser(currentUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  }, []);

  const checkAppState = async () => {
    const currentUser = localAuth.getUser();
    setAuthError(null);
    setUser(currentUser);
    setIsAuthenticated(true);
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
  };

  const logout = (shouldRedirect = true) => {
    localAuth.clearUser();
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    const currentUser = localAuth.setUser({ id: 'local-admin', name: 'Local Admin', role: 'admin' });
    setUser(currentUser);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
