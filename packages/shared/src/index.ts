/**
 * @kata/shared public barrel.
 *
 * Consumers import only from '@kata/shared'. Production code in this package
 * may import only zod (enforced by ESLint).
 */
export const SHARED_PACKAGE_NAME = '@kata/shared';

export * from './enums';
export * from './errors';
export * from './schemas/common';
export * from './schemas/auth';
export * from './schemas/vehicle';
export * from './schemas/inventory';
export * from './money';
