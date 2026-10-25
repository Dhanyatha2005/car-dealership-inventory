/** HTTP surface of the vehicles module: catalogue reads for any user, writes for admins. */
import {
  CreateVehicleInputSchema,
  IdParamSchema,
  UpdateVehicleInputSchema,
  VehicleListQuerySchema,
  VehicleSearchQuerySchema,
  type Role,
} from '@kata/shared';
import { Router, type RequestHandler } from 'express';
import type { ApiModule } from '../../http/api-module';
import { toVehicleDto } from './vehicle.mapper';
import type { VehicleService } from './vehicle.service';

export interface VehiclesModuleDeps {
  vehicleService: VehicleService;
  authenticate: RequestHandler;
  requireRole: (...roles: Role[]) => RequestHandler;
}

export function createVehiclesModule({
  vehicleService,
  authenticate,
  requireRole,
}: VehiclesModuleDeps): ApiModule {
  const router = Router();
  const admin = requireRole('ADMIN');

  router.get('/vehicles', authenticate, async (req, res) => {
    const page = await vehicleService.list(VehicleListQuerySchema.parse(req.query));
    res.json({ ...page, items: page.items.map(toVehicleDto) });
  });
  // Registered before '/vehicles/:id' so "search" is never treated as an id.
  router.get('/vehicles/search', authenticate, async (req, res) => {
    const page = await vehicleService.search(VehicleSearchQuerySchema.parse(req.query));
    res.json({ ...page, items: page.items.map(toVehicleDto) });
  });
  router.get('/vehicles/:id', authenticate, async (req, res) => {
    const { id } = IdParamSchema.parse(req.params);
    res.json(toVehicleDto(await vehicleService.getById(id)));
  });
  router.post('/vehicles', authenticate, admin, async (req, res) => {
    const vehicle = await vehicleService.create(CreateVehicleInputSchema.parse(req.body));
    res.status(201).location(`/api/vehicles/${vehicle.id}`).json(toVehicleDto(vehicle));
  });
  router.put('/vehicles/:id', authenticate, admin, async (req, res) => {
    const { id } = IdParamSchema.parse(req.params);
    res.json(
      toVehicleDto(await vehicleService.update(id, UpdateVehicleInputSchema.parse(req.body))),
    );
  });
  router.delete('/vehicles/:id', authenticate, admin, async (req, res) => {
    const { id } = IdParamSchema.parse(req.params);
    await vehicleService.archive(id);
    res.status(204).end();
  });

  return { name: 'vehicles', router, registerOpenApi: () => {} };
}
