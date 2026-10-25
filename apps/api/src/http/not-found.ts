/** Catch-all for unmatched routes; forwards ROUTE_NOT_FOUND to the error handler. */
import type { RequestHandler } from 'express';
import { NotFoundError } from '../core/errors';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError('ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};
