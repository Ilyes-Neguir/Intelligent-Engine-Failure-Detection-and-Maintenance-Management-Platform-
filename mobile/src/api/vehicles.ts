import { apiClient } from './client';
import type { Vehicle, VehiclePayload } from '../types';

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    return await apiClient.get<Vehicle[]>('/vehicles');
  },

  getById: async (id: number): Promise<Vehicle> => {
    return await apiClient.get<Vehicle>(`/vehicles/${id}`);
  },

  create: async (data: VehiclePayload): Promise<Vehicle> => {
    return await apiClient.post<Vehicle>('/vehicles', data);
  },

  update: async (id: number, data: VehiclePayload): Promise<Vehicle> => {
    return await apiClient.put<Vehicle>(`/vehicles/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};