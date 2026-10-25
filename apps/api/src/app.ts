/**
 * Builds the Express application without listening, so tests can drive it
 * with supertest: security middleware, JSON parsing, module routers under
 * `/api`, health check, then not-found and the error handler.
 */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { ApiModule } from './http/api-module';
import { errorHandler } from './http/error-handler';
import { notFound } from './http/not-found';

export interface CreateAppOptions {
  /** Exact browser origins allowed by CORS; empty disallows cross-origin requests. */
  corsOrigins: string[];
}

export function createApp(modules: ApiModule[], opts: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: opts.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  for (const module of modules) {
    app.use('/api', module.router);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
