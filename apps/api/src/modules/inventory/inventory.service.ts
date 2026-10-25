import type { Paginated, PaginationQuery, PurchaseInput, RestockInput } from '@kata/shared';
import { ConflictError, NotFoundError } from '../../core/errors';
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

const notFound = () => new NotFoundError('VEHICLE_NOT_FOUND', 'Vehicle not found');

export function createInventoryService({ uow }: InventoryServiceDeps): InventoryService {
  return {
    purchase(userId, vehicleId, input) {
      const qty = input.quantity ?? 1;
      return uow.run(async ({ vehicles, purchases }) => {
        const updated = await vehicles.decrementStockIfAvailable(vehicleId, qty);
        if (!updated) {
          const v = await vehicles.findActiveById(vehicleId);
          if (!v) throw notFound();
          throw new ConflictError('INSUFFICIENT_STOCK', 'Not enough stock', {
            available: v.quantity,
            requested: qty,
          });
        }
        const purchase = await purchases.create({
          userId,
          vehicleId,
          quantity: qty,
          unitPriceCents: updated.priceCents,
        });
        return { purchase, vehicle: updated };
      });
    },
    restock(vehicleId, input) {
      return uow.run(async ({ vehicles }) => {
        const v = await vehicles.incrementStock(vehicleId, input.quantity);
        if (!v) throw notFound();
        return v;
      });
    },
    listMyPurchases(userId, q) {
      return uow.run(async ({ purchases }) => {
        const { items, total } = await purchases.listByUser(
          userId,
          (q.page - 1) * q.pageSize,
          q.pageSize,
        );
        return { items, page: q.page, pageSize: q.pageSize, total };
      });
    },
  };
}
