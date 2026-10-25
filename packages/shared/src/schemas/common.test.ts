import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { IdParamSchema, IsoDateString, PaginationQuerySchema, paginated } from './common';

const UUID = '3f2b1c9e-8a4d-4f6b-9c2e-1a2b3c4d5e6f';

describe('IdParamSchema', () => {
  it('accepts a uuid', () => {
    expect(IdParamSchema.parse({ id: UUID })).toEqual({ id: UUID });
  });

  it.each(['search', '123', '', `${UUID}x`, "1' OR '1'='1"])('rejects %j', (id) => {
    expect(IdParamSchema.safeParse({ id }).success).toBe(false);
  });

  it('rejects a missing id', () => {
    expect(IdParamSchema.safeParse({}).success).toBe(false);
  });
});

describe('IsoDateString', () => {
  it('accepts the output of Date#toISOString', () => {
    const iso = new Date('2026-01-02T03:04:05.678Z').toISOString();

    expect(IsoDateString.parse(iso)).toBe(iso);
  });

  it('rejects free-form dates and Date objects', () => {
    expect(IsoDateString.safeParse('January 2, 2026').success).toBe(false);
    expect(IsoDateString.safeParse(new Date()).success).toBe(false);
  });
});

describe('PaginationQuerySchema', () => {
  it('defaults to page 1 and page size 12', () => {
    expect(PaginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 12 });
  });

  it('coerces query-string values to integers', () => {
    expect(PaginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('treats blank values as absent', () => {
    expect(PaginationQuerySchema.parse({ page: '', pageSize: ' ' })).toEqual({
      page: 1,
      pageSize: 12,
    });
  });

  it.each([
    ['page', '0'],
    ['page', '-1'],
    ['page', '1.5'],
    ['page', 'abc'],
    ['pageSize', '0'],
    ['pageSize', '51'],
  ])('rejects %s=%j', (key, value) => {
    expect(PaginationQuerySchema.safeParse({ [key]: value }).success).toBe(false);
  });
});

describe('paginated(itemSchema)', () => {
  const PageOfNames = paginated(z.object({ name: z.string() }));

  it('builds a { items, page, pageSize, total } schema around the item schema', () => {
    const page = { items: [{ name: 'a' }, { name: 'b' }], page: 1, pageSize: 12, total: 2 };

    expect(PageOfNames.parse(page)).toEqual(page);
  });

  it('validates every item with the item schema', () => {
    const page = { items: [{ name: 1 }], page: 1, pageSize: 12, total: 1 };

    expect(PageOfNames.safeParse(page).success).toBe(false);
  });

  it('requires the paging metadata', () => {
    expect(PageOfNames.safeParse({ items: [] }).success).toBe(false);
    expect(PageOfNames.safeParse({ items: [], page: 1, pageSize: 12, total: -1 }).success).toBe(
      false,
    );
  });
});
