import { dollarsToCents, VEHICLE_CATEGORIES } from '@kata/shared';
import type { Vehicle, VehicleCategory } from '@kata/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Card, EmptyState, ErrorState, Input, Pagination, Select, Spinner } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { errorMessage } from '@/lib/api/api-error';
import { VehicleCard } from './VehicleCard';
import { vehicleKeys, vehiclesApi } from './vehicles-api';
import type { VehicleFilters } from './vehicles-api';

const categoryOptions = VEHICLE_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0) + c.slice(1).toLowerCase(),
}));

const toCents = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  try {
    return dollarsToCents(value);
  } catch {
    return undefined;
  }
};

export function DashboardPage(): ReactElement {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<VehicleCategory | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const filters: VehicleFilters = {
    q: q.trim() || undefined,
    category,
    minPrice: toCents(minPrice),
    maxPrice: toCents(maxPrice),
    page,
  };
  const query = useQuery({
    queryKey: vehicleKeys.search(filters),
    queryFn: () => vehiclesApi.search(filters),
    placeholderData: keepPreviousData,
  });

  const purchase = useMutation({
    mutationFn: (v: Vehicle) => vehiclesApi.purchase(v.id),
    onSuccess: (_d, v) => setNotice({ tone: 'ok', text: `Purchased ${v.make} ${v.model}.` }),
    onError: (e) => setNotice({ tone: 'err', text: errorMessage(e) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });

  const resetPage =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-8">
      <Card padding="lg" as="section" className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Showroom</p>
          <h1 className="mt-1 text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="mt-1 text-ink-muted">Find your next vehicle from our live inventory.</p>
        </div>
        <Input
          aria-label="Search vehicles"
          placeholder="Search make, model or keyword"
          icon={<Search aria-hidden size={18} />}
          value={q}
          onChange={(e) => resetPage(setQ)(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            aria-label="Category"
            placeholder="Any category"
            options={categoryOptions}
            value={category}
            onChange={(e) => resetPage(setCategory)(e.target.value as VehicleCategory | '')}
          />
          <Input
            aria-label="Minimum price"
            placeholder="Min price ($)"
            inputMode="decimal"
            value={minPrice}
            onChange={(e) => resetPage(setMinPrice)(e.target.value)}
          />
          <Input
            aria-label="Maximum price"
            placeholder="Max price ($)"
            inputMode="decimal"
            value={maxPrice}
            onChange={(e) => resetPage(setMaxPrice)(e.target.value)}
          />
        </div>
      </Card>

      {notice && (
        <p
          role="status"
          className={notice.tone === 'ok' ? 'text-sm text-success' : 'text-sm text-danger'}
        >
          {notice.text}
        </p>
      )}

      {query.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading vehicles" size="lg" />
        </div>
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="No vehicles found" description="Try a different search or filter." />
      ) : (
        <>
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((v) => (
              <li key={v.id}>
                <VehicleCard
                  vehicle={v}
                  onPurchase={(veh) => purchase.mutate(veh)}
                  purchasing={purchase.isPending && purchase.variables.id === v.id}
                />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
