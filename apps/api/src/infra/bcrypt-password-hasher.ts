import type { PasswordHasher } from '../modules/auth/auth.ports';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number) {}
  hash(plain: string): Promise<string> {
    return Promise.resolve(`${plain}${this.cost}`);
  }
  verify(_plain: string, _hash: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}
