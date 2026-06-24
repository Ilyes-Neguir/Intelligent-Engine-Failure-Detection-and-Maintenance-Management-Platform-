import { apiClient } from './client';
import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse, User } from '../types';
import { storeAuthToken, removeAuthToken } from '../utils/storage';

export const authApi = {
  register: async (data: RegisterPayload): Promise<RegisterResponse> => {
    return await apiClient.postPublic<RegisterResponse>('/auth/register', data);
  },

  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const result = await apiClient.postPublic<LoginResponse>('/auth/login', data);
    // Store the token securely
    if (result.token) {
      await storeAuthToken(result.token);
    }
    return result;
  },

  logout: async (): Promise<void> => {
    // Remove the token
    await removeAuthToken();
    // Optionally call the logout endpoint to invalidate the token on the server
    // await apiClient.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    return await apiClient.get<User>('/auth/me');
  },
};