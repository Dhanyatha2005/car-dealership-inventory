import express, { type Express } from 'express';
import type { ApiModule } from './http/api-module';

export interface CreateAppOptions {
  corsOrigins: string[];
}

export function createApp(_modules: ApiModule[], _opts: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  return app;
}
