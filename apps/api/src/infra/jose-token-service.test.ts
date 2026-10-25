import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../core/errors';
import { JoseTokenService } from './jose-token-service';

const SECRET = 'x'.repeat(32);

describe('JoseTokenService', () => {
  it('round-trips claims', async () => {
    const svc = new JoseTokenService(SECRET, '1h');
    const token = await svc.sign({ sub: 'u1', role: 'USER' });
    expect(await svc.verify(token)).toEqual({ sub: 'u1', role: 'USER' });
  });

  it('rejects a token signed with another secret', async () => {
    const token = await new JoseTokenService('y'.repeat(32), '1h').sign({ sub: 'u1', role: 'USER' });
    await expect(new JoseTokenService(SECRET, '1h').verify(token)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects garbage and expired tokens', async () => {
    const svc = new JoseTokenService(SECRET, '1h');
    await expect(svc.verify('garbage')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    const expired = await new JoseTokenService(SECRET, '-1s').sign({ sub: 'u1', role: 'USER' });
    await expect(svc.verify(expired)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
