import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../../src/core/errors';
import type { NewUser, User } from '../../../src/modules/users/user.entity';
import type { UserRepository } from '../../../src/modules/users/user.repository';

/** In-memory {@link UserRepository} for unit tests; mirrors the unique-email rule. */
export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(normalizedEmail: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  async create(data: NewUser): Promise<User> {
    if (await this.findByEmail(data.email)) {
      throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
    }
    const now = new Date();
    const user: User = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.users.set(user.id, user);
    return user;
  }

  async upsertAdmin(data: Omit<NewUser, 'role'>): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (!existing) return this.create({ ...data, role: 'ADMIN' });
    const updated: User = { ...existing, ...data, role: 'ADMIN', updatedAt: new Date() };
    this.users.set(updated.id, updated);
    return updated;
  }
}
