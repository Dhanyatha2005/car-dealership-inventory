/** Composition of feature modules mounted by `createApp`. */
import type { RequestHandler } from 'express';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import { requireRole } from '../http/middleware/require-role';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { ApiModule } from '../http/api-module';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { PrismaClient } from '../infra/prisma';
import { createAuthModule } from './auth/auth.module';
import type { PasswordHasher, TokenService } from './auth/auth.ports';
import { createAuthService } from './auth/auth.service';
import { createInventoryModule } from './inventory/inventory.module';
import { createInventoryService } from './inventory/inventory.service';
import { PrismaUnitOfWork } from './inventory/prisma-unit-of-work';
import { createPrismaUserRepository } from './users/prisma-user.repository';
import { PrismaVehicleRepository } from './vehicles/prisma-vehicle.repository';
import { toVehicleDto } from './vehicles/vehicle.mapper';
import { createVehicleService } from './vehicles/vehicle.service';
import { createVehiclesModule } from './vehicles/vehicles.module';

export interface ModuleDeps {
  prisma: PrismaClient;
  tokens: TokenService;
  hasher: PasswordHasher;
  authenticate: RequestHandler;
}

/** Wires each feature's adapters and services; one entry per mounted module. */
export function buildModules(deps: ModuleDeps): ApiModule[] {
  const users = createPrismaUserRepository(deps.prisma);
  const authService = createAuthService({ users, hasher: deps.hasher, tokens: deps.tokens });

  const vehicleService = createVehicleService({
    vehicles: new PrismaVehicleRepository(deps.prisma),
  });
  const uow = new PrismaUnitOfWork(deps.prisma, (tx) => new PrismaVehicleRepository(tx));
  const inventoryService = createInventoryService({ uow });
  const { authenticate } = deps;

  return [
    createAuthModule({ authService, authenticate }),
    createVehiclesModule({ vehicleService, authenticate, requireRole }),
    createInventoryModule({ inventoryService, authenticate, requireRole, toVehicleDto }),
    // SEAM: register modules here
  ];
}
