/** Identity attached to an authenticated request. */
import type { Role } from '@kata/shared';

export type { Role };

export interface AuthPrincipal {
  userId: string;
  role: Role;
}
