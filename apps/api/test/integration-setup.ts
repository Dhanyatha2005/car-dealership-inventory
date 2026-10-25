import { afterAll, beforeEach } from 'vitest';
import { resetDatabase, testDatabaseUrl, testPrisma } from './support/db';

// Code under test (env config, container) reads DATABASE_URL: point it at the test database.
process.env.DATABASE_URL = testDatabaseUrl;

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  // Leave the database empty so a later migration with new constraints never
  // trips over rows left behind by this file (e.g. invalid rows from a red run).
  await resetDatabase();
  await testPrisma.$disconnect();
});
