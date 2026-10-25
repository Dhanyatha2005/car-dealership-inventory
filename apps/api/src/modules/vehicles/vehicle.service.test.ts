import { randomUUID } from 'node:crypto';
import type { CreateVehicleInput } from '@kata/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryVehicleRepository } from '../../../test/support/fakes/InMemoryVehicleRepository';
import { NotFoundError } from '../../core/errors';
import { createVehicleService, type VehicleService } from './vehicle.service';

const input = (over: Partial<CreateVehicleInput> = {}): CreateVehicleInput => ({
  make: 'Toyota',
  model: 'Corolla',
  category: 'SEDAN',
  priceCents: 2_000_000,
  quantity: 3,
  year: 2022,
  color: null,
  fuelType: null,
  transmission: null,
  imageUrl: null,
  description: null,
  ...over,
});
const listQ = { page: 1, pageSize: 12, sortBy: 'createdAt' as const, sortOrder: 'desc' as const };

describe('VehicleService', () => {
  let repo: InMemoryVehicleRepository;
  let svc: VehicleService;
  beforeEach(() => {
    repo = new InMemoryVehicleRepository();
    svc = createVehicleService({ vehicles: repo });
  });

  it('creates and fetches a vehicle', async () => {
    const v = await svc.create(input());
    expect(v.isActive).toBe(true);
    await expect(svc.getById(v.id)).resolves.toMatchObject({ make: 'Toyota', quantity: 3 });
  });

  it('getById throws VEHICLE_NOT_FOUND for missing or archived', async () => {
    await expect(svc.getById(randomUUID())).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
    const v = await svc.create(input());
    await svc.archive(v.id);
    await expect(svc.getById(v.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lists paginated active vehicles newest first', async () => {
    const a = await svc.create(input({ make: 'A' }));
    const b = await svc.create(input({ make: 'B' }));
    await svc.create(input({ make: 'C' }));
    const page = await svc.list({ ...listQ, pageSize: 2 });
    expect(page).toMatchObject({ page: 1, pageSize: 2, total: 3 });
    expect(page.items.map((v) => v.make)).toEqual(['C', 'B']);
    const p2 = await svc.list({ ...listQ, page: 2, pageSize: 2 });
    expect(p2.items.map((v) => v.id)).toEqual([a.id]);
    void b;
  });

  it('search maps filters and price range to criteria', async () => {
    await svc.create(input({ make: 'Toyota', priceCents: 100 }));
    await svc.create(input({ make: 'Honda', priceCents: 500 }));
    await svc.create(input({ make: 'toyota', model: 'Supra', priceCents: 900 }));
    const res = await svc.search({ ...listQ, q: 'TOY', minPrice: 50, maxPrice: 800 });
    expect(res.total).toBe(1);
    expect(res.items[0]?.priceCents).toBe(100);
  });

  it('update patches fields and 404s when missing', async () => {
    const v = await svc.create(input());
    await expect(svc.update(v.id, { color: 'red' })).resolves.toMatchObject({ color: 'red' });
    await expect(svc.update(randomUUID(), { color: 'red' })).rejects.toMatchObject({
      code: 'VEHICLE_NOT_FOUND',
    });
  });

  it('archive soft-deletes and 404s when already archived', async () => {
    const v = await svc.create(input());
    await svc.archive(v.id);
    expect(repo.rows.get(v.id)?.archivedAt).toBeInstanceOf(Date);
    await expect(svc.archive(v.id)).rejects.toMatchObject({ code: 'VEHICLE_NOT_FOUND' });
  });
});
