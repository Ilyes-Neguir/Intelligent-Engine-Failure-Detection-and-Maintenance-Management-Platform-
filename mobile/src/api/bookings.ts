import { apiClient } from './client';
import type { Booking } from '../types';

export interface BookingPayload {
  vehicleId: number;
  scheduledTime: string; // ISO date string
  description?: string;
}

export const bookingsApi = {
  /**
   * GET /api/bookings/my
   * Get all bookings for the current user.
   */
  getMyBookings: async (): Promise<Booking[]> => {
    return await apiClient.get<Booking[]>('/bookings/my');
  },

  /**
   * GET /api/bookings/:id
   * Get a specific booking by ID.
   */
  getById: async (id: number): Promise<Booking> => {
    return await apiClient.get<Booking>(`/bookings/${id}`);
  },

  /**
   * POST /api/bookings
   * Create a new booking.
   */
  create: async (data: BookingPayload): Promise<Booking> => {
    return await apiClient.post<Booking>('/bookings', data);
  },

  /**
   * PUT /api/bookings/:id/accept
   * Mechanic accepts a booking.
   */
  accept: async (id: number): Promise<Booking> => {
    return await apiClient.put<Booking>(`/bookings/${id}/accept`, {});
  },

  /**
   * PUT /api/bookings/:id/start
   * Mechanic starts work on a booking.
   */
  start: async (id: number): Promise<Booking> => {
    return await apiClient.put<Booking>(`/bookings/${id}/start`, {});
  },

  /**
   * PUT /api/bookings/:id/complete
   * Mechanic completes a booking.
   */
  complete: async (id: number): Promise<Booking> => {
    return await apiClient.put<Booking>(`/bookings/${id}/complete`, {});
  },

  /**
   * PUT /api/bookings/:id/cancel
   * Cancel a booking (by client or mechanic).
   */
  cancel: async (id: number): Promise<Booking> => {
    return await apiClient.put<Booking>(`/bookings/${id}/cancel`, {});
  },
};
