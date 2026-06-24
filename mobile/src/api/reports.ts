import { apiClient } from './client';
import type { Report } from '../types';

export const reportsApi = {
  /**
   * GET /api/reports/booking/:id
   * Generate a PDF report for a booking (returns metadata).
   */
  generate: async (bookingId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/reports/booking/${bookingId}`,
      {}
    );
    return response;
  },

  /**
   * GET /api/reports/booking/:id/download
   * Download the generated PDF report.
   */
  download: async (bookingId: number): Promise<Blob> => {
    return await apiClient.getBlob(`/reports/booking/${bookingId}/download`);
  },

  /**
   * GET /api/reports/:id
   * Get report metadata by ID.
   */
  getById: async (id: number): Promise<Report> => {
    return await apiClient.get<Report>(`/reports/${id}`);
  },

  /**
   * GET /api/reports/booking/:id
   * Get reports for a specific booking.
   */
  getByBookingId: async (bookingId: number): Promise<Report[]> => {
    return await apiClient.get<Report[]>(`/reports/booking/${bookingId}`);
  },
};