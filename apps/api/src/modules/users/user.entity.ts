import type { Role } from '../../core/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, 'email' | 'name' | 'passwordHash' | 'role'>;
