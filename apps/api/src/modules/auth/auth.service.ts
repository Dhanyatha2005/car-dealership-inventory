import type { LoginInput, PublicUser, RegisterInput } from '@kata/shared';
import type { UserRepository } from '../users/user.repository';
import type { PasswordHasher, TokenService } from './auth.ports';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export interface AuthService {
  /** Role is always USER. Throws `ConflictError('EMAIL_TAKEN')` on a duplicate email. */
  register(input: RegisterInput): Promise<AuthResult>;
  /** Unknown email and wrong password both throw `UnauthorizedError('INVALID_CREDENTIALS')`. */
  login(input: LoginInput): Promise<AuthResult>;
  /** Throws `NotFoundError('USER_NOT_FOUND')` when the user no longer exists. */
  getProfile(userId: string): Promise<PublicUser>;
}

export interface AuthServiceDeps {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
}

export function createAuthService(_deps: AuthServiceDeps): AuthService {
  const notImplemented = (): Promise<never> => Promise.reject(new Error('not implemented'));
  return { register: notImplemented, login: notImplemented, getProfile: notImplemented };
}
