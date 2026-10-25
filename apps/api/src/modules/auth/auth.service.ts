import type { LoginInput, PublicUser, RegisterInput } from '@kata/shared';
import { NotFoundError, UnauthorizedError } from '../../core/errors';
import type { User } from '../users/user.entity';
import type { UserRepository } from '../users/user.repository';
import type { PasswordHasher, TokenService } from './auth.ports';
import { toPublicUser } from './user.mapper';

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

export function createAuthService({ users, hasher, tokens }: AuthServiceDeps): AuthService {
  const issue = async (user: User): Promise<AuthResult> => ({
    token: await tokens.sign({ sub: user.id, role: user.role }),
    user: toPublicUser(user),
  });

  return {
    async register(input) {
      const passwordHash = await hasher.hash(input.password);
      const user = await users.create({
        email: input.email,
        name: input.name,
        passwordHash,
        role: 'USER',
      });
      return issue(user);
    },

    async login(input) {
      const user = await users.findByEmail(input.email);
      if (!user || !(await hasher.verify(input.password, user.passwordHash))) {
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
      }
      return issue(user);
    },

    async getProfile(userId) {
      const user = await users.findById(userId);
      if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
      return toPublicUser(user);
    },
  };
}
