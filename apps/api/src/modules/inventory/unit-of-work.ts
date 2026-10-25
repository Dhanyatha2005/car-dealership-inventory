import type { VehicleRepository } from '../vehicles/vehicle.repository';
import type { PurchaseRepository } from './purchase.repository';

export interface TransactionalRepositories {
  vehicles: VehicleRepository;
  purchases: PurchaseRepository;
}
export interface UnitOfWork {
  /** All-or-nothing. */
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
