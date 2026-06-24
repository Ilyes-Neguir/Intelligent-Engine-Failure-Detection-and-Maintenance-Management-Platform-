import { apiClient } from './client';
import type { AuthUser, RegisterResponse, UserRole } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * POST /api/auth/register
   * Returns RegisterResponse { userId, name, email, role } — NO token.
   * Frontend must redirect to /login after success.
   */
  register: (data: RegisterPayload) =>
    apiClient.postPublic<RegisterResponse>('/auth/register', data),

  /**
   * POST /api/auth/login
   * Returns AuthResponse { token, userId, name, email, role }.
   */
  login: (data: LoginPayload) =>
    apiClient.postPublic<AuthUser>('/auth/login', data),
};
