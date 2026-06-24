import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, RegisterResponse } from '../types';
import { authApi } from '../api/auth';
import type { RegisterPayload, LoginPayload } from '../api/auth';

const AUTH_KEY = 'engine_auth_user';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<AuthUser>;
  /**
   * Register creates a new account only — does NOT authenticate.
   * The caller must redirect the user to /login after success.
   */
  register: (data: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only restore if the stored object has a token (valid auth session)
        if (parsed?.token) setUser(parsed);
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginPayload): Promise<AuthUser> => {
    const authUser = await authApi.login(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return authUser;
  }, []);

  /**
   * Register does NOT store a token or authenticate the user.
   * Register response: { userId, name, email, role } — no token.
   * Caller is responsible for redirecting to /login.
   */
  const register = useCallback(async (data: RegisterPayload): Promise<RegisterResponse> => {
    return authApi.register(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const isAuthenticated = !!user?.token;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
