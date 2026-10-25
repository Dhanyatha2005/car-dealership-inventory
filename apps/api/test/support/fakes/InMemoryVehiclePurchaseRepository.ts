import { randomUUID } from 'node:crypto';
import type { Purchase, PurchaseWithVehicle } from '../../../src/modules/inventory/purchase.entity';
import type { PurchaseRepository } from '../../../src/modules/inventory/purchase.repository';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../../src/modules/inventory/unit-of-work';
import type { InMemoryVehicleRepository } from './InMemoryVehicleRepository';

export class InMemoryPurchaseRepository implements PurchaseRepository {
  rows = new Map<string, Purchase>();
  private clock = 0;
  constructor(private readonly vehicles: InMemoryVehicleRepository) {}

  async create(data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    const p: Purchase = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(Date.UTC(2026, 0, 1) + this.clock++ * 1000),
    };
    this.rows.set(p.id, p);
    return { ...p };
  }

  async listByUser(userId: string, skip: number, take: number) {
    const mine = [...this.rows.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? -1 : 1));
    const items: PurchaseWithVehicle[] = mine.slice(skip, skip + take).map((p) => {
      const v = this.vehicles.rows.get(p.vehicleId);
      if (!v) throw new Error(`vehicle ${p.vehicleId} missing`);
      return {
        ...p,
        vehicle: { id: v.id, make: v.make, model: v.model, year: v.year, category: v.category },
      };
    });
    return { items, total: mine.length };
  }
}

/** Snapshots the fakes' maps and restores them when the work throws. */
export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(
    readonly repos: { vehicles: InMemoryVehicleRepository; purchases: InMemoryPurchaseRepository },
  ) {}

  async run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    const v = new Map(this.repos.vehicles.rows);
    const p = new Map(this.repos.purchases.rows);
    try {
      return await work(this.repos);
    } catch (err) {
      this.repos.vehicles.rows = v;
      this.repos.purchases.rows = p;
      throw err;
    }
  }
}
