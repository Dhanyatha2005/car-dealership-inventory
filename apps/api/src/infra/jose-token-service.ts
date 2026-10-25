import type { TokenClaims, TokenService } from '../modules/auth/auth.ports';

export class JoseTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}
  sign(_claims: TokenClaims): Promise<string> {
    return Promise.resolve(this.secret + this.expiresIn);
  }
  verify(_token: string): Promise<TokenClaims> {
    return Promise.reject(new Error('not implemented'));
  }
}
