import { describe, expect, it } from 'vitest';
import {
  AuthResponseSchema,
  LoginInputSchema,
  MeResponseSchema,
  PublicUserSchema,
  RegisterInputSchema,
} from './auth';

const validRegister = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse' };

describe('RegisterInputSchema', () => {
  it('accepts a valid registration', () => {
    expect(RegisterInputSchema.parse(validRegister)).toEqual(validRegister);
  });

  it('trims and lowercases the email', () => {
    const parsed = RegisterInputSchema.parse({ ...validRegister, email: '  Ada@Example.COM ' });

    expect(parsed.email).toBe('ada@example.com');
  });

  it.each(['not-an-email', 'ada@', '@example.com', 'ada example.com', ''])(
    'rejects invalid email %j',
    (email) => {
      expect(RegisterInputSchema.safeParse({ ...validRegister, email }).success).toBe(false);
    },
  );

  it('rejects an email longer than 254 characters', () => {
    const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(60)}.${'d'.repeat(60)}.com`;

    expect(email.length).toBe(254);
    expect(RegisterInputSchema.safeParse({ ...validRegister, email }).success).toBe(true);
    expect(RegisterInputSchema.safeParse({ ...validRegister, email: `a${email}` }).success).toBe(
      false,
    );
  });

  it('accepts passwords of 8 and 72 characters', () => {
    for (const password of ['a'.repeat(8), 'a'.repeat(72)]) {
      expect(RegisterInputSchema.safeParse({ ...validRegister, password }).success).toBe(true);
    }
  });

  it('rejects passwords of 7 and 73 characters', () => {
    for (const password of ['a'.repeat(7), 'a'.repeat(73)]) {
      expect(RegisterInputSchema.safeParse({ ...validRegister, password }).success).toBe(false);
    }
  });

  it('rejects a password over 72 UTF-8 bytes, because bcrypt would silently truncate it', () => {
    const password = 'é'.repeat(37); // 37 characters, 74 bytes

    expect(RegisterInputSchema.safeParse({ ...validRegister, password }).success).toBe(false);
  });

  it('does not trim the password', () => {
    const password = '  spaced pass  ';

    expect(RegisterInputSchema.parse({ ...validRegister, password }).password).toBe(password);
  });

  it('trims the name and accepts 1 to 80 characters', () => {
    expect(RegisterInputSchema.parse({ ...validRegister, name: '  Ada  ' }).name).toBe('Ada');
    expect(RegisterInputSchema.safeParse({ ...validRegister, name: 'A' }).success).toBe(true);
    expect(RegisterInputSchema.safeParse({ ...validRegister, name: 'a'.repeat(80) }).success).toBe(
      true,
    );
  });

  it.each(['', '   ', 'a'.repeat(81)])('rejects name %j', (name) => {
    expect(RegisterInputSchema.safeParse({ ...validRegister, name }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(RegisterInputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown keys such as a self-assigned role', () => {
    const result = RegisterInputSchema.safeParse({ ...validRegister, role: 'ADMIN' });

    expect(result.success).toBe(false);
  });
});

describe('LoginInputSchema', () => {
  it('trims and lowercases the email', () => {
    const parsed = LoginInputSchema.parse({ email: ' Ada@Example.com', password: 'whatever' });

    expect(parsed).toEqual({ email: 'ada@example.com', password: 'whatever' });
  });

  it('rejects an empty password and an invalid email', () => {
    expect(LoginInputSchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(
      false,
    );
    expect(LoginInputSchema.safeParse({ email: 'nope', password: 'whatever' }).success).toBe(false);
  });

  it('does not apply the registration minimum length, so wrong passwords stay a 401', () => {
    expect(
      LoginInputSchema.safeParse({ email: 'ada@example.com', password: 'short' }).success,
    ).toBe(true);
  });
});

describe('PublicUserSchema', () => {
  const user = {
    id: '3f2b1c9e-8a4d-4f6b-9c2e-1a2b3c4d5e6f',
    email: 'ada@example.com',
    name: 'Ada',
    role: 'USER',
  };

  it('parses a public user', () => {
    expect(PublicUserSchema.parse(user)).toEqual(user);
  });

  it('strips a password hash so it can never be serialized through this schema', () => {
    const parsed = PublicUserSchema.parse({ ...user, passwordHash: '$2b$10$secret' });

    expect(parsed).not.toHaveProperty('passwordHash');
  });

  it('rejects an unknown role', () => {
    expect(PublicUserSchema.safeParse({ ...user, role: 'ROOT' }).success).toBe(false);
  });

  it('wraps into AuthResponse and MeResponse', () => {
    expect(AuthResponseSchema.parse({ token: 'jwt', user })).toEqual({ token: 'jwt', user });
    expect(AuthResponseSchema.safeParse({ token: '', user }).success).toBe(false);
    expect(MeResponseSchema.parse({ user })).toEqual({ user });
  });
});
