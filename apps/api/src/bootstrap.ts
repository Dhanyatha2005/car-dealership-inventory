/**
 * Composition shared by every runtime (local server, Vercel function):
 * env → prisma → adapters → modules → Express app.
 */
import type { Express } from 'express';
import { createApp } from './app';
import type { Env } from './config/env';
import { createAuthenticate } from './http/middleware/authenticate';
import { BcryptPasswordHasher } from './infra/bcrypt-password-hasher';
import { JoseTokenService } from './infra/jose-token-service';
import { createPrismaClient, type PrismaClient } from './infra/prisma';
import { buildModules } from './modules/index';

export interface Api {
  app: Express;
  prisma: PrismaClient;
}

export function buildApi(env: Env): Api {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const hasher = new BcryptPasswordHasher(env.BCRYPT_COST);
  const tokens = new JoseTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const authenticate = createAuthenticate(tokens);
  const modules = buildModules({ prisma, tokens, hasher, authenticate });
  const app = createApp(modules, { corsOrigins: env.CORS_ORIGINS });
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);
  return { app, prisma };
}
