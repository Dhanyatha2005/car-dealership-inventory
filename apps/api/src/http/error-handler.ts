/** Final Express error middleware: maps any thrown value to `{ error: { code, message, details? } }`. */
import type { ErrorCode, ErrorResponse } from '@kata/shared';
import type { ErrorRequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../core/errors';
import { ERROR_STATUS } from './error-status';

function send(res: Response, code: ErrorCode, message: string, details?: unknown): void {
  const body: ErrorResponse = {
    error: details === undefined ? { code, message } : { code, message, details },
  };
  res.status(ERROR_STATUS[code]).json(body);
}

/** body-parser errors carry a `type` string. */
function bodyParserType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type: unknown }).type;
    return typeof type === 'string' ? type : undefined;
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    send(res, err.code, err.message, err.details);
    return;
  }
  if (err instanceof ZodError) {
    send(
      res,
      'VALIDATION_ERROR',
      'Request validation failed',
      err.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    );
    return;
  }
  const type = bodyParserType(err);
  if (type === 'entity.parse.failed') {
    send(res, 'INVALID_JSON', 'Malformed JSON body');
    return;
  }
  if (type === 'entity.too.large') {
    send(res, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    return;
  }
  console.error(err);
  send(res, 'INTERNAL_ERROR', 'Internal server error');
};
