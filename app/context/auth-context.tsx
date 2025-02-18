'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { AuthApi, LoginResponse } from '@/lib/domains/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string) => Promise<LoginResponse>;
  confirmCode: (phoneNumber: string, code: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (phoneNumber: string) => {
    const response = await AuthApi.login(phoneNumber);

    return response;
  };

  const confirmCode = async (sessionId: string, code: number) => {
    const data = await AuthApi.confirmSms(sessionId, code);
    setState({
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('access_token', data.jwt.accessToken);
    localStorage.setItem('refresh_token', data.jwt.refreshToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setState({
      isAuthenticated: false,
      isLoading: false,
    });
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (accessToken && refreshToken) {
      setState({
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        confirmCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
