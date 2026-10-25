/**
 * Common request and response building blocks.
 */
import { z } from 'zod';
import { blankToUndefined } from './query-helpers';

/** Default number of items per page. */
export const DEFAULT_PAGE_SIZE = 12;
/** Largest page size a client may request. */
export const MAX_PAGE_SIZE = 50;

/** Route parameter `:id`; only UUIDs are accepted, anything else is a 400. */
export const IdParamSchema = z.object({ id: z.uuid() });
export type IdParam = z.infer<typeof IdParamSchema>;

/** A UTC ISO-8601 timestamp as produced by `Date#toISOString()`. */
export const IsoDateString = z.iso.datetime();

/**
 * `?page&pageSize` coerced from the query string. `page` >= 1 (default 1),
 * `pageSize` 1..50 (default 12). Out-of-range values are rejected, not clamped.
 */
export const PaginationQuerySchema = z.object({
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  ),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Builds the list envelope `{ items, page, pageSize, total }` around an item schema. */
export const paginated = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
    total: z.number().int().min(0),
  });

/** A page of `T` items as returned by every list endpoint. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
