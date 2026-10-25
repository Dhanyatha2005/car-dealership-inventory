import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient };

export interface CreatePrismaClientOptions {
  /** Max connections in the pg pool (pg defaults to 10). */
  poolMax?: number;
}

/**
 * Builds a Prisma 7 client over the `pg` driver adapter. Prisma 7 requires a
 * driver adapter; the connection URL is passed in, never read from env here,
 * so the composition root and the test harness each choose their database.
 */
export function createPrismaClient(
  url: string,
  options: CreatePrismaClientOptions = {},
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: url,
    ...(options.poolMax === undefined ? {} : { max: options.poolMax }),
  });
  return new PrismaClient({ adapter });
}
