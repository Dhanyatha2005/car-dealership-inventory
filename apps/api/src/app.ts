import express, { type Express } from 'express';

/**
 * Builds the Express application without listening, so tests can drive it
 * with supertest. Phase 1C replaces this stub with createApp(container),
 * which mounts security middleware, modules and the error handler.
 */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  return app;
}
