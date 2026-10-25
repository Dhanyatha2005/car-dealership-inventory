/**
 * Vehicle contracts: the DTO, admin create/update bodies and list/search queries.
 */
import { z } from 'zod';
import {
  FuelTypeSchema,
  SortOrderSchema,
  TransmissionSchema,
  VehicleCategorySchema,
  VehicleSortFieldSchema,
} from '../enums';
import { IsoDateString, PaginationQuerySchema, paginated } from './common';
import { blankToUndefined, optionalQueryInt, optionalQueryText } from './query-helpers';

/** Highest accepted price: $10,000,000.00. */
export const MAX_PRICE_CENTS = 1_000_000_000;
/** Highest stock level a vehicle may hold (also the restock ceiling). */
export const MAX_STOCK_QUANTITY = 10_000;
/** The first production automobile (Benz Patent-Motorwagen). */
export const MIN_VEHICLE_YEAR = 1886;
export const MAKE_MODEL_MAX_LENGTH = 80;
export const COLOR_MAX_LENGTH = 40;
export const IMAGE_URL_MAX_LENGTH = 2048;
export const DESCRIPTION_MAX_LENGTH = 2000;

/** Next calendar year (UTC), evaluated on every call so long-running processes stay correct. */
export const maxVehicleYear = (): number => new Date().getUTCFullYear() + 1;

const yearIsNotTooNew = [
  (year: number) => year <= maxVehicleYear(),
  { message: 'Year cannot be later than next year' },
] as const;

/** Required text: trimmed, 1..max characters. */
const requiredText = (max: number) => z.string().trim().min(1).max(max);

/**
 * Optional text: trimmed, at most `max` characters. Omitted, `null` and blank
 * input all become `null`, matching the nullable DTO and database columns.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))
    .nullish()
    .transform((value) => value ?? null);

/** Optional enum: omitted and `null` become `null`. */
const optionalEnum = <T extends z.ZodType>(schema: T) =>
  schema.nullish().transform((value) => value ?? null);

/** Optional http(s) URL, at most 2048 characters; blank becomes `null`. Rejects `javascript:` etc. */
const optionalHttpUrl = z
  .string()
  .trim()
  .pipe(
    z.union([
      z.literal(''),
      z
        .url({ protocol: /^https?$/i, error: 'Image URL must be an http(s) URL' })
        .max(IMAGE_URL_MAX_LENGTH),
    ]),
  )
  .transform((value) => (value === '' ? null : value))
  .nullish()
  .transform((value) => value ?? null);

/** Fields an admin may set on create and (except quantity) on update. */
const vehicleFields = {
  make: requiredText(MAKE_MODEL_MAX_LENGTH),
  model: requiredText(MAKE_MODEL_MAX_LENGTH),
  category: VehicleCategorySchema,
  priceCents: z.number().int().min(1).max(MAX_PRICE_CENTS),
  year: z
    .number()
    .int()
    .min(MIN_VEHICLE_YEAR)
    .refine(...yearIsNotTooNew),
  color: optionalText(COLOR_MAX_LENGTH),
  fuelType: optionalEnum(FuelTypeSchema),
  transmission: optionalEnum(TransmissionSchema),
  imageUrl: optionalHttpUrl,
  description: optionalText(DESCRIPTION_MAX_LENGTH),
};

/**
 * `POST /api/vehicles` body (strict). Prices are integer cents 1..1e9, stock
 * 0..10,000, year 1886..next year (checked at parse time). Optional fields
 * may be omitted, `null` or blank; all three parse to `null`.
 */
export const CreateVehicleInputSchema = z.strictObject({
  ...vehicleFields,
  quantity: z.number().int().min(0).max(MAX_STOCK_QUANTITY),
});
export type CreateVehicleInput = z.infer<typeof CreateVehicleInputSchema>;
/** Raw admin form values before parsing (optional fields may be blank or missing). */
export type CreateVehicleFormValues = z.input<typeof CreateVehicleInputSchema>;

/**
 * `PUT /api/vehicles/:id` body: any subset of the create fields except
 * `quantity` (stock changes only through purchase and restock). Strict, so
 * sending `quantity` is a 400; at least one field is required. Only sent
 * fields appear in the output; `null` clears an optional field.
 */
export const UpdateVehicleInputSchema = z
  .strictObject(vehicleFields)
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleInputSchema>;
export type UpdateVehicleFormValues = z.input<typeof UpdateVehicleInputSchema>;

/**
 * Vehicle as returned by the API. Optional attributes are always present as
 * `null`, dates are ISO strings, and internal fields (`isActive`,
 * `archivedAt`) are stripped.
 */
export const VehicleSchema = z.object({
  id: z.uuid(),
  make: z.string(),
  model: z.string(),
  category: VehicleCategorySchema,
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(0),
  year: z.number().int(),
  color: z.string().nullable(),
  fuelType: FuelTypeSchema.nullable(),
  transmission: TransmissionSchema.nullable(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: IsoDateString,
  updatedAt: IsoDateString,
});
export type Vehicle = z.infer<typeof VehicleSchema>;

/**
 * `GET /api/vehicles` query: pagination plus `sortBy` (default `createdAt`)
 * and `sortOrder` (default `desc`). Unknown parameters are ignored.
 */
export const VehicleListQuerySchema = PaginationQuerySchema.extend({
  sortBy: z.preprocess(blankToUndefined, VehicleSortFieldSchema.default('createdAt')),
  sortOrder: z.preprocess(blankToUndefined, SortOrderSchema.default('desc')),
});
export type VehicleListQuery = z.infer<typeof VehicleListQuerySchema>;

/**
 * `GET /api/vehicles/search` query: the list query plus optional filters.
 * Text filters are trimmed (partial match), prices are inclusive integer
 * cents with `minPrice <= maxPrice`, and blank values count as absent. No
 * filters is valid and returns every active vehicle.
 */
export const VehicleSearchQuerySchema = VehicleListQuerySchema.extend({
  q: optionalQueryText(100),
  make: optionalQueryText(MAKE_MODEL_MAX_LENGTH),
  model: optionalQueryText(MAKE_MODEL_MAX_LENGTH),
  category: z.preprocess(blankToUndefined, VehicleCategorySchema.optional()),
  minPrice: optionalQueryInt(0, MAX_PRICE_CENTS),
  maxPrice: optionalQueryInt(0, MAX_PRICE_CENTS),
  year: optionalQueryInt(MIN_VEHICLE_YEAR, Number.MAX_SAFE_INTEGER).refine(
    (year) => year === undefined || year <= maxVehicleYear(),
    { message: 'Year cannot be later than next year' },
  ),
  fuelType: z.preprocess(blankToUndefined, FuelTypeSchema.optional()),
}).refine(
  ({ minPrice, maxPrice }) =>
    minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
  { message: 'minPrice must be less than or equal to maxPrice', path: ['maxPrice'] },
);
export type VehicleSearchQuery = z.infer<typeof VehicleSearchQuerySchema>;

/** `Paginated<Vehicle>` response of list and search. */
export const PaginatedVehiclesSchema = paginated(VehicleSchema);
export type PaginatedVehicles = z.infer<typeof PaginatedVehiclesSchema>;
