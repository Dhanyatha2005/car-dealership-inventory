import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4);

  it('hashes and verifies a password', async () => {
    const hash = await hasher.hash('secret123');
    expect(hash).not.toBe('secret123');
    expect(await hasher.verify('secret123', hash)).toBe(true);
    expect(await hasher.verify('wrong', hash)).toBe(false);
  });
});
