import type { RequestHandler } from 'express';
import type { TokenService } from '../../modules/auth/auth.ports';

export function createAuthenticate(_tokens: TokenService): RequestHandler {
  return (_req, _res, next) => {
    next();
  };
}
