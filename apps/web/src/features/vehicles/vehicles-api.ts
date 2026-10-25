import type {
  CreateVehicleInput,
  PaginatedVehicles,
  UpdateVehicleInput,
  Vehicle,
  VehicleCategory,
} from '@kata/shared';
import { http } from '@/lib/api/http-client';

export interface VehicleFilters {
  q?: string;
  category?: VehicleCategory | '';
  minPrice?: number;
  maxPrice?: number;
  page: number;
}

export const vehicleKeys = {
  all: ['vehicles'] as const,
  search: (filters: VehicleFilters) => ['vehicles', 'search', filters] as const,
};

export const vehiclesApi = {
  search: (f: VehicleFilters) =>
    http.get<PaginatedVehicles>('/api/vehicles/search', {
      q: f.q,
      category: f.category,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      page: f.page,
    }),
  purchase: (id: string) => http.post<unknown>(`/api/vehicles/${id}/purchase`),
  create: (input: CreateVehicleInput) => http.post<Vehicle>('/api/vehicles', input),
  update: (id: string, input: UpdateVehicleInput) =>
    http.put<Vehicle>(`/api/vehicles/${id}`, input),
  remove: (id: string) => http.delete<unknown>(`/api/vehicles/${id}`),
  restock: (id: string, quantity: number) =>
    http.post<Vehicle>(`/api/vehicles/${id}/restock`, { quantity }),
};
