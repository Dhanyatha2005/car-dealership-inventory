import type { Purchase, PurchaseWithVehicle } from './purchase.entity';

export interface PurchaseRepository {
  create(data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase>;
  /** Newest first, id tiebreak. */
  listByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: PurchaseWithVehicle[]; total: number }>;
}
