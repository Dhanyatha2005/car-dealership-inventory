import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import type { Purchase, PurchaseWithVehicle } from './purchase.entity';
import type { PurchaseRepository } from './purchase.repository';

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class PrismaPurchaseRepository implements PurchaseRepository {
  constructor(private readonly db: PrismaDb) {}

  create(data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    return this.db.purchase.create({ data });
  }

  async listByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: PurchaseWithVehicle[]; total: number }> {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.db.purchase.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
        include: {
          vehicle: { select: { id: true, make: true, model: true, year: true, category: true } },
        },
      }),
      this.db.purchase.count({ where }),
    ]);
    return { items, total };
  }
}
