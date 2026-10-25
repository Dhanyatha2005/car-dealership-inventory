import { formatCents } from '@kata/shared';
import type { PaginatedPurchases } from '@kata/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Card, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api/api-error';
import { http } from '@/lib/api/http-client';

const purchasesApi = {
  mine: () => http.get<PaginatedPurchases>('/api/purchases/me'),
};

export function MyPurchasesPage(): ReactElement {
  const query = useQuery({ queryKey: ['purchases', 'me'], queryFn: purchasesApi.mine });

  return (
    <Card padding="lg" as="section" className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Purchases</p>
        <h1 className="mt-1 text-3xl font-bold">My purchases</h1>
      </div>
      {query.isPending ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title="No purchases yet" description="Vehicles you buy will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Unit price</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((p) => (
                <tr key={p.id} className="border-t border-ink/5">
                  <td className="px-3 py-3 font-semibold">
                    {p.vehicle.year} {p.vehicle.make} {p.vehicle.model}
                  </td>
                  <td className="px-3 py-3">{p.quantity}</td>
                  <td className="px-3 py-3">{formatCents(p.unitPriceCents)}</td>
                  <td className="px-3 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
