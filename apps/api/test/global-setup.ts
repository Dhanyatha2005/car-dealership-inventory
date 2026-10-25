import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    /** Connection URL of the integration test database (migrated, may be truncated). */
    databaseUrl: string;
  }
}

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * TEST_DATABASE_URL (one database per parallel worktree) wins; otherwise
 * DATABASE_URL, which `npm run test:integration` loads from .env.test.
 * Running vitest directly without dotenv-cli still falls back to .env.test.
 */
export function resolveTestDatabaseUrl(): string {
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    const envFile = resolve(apiRoot, '.env.test');
    if (existsSync(envFile)) process.loadEnvFile(envFile);
  }
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL for integration tests.');
  return url;
}

async function ensureDatabaseExists(url: string): Promise<void> {
  const target = new URL(url);
  const dbName = decodeURIComponent(target.pathname.slice(1));
  if (!dbName) throw new Error(`No database name in ${target.host}`);

  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  const client = new pg.Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      dbName,
    ]);
    if (!rowCount) {
      try {
        await client.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`);
      } catch (error) {
        // 42P04 duplicate_database: another process created it first.
        if ((error as { code?: string }).code !== '42P04') throw error;
      }
    }
  } finally {
    await client.end();
  }
}

function migrateDeploy(url: string): void {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url };
  // prisma.config.ts prefers DIRECT_DATABASE_URL; never let it redirect test migrations.
  delete env.DIRECT_DATABASE_URL;
  try {
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: apiRoot, env, stdio: 'pipe' });
  } catch (error) {
    // Re-throw with Prisma's output as plain text so Vitest prints the real cause.
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(
      `prisma migrate deploy failed for ${new URL(url).pathname.slice(1)}:\n${String(stdout ?? '')}${String(stderr ?? '')}`,
      { cause: error },
    );
  }
}

export default async function setup(project: TestProject): Promise<void> {
  const url = resolveTestDatabaseUrl();
  await ensureDatabaseExists(url);
  migrateDeploy(url);
  project.provide('databaseUrl', url);
}
