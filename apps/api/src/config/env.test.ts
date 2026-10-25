import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv, type EnvSource } from './env';

const SECRET = 'a-very-long-test-secret-of-at-least-32-chars';

const validSource = (overrides: EnvSource = {}): EnvSource => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://kata:kata@localhost:5433/kata_test',
  JWT_SECRET: SECRET,
  ...overrides,
});

/** Runs parseEnv and returns the thrown error (fails the test if nothing is thrown). */
const parseError = (source: EnvSource): Error => {
  try {
    parseEnv(source);
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected parseEnv to throw');
};

describe('parseEnv', () => {
  it('applies documented defaults to a minimal valid environment', () => {
    const env = parseEnv(validSource());

    expect(env).toEqual({
      NODE_ENV: 'test',
      PORT: 4000,
      DATABASE_URL: 'postgresql://kata:kata@localhost:5433/kata_test',
      JWT_SECRET: SECRET,
      JWT_EXPIRES_IN: '1h',
      BCRYPT_COST: 12,
      CORS_ORIGINS: [],
      AUTH_RATE_LIMIT_MAX: 20,
      TRUST_PROXY: 0,
      LOG_LEVEL: 'info',
    });
  });

  it('defaults NODE_ENV to development', () => {
    expect(parseEnv(validSource({ NODE_ENV: undefined })).NODE_ENV).toBe('development');
  });

  it('coerces numeric variables from strings', () => {
    const env = parseEnv(
      validSource({ PORT: '0', BCRYPT_COST: '4', AUTH_RATE_LIMIT_MAX: '10000', TRUST_PROXY: '1' }),
    );

    expect(env).toMatchObject({
      PORT: 0,
      BCRYPT_COST: 4,
      AUTH_RATE_LIMIT_MAX: 10000,
      TRUST_PROXY: 1,
    });
  });

  it('keeps the optional DIRECT_DATABASE_URL when present', () => {
    const direct = 'postgresql://kata:kata@localhost:5433/kata_direct';

    expect(parseEnv(validSource({ DIRECT_DATABASE_URL: direct })).DIRECT_DATABASE_URL).toBe(direct);
  });

  it('treats blank optional variables as unset', () => {
    const env = parseEnv(validSource({ DIRECT_DATABASE_URL: '', LOG_LEVEL: '', PORT: '' }));

    expect(env.DIRECT_DATABASE_URL).toBeUndefined();
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.PORT).toBe(4000);
  });

  it('splits, trims and drops empty entries in CORS_ORIGINS', () => {
    const env = parseEnv(
      validSource({ CORS_ORIGINS: ' http://localhost:5173 , https://app.example.com,, ' }),
    );

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });

  it.each([
    ['missing DATABASE_URL', { DATABASE_URL: undefined }, 'DATABASE_URL'],
    ['non-postgres DATABASE_URL', { DATABASE_URL: 'mysql://x@localhost/db' }, 'DATABASE_URL'],
    ['missing JWT_SECRET', { JWT_SECRET: undefined }, 'JWT_SECRET'],
    ['JWT_SECRET shorter than 32 chars', { JWT_SECRET: 'x'.repeat(31) }, 'JWT_SECRET'],
    ['unknown NODE_ENV', { NODE_ENV: 'staging' }, 'NODE_ENV'],
    ['BCRYPT_COST below 4', { BCRYPT_COST: '3' }, 'BCRYPT_COST'],
    ['BCRYPT_COST above 15', { BCRYPT_COST: '16' }, 'BCRYPT_COST'],
    ['non-integer PORT', { PORT: 'abc' }, 'PORT'],
    ['PORT above 65535', { PORT: '65536' }, 'PORT'],
    ['AUTH_RATE_LIMIT_MAX of zero', { AUTH_RATE_LIMIT_MAX: '0' }, 'AUTH_RATE_LIMIT_MAX'],
    ['negative TRUST_PROXY', { TRUST_PROXY: '-1' }, 'TRUST_PROXY'],
    ['unknown LOG_LEVEL', { LOG_LEVEL: 'verbose' }, 'LOG_LEVEL'],
    ['malformed JWT_EXPIRES_IN', { JWT_EXPIRES_IN: 'one hour' }, 'JWT_EXPIRES_IN'],
    ['CORS origin with a path', { CORS_ORIGINS: 'https://app.example.com/' }, 'CORS_ORIGINS'],
    ['CORS origin that is not a url', { CORS_ORIGINS: 'localhost:5173' }, 'CORS_ORIGINS'],
  ])('rejects %s', (_label, overrides, variable) => {
    const error = parseError(validSource(overrides));

    expect(error).toBeInstanceOf(EnvValidationError);
    expect(error.message).toContain(variable);
  });

  it('accepts common jose time spans for JWT_EXPIRES_IN', () => {
    for (const span of ['15m', '1h', '2 hours', '7d', '3600s']) {
      expect(parseEnv(validSource({ JWT_EXPIRES_IN: span })).JWT_EXPIRES_IN).toBe(span);
    }
  });

  it('requires CORS_ORIGINS in production', () => {
    const error = parseError(validSource({ NODE_ENV: 'production' }));

    expect(error).toBeInstanceOf(EnvValidationError);
    expect(error.message).toContain('CORS_ORIGINS');
  });

  it('accepts production with an explicit CORS allowlist', () => {
    const env = parseEnv(
      validSource({ NODE_ENV: 'production', CORS_ORIGINS: 'https://kata.vercel.app' }),
    );

    expect(env.CORS_ORIGINS).toEqual(['https://kata.vercel.app']);
  });

  it('reports every invalid variable at once', () => {
    const error = parseError(validSource({ JWT_SECRET: 'short', BCRYPT_COST: '99' }));

    expect(error.message).toContain('JWT_SECRET');
    expect(error.message).toContain('BCRYPT_COST');
  });

  it('never echoes variable values in the error message', () => {
    const leakySecret = 'super-secret-but-too-short';
    const error = parseError(
      validSource({ JWT_SECRET: leakySecret, DATABASE_URL: 'mysql://user:hunter2@db/x' }),
    );

    expect(error.message).not.toContain(leakySecret);
    expect(error.message).not.toContain('hunter2');
  });
});
