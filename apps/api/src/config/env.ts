/**
 * Environment configuration (plan section 8). Parsed once at startup by
 * {@link parseEnv}; the process fails fast when anything is invalid.
 */
import { z } from 'zod';

/** Turns blank strings into `undefined` so defaults and optionals apply. */
const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema);

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/, error: 'must be a postgres:// URL' });

/** jose relative time span, e.g. `15m`, `1h`, `2 hours`, `7d`, `3600s`. */
const TIME_SPAN =
  /^\d+ ?(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|y|yr|yrs|year|years)$/i;

/** A browser origin: scheme + host (+ port), no path and no trailing slash. */
const isOrigin = (value: string): boolean => {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
};

const corsOrigins = z
  .string()
  .default('')
  .transform((raw) =>
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((origins) => origins.every(isOrigin), {
    error: 'each entry must be an exact origin such as https://app.example.com (no trailing slash)',
  });

export const EnvSchema = z
  .object({
    NODE_ENV: optional(z.enum(['development', 'test', 'production']).default('development')),
    PORT: optional(z.coerce.number().int().min(0).max(65535).default(4000)),
    DATABASE_URL: postgresUrl,
    DIRECT_DATABASE_URL: optional(postgresUrl.optional()),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: optional(z.string().regex(TIME_SPAN).default('1h')),
    BCRYPT_COST: optional(z.coerce.number().int().min(4).max(15).default(12)),
    CORS_ORIGINS: optional(corsOrigins),
    AUTH_RATE_LIMIT_MAX: optional(z.coerce.number().int().min(1).default(20)),
    TRUST_PROXY: optional(z.coerce.number().int().min(0).default(0)),
    LOG_LEVEL: optional(
      z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'is required in production',
      });
    }
  });

/** Typed, validated environment. */
export type Env = z.output<typeof EnvSchema>;
export type NodeEnv = Env['NODE_ENV'];
export type LogLevel = Env['LOG_LEVEL'];

/** Raw variables as found in `process.env`. */
export type EnvSource = Record<string, string | undefined>;

/** Thrown by {@link parseEnv}; lists every invalid variable by name, never by value. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';
}

/**
 * Parses and validates the environment.
 *
 * @throws {EnvValidationError} when any variable is missing or invalid.
 */
export function parseEnv(source: EnvSource): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;

  // Issue messages come from our own rules and never include the input value.
  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  throw new EnvValidationError(`Invalid environment variables:\n${problems.join('\n')}`);
}
