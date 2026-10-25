import { FUEL_TYPES, ROLES, TRANSMISSIONS, VEHICLE_CATEGORIES } from '@kata/shared';
import { describe, expect, it } from 'vitest';
import { FuelType, Role, Transmission, VehicleCategory } from '../../src/generated/prisma/enums';

describe('prisma enums match the @kata/shared contract', () => {
  it.each([
    ['Role', Role, ROLES],
    ['VehicleCategory', VehicleCategory, VEHICLE_CATEGORIES],
    ['FuelType', FuelType, FUEL_TYPES],
    ['Transmission', Transmission, TRANSMISSIONS],
  ] as const)('%s has the same values in the same order', (_name, prismaEnum, shared) => {
    expect(Object.values(prismaEnum)).toEqual([...shared]);
  });
});
