import { inject } from 'vitest';
import { createPrismaClient } from '../../src/infra/prisma';

/** URL of the migrated integration database, provided by test/global-setup.ts. */
export const testDatabaseUrl = inject('databaseUrl');

/**
 * Prisma client for integration tests (one per test file / fork). The pool is
 * larger than pg's default of 10 so concurrency tests are not pool-bound.
 * Disconnected in afterAll by test/integration-setup.ts.
 */
export const testPrisma = createPrismaClient(testDatabaseUrl, { poolMax: 20 });

/** Empties every table and resets sequences. Runs before each integration test. */
export async function resetDatabase(): Promise<void> {
  await testPrisma.$executeRawUnsafe(
    'TRUNCATE TABLE "purchases", "vehicles", "users" RESTART IDENTITY CASCADE',
  );
}
