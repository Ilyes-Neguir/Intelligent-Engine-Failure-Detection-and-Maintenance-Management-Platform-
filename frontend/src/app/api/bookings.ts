import { apiClient } from './client';
import type { Booking } from '../types';

// ⚠️  All routes are JWT-identity-based — no userId/mechanicId in path.
// Backend resolves the acting user from the Bearer token.

export interface CreateBookingPayload {
  vehicleId: number;
  scheduledTime: string; // ISO-8601 datetime
  description?: string;
}

export const bookingsApi = {
  /** GET /api/bookings/my — returns bookings for the authenticated user */
  getMy: () =>
    apiClient.get<Booking[]>('/bookings/my'),

  /** GET /api/bookings/{id} */
  getById: (id: number) =>
    apiClient.get<Booking>(`/bookings/${id}`),

  /** POST /api/bookings — CLIENT only */
  create: (data: CreateBookingPayload) =>
    apiClient.post<Booking>('/bookings', data),

  /** POST /api/bookings/{id}/accept — MECHANIC only */
  accept: (bookingId: number) =>
    apiClient.post<Booking>(`/bookings/${bookingId}/accept`),

  /** POST /api/bookings/{id}/start — MECHANIC only */
  start: (bookingId: number) =>
    apiClient.post<Booking>(`/bookings/${bookingId}/start`),

  /**
   * POST /api/bookings/{id}/complete — MECHANIC only
   * Body: { notes: string }
   */
  complete: (bookingId: number, data: { notes: string }) =>
    apiClient.post<Booking>(`/bookings/${bookingId}/complete`, data),

  /** POST /api/bookings/{id}/cancel — CLIENT only */
  cancel: (bookingId: number) =>
    apiClient.post<Booking>(`/bookings/${bookingId}/cancel`),
};
