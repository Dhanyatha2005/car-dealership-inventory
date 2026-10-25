/** HTTP surface of the inventory module: purchase (any user), restock (admin), purchase history. */
import {
  IdParamSchema,
  PaginationQuerySchema,
  PurchaseInputSchema,
  RestockInputSchema,
  type Role,
} from '@kata/shared';
import { Router, type Request, type RequestHandler } from 'express';
import { UnauthorizedError } from '../../core/errors';
import type { ApiModule } from '../../http/api-module';
import type { Vehicle } from '../vehicles/vehicle.entity';
import type { InventoryService } from './inventory.service';
import type { Purchase } from './purchase.entity';

export interface InventoryModuleDeps {
  inventoryService: InventoryService;
  authenticate: RequestHandler;
  requireRole: (...roles: Role[]) => RequestHandler;
  toVehicleDto: (v: Vehicle) => unknown;
}

const userId = (req: Request): string => {
  if (!req.auth) throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
  return req.auth.userId;
};

const toPurchaseDto = <P extends Purchase>(p: P) => ({
  ...p,
  totalCents: p.unitPriceCents * p.quantity,
  createdAt: p.createdAt.toISOString(),
});

export function createInventoryModule(deps: InventoryModuleDeps): ApiModule {
  const { inventoryService, authenticate, requireRole, toVehicleDto } = deps;
  const router = Router();

  router.post('/vehicles/:id/purchase', authenticate, async (req, res) => {
    const { id } = IdParamSchema.parse(req.params);
    const input = PurchaseInputSchema.parse(req.body ?? {});
    const { purchase, vehicle } = await inventoryService.purchase(userId(req), id, input);
    res.status(201).json({ purchase: toPurchaseDto(purchase), vehicle: toVehicleDto(vehicle) });
  });
  router.post('/vehicles/:id/restock', authenticate, requireRole('ADMIN'), async (req, res) => {
    const { id } = IdParamSchema.parse(req.params);
    res.json(toVehicleDto(await inventoryService.restock(id, RestockInputSchema.parse(req.body))));
  });
  router.get('/purchases/me', authenticate, async (req, res) => {
    const page = await inventoryService.listMyPurchases(
      userId(req),
      PaginationQuerySchema.parse(req.query),
    );
    res.json({ ...page, items: page.items.map(toPurchaseDto) });
  });

  return { name: 'inventory', router, registerOpenApi: () => {} };
}
