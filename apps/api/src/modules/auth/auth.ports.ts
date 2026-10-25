/** Ports the auth domain depends on; infra adapters implement them. */
import type { Role } from '../../core/auth';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenClaims {
  sub: string;
  role: Role;
}

export interface TokenService {
  sign(claims: TokenClaims): Promise<string>;
  /** Throws `UnauthorizedError('UNAUTHENTICATED')` on a bad signature or expiry. */
  verify(token: string): Promise<TokenClaims>;
}
