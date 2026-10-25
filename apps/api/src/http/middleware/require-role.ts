/** Allows only the given roles; must run after `authenticate`. */
import type { RequestHandler } from 'express';
import type { Role } from '../../core/auth';
import { ForbiddenError, UnauthorizedError } from '../../core/errors';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new UnauthorizedError('UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new ForbiddenError('FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
