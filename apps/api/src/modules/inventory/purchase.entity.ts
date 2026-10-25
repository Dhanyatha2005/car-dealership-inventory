import type { Vehicle } from '../vehicles/vehicle.entity';

export interface Purchase {
  id: string;
  userId: string;
  vehicleId: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: Date;
}
export interface PurchaseWithVehicle extends Purchase {
  vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'category'>;
}
