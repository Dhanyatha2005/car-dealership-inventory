/** Composition of feature modules mounted by `createApp`. */
import type { RequestHandler } from 'express';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { ApiModule } from '../http/api-module';
// eslint-disable-next-line no-restricted-imports -- composition root, not a cross-module import (rule's ../<dir>/ pattern false-positives at this depth)
import type { PrismaClient } from '../infra/prisma';
import type { PasswordHasher, TokenService } from './auth/auth.ports';

export interface ModuleDeps {
  prisma: PrismaClient;
  tokens: TokenService;
  hasher: PasswordHasher;
  authenticate: RequestHandler;
}

export function buildModules(_deps: ModuleDeps): ApiModule[] {
  // SEAM: register modules here
  return [];
}
