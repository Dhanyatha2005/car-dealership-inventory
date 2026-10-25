import type { RequestHandler } from 'express';
import type { ApiModule } from '../../http/api-module';
import { createAuthController } from './auth.controller';
import { createAuthRouter } from './auth.routes';
import type { AuthService } from './auth.service';

export interface AuthModuleDeps {
  authService: AuthService;
  authenticate: RequestHandler;
}

export function createAuthModule(deps: AuthModuleDeps): ApiModule {
  const controller = createAuthController(deps.authService);
  return {
    name: 'auth',
    router: createAuthRouter(controller, deps.authenticate),
    registerOpenApi: () => {
      // OpenAPI paths are registered in a later phase.
    },
  };
}
