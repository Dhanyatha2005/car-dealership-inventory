import type { Paginated, PaginationQuery, PurchaseInput, RestockInput } from '@kata/shared';
import type { Vehicle } from '../vehicles/vehicle.entity';
import type { Purchase, PurchaseWithVehicle } from './purchase.entity';
import type { UnitOfWork } from './unit-of-work';

export interface PurchaseResult {
  purchase: Purchase;
  vehicle: Vehicle;
}
export interface InventoryService {
  purchase(userId: string, vehicleId: string, input: PurchaseInput): Promise<PurchaseResult>;
  restock(vehicleId: string, input: RestockInput): Promise<Vehicle>;
  listMyPurchases(userId: string, q: PaginationQuery): Promise<Paginated<PurchaseWithVehicle>>;
}
export interface InventoryServiceDeps {
  uow: UnitOfWork;
}

export function createInventoryService(_deps: InventoryServiceDeps): InventoryService {
  const notImplemented = () => Promise.reject(new Error('not implemented'));
  return { purchase: notImplemented, restock: notImplemented, listMyPurchases: notImplemented };
}
