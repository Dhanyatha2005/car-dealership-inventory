import type {
  CreateVehicleInput,
  Paginated,
  UpdateVehicleInput,
  VehicleListQuery,
  VehicleSearchQuery,
} from '@kata/shared';
import type { Vehicle } from './vehicle.entity';
import type { VehicleRepository } from './vehicle.repository';

export interface VehicleService {
  create(input: CreateVehicleInput): Promise<Vehicle>;
  getById(id: string): Promise<Vehicle>;
  list(query: VehicleListQuery): Promise<Paginated<Vehicle>>;
  search(query: VehicleSearchQuery): Promise<Paginated<Vehicle>>;
  update(id: string, input: UpdateVehicleInput): Promise<Vehicle>;
  archive(id: string): Promise<void>;
}

export interface VehicleServiceDeps {
  vehicles: VehicleRepository;
}

export function createVehicleService(_deps: VehicleServiceDeps): VehicleService {
  const notImplemented = () => Promise.reject(new Error('not implemented'));
  return {
    create: notImplemented,
    getById: notImplemented,
    list: notImplemented,
    search: notImplemented,
    update: notImplemented,
    archive: notImplemented,
  };
}
