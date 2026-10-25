import type { AuthPrincipal } from '../core/auth';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      auth?: AuthPrincipal;
    }
  }
}

export {};
