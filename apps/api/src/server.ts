/** Local / long-running process entry point. */
import { buildApi } from './bootstrap';
import { parseEnv } from './config/env';

const env = parseEnv(process.env);
const { app, prisma } = buildApi(env);

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
