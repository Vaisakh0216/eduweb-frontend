import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('refreshToken');
    if (!token) {
      throw new Error('No refresh token');
    }

    const response = await api.post('/auth/refresh-token', { refreshToken: token });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return accessToken;
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const hasRole = (...roles) => {
    return roles.includes(user?.role);
  };

  const hasBranchAccess = (branchId) => {
    if (isSuperAdmin) return true;
    return user?.branches?.some(b => b._id === branchId);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin,
    isAdmin,
    isStaff,
    hasRole,
    hasBranchAccess,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
