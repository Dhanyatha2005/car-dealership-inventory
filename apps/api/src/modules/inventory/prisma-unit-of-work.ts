import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import type { VehicleRepository } from '../vehicles/vehicle.repository';
import { PrismaPurchaseRepository } from './prisma-purchase.repository';
import type { TransactionalRepositories, UnitOfWork } from './unit-of-work';

/** Builds the vehicles adapter on a transaction client (wired by the composition root). */
export type VehicleRepositoryFactory = (tx: Prisma.TransactionClient) => VehicleRepository;

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly makeVehicles: VehicleRepositoryFactory,
  ) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) =>
      work({ vehicles: this.makeVehicles(tx), purchases: new PrismaPurchaseRepository(tx) }),
    );
  }
}
