import { describe, expect, it } from 'vitest';
import {
  PaginatedPurchasesSchema,
  PurchaseInputSchema,
  PurchaseResultSchema,
  PurchaseSchema,
  PurchaseWithVehicleSchema,
  RestockInputSchema,
} from './inventory';

describe('PurchaseInputSchema', () => {
  it('defaults an empty body to one unit', () => {
    expect(PurchaseInputSchema.parse({})).toEqual({ quantity: 1 });
  });

  it('accepts 1 to 10 units', () => {
    expect(PurchaseInputSchema.parse({ quantity: 1 })).toEqual({ quantity: 1 });
    expect(PurchaseInputSchema.parse({ quantity: 10 })).toEqual({ quantity: 10 });
  });

  it.each([0, 11, -1, 1.5, '2', null])('rejects quantity %j', (quantity) => {
    expect(PurchaseInputSchema.safeParse({ quantity }).success).toBe(false);
  });

  it('is strict: unknown keys such as a client-supplied price are rejected', () => {
    expect(PurchaseInputSchema.safeParse({ quantity: 1, unitPriceCents: 1 }).success).toBe(false);
  });
});

describe('RestockInputSchema', () => {
  it('accepts 1 to 10_000 units', () => {
    expect(RestockInputSchema.parse({ quantity: 1 })).toEqual({ quantity: 1 });
    expect(RestockInputSchema.parse({ quantity: 10_000 })).toEqual({ quantity: 10_000 });
  });

  it.each([0, 10_001, -5, 2.5, '5'])('rejects quantity %j', (quantity) => {
    expect(RestockInputSchema.safeParse({ quantity }).success).toBe(false);
  });

  it('requires quantity (no default)', () => {
    expect(RestockInputSchema.safeParse({}).success).toBe(false);
  });

  it('is strict', () => {
    expect(RestockInputSchema.safeParse({ quantity: 1, note: 'x' }).success).toBe(false);
  });
});

describe('purchase response schemas', () => {
  const vehicle = {
    id: '6a1f3e2d-4b5c-4d7e-8f90-a1b2c3d4e5f6',
    make: 'Toyota',
    model: 'Camry',
    category: 'SEDAN',
    priceCents: 2_799_900,
    quantity: 4,
    year: 2024,
    color: null,
    fuelType: null,
    transmission: null,
    imageUrl: null,
    description: null,
    createdAt: '2026-01-02T03:04:05.678Z',
    updatedAt: '2026-01-02T03:04:05.678Z',
  };
  const purchase = {
    id: '3f2b1c9e-8a4d-4f6b-9c2e-1a2b3c4d5e6f',
    userId: '9b8c7d6e-5f4a-4b3c-8d2e-1f0a9b8c7d6e',
    vehicleId: vehicle.id,
    quantity: 1,
    unitPriceCents: 2_799_900,
    totalCents: 2_799_900,
    createdAt: '2026-01-02T03:04:05.678Z',
  };

  it('parses a purchase with its price snapshot and total', () => {
    expect(PurchaseSchema.parse(purchase)).toEqual(purchase);
    expect(PurchaseSchema.safeParse({ ...purchase, quantity: 0 }).success).toBe(false);
  });

  it('parses a purchase result carrying the updated vehicle', () => {
    const result = { purchase, vehicle };

    expect(PurchaseResultSchema.parse(result)).toEqual(result);
  });

  it('embeds a vehicle summary in purchase history', () => {
    const summary = {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
    };
    const item = { ...purchase, vehicle: summary };

    expect(PurchaseWithVehicleSchema.parse({ ...purchase, vehicle })).toEqual(item);
    expect(
      PaginatedPurchasesSchema.parse({ items: [item], page: 1, pageSize: 12, total: 1 }),
    ).toEqual({ items: [item], page: 1, pageSize: 12, total: 1 });
  });
});
