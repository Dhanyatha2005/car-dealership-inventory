import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import type { NewVehicle, Vehicle, VehiclePatch } from './vehicle.entity';
import type { VehicleCriteria, VehicleRepository } from './vehicle.repository';

export type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly db: PrismaDb) {}

  create(data: NewVehicle): Promise<Vehicle> {
    return this.db.vehicle.create({ data });
  }

  findActiveById(id: string): Promise<Vehicle | null> {
    return this.db.vehicle.findFirst({ where: { id, isActive: true } });
  }

  async search(c: VehicleCriteria): Promise<{ items: Vehicle[]; total: number }> {
    const ci = (value: string) => ({ contains: value, mode: Prisma.QueryMode.insensitive });
    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      ...(c.q === undefined ? {} : { OR: [{ make: ci(c.q) }, { model: ci(c.q) }] }),
      ...(c.make === undefined ? {} : { make: ci(c.make) }),
      ...(c.model === undefined ? {} : { model: ci(c.model) }),
      ...(c.category === undefined ? {} : { category: c.category }),
      ...(c.minPriceCents === undefined && c.maxPriceCents === undefined
        ? {}
        : { priceCents: { gte: c.minPriceCents, lte: c.maxPriceCents } }),
      ...(c.year === undefined ? {} : { year: c.year }),
      ...(c.fuelType === undefined ? {} : { fuelType: c.fuelType }),
    };
    const [items, total] = await Promise.all([
      this.db.vehicle.findMany({
        where,
        orderBy: [{ [c.sortBy]: c.sortOrder }, { id: 'asc' }],
        skip: c.skip,
        take: c.take,
      }),
      this.db.vehicle.count({ where }),
    ]);
    return { items, total };
  }

  async update(id: string, patch: VehiclePatch): Promise<Vehicle | null> {
    const { count } = await this.db.vehicle.updateMany({
      where: { id, isActive: true },
      data: patch,
    });
    return count === 0 ? null : this.findActiveById(id);
  }

  async archive(id: string, at: Date): Promise<boolean> {
    const { count } = await this.db.vehicle.updateMany({
      where: { id, isActive: true },
      data: { isActive: false, archivedAt: at },
    });
    return count > 0;
  }

  async decrementStockIfAvailable(id: string, qty: number): Promise<Vehicle | null> {
    const { count } = await this.db.vehicle.updateMany({
      where: { id, isActive: true, quantity: { gte: qty } },
      data: { quantity: { decrement: qty } },
    });
    return count === 0 ? null : this.db.vehicle.findUnique({ where: { id } });
  }

  async incrementStock(id: string, qty: number): Promise<Vehicle | null> {
    const { count } = await this.db.vehicle.updateMany({
      where: { id, isActive: true },
      data: { quantity: { increment: qty } },
    });
    return count === 0 ? null : this.db.vehicle.findUnique({ where: { id } });
  }
}
