import type { PublicUser } from '@kata/shared';
import type { User } from '../users/user.entity';

/** Strips private fields (passwordHash, timestamps) from a {@link User}. */
export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});
