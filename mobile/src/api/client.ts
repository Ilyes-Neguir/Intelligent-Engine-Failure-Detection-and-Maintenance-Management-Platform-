import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiErrorData } from '../types';

// API base URL - will be set from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
const AUTH_KEY = 'auth_token';

// ─── Storage Helpers ──────────────────────────────────────
export const storeToken = async (token: string) => {
  await SecureStore.setItemAsync(AUTH_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_KEY);
  } catch {
    return null;
  }
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_KEY);
};

// ─── Request Helper ───────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  data?: any,
  params: any = {},
  requiresAuth = true,
  responseType: XMLHttpRequestResponseType = 'json'
): Promise<T> {
  try {
    // Get token if authentication is required
    let token = null;
    if (requiresAuth) {
      token = await getToken();
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Make the request
    const response = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      data,
      params,
      headers,
      responseType,
    });

    // Return the data
    return response.data;
  } catch (error: any) {
    // Handle Axios errors
    if (error.response) {
      // Server responded with error status
      const data: ApiErrorData = error.response.data || {
        message: error.response.statusText,
      };

      // Auto-logout on 401
      if (error.response.status === 401) {
        removeToken().catch(() => {}); // Ignore logout errors
      }

      throw new Error(data.message || 'An error occurred');
    } else if (error.request) {
      // No response received
      throw new Error(
        'Cannot connect to server. Please ensure the backend is running.'
      );
    } else {
      // Error setting up request
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

// ─── Public API Client ───────────────────────────────────
export const apiClient = {
  get: <T>(path: string, params: any = {}, requiresAuth = true) =>
    request<T>('GET', path, undefined, params, requiresAuth),

  post: <T>(path: string, data: any, requiresAuth = true) =>
    request<T>('POST', path, data, {}, requiresAuth),

  put: <T>(path: string, data: any, requiresAuth = true) =>
    request<T>('PUT', path, data, {}, requiresAuth),

  patch: <T>(path: string, data: any, requiresAuth = true) =>
    request<T>('PATCH', path, data, {}, requiresAuth),

  delete: <T>(path: string, requiresAuth = true) =>
    request<T>('DELETE', path, undefined, {}, requiresAuth),

  // Public endpoints (no auth required)
  getPublic: <T>(path: string, params: any = {}) =>
    request<T>('GET', path, undefined, params, false),

  postPublic: <T>(path: string, data: any) =>
    request<T>('POST', path, data, {}, false),

  // Blob download helper
  getBlob: async (path: string, params: any = {}, requiresAuth = true): Promise<Blob> => {
    try {
      let token = null;
      if (requiresAuth) {
        token = await getToken();
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios({
        method: 'GET',
        url: `${API_BASE_URL}${path}`,
        params,
        headers,
        responseType: 'blob',
      });

      return new Blob([response.data]);
    } catch (error: any) {
      if (error.response) {
        const data: ApiErrorData = error.response.data || {
          message: error.response.statusText,
        };
        if (error.response.status === 401) {
          removeToken().catch(() => {});
        }
        throw new Error(data.message || 'Download failed');
      } else if (error.request) {
        throw new Error(
          'Cannot connect to server for download. Please ensure the backend is running.'
        );
      } else {
        throw new Error(`Download failed: ${error.message}`);
      }
    }
  },
};