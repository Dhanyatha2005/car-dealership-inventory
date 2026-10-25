import type { NewUser, User } from './user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(normalizedEmail: string): Promise<User | null>;
  /** Throws `ConflictError('EMAIL_TAKEN')` on a unique email violation. */
  create(data: NewUser): Promise<User>;
  /** Seed only: creates or updates the ADMIN account for this email. */
  upsertAdmin(data: Omit<NewUser, 'role'>): Promise<User>;
}
