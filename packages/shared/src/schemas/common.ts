/**
 * Common request/response building blocks (red stub, Phase 1A).
 */
import { z } from 'zod';

export const IdParamSchema = z.any();
export const IsoDateString = z.any();
export const PaginationQuerySchema = z.any();
export const paginated = <T extends z.ZodType>(_itemSchema: T) => z.any();
