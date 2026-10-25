import { formatCents } from '@kata/shared';
import type { Vehicle } from '@kata/shared';
import { Car, ShoppingBag } from 'lucide-react';
import type { ReactElement } from 'react';
import { Badge, Button, Card } from '@/components/ui';

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => void;
  purchasing?: boolean;
}

export function VehicleCard({ vehicle, onPurchase, purchasing }: VehicleCardProps): ReactElement {
  const outOfStock = vehicle.quantity === 0;
  const name = `${vehicle.make} ${vehicle.model}`;
  return (
    <Card as="article" padding="sm" className="flex flex-col gap-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-field shadow-inset">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-subtle">
            <Car aria-hidden size={48} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="accent">{titleCase(vehicle.category)}</Badge>
          {outOfStock && <Badge tone="danger">Out of stock</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>
        <p className="text-sm text-ink-muted">{vehicle.year}</p>
      </div>
      <div className="flex items-end justify-between gap-3 px-1 pb-1">
        <div>
          <p className="text-xl font-bold text-ink">{formatCents(vehicle.priceCents)}</p>
          <p className="text-xs text-ink-muted">
            {outOfStock ? 'No units left' : `${vehicle.quantity} in stock`}
          </p>
        </div>
        <Button
          size="sm"
          icon={<ShoppingBag aria-hidden size={14} />}
          disabled={outOfStock}
          loading={purchasing}
          onClick={() => onPurchase(vehicle)}
          aria-label={`Purchase ${name}`}
        >
          Purchase
        </Button>
      </div>
    </Card>
  );
}
