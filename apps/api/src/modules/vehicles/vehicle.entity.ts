import type { FuelType, Transmission, VehicleCategory } from '@kata/shared';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: VehicleCategory;
  priceCents: number;
  quantity: number;
  year: number;
  color: string | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type NewVehicle = Omit<
  Vehicle,
  'id' | 'isActive' | 'archivedAt' | 'createdAt' | 'updatedAt'
>;
/** Stock changes only via purchase/restock. */
export type VehiclePatch = Partial<Omit<NewVehicle, 'quantity'>>;
export type VehicleSortField = 'createdAt' | 'priceCents' | 'year' | 'make';
