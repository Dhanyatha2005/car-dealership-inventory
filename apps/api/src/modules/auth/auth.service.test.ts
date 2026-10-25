import { describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../core/errors';
import { InMemoryUserRepository } from '../../../test/support/fakes/InMemoryUserRepository';
import type { PasswordHasher, TokenClaims, TokenService } from './auth.ports';
import { createAuthService } from './auth.service';

const hasher: PasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  verify: (plain, hash) => Promise.resolve(hash === `hashed:${plain}`),
};

const tokens: TokenService = {
  sign: (claims) => Promise.resolve(`token:${claims.sub}:${claims.role}`),
  verify: (token): Promise<TokenClaims> => {
    const [, sub = '', role] = token.split(':');
    return Promise.resolve({ sub, role: role === 'ADMIN' ? 'ADMIN' : 'USER' });
  },
};

const setup = () => {
  const users = new InMemoryUserRepository();
  const service = createAuthService({ users, hasher, tokens });
  return { users, service };
};

const input = { name: 'Ada', email: 'ada@example.com', password: 'password123' };

describe('AuthService.register', () => {
  it('creates a USER, hashes the password and returns a token with the public user', async () => {
    const { users, service } = setup();
    const result = await service.register(input);

    expect(result.user).toEqual({
      id: expect.any(String),
      email: 'ada@example.com',
      name: 'Ada',
      role: 'USER',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.token).toBe(`token:${result.user.id}:USER`);
    const stored = await users.findById(result.user.id);
    expect(stored?.passwordHash).toBe('hashed:password123');
  });

  it('rejects a duplicate email with EMAIL_TAKEN', async () => {
    const { service } = setup();
    await service.register(input);
    const error = await service.register(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toMatchObject({ code: 'EMAIL_TAKEN' });
  });
});

describe('AuthService.login', () => {
  it('returns a token and the public user for valid credentials', async () => {
    const { service } = setup();
    const { user } = await service.register(input);
    const result = await service.login({ email: input.email, password: input.password });
    expect(result).toEqual({ token: `token:${user.id}:USER`, user });
  });

  it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
    const { service } = setup();
    await service.register(input);
    const error = await service
      .login({ email: input.email, password: 'wrong-password' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('rejects an unknown email with the same INVALID_CREDENTIALS', async () => {
    const { service } = setup();
    const error = await service
      .login({ email: 'nobody@example.com', password: 'password123' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});

describe('AuthService.getProfile', () => {
  it('returns the public user', async () => {
    const { service } = setup();
    const { user } = await service.register(input);
    await expect(service.getProfile(user.id)).resolves.toEqual(user);
  });

  it('throws USER_NOT_FOUND for an unknown id', async () => {
    const { service } = setup();
    const error = await service
      .getProfile('00000000-0000-4000-8000-000000000000')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});
