/** Process entry point: env → prisma → adapters → modules → app → listen. */
import { createApp } from './app';
import { parseEnv } from './config/env';
import { createAuthenticate } from './http/middleware/authenticate';
import { BcryptPasswordHasher } from './infra/bcrypt-password-hasher';
import { JoseTokenService } from './infra/jose-token-service';
import { createPrismaClient } from './infra/prisma';
import { buildModules } from './modules/index';

const env = parseEnv(process.env);
const prisma = createPrismaClient(env.DATABASE_URL);
const hasher = new BcryptPasswordHasher(env.BCRYPT_COST);
const tokens = new JoseTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
const authenticate = createAuthenticate(tokens);

const modules = buildModules({ prisma, tokens, hasher, authenticate });
const app = createApp(modules, { corsOrigins: env.CORS_ORIGINS });

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

const shutdown = () => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
