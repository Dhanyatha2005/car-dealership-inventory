/** Exhaustive ErrorCode → HTTP status table; adding a code without a status fails typecheck. */
import type { ErrorCode } from '@kata/shared';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  ROUTE_NOT_FOUND: 404,
  VEHICLE_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  INSUFFICIENT_STOCK: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};
