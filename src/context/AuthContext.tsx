import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    securityQuestion?: string;
    securityAnswer?: string;
    targetExam?: string;
    learningStyle?: string;
    dailyGoalMinutes?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> & { securityQuestion?: string; securityAnswer?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('studymate_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('studymate_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
    } catch (err) {
      console.warn('Session verification failed:', err);
      localStorage.removeItem('studymate_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.login({ email, password: pass });
    localStorage.setItem('studymate_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (regData: any) => {
    const data = await api.register(regData);
    localStorage.setItem('studymate_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout network error (clearing local state):', err);
    } finally {
      localStorage.removeItem('studymate_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: any) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
