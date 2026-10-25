import { defineConfig } from 'vitest/config';

/**
 * Two projects:
 * - unit: fast, parallel, no database (src/**\/*.test.ts).
 * - integration: real Postgres (test/integration/**\/*.int.test.ts). Files run
 *   one at a time in forked processes because they share one database that is
 *   truncated between tests. Phase 1B adds globalSetup/setupFiles here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/server.ts', 'src/**/*.test.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['test/integration/**/*.int.test.ts'],
          fileParallelism: false,
          pool: 'forks',
          // Creates the test database if missing and runs `prisma migrate deploy` once per run.
          globalSetup: ['./test/global-setup.ts'],
          // Truncates all tables before each test and disconnects Prisma after each file.
          setupFiles: ['./test/integration-setup.ts'],
        },
      },
    ],
  },
});
