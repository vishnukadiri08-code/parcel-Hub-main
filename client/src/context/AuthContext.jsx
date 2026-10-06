import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { sounds } from '../utils/sound';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cph_auth_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cph_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for unauthorized events to trigger clean logout
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('cph:unauthorized', handleUnauthorized);

    async function verifySession() {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.user);
          localStorage.setItem('cph_auth_user', JSON.stringify(res.user));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }

    verifySession();

    return () => {
      window.removeEventListener('cph:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (username, password) => {
    sounds.playClickSound();
    const res = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('cph_auth_token', res.token);
    localStorage.setItem('cph_auth_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    sounds.playClickSound();
    localStorage.removeItem('cph_auth_token');
    localStorage.removeItem('cph_auth_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isAdmin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
