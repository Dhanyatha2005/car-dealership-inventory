import { ERROR_CODES } from '@kata/shared';
import { describe, expect, it } from 'vitest';
import { ERROR_STATUS } from './error-status';

describe('ERROR_STATUS', () => {
  it('maps every error code to an HTTP error status', () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
  });

  it('uses the documented statuses', () => {
    expect(ERROR_STATUS.VALIDATION_ERROR).toBe(400);
    expect(ERROR_STATUS.UNAUTHENTICATED).toBe(401);
    expect(ERROR_STATUS.FORBIDDEN).toBe(403);
    expect(ERROR_STATUS.VEHICLE_NOT_FOUND).toBe(404);
    expect(ERROR_STATUS.EMAIL_TAKEN).toBe(409);
    expect(ERROR_STATUS.PAYLOAD_TOO_LARGE).toBe(413);
    expect(ERROR_STATUS.RATE_LIMITED).toBe(429);
    expect(ERROR_STATUS.INTERNAL_ERROR).toBe(500);
  });
});
