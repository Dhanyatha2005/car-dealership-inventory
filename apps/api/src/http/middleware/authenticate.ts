/** Reads `Authorization: Bearer <jwt>`, verifies it and sets `req.auth`. */
import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../core/errors';
import type { TokenService } from '../../modules/auth/auth.ports';

const BEARER = /^Bearer (\S+)$/;

export function createAuthenticate(tokens: TokenService): RequestHandler {
  return async (req, _res, next) => {
    const match = BEARER.exec(req.headers.authorization ?? '');
    if (!match?.[1]) {
      next(new UnauthorizedError('UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    try {
      const claims = await tokens.verify(match[1]);
      req.auth = { userId: claims.sub, role: claims.role };
      next();
    } catch (err) {
      next(err);
    }
  };
}
