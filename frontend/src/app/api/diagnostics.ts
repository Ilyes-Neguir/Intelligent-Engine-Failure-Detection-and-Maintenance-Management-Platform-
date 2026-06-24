import { apiClient } from './client';
import type { OBDData } from '../types';

// ⚠️  OBD field names MUST match the backend DTO exactly.
// Backend DTO uses: map, tps, force, power, rpm,
// consumptionlh, consumptionl100km, speed, co, hc, co2, o2, lambda, afr
// (14 fields total)

export interface OBDPayload {
  map: number;           // Manifold Absolute Pressure (kPa)
  tps: number;           // Throttle Position Sensor (%)
  force: number;         // Engine Force/Torque (N·m)
  power: number;         // Engine Power (kW)
  rpm: number;           // Engine RPM
  consumptionlh: number; // Fuel Consumption (L/h)
  consumptionl100km: number; // Fuel Economy (L/100km)
  speed: number;         // Vehicle Speed (km/h)
  co: number;            // Carbon Monoxide (%)
  hc: number;            // Hydrocarbons (ppm)
  co2: number;           // Carbon Dioxide (%)
  o2: number;            // Oxygen (%)
  lambda: number;        // Lambda ratio (stoich = 1.0)
  afr: number;           // Air-Fuel Ratio (stoich ≈ 14.7)
}

export const diagnosticsApi = {
  /** POST /api/diagnostic/booking/{bookingId} — submit OBD data for AI analysis */
  submit: (bookingId: number, data: OBDPayload) =>
    apiClient.post<OBDData>(`/diagnostic/booking/${bookingId}`, data),

  /** GET /api/diagnostic/booking/{bookingId} — get OBD result for a booking */
  getByBooking: (bookingId: number) =>
    apiClient.get<OBDData>(`/diagnostic/booking/${bookingId}`),
};
