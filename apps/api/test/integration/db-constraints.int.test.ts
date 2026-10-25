import { describe, expect, it } from 'vitest';
import type { Prisma } from '../../src/generated/prisma/client';
import { testPrisma } from '../support/db';

const validVehicle = {
  make: 'Toyota',
  model: 'Corolla',
  category: 'SEDAN',
  priceCents: 2_000_000,
  quantity: 3,
  year: 2022,
} satisfies Prisma.VehicleCreateInput;

async function createUserAndVehicle() {
  const user = await testPrisma.user.create({
    data: { email: 'buyer@example.com', name: 'Buyer', passwordHash: 'hash' },
  });
  const vehicle = await testPrisma.vehicle.create({ data: validVehicle });
  return { user, vehicle };
}

describe('vehicles check constraints', () => {
  it('accepts zero stock and a zero price at the boundary', async () => {
    const vehicle = await testPrisma.vehicle.create({
      data: { ...validVehicle, quantity: 0, priceCents: 0 },
    });

    expect(vehicle).toMatchObject({ quantity: 0, priceCents: 0 });
  });

  it('rejects creating a vehicle with negative stock', async () => {
    await expect(
      testPrisma.vehicle.create({ data: { ...validVehicle, quantity: -1 } }),
    ).rejects.toThrow(/vehicles_quantity_nonnegative/);
  });

  it('rejects decrementing stock below zero', async () => {
    const vehicle = await testPrisma.vehicle.create({ data: { ...validVehicle, quantity: 1 } });

    await expect(
      testPrisma.vehicle.update({
        where: { id: vehicle.id },
        data: { quantity: { decrement: 2 } },
      }),
    ).rejects.toThrow(/vehicles_quantity_nonnegative/);
    await expect(
      testPrisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
    ).resolves.toMatchObject({ quantity: 1 });
  });

  it('rejects a negative price on create and on update', async () => {
    await expect(
      testPrisma.vehicle.create({ data: { ...validVehicle, priceCents: -1 } }),
    ).rejects.toThrow(/vehicles_price_nonnegative/);

    const vehicle = await testPrisma.vehicle.create({ data: validVehicle });
    await expect(
      testPrisma.vehicle.update({ where: { id: vehicle.id }, data: { priceCents: -100 } }),
    ).rejects.toThrow(/vehicles_price_nonnegative/);
  });

  it.each([1885, 2101])('rejects model year %i outside 1886..2100', async (year) => {
    await expect(testPrisma.vehicle.create({ data: { ...validVehicle, year } })).rejects.toThrow(
      /vehicles_year_range/,
    );
  });

  it.each([1886, 2100])('accepts model year %i at the range boundary', async (year) => {
    await expect(
      testPrisma.vehicle.create({ data: { ...validVehicle, year } }),
    ).resolves.toMatchObject({ year });
  });
});

describe('purchases check constraints', () => {
  it('accepts a purchase of one unit at a non-negative price', async () => {
    const { user, vehicle } = await createUserAndVehicle();

    const purchase = await testPrisma.purchase.create({
      data: { userId: user.id, vehicleId: vehicle.id, quantity: 1, unitPriceCents: 0 },
    });

    expect(purchase).toMatchObject({ quantity: 1, unitPriceCents: 0 });
  });

  it.each([0, -1])('rejects a purchase quantity of %i', async (quantity) => {
    const { user, vehicle } = await createUserAndVehicle();

    await expect(
      testPrisma.purchase.create({
        data: { userId: user.id, vehicleId: vehicle.id, quantity, unitPriceCents: 100 },
      }),
    ).rejects.toThrow(/purchases_quantity_positive/);
  });

  it('rejects a negative unit price', async () => {
    const { user, vehicle } = await createUserAndVehicle();

    await expect(
      testPrisma.purchase.create({
        data: { userId: user.id, vehicleId: vehicle.id, quantity: 1, unitPriceCents: -1 },
      }),
    ).rejects.toThrow(/purchases_unit_price_nonneg/);
  });
});
