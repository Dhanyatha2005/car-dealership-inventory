/** Maps the Vehicle entity to the public VehicleDto (ISO dates, no archive fields). */
import type { Vehicle as VehicleDto } from '@kata/shared';
import type { Vehicle } from './vehicle.entity';

export function toVehicleDto(v: Vehicle): VehicleDto {
  const { isActive: _isActive, archivedAt: _archivedAt, createdAt, updatedAt, ...rest } = v;
  return { ...rest, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
}
