import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tripmate_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('tripmate_token');
      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await request('/auth/me');
        setUser(response.data || null);
      } catch (error) {
        localStorage.removeItem('tripmate_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    localStorage.setItem('tripmate_token', response.data.token);
    setToken(response.data.token);
    setUser(response.data);
    return response;
  };

  const register = async (payload) => {
    const response = await request('/auth/register', {
      method: 'POST',
      body: payload,
    });

    localStorage.setItem('tripmate_token', response.data.token);
    setToken(response.data.token);
    setUser(response.data);
    return response;
  };

  const logout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore backend logout failure to keep frontend session clear.
    } finally {
      localStorage.removeItem('tripmate_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!token,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
