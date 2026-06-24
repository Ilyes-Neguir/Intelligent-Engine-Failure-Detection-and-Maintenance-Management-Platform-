import { apiClient } from './client';
import type { Vehicle } from '../types';

// ⚠️  All routes are JWT-identity-based — no userId in path.
// Backend resolves owner from the Bearer token.

export interface CreateVehiclePayload {
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate?: string;
  engineType?: string;
  mileage?: number;
}

export interface UpdateVehiclePayload {
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  engineType?: string;
  mileage?: number;
}

export const vehiclesApi = {
  /** GET /api/vehicles/my — list vehicles owned by the authenticated user */
  getMy: () =>
    apiClient.get<Vehicle[]>('/vehicles/my'),

  /** GET /api/vehicles/{id} */
  getById: (id: number) =>
    apiClient.get<Vehicle>(`/vehicles/${id}`),

  /** POST /api/vehicles */
  create: (data: CreateVehiclePayload) =>
    apiClient.post<Vehicle>('/vehicles', data),

  /** PUT /api/vehicles/{id} */
  update: (id: number, data: UpdateVehiclePayload) =>
    apiClient.put<Vehicle>(`/vehicles/${id}`, data),

  /** DELETE /api/vehicles/{id} */
  delete: (id: number) =>
    apiClient.delete<void>(`/vehicles/${id}`),
};
