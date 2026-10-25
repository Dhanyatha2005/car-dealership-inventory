/** Composition of feature modules mounted by `createApp`. */
import type { RequestHandler } from 'express';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { ApiModule } from '../http/api-module';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { PrismaClient } from '../infra/prisma';
import { createAuthModule } from './auth/auth.module';
import type { PasswordHasher, TokenService } from './auth/auth.ports';
import { createAuthService } from './auth/auth.service';
import { createPrismaUserRepository } from './users/prisma-user.repository';

export interface ModuleDeps {
  prisma: PrismaClient;
  tokens: TokenService;
  hasher: PasswordHasher;
  authenticate: RequestHandler;
}

/** Wires each feature's adapters and services; one entry per mounted module. */
export function buildModules(deps: ModuleDeps): ApiModule[] {
  const users = createPrismaUserRepository(deps.prisma);
  const authService = createAuthService({ users, hasher: deps.hasher, tokens: deps.tokens });

  return [
    createAuthModule({ authService, authenticate: deps.authenticate }),
    // SEAM: register modules here
  ];
}
