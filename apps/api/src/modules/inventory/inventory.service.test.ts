import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryVehicleRepository } from '../../../test/support/fakes/InMemoryVehicleRepository';
import {
  InMemoryPurchaseRepository,
  InMemoryUnitOfWork,
} from '../../../test/support/fakes/InMemoryVehiclePurchaseRepository';
import { ConflictError } from '../../core/errors';
import type { Vehicle } from '../vehicles/vehicle.entity';
import { createInventoryService, type InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let vehicles: InMemoryVehicleRepository;
  let purchases: InMemoryPurchaseRepository;
  let svc: InventoryService;
  let car: Vehicle;
  const user = randomUUID();

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    purchases = new InMemoryPurchaseRepository(vehicles);
    svc = createInventoryService({ uow: new InMemoryUnitOfWork({ vehicles, purchases }) });
    car = await vehicles.create({
      make: 'Mazda',
      model: 'MX-5',
      category: 'COUPE',
      priceCents: 3_000_000,
      quantity: 2,
      year: 2023,
      color: null,
      fuelType: null,
      transmission: null,
      imageUrl: null,
      description: null,
    });
  });

  it('purchases with default qty 1 and snapshots the price', async () => {
    const r = await svc.purchase(user, car.id, { quantity: 1 });
    expect(r.vehicle.quantity).toBe(1);
    expect(r.purchase).toMatchObject({
      userId: user,
      vehicleId: car.id,
      quantity: 1,
      unitPriceCents: 3_000_000,
    });
    await vehicles.update(car.id, { priceCents: 1 });
    expect([...purchases.rows.values()][0]?.unitPriceCents).toBe(3_000_000);
  });

  it('rejects insufficient stock with details and writes nothing', async () => {
    const err = await svc.purchase(user, car.id, { quantity: 3 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: { available: 2, requested: 3 },
    });
    expect(purchases.rows.size).toBe(0);
    expect(vehicles.rows.get(car.id)?.quantity).toBe(2);
  });

  it('404s for unknown or archived vehicles', async () => {
    await expect(svc.purchase(user, randomUUID(), { quantity: 1 })).rejects.toMatchObject({
      code: 'VEHICLE_NOT_FOUND',
    });
    await vehicles.archive(car.id, new Date());
    await expect(svc.purchase(user, car.id, { quantity: 1 })).rejects.toMatchObject({
      code: 'VEHICLE_NOT_FOUND',
    });
    await expect(svc.restock(car.id, { quantity: 1 })).rejects.toMatchObject({
      code: 'VEHICLE_NOT_FOUND',
    });
  });

  it('restocks', async () => {
    await expect(svc.restock(car.id, { quantity: 5 })).resolves.toMatchObject({ quantity: 7 });
  });

  it('lists my purchases newest first, paginated', async () => {
    await svc.purchase(user, car.id, { quantity: 1 });
    const second = await svc.purchase(user, car.id, { quantity: 1 });
    await svc.restock(car.id, { quantity: 1 });
    await svc.purchase(randomUUID(), car.id, { quantity: 1 });
    const page = await svc.listMyPurchases(user, { page: 1, pageSize: 1 });
    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(page.items[0]?.id).toBe(second.purchase.id);
    expect(page.items[0]?.vehicle).toEqual({
      id: car.id,
      make: 'Mazda',
      model: 'MX-5',
      year: 2023,
      category: 'COUPE',
    });
  });
});
