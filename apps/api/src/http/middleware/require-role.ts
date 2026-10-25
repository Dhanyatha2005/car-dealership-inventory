import type { RequestHandler } from 'express';
import type { Role } from '../../core/auth';

export function requireRole(..._roles: Role[]): RequestHandler {
  return (_req, _res, next) => {
    next();
  };
}
