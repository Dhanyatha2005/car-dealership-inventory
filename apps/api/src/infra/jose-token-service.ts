/** HS256 JWT adapter for the {@link TokenService} port. */
import { RoleSchema } from '@kata/shared';
import { SignJWT, jwtVerify } from 'jose';
import { UnauthorizedError } from '../core/errors';
import type { TokenClaims, TokenService } from '../modules/auth/auth.ports';

const ALG = 'HS256';

export class JoseTokenService implements TokenService {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly expiresIn: string,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  sign(claims: TokenClaims): Promise<string> {
    return new SignJWT({ role: claims.role })
      .setProtectedHeader({ alg: ALG })
      .setSubject(claims.sub)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.key);
  }

  async verify(token: string): Promise<TokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: [ALG] });
      const role = RoleSchema.parse(payload.role);
      if (!payload.sub) throw new Error('missing sub');
      return { sub: payload.sub, role };
    } catch {
      throw new UnauthorizedError('UNAUTHENTICATED', 'Invalid or expired token');
    }
  }
}
