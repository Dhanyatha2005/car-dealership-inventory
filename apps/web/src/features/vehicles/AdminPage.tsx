import { formatCents } from '@kata/shared';
import type { CreateVehicleInput, Vehicle } from '@kata/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Pagination,
  Spinner,
} from '@/components/ui';
import { errorMessage } from '@/lib/api/api-error';
import { VehicleFormDialog } from './VehicleFormDialog';
import { vehicleKeys, vehiclesApi } from './vehicles-api';
import type { VehicleFilters } from './vehicles-api';

type Notice = { tone: 'ok' | 'err'; text: string } | null;
type Modal =
  | { kind: 'create' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }
  | null;

const label = (v: Vehicle) => `${v.make} ${v.model}`;

export function AdminPage(): ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [restockQty, setRestockQty] = useState('1');

  const filters: VehicleFilters = { page };
  const query = useQuery({
    queryKey: vehicleKeys.search(filters),
    queryFn: () => vehiclesApi.search(filters),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: async (action: () => Promise<string>) => action(),
    onSuccess: (text) => {
      setNotice({ tone: 'ok', text });
      setModal(null);
    },
    onError: (e) => setNotice({ tone: 'err', text: errorMessage(e) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });

  const save = (input: CreateVehicleInput) => {
    if (modal?.kind === 'edit') {
      const { quantity: _quantity, ...patch } = input;
      const v = modal.vehicle;
      mutation.mutate(async () => {
        await vehiclesApi.update(v.id, patch);
        return `Updated ${input.make} ${input.model}.`;
      });
    } else {
      mutation.mutate(async () => {
        await vehiclesApi.create(input);
        return `Added ${input.make} ${input.model}.`;
      });
    }
  };

  const restockQuantity = Number(restockQty);
  const restockValid = Number.isInteger(restockQuantity) && restockQuantity > 0;

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-8">
      <Card padding="lg" as="section" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
            <h1 className="mt-1 text-3xl font-bold">Inventory management</h1>
          </div>
          <Button onClick={() => setModal({ kind: 'create' })}>
            <Plus aria-hidden size={18} /> Add vehicle
          </Button>
        </div>

        {notice && (
          <p
            role="status"
            className={notice.tone === 'ok' ? 'text-sm text-success' : 'text-sm text-danger'}
          >
            {notice.text}
          </p>
        )}

        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState title="No vehicles yet" description="Add your first vehicle." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((v) => (
                  <tr key={v.id} className="border-t border-ink/5">
                    <td className="px-3 py-3 font-semibold">
                      {v.year} {label(v)}
                    </td>
                    <td className="px-3 py-3">{v.category}</td>
                    <td className="px-3 py-3">{formatCents(v.priceCents)}</td>
                    <td className="px-3 py-3">{v.quantity}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={`Edit ${label(v)}`}
                          onClick={() => setModal({ kind: 'edit', vehicle: v })}
                        >
                          <Pencil aria-hidden size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={`Restock ${label(v)}`}
                          onClick={() => {
                            setRestockQty('1');
                            setModal({ kind: 'restock', vehicle: v });
                          }}
                        >
                          <PackagePlus aria-hidden size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          aria-label={`Delete ${label(v)}`}
                          onClick={() => setModal({ kind: 'delete', vehicle: v })}
                        >
                          <Trash2 aria-hidden size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </Card>

      <VehicleFormDialog
        open={modal?.kind === 'create' || modal?.kind === 'edit'}
        vehicle={modal?.kind === 'edit' ? modal.vehicle : null}
        pending={mutation.isPending}
        onClose={() => setModal(null)}
        onSubmit={save}
      />

      <Dialog
        open={modal?.kind === 'restock'}
        onClose={() => setModal(null)}
        title="Restock vehicle"
        description={modal?.kind === 'restock' ? label(modal.vehicle) : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              disabled={!restockValid || mutation.isPending}
              onClick={() => {
                if (modal?.kind !== 'restock') return;
                const v = modal.vehicle;
                mutation.mutate(async () => {
                  await vehiclesApi.restock(v.id, restockQuantity);
                  return `Restocked ${label(v)} by ${restockQuantity}.`;
                });
              }}
            >
              Restock
            </Button>
          </>
        }
      >
        <FormField
          label="Quantity"
          error={restockValid ? undefined : 'Enter a whole number above 0'}
        >
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
            />
          )}
        </FormField>
      </Dialog>

      <Dialog
        open={modal?.kind === 'delete'}
        onClose={() => setModal(null)}
        title="Delete vehicle"
        description={
          modal?.kind === 'delete'
            ? `Delete ${label(modal.vehicle)}? This cannot be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={mutation.isPending}
              onClick={() => {
                if (modal?.kind !== 'delete') return;
                const v = modal.vehicle;
                mutation.mutate(async () => {
                  await vehiclesApi.remove(v.id);
                  return `Deleted ${label(v)}.`;
                });
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
