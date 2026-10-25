import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import type { VehicleRepository } from '../vehicles/vehicle.repository';
import type { TransactionalRepositories, UnitOfWork } from './unit-of-work';

/** Builds the vehicles adapter on a transaction client (wired by the composition root). */
export type VehicleRepositoryFactory = (tx: Prisma.TransactionClient) => VehicleRepository;

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly makeVehicles: VehicleRepositoryFactory,
  ) {}

  run<T>(_work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    void this.prisma;
    void this.makeVehicles;
    return Promise.reject(new Error('not implemented'));
  }
}
