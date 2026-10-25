import type {
  CreateVehicleInput,
  Paginated,
  UpdateVehicleInput,
  VehicleListQuery,
  VehicleSearchQuery,
} from '@kata/shared';
import { NotFoundError } from '../../core/errors';
import type { Vehicle } from './vehicle.entity';
import type { VehicleCriteria, VehicleRepository } from './vehicle.repository';

export interface VehicleService {
  create(input: CreateVehicleInput): Promise<Vehicle>;
  /** Throws NotFoundError('VEHICLE_NOT_FOUND'). */
  getById(id: string): Promise<Vehicle>;
  list(query: VehicleListQuery): Promise<Paginated<Vehicle>>;
  search(query: VehicleSearchQuery): Promise<Paginated<Vehicle>>;
  update(id: string, input: UpdateVehicleInput): Promise<Vehicle>;
  archive(id: string): Promise<void>;
}

export interface VehicleServiceDeps {
  vehicles: VehicleRepository;
}

const notFound = () => new NotFoundError('VEHICLE_NOT_FOUND', 'Vehicle not found');

export function createVehicleService({ vehicles }: VehicleServiceDeps): VehicleService {
  async function page(
    q: VehicleListQuery,
    filters: Omit<VehicleCriteria, 'sortBy' | 'sortOrder' | 'skip' | 'take'>,
  ): Promise<Paginated<Vehicle>> {
    const { items, total } = await vehicles.search({
      ...filters,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    return { items, page: q.page, pageSize: q.pageSize, total };
  }

  return {
    create: (input) => vehicles.create(input),
    async getById(id) {
      const v = await vehicles.findActiveById(id);
      if (!v) throw notFound();
      return v;
    },
    list: (q) => page(q, {}),
    search: (q) =>
      page(q, {
        q: q.q,
        make: q.make,
        model: q.model,
        category: q.category,
        minPriceCents: q.minPrice,
        maxPriceCents: q.maxPrice,
        year: q.year,
        fuelType: q.fuelType,
      }),
    async update(id, input) {
      const v = await vehicles.update(id, input);
      if (!v) throw notFound();
      return v;
    },
    async archive(id) {
      if (!(await vehicles.archive(id, new Date()))) throw notFound();
    },
  };
}
