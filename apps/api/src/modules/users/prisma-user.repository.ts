import { ConflictError } from '../../core/errors';
import type { PrismaClient } from '../../infra/prisma';
import type { User } from './user.entity';
import type { UserRepository } from './user.repository';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2002';

export function createPrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findById(id): Promise<User | null> {
      return prisma.user.findUnique({ where: { id } });
    },
    async findByEmail(normalizedEmail): Promise<User | null> {
      return prisma.user.findUnique({ where: { email: normalizedEmail } });
    },
    async create(data): Promise<User> {
      try {
        return await prisma.user.create({ data });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
        }
        throw error;
      }
    },
    async upsertAdmin(data): Promise<User> {
      return prisma.user.upsert({
        where: { email: data.email },
        create: { ...data, role: 'ADMIN' },
        update: { name: data.name, passwordHash: data.passwordHash, role: 'ADMIN' },
      });
    },
  };
}
