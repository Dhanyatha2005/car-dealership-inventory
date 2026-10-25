import { describe, expect, it } from 'vitest';
import { dollarsToCents, formatCents } from './money';

describe('formatCents', () => {
  it.each([
    [1_249_999, '$12,499.99'],
    [0, '$0.00'],
    [1, '$0.01'],
    [10, '$0.10'],
    [100, '$1.00'],
    [1_000_000_000, '$10,000,000.00'],
  ])('formats %d cents as %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });

  it('formats negative amounts', () => {
    expect(formatCents(-1_050)).toBe('-$10.50');
  });

  it('is exact for large amounts where cents / 100 would drift', () => {
    expect(formatCents(Number.MAX_SAFE_INTEGER)).toBe('$90,071,992,547,409.91');
  });

  it('honours locale and currency', () => {
    expect(formatCents(1_249_999, 'de-DE', 'EUR')).toBe('12.499,99 €');
  });

  it.each([12.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects non-integer or unsafe cents %d',
    (cents) => {
      expect(() => formatCents(cents)).toThrow(RangeError);
    },
  );
});

describe('dollarsToCents', () => {
  it.each([
    ['12,499.99', 1_249_999],
    ['12499.9', 1_249_990],
    ['12499', 1_249_900],
    ['0.1', 10],
    ['0.01', 1],
    ['0', 0],
    ['1,000,000', 100_000_000],
    ['  42.50  ', 4_250],
    ['$12,499.99', 1_249_999],
    ['0.29', 29],
    // Values where Math.round(parseFloat(x) * 100) style float math drifts:
    ['1.15', 115],
    ['0.07', 7],
    ['4.35', 435],
    ['90,071,992,547,409.91', Number.MAX_SAFE_INTEGER],
  ])('converts %j to %d cents', (input, expected) => {
    expect(dollarsToCents(input)).toBe(expected);
  });

  it.each([
    'abc',
    '',
    '   ',
    '-5',
    '-0.01',
    '12.345',
    '1.',
    '.5',
    '1e3',
    '12,49.99',
    '1,2345',
    '12..5',
    '$',
    'Infinity',
    'NaN',
    '0x10',
    '99999999999999999999',
  ])('rejects %j', (input) => {
    expect(() => dollarsToCents(input)).toThrow(RangeError);
  });
});
