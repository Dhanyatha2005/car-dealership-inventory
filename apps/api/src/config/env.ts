/**
 * Environment configuration (plan section 8).
 */

export type NodeEnv = 'development' | 'test' | 'production';
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

/** Typed, validated environment. */
export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  DIRECT_DATABASE_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_COST: number;
  CORS_ORIGINS: string[];
  AUTH_RATE_LIMIT_MAX: number;
  TRUST_PROXY: number;
  LOG_LEVEL: LogLevel;
}

/** Raw variables as found in `process.env`. */
export type EnvSource = Record<string, string | undefined>;

/**
 * Parses and validates the environment.
 *
 * @throws {EnvValidationError} when any variable is missing or invalid.
 */
export function parseEnv(_source: EnvSource): Env {
  throw new Error('not implemented');
}

/** Thrown by {@link parseEnv}; lists every invalid variable by name, never by value. */
export class EnvValidationError extends Error {}
