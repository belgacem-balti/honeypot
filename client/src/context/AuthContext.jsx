import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api, { auth as authApi } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('taskflow_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await authApi.getMe();
          const userData = response.data?.data?.user || response.data?.data || response.data?.user || response.data;
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user', error);
          localStorage.removeItem('taskflow_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const payload = response.data?.data || response.data;
    const { token: newToken, user: userData } = payload;
    if (newToken) {
      localStorage.setItem('taskflow_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
    toast.success('Logged in successfully');
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authApi.register({ name, email, password });
    const payload = response.data?.data || response.data;
    const { token: newToken, user: userData } = payload;
    if (newToken) {
      localStorage.setItem('taskflow_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
    toast.success('Registered successfully');
    return response;
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out');
    window.location.href = '/';
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
