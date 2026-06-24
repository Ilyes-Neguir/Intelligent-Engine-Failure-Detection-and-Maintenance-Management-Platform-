import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import type { AuthUser } from '../types';

const AUTH_KEY = 'engine_auth_user';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from secure storage on init
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const result = await SecureStore.getItemAsync(AUTH_KEY);
        if (result) {
          const userData = JSON.parse(result);
          if (userData.token) {
            setUser(userData);
          }
        }
      } catch (err) {
        console.error('Failed to load user from storage:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.login({ email, password });
      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await authApi.logout();
      setUser(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'CLIENT' | 'MECHANIC';
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authApi.register(userData);
      return result;
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = () => !!user;

  // Get current user role
  const getUserRole = (): 'CLIENT' | 'MECHANIC' | null => {
    return user?.role ?? null;
  };

  // Get current user ID
  const getUserId = (): number | null => {
    return user?.userId ?? null;
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated,
    getUserRole,
    getUserId,
  };
};
