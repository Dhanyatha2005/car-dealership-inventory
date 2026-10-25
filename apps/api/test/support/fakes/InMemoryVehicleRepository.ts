import { randomUUID } from 'node:crypto';
import type {
  NewVehicle,
  Vehicle,
  VehiclePatch,
} from '../../../src/modules/vehicles/vehicle.entity';
import type {
  VehicleCriteria,
  VehicleRepository,
} from '../../../src/modules/vehicles/vehicle.repository';

const contains = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

export class InMemoryVehicleRepository implements VehicleRepository {
  rows = new Map<string, Vehicle>();
  private clock = 0;

  private now(): Date {
    return new Date(Date.UTC(2026, 0, 1) + this.clock++ * 1000);
  }

  async create(data: NewVehicle): Promise<Vehicle> {
    const at = this.now();
    const v: Vehicle = {
      ...data,
      id: randomUUID(),
      isActive: true,
      archivedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    this.rows.set(v.id, v);
    return { ...v };
  }

  async findActiveById(id: string): Promise<Vehicle | null> {
    const v = this.rows.get(id);
    return v && v.isActive ? { ...v } : null;
  }

  async search(c: VehicleCriteria): Promise<{ items: Vehicle[]; total: number }> {
    const matched = [...this.rows.values()].filter(
      (v) =>
        v.isActive &&
        (c.q === undefined || contains(v.make, c.q) || contains(v.model, c.q)) &&
        (c.make === undefined || contains(v.make, c.make)) &&
        (c.model === undefined || contains(v.model, c.model)) &&
        (c.category === undefined || v.category === c.category) &&
        (c.minPriceCents === undefined || v.priceCents >= c.minPriceCents) &&
        (c.maxPriceCents === undefined || v.priceCents <= c.maxPriceCents) &&
        (c.year === undefined || v.year === c.year) &&
        (c.fuelType === undefined || v.fuelType === c.fuelType),
    );
    const dir = c.sortOrder === 'asc' ? 1 : -1;
    matched.sort((a, b) => {
      const x = a[c.sortBy];
      const y = b[c.sortBy];
      const cmp = x < y ? -1 : x > y ? 1 : 0;
      return cmp !== 0 ? cmp * dir : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return {
      items: matched.slice(c.skip, c.skip + c.take).map((v) => ({ ...v })),
      total: matched.length,
    };
  }

  async update(id: string, patch: VehiclePatch): Promise<Vehicle | null> {
    const v = this.rows.get(id);
    if (!v || !v.isActive) return null;
    const next = { ...v, ...patch, updatedAt: this.now() };
    this.rows.set(id, next);
    return { ...next };
  }

  async archive(id: string, at: Date): Promise<boolean> {
    const v = this.rows.get(id);
    if (!v || !v.isActive) return false;
    this.rows.set(id, { ...v, isActive: false, archivedAt: at, updatedAt: at });
    return true;
  }

  async decrementStockIfAvailable(id: string, qty: number): Promise<Vehicle | null> {
    const v = this.rows.get(id);
    if (!v || !v.isActive || v.quantity < qty) return null;
    const next = { ...v, quantity: v.quantity - qty, updatedAt: this.now() };
    this.rows.set(id, next);
    return { ...next };
  }

  async incrementStock(id: string, qty: number): Promise<Vehicle | null> {
    const v = this.rows.get(id);
    if (!v || !v.isActive) return null;
    const next = { ...v, quantity: v.quantity + qty, updatedAt: this.now() };
    this.rows.set(id, next);
    return { ...next };
  }
}
