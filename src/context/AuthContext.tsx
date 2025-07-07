import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'client' | 'counselor' | 'admin';
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  maritalStatus?: string;
  nationality?: string;
  // Counselor specific fields
  countryOfResidence?: string;
  cityOfResidence?: string;
  academicQualifications?: string;
  relevantPositions?: string;
  yearsOfExperience?: string;
  issuesSpecialization?: string;
  affiliations?: string;
  sessionRate?: number;
  ngnSessionRate?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: 'client' | 'counselor') => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setAuthTokenAndLoadUser: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    const tokenToLoad = localStorage.getItem('token');
    if (!tokenToLoad) {
      setLoading(false);
      return;
    }
    
    api.defaults.headers.common['x-auth-token'] = tokenToLoad;
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      setToken(tokenToLoad);
    } catch (error: any) {
      console.error('Failed to load user:', error.response?.data || error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const setAuthTokenAndLoadUser = useCallback(async (newToken: string) => {
    if (!newToken) {
      logout();
      return;
    }
    localStorage.setItem('token', newToken);
    await loadUser();
  }, [loadUser, logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken } = response.data;
      await setAuthTokenAndLoadUser(newToken);
    } catch (err: any) {
      console.error('Login failed:', err.response?.data || err);
      logout();
      throw new Error(err.response?.data?.msg || 'An error occurred during login.');
    }
  }, [setAuthTokenAndLoadUser, logout]);

  const signup = useCallback(async (name: string, email: string, password: string, role: 'client' | 'counselor') => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', { name, email, password, role });
      const { token: newToken } = response.data;
      await setAuthTokenAndLoadUser(newToken);
    } catch (err: any) {
      console.error('Signup failed:', err.response?.data || err);
      logout();
      throw new Error(err.response?.data?.msg || 'An error occurred during signup.');
    }
  }, [setAuthTokenAndLoadUser, logout]);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, signup, logout, loadUser, setAuthTokenAndLoadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
