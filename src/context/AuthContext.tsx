import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'counselor' | 'admin';
  onboardingCompleted?: boolean;
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

interface ApiError {
  response?: {
    data?: {
      msg?: string;
    };
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, role: 'client' | 'counselor') => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setAuthTokenAndLoadUser: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<{ 
    token: string | null; 
    user: User | null; 
    isAuthenticated: boolean; 
    loading: boolean; 
  }>({ 
    token: null, 
    user: null, 
    isAuthenticated: false, 
    loading: true 
  });

  const loadUser = useCallback(async () => {
    const tokenFromStorage = localStorage.getItem('token');
    if (!tokenFromStorage) {
      setAuthState(prev => ({ ...prev, loading: false, isAuthenticated: false, user: null, token: null }));
      delete api.defaults.headers.common['x-auth-token'];
      return;
    }

    api.defaults.headers.common['x-auth-token'] = tokenFromStorage;
    try {
      const response = await api.get('/auth/me');
      const user = response.data;

      setAuthState({
        token: tokenFromStorage,
        isAuthenticated: true,
        user: user,
        loading: false,
      });


    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['x-auth-token'];
      setAuthState({ token: null, user: null, isAuthenticated: false, loading: false });
    }
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const setAuthTokenAndLoadUser = useCallback(async (newToken: string) => {
    localStorage.setItem('token', newToken);
    await loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      await setAuthTokenAndLoadUser(response.data.token);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Login failed:', apiError.response?.data || err);
      throw new Error(apiError.response?.data?.msg || 'An error occurred during login.');
    }
  }, [setAuthTokenAndLoadUser]);

  const signup = useCallback(async (firstName: string, lastName: string, email: string, password: string, role: 'client' | 'counselor') => {
    try {
      const response = await api.post('/auth/signup', { firstName, lastName, email, password, role });
      await setAuthTokenAndLoadUser(response.data.token);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Signup failed:', apiError.response?.data || err);
      throw new Error(apiError.response?.data?.msg || 'An error occurred during signup.');
    }
  }, [setAuthTokenAndLoadUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setAuthState({ token: null, user: null, isAuthenticated: false, loading: false });
    navigate('/login');
  }, [navigate]);

  const contextValue = {
    ...authState,
    login,
    signup,
    logout,
    loadUser,
    setAuthTokenAndLoadUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
