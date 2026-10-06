import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('earts_token');
    if (token) {
      const cachedUser = localStorage.getItem('earts_user');
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch { localStorage.removeItem('earts_user'); }
      }
      api.get('/auth/me')
        .then((currentUser) => {
          setUser(currentUser);
          localStorage.setItem('earts_user', JSON.stringify(currentUser));
        })
        .catch((error) => {
          // Keep a cached session during temporary API/database outages.
          if (error.status === 401) {
            localStorage.removeItem('earts_token');
            localStorage.removeItem('earts_user');
            setUser(null);
          }
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('earts_token', data.token);
    localStorage.setItem('earts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (form) => {
    const data = await api.post('/auth/register', form);
    localStorage.setItem('earts_token', data.token);
    localStorage.setItem('earts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (googleData) => {
    const data = await api.post('/auth/google', googleData);
    localStorage.setItem('earts_token', data.token);
    localStorage.setItem('earts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('earts_token');
    localStorage.removeItem('earts_user');
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => {
    const updatedUser = { ...prev, ...updates };
    localStorage.setItem('earts_user', JSON.stringify(updatedUser));
    return updatedUser;
  });

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
