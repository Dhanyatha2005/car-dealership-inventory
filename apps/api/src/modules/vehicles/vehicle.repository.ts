import type { FuelType, VehicleCategory } from '@kata/shared';
import type { NewVehicle, Vehicle, VehiclePatch, VehicleSortField } from './vehicle.entity';

export interface VehicleCriteria {
  q?: string;
  make?: string;
  model?: string;
  category?: VehicleCategory;
  minPriceCents?: number;
  maxPriceCents?: number;
  year?: number;
  fuelType?: FuelType;
  sortBy: VehicleSortField;
  sortOrder: 'asc' | 'desc';
  skip: number;
  take: number;
}

export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  findActiveById(id: string): Promise<Vehicle | null>;
  /** Active only; ORDER BY sortBy, id ASC. */
  search(c: VehicleCriteria): Promise<{ items: Vehicle[]; total: number }>;
  /** null if missing/archived. */
  update(id: string, patch: VehiclePatch): Promise<Vehicle | null>;
  /** false if missing/already archived. */
  archive(id: string, at: Date): Promise<boolean>;
  /** Atomic conditional; null = not active or insufficient. */
  decrementStockIfAvailable(id: string, qty: number): Promise<Vehicle | null>;
  /** Active only. */
  incrementStock(id: string, qty: number): Promise<Vehicle | null>;
}
