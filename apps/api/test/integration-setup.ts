import { afterAll, beforeEach } from 'vitest';
import { resetDatabase, testDatabaseUrl, testPrisma } from './support/db';

// Code under test (env config, container) reads DATABASE_URL: point it at the test database.
process.env.DATABASE_URL = testDatabaseUrl;

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
