import type { Vehicle } from '@kata/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';
import { vehiclesApi } from './vehicles-api';

vi.mock('./vehicles-api', () => ({
  vehicleKeys: { all: ['vehicles'], search: (f: unknown) => ['vehicles', 'search', f] },
  vehiclesApi: {
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    restock: vi.fn(),
    purchase: vi.fn(),
  },
}));

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

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminPage />
    </QueryClientProvider>,
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.mocked(vehiclesApi.search).mockResolvedValue({
      items: [vehicle],
      total: 1,
      page: 1,
      pageSize: 20,
    } as never);
    vi.mocked(vehiclesApi.remove).mockResolvedValue(undefined);
  });

  it('renders vehicles and opens the add dialog', async () => {
    renderPage();

    expect(await screen.findByText('2024 Toyota Corolla')).toBeInTheDocument();
    expect(screen.getByText('$25,000.00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));
    const dialog = screen.getByRole('dialog', { name: /add vehicle/i });
    expect(within(dialog).getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('calls the delete API after confirming', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /delete toyota corolla/i }));
    const dialog = screen.getByRole('dialog', { name: /delete vehicle/i });
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(vehiclesApi.remove).toHaveBeenCalledWith(vehicle.id);
    expect(await screen.findByText(/deleted toyota corolla/i)).toBeInTheDocument();
  });
});
