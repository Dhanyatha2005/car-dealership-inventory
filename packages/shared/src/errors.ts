/**
 * Error codes and the error response envelope (red stub, Phase 1A).
 */
import { z } from 'zod';

export const ERROR_CODES = [] as const;
export type ErrorCode = string;
export const ErrorCodeSchema = z.any();
export const ErrorResponseSchema = z.any();
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
