/**
 * Money helpers. Amounts are integer cents (minor units of a two-decimal
 * currency) everywhere; these helpers convert to and from display strings
 * using string manipulation only, so no binary floating-point rounding can
 * creep in (e.g. `Math.round(1.15 * 100)` is 114.99999... before rounding,
 * and `cents / 100` loses precision for large amounts).
 */

/** `1,234.56` or `1234.56`, with 0-2 decimals; grouping commas must be well formed. */
const DOLLAR_AMOUNT = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/;

/**
 * Formats integer cents as a currency string, e.g. `1249999` → `"$12,499.99"`.
 * The cents are turned into an exact decimal string before `Intl` sees them.
 *
 * @throws RangeError if `cents` is not a safe integer.
 */
export const formatCents = (cents: number, locale = 'en-US', currency = 'USD'): string => {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Cents must be a safe integer, received ${cents}`);
  }
  const sign = cents < 0 ? '-' : '';
  const digits = String(Math.abs(cents)).padStart(3, '0');
  const decimal = `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}` as `${number}`;

  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(decimal);
};

/**
 * Parses a non-negative dollar amount typed by a user into integer cents, e.g.
 * `"12,499.99"` → `1249999`, `"0.1"` → `10`. Surrounding whitespace and one
 * leading `$` are allowed. Negative values, more than two decimals, malformed
 * grouping, exponents and empty input are rejected.
 *
 * @throws RangeError if the input is not a valid amount or exceeds the safe integer range.
 */
export const dollarsToCents = (input: string): number => {
  const trimmed = input.trim();
  const unsigned = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  const match = DOLLAR_AMOUNT.exec(unsigned);
  if (!match) {
    throw new RangeError(`Invalid dollar amount: "${input}"`);
  }

  const [, whole = '', fraction = ''] = match;
  const cents = Number(whole.replaceAll(',', '') + fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Dollar amount is too large: "${input}"`);
  }
  return cents;
};
