/**
 * Framework-free domain errors. Services throw these; the HTTP error handler
 * maps `code` to a status via the exhaustive table in `http/error-status.ts`.
 */
import type { ErrorCode } from '@kata/shared';

/** Base class for every expected, client-facing failure. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** A requested resource does not exist (or is archived). */
export class NotFoundError extends AppError {}
/** The request conflicts with current state (duplicate email, insufficient stock). */
export class ConflictError extends AppError {}
/** Missing, invalid or expired credentials. */
export class UnauthorizedError extends AppError {}
/** Authenticated, but the role is not allowed to perform the action. */
export class ForbiddenError extends AppError {}
