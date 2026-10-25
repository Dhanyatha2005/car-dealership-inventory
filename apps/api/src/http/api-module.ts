/**
 * Contract every feature module implements. `modules/index.ts` lists the
 * modules; adding or removing a feature is a one-line change there.
 */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { Router } from 'express';

export interface ApiModule {
  name: string;
  /** Mounted under `/api`. */
  router: Router;
  /** Registers this module's paths and schemas in the OpenAPI document. */
  registerOpenApi(registry: OpenAPIRegistry): void;
}
