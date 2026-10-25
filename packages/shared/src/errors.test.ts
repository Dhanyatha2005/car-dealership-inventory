import { describe, expect, it } from 'vitest';
import { ERROR_CODES, ErrorResponseSchema } from './errors';

describe('ERROR_CODES', () => {
  it('lists exactly the codes of the error model (plan 2.3)', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      [
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
      ].sort(),
    );
  });
});

describe('ErrorResponseSchema', () => {
  it('parses an error envelope without details', () => {
    const body = { error: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' } };

    expect(ErrorResponseSchema.parse(body)).toEqual(body);
  });

  it('keeps arbitrary details', () => {
    const body = {
      error: {
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock',
        details: { available: 1, requested: 3 },
      },
    };

    expect(ErrorResponseSchema.parse(body)).toEqual(body);
  });

  it('rejects an unknown error code', () => {
    const result = ErrorResponseSchema.safeParse({ error: { code: 'TEAPOT', message: 'x' } });

    expect(result.success).toBe(false);
  });

  it('rejects a body that is not wrapped in "error" or lacks a message', () => {
    expect(ErrorResponseSchema.safeParse({ code: 'FORBIDDEN', message: 'x' }).success).toBe(false);
    expect(ErrorResponseSchema.safeParse({ error: { code: 'FORBIDDEN' } }).success).toBe(false);
  });
});
