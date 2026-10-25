/**
 * Internal helpers for parsing query-string values. Not part of the public
 * barrel; used by the query schemas in this folder.
 */
import { z } from 'zod';

/**
 * Maps blank query-string values (`?make=`) to `undefined`, so they count as
 * absent instead of being coerced to `0` or kept as `''`.
 */
export const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/**
 * An optional integer query parameter: blank means absent, strings are
 * coerced, and the result must lie in `[min, max]`.
 */
export const optionalQueryInt = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional());

/** An optional trimmed text query parameter of at most `max` characters; blank means absent. */
export const optionalQueryText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
