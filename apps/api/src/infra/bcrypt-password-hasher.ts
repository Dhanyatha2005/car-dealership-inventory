/** bcryptjs adapter for the {@link PasswordHasher} port. */
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../modules/auth/auth.ports';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
