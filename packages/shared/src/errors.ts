/**
 * Machine-readable error codes and the error response envelope.
 *
 * The API maps each code to an HTTP status (an exhaustive
 * `Record<ErrorCode, number>`), and the web app switches on the code.
 */
import { z } from 'zod';

/** Every error code the API can return (plan section 2.3). */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_JSON',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'ROUTE_NOT_FOUND',
  'VEHICLE_NOT_FOUND',
  'USER_NOT_FOUND',
  'EMAIL_TAKEN',
  'INSUFFICIENT_STOCK',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

/** Validates an {@link ErrorCode}; unknown codes are rejected. */
export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/**
 * Body of every non-2xx response: `{ error: { code, message, details? } }`.
 * `details` is free-form (e.g. validation issues, `{ available, requested }`).
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
