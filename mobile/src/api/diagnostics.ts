import { apiClient } from './client';
import type { OBDData } from '../types';

export interface OBDSubmission {
  map: number;
  tps: number;
  force: number;
  power: number;
  rpm: number;
  consumptionlh: number;
  consumptionl100km: number;
  speed: number;
  co: number;
  hc: number;
  co2: number;
  o2: number;
  lambda: number;
  afr: number;
}

export const diagnosticsApi = {
  /**
   * GET /api/diagnostic/booking/:id
   * Get OBD data for a specific booking.
   */
  getByBookingId: async (bookingId: number): Promise<OBDData[]> => {
    return await apiClient.get<OBDData[]>(`/diagnostic/booking/${bookingId}`);
  },

  /**
   * POST /api/diagnostic/booking/:id
   * Submit OBD readings for a booking.
   */
  submit: async (
    bookingId: number,
    data: OBDSubmission
  ): Promise<OBDData> => {
    return await apiClient.post<OBDData>(
      `/diagnostic/booking/${bookingId}`,
      data
    );
  },
};
