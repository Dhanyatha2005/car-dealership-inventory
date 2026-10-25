import { LoginInputSchema, RegisterInputSchema } from '@kata/shared';
import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../core/errors';
import type { AuthService } from './auth.service';

/** Thin HTTP adapters: parse with shared schemas (ZodError propagates), call the service. */
export function createAuthController(authService: AuthService) {
  return {
    async register(req: Request, res: Response): Promise<void> {
      const input = RegisterInputSchema.parse(req.body);
      res.status(201).json(await authService.register(input));
    },
    async login(req: Request, res: Response): Promise<void> {
      const input = LoginInputSchema.parse(req.body);
      res.status(200).json(await authService.login(input));
    },
    async me(req: Request, res: Response): Promise<void> {
      if (!req.auth) throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
      res.status(200).json({ user: await authService.getProfile(req.auth.userId) });
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
