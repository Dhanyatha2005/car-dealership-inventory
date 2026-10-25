import { createApp } from './app';

/**
 * Process entry point. Phase 1C replaces this stub with:
 * loadEnv → prisma → buildContainer → createApp → listen, plus graceful shutdown.
 */
const port = Number(process.env.PORT ?? 4000);

const server = createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
