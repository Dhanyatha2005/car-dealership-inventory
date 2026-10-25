import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * Prisma 7 no longer loads .env files: scripts wrap the CLI with dotenv-cli
 * (`dotenv -e .env -- prisma ...`). Migrations prefer DIRECT_DATABASE_URL
 * (Neon's non-pooled URL in production) and fall back to DATABASE_URL.
 * The empty-string fallback lets `prisma generate` run in postinstall on a
 * machine with no database variables set; commands that need a connection
 * fail with a clear error instead.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
  },
});
