import { Router, type RequestHandler } from 'express';
import type { AuthController } from './auth.controller';

export function createAuthRouter(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post('/auth/register', controller.register);
  router.post('/auth/login', controller.login);
  router.get('/auth/me', authenticate, controller.me);
  return router;
}
