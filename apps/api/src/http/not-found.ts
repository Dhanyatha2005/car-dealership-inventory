import type { RequestHandler } from 'express';

export const notFound: RequestHandler = (_req, _res, next) => {
  next();
};
