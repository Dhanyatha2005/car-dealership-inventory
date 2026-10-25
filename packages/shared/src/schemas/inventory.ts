/**
 * Inventory contracts: purchase and restock bodies and purchase DTOs.
 */
import { z } from 'zod';
import { IsoDateString, paginated } from './common';
import { MAX_STOCK_QUANTITY, VehicleSchema } from './vehicle';

/** Most units a single purchase may buy. */
export const MAX_PURCHASE_QUANTITY = 10;

/**
 * `POST /api/vehicles/:id/purchase` body (strict): `quantity` is an integer
 * 1..10 and defaults to 1, so `{}` buys one unit. Parse `req.body ?? {}`.
 */
export const PurchaseInputSchema = z.strictObject({
  quantity: z.number().int().min(1).max(MAX_PURCHASE_QUANTITY).default(1),
});
export type PurchaseInput = z.infer<typeof PurchaseInputSchema>;
/** Purchase form values; `quantity` may be omitted. */
export type PurchaseFormValues = z.input<typeof PurchaseInputSchema>;

/** `POST /api/vehicles/:id/restock` body (strict): required integer quantity 1..10,000. */
export const RestockInputSchema = z.strictObject({
  quantity: z.number().int().min(1).max(MAX_STOCK_QUANTITY),
});
export type RestockInput = z.infer<typeof RestockInputSchema>;

/** A purchase record with the unit price snapshot taken at purchase time and its total. */
export const PurchaseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  vehicleId: z.uuid(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  createdAt: IsoDateString,
});
export type Purchase = z.infer<typeof PurchaseSchema>;

/** Purchase response: the new purchase plus the vehicle with its updated stock. */
export const PurchaseResultSchema = z.object({
  purchase: PurchaseSchema,
  vehicle: VehicleSchema,
});
export type PurchaseResult = z.infer<typeof PurchaseResultSchema>;

/** Purchase history item: the purchase plus a vehicle summary (id, make, model, year, category). */
export const PurchaseWithVehicleSchema = PurchaseSchema.extend({
  vehicle: VehicleSchema.pick({ id: true, make: true, model: true, year: true, category: true }),
});
export type PurchaseWithVehicle = z.infer<typeof PurchaseWithVehicleSchema>;

/** `Paginated<PurchaseWithVehicle>` response of `GET /api/purchases/me`. */
export const PaginatedPurchasesSchema = paginated(PurchaseWithVehicleSchema);
export type PaginatedPurchases = z.infer<typeof PaginatedPurchasesSchema>;
