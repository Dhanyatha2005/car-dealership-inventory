import { describe, expect, it } from 'vitest';
import { createInventoryService } from '../../src/modules/inventory/inventory.service';
import { PrismaUnitOfWork } from '../../src/modules/inventory/prisma-unit-of-work';
import { PrismaVehicleRepository } from '../../src/modules/vehicles/prisma-vehicle.repository';
import { testPrisma } from '../support/db';

describe('concurrent purchase of the last unit', () => {
  it('sells exactly one unit when 10 buyers race for stock 1', async () => {
    const users = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        testPrisma.user.create({
          data: {
            email: `buyer${i}@example.com`,
            name: `Buyer ${i}`,
            passwordHash: 'x',
            role: 'USER',
          },
        }),
      ),
    );
    const vehicle = await testPrisma.vehicle.create({
      data: {
        make: 'Ford',
        model: 'GT',
        category: 'COUPE',
        priceCents: 50_000_000,
        quantity: 1,
        year: 2024,
      },
    });
    const svc = createInventoryService({
      uow: new PrismaUnitOfWork(testPrisma, (tx) => new PrismaVehicleRepository(tx)),
    });

    const results = await Promise.allSettled(
      users.map((u) => svc.purchase(u.id, vehicle.id, { quantity: 1 })),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    for (const f of failed) expect(f.reason).toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    const after = await testPrisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(after.quantity).toBe(0);
    expect(await testPrisma.purchase.count()).toBe(1);
  });
});
