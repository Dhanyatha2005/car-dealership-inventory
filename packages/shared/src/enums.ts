/**
 * Domain enums shared by the API, the web app and the Prisma schema.
 *
 * Each enum is an `as const` tuple (for iteration, e.g. select options), a
 * `z.enum` schema (for validation) and a union type. The Prisma enums must stay
 * identical to these tuples; an API test guards against drift.
 */
import { z } from 'zod';

/** User roles. Public registration always creates `USER`. */
export const ROLES = ['USER', 'ADMIN'] as const;
/** Validates a {@link Role}; values are upper case and case-sensitive. */
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

/** Body styles a vehicle listing can have. */
export const VEHICLE_CATEGORIES = [
  'SEDAN',
  'SUV',
  'TRUCK',
  'COUPE',
  'HATCHBACK',
  'CONVERTIBLE',
  'VAN',
  'WAGON',
] as const;
/** Validates a {@link VehicleCategory}. */
export const VehicleCategorySchema = z.enum(VEHICLE_CATEGORIES);
export type VehicleCategory = z.infer<typeof VehicleCategorySchema>;

/** Fuel types; optional on a vehicle. */
export const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;
/** Validates a {@link FuelType}. */
export const FuelTypeSchema = z.enum(FUEL_TYPES);
export type FuelType = z.infer<typeof FuelTypeSchema>;

/** Transmission types; optional on a vehicle. */
export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'] as const;
/** Validates a {@link Transmission}. */
export const TransmissionSchema = z.enum(TRANSMISSIONS);
export type Transmission = z.infer<typeof TransmissionSchema>;

/** Fields a vehicle list may be sorted by (each backed by an index). */
export const SORT_FIELDS = ['createdAt', 'priceCents', 'year', 'make'] as const;
/** Validates a {@link VehicleSortField}. */
export const VehicleSortFieldSchema = z.enum(SORT_FIELDS);
export type VehicleSortField = z.infer<typeof VehicleSortFieldSchema>;

/** Sort directions, lower case as they appear in the query string. */
export const SORT_ORDERS = ['asc', 'desc'] as const;
/** Validates a {@link SortOrder}. */
export const SortOrderSchema = z.enum(SORT_ORDERS);
export type SortOrder = z.infer<typeof SortOrderSchema>;
