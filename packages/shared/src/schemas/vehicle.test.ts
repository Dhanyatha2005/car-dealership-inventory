import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CreateVehicleInputSchema,
  PaginatedVehiclesSchema,
  UpdateVehicleInputSchema,
  VehicleListQuerySchema,
  VehicleSchema,
  VehicleSearchQuerySchema,
} from './vehicle';

const validCreate = {
  make: 'Toyota',
  model: 'Camry',
  category: 'SEDAN',
  priceCents: 2_799_900,
  quantity: 5,
  year: 2024,
};

const accepts = (input: Record<string, unknown>) =>
  CreateVehicleInputSchema.safeParse({ ...validCreate, ...input }).success;

describe('CreateVehicleInputSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts the required fields and fills omitted optional fields with null', () => {
    expect(CreateVehicleInputSchema.parse(validCreate)).toEqual({
      ...validCreate,
      color: null,
      fuelType: null,
      transmission: null,
      imageUrl: null,
      description: null,
    });
  });

  it('accepts a fully populated vehicle', () => {
    const full = {
      ...validCreate,
      color: 'Midnight Black',
      fuelType: 'HYBRID',
      transmission: 'AUTOMATIC',
      imageUrl: 'https://images.example.com/camry.jpg',
      description: 'Low mileage, one owner.',
    };

    expect(CreateVehicleInputSchema.parse(full)).toEqual(full);
  });

  it('accepts explicit nulls for optional fields', () => {
    const parsed = CreateVehicleInputSchema.parse({
      ...validCreate,
      color: null,
      fuelType: null,
      transmission: null,
      imageUrl: null,
      description: null,
    });

    expect(parsed.color).toBeNull();
    expect(parsed.imageUrl).toBeNull();
  });

  it('normalizes blank optional text (from empty form inputs) to null', () => {
    const parsed = CreateVehicleInputSchema.parse({
      ...validCreate,
      color: '   ',
      imageUrl: '',
      description: '',
    });

    expect(parsed).toMatchObject({ color: null, imageUrl: null, description: null });
  });

  it('trims make and model', () => {
    const parsed = CreateVehicleInputSchema.parse({
      ...validCreate,
      make: ' Toyota ',
      model: ' Camry',
    });

    expect(parsed).toMatchObject({ make: 'Toyota', model: 'Camry' });
  });

  it.each(['make', 'model', 'category', 'priceCents', 'quantity', 'year'])(
    'requires %s',
    (field) => {
      const input: Record<string, unknown> = { ...validCreate };
      delete input[field];

      expect(CreateVehicleInputSchema.safeParse(input).success).toBe(false);
    },
  );

  it.each(['make', 'model', 'category', 'priceCents', 'quantity', 'year'])(
    'rejects null for required %s',
    (field) => {
      expect(accepts({ [field]: null })).toBe(false);
    },
  );

  it('rejects blank or over-long make and model', () => {
    expect(accepts({ make: '  ' })).toBe(false);
    expect(accepts({ model: '' })).toBe(false);
    expect(accepts({ make: 'a'.repeat(80) })).toBe(true);
    expect(accepts({ make: 'a'.repeat(81) })).toBe(false);
    expect(accepts({ model: 'a'.repeat(81) })).toBe(false);
  });

  it('is strict: unknown keys such as isActive or id are rejected', () => {
    expect(accepts({ isActive: false })).toBe(false);
    expect(accepts({ id: '3f2b1c9e-8a4d-4f6b-9c2e-1a2b3c4d5e6f' })).toBe(false);
  });

  it.each(['SEDAN', 'SUV', 'TRUCK', 'COUPE', 'HATCHBACK', 'CONVERTIBLE', 'VAN', 'WAGON'])(
    'accepts category %s',
    (category) => {
      expect(accepts({ category })).toBe(true);
    },
  );

  it('rejects unknown or wrongly cased enum values', () => {
    expect(accepts({ category: 'sedan' })).toBe(false);
    expect(accepts({ category: 'SPACESHIP' })).toBe(false);
    expect(accepts({ fuelType: 'STEAM' })).toBe(false);
    expect(accepts({ transmission: 'CVT' })).toBe(false);
  });

  it('accepts every fuel type and transmission', () => {
    for (const fuelType of ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']) {
      expect(accepts({ fuelType })).toBe(true);
    }
    for (const transmission of ['MANUAL', 'AUTOMATIC']) {
      expect(accepts({ transmission })).toBe(true);
    }
  });

  it('requires priceCents to be a positive integer of at most 1_000_000_000', () => {
    expect(accepts({ priceCents: 1 })).toBe(true);
    expect(accepts({ priceCents: 1_000_000_000 })).toBe(true);
    expect(accepts({ priceCents: 0 })).toBe(false);
    expect(accepts({ priceCents: -100 })).toBe(false);
    expect(accepts({ priceCents: 1_000_000_001 })).toBe(false);
    expect(accepts({ priceCents: 12.5 })).toBe(false);
    expect(accepts({ priceCents: '1000' })).toBe(false);
  });

  it('requires quantity to be an integer from 0 to 10_000', () => {
    expect(accepts({ quantity: 0 })).toBe(true);
    expect(accepts({ quantity: 10_000 })).toBe(true);
    expect(accepts({ quantity: -1 })).toBe(false);
    expect(accepts({ quantity: 10_001 })).toBe(false);
    expect(accepts({ quantity: 1.5 })).toBe(false);
  });

  it('accepts years from 1886 to next year', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    expect(accepts({ year: 1886 })).toBe(true);
    expect(accepts({ year: 2027 })).toBe(true);
    expect(accepts({ year: 1885 })).toBe(false);
    expect(accepts({ year: 2028 })).toBe(false);
    expect(accepts({ year: 2020.5 })).toBe(false);
  });

  it('computes the year ceiling at parse time, not at module load', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));

    expect(accepts({ year: 2031 })).toBe(true);
    expect(accepts({ year: 2032 })).toBe(false);
  });

  it.each([
    'https://example.com/car.png',
    'http://localhost:3000/car.png',
    'HTTPS://EXAMPLE.COM/car.png',
  ])('accepts http(s) image url %j', (imageUrl) => {
    expect(accepts({ imageUrl })).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'ftp://example.com/car.png',
    'file:///etc/passwd',
    'not a url',
    '//example.com/car.png',
  ])('rejects image url %j', (imageUrl) => {
    expect(accepts({ imageUrl })).toBe(false);
  });

  it('rejects an image url longer than 2048 characters', () => {
    const prefix = 'https://example.com/';

    expect(accepts({ imageUrl: prefix + 'a'.repeat(2048 - prefix.length) })).toBe(true);
    expect(accepts({ imageUrl: prefix + 'a'.repeat(2049 - prefix.length) })).toBe(false);
  });

  it('limits description to 2000 characters and color to 40', () => {
    expect(accepts({ description: 'a'.repeat(2000) })).toBe(true);
    expect(accepts({ description: 'a'.repeat(2001) })).toBe(false);
    expect(accepts({ color: 'a'.repeat(40) })).toBe(true);
    expect(accepts({ color: 'a'.repeat(41) })).toBe(false);
  });
});

describe('UpdateVehicleInputSchema', () => {
  it('accepts a partial update and keeps only the sent fields', () => {
    expect(UpdateVehicleInputSchema.parse({ priceCents: 1_999_900 })).toEqual({
      priceCents: 1_999_900,
    });
  });

  it('still validates the fields that are sent', () => {
    expect(UpdateVehicleInputSchema.safeParse({ priceCents: 0 }).success).toBe(false);
    expect(UpdateVehicleInputSchema.safeParse({ imageUrl: 'javascript:alert(1)' }).success).toBe(
      false,
    );
    expect(UpdateVehicleInputSchema.safeParse({ make: '' }).success).toBe(false);
  });

  it('lets an optional field be cleared with null', () => {
    expect(UpdateVehicleInputSchema.parse({ color: null })).toEqual({ color: null });
  });

  it('rejects quantity, because stock changes only through purchase and restock', () => {
    const result = UpdateVehicleInputSchema.safeParse({ quantity: 3 });

    expect(result.success).toBe(false);
  });

  it('is strict: unknown keys are rejected', () => {
    expect(UpdateVehicleInputSchema.safeParse({ make: 'Honda', isActive: true }).success).toBe(
      false,
    );
  });

  it('rejects an empty object', () => {
    expect(UpdateVehicleInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('VehicleListQuerySchema', () => {
  it('defaults to page 1, 12 per page, newest first', () => {
    expect(VehicleListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it.each(['createdAt', 'priceCents', 'year', 'make'])('accepts sortBy=%s', (sortBy) => {
    expect(VehicleListQuerySchema.parse({ sortBy, sortOrder: 'asc' })).toMatchObject({
      sortBy,
      sortOrder: 'asc',
    });
  });

  it('rejects unknown sort fields and orders', () => {
    expect(VehicleListQuerySchema.safeParse({ sortBy: 'quantity' }).success).toBe(false);
    expect(VehicleListQuerySchema.safeParse({ sortBy: 'isActive' }).success).toBe(false);
    expect(VehicleListQuerySchema.safeParse({ sortOrder: 'DESC' }).success).toBe(false);
  });

  it('caps pageSize at 50', () => {
    expect(VehicleListQuerySchema.parse({ pageSize: '50' }).pageSize).toBe(50);
    expect(VehicleListQuerySchema.safeParse({ pageSize: '51' }).success).toBe(false);
  });
});

describe('VehicleSearchQuerySchema', () => {
  it('accepts an empty query (no filters returns everything) with list defaults', () => {
    expect(VehicleSearchQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('coerces numeric query-string values', () => {
    const parsed = VehicleSearchQuerySchema.parse({
      minPrice: '1000000',
      maxPrice: '5000000',
      year: '2020',
      page: '2',
      pageSize: '24',
    });

    expect(parsed).toMatchObject({
      minPrice: 1_000_000,
      maxPrice: 5_000_000,
      year: 2020,
      page: 2,
      pageSize: 24,
    });
  });

  it('accepts text and enum filters and trims text', () => {
    const parsed = VehicleSearchQuerySchema.parse({
      q: ' family ',
      make: ' toy',
      model: 'cam ',
      category: 'SUV',
      fuelType: 'ELECTRIC',
    });

    expect(parsed).toMatchObject({
      q: 'family',
      make: 'toy',
      model: 'cam',
      category: 'SUV',
      fuelType: 'ELECTRIC',
    });
  });

  it('treats blank filters (e.g. ?make=&minPrice=) as absent rather than as 0 or ""', () => {
    const parsed = VehicleSearchQuerySchema.parse({ make: '', minPrice: '', category: '' });

    expect(parsed.make).toBeUndefined();
    expect(parsed.minPrice).toBeUndefined();
    expect(parsed.category).toBeUndefined();
  });

  it('rejects minPrice greater than maxPrice, reported on maxPrice', () => {
    const result = VehicleSearchQuerySchema.safeParse({ minPrice: '5000', maxPrice: '4999' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['maxPrice']);
  });

  it('accepts equal min and max prices (inclusive range)', () => {
    expect(VehicleSearchQuerySchema.safeParse({ minPrice: '5000', maxPrice: '5000' }).success).toBe(
      true,
    );
  });

  it.each([
    ['minPrice', 'abc'],
    ['minPrice', '-1'],
    ['maxPrice', '12.5'],
    ['year', '1800'],
    ['category', 'BOAT'],
    ['fuelType', 'petrol'],
    ['pageSize', '51'],
    ['make', 'a'.repeat(81)],
  ])('rejects %s=%j', (key, value) => {
    expect(VehicleSearchQuerySchema.safeParse({ [key]: value }).success).toBe(false);
  });

  it('rejects repeated query parameters (arrays)', () => {
    expect(VehicleSearchQuerySchema.safeParse({ make: ['a', 'b'] }).success).toBe(false);
  });
});

describe('VehicleSchema (DTO)', () => {
  const dto = {
    id: '3f2b1c9e-8a4d-4f6b-9c2e-1a2b3c4d5e6f',
    ...validCreate,
    color: null,
    fuelType: 'PETROL',
    transmission: null,
    imageUrl: null,
    description: null,
    createdAt: '2026-01-02T03:04:05.678Z',
    updatedAt: '2026-01-02T03:04:05.678Z',
  };

  it('parses a vehicle with null optional fields and ISO dates', () => {
    expect(VehicleSchema.parse(dto)).toEqual(dto);
  });

  it('never exposes internal fields such as isActive or archivedAt', () => {
    const parsed = VehicleSchema.parse({ ...dto, isActive: true, archivedAt: null });

    expect(parsed).not.toHaveProperty('isActive');
    expect(parsed).not.toHaveProperty('archivedAt');
  });

  it('requires nullable fields to be present (null, not omitted)', () => {
    const { color: _color, ...withoutColor } = dto;

    expect(VehicleSchema.safeParse(withoutColor).success).toBe(false);
  });

  it('wraps into a paginated list', () => {
    const page = { items: [dto], page: 1, pageSize: 12, total: 1 };

    expect(PaginatedVehiclesSchema.parse(page)).toEqual(page);
  });
});
