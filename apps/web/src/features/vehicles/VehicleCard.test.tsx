import type { Vehicle } from '@kata/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VehicleCard } from './VehicleCard';

const vehicle: Vehicle = {
  id: '11111111-1111-4111-8111-111111111111',
  make: 'Toyota',
  model: 'Corolla',
  category: 'SEDAN' as Vehicle['category'],
  priceCents: 2_500_000,
  quantity: 3,
  year: 2024,
  color: null,
  fuelType: null,
  transmission: null,
  imageUrl: null,
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('VehicleCard', () => {
  it('disables purchase and shows Out of stock when quantity is 0', () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} onPurchase={vi.fn()} />);

    expect(screen.getByRole('button', { name: /purchase toyota corolla/i })).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('enables purchase and shows the formatted price when in stock', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={vi.fn()} />);

    expect(screen.getByRole('button', { name: /purchase toyota corolla/i })).toBeEnabled();
    expect(screen.getByText('$25,000.00')).toBeInTheDocument();
  });
});
