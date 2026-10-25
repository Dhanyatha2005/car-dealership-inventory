import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateVehicleInputSchema,
  dollarsToCents,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_CATEGORIES,
} from '@kata/shared';
import type { CreateVehicleInput, Vehicle } from '@kata/shared';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Dialog, FormField, Input, Select } from '@/components/ui';

const isDollars = (value: string): boolean => {
  try {
    return dollarsToCents(value) > 0;
  } catch {
    return false;
  }
};

/** CreateVehicleInputSchema with the cents price swapped for a dollars string. */
const FormSchema = CreateVehicleInputSchema.omit({ priceCents: true }).extend({
  price: z.string().refine(isDollars, 'Enter a valid price, e.g. 25000.00'),
});
type FormInput = z.input<typeof FormSchema>;
type FormOutput = z.output<typeof FormSchema>;

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

export interface VehicleFormDialogProps {
  open: boolean;
  /** When set, the dialog edits this vehicle (PUT, no quantity). */
  vehicle?: Vehicle | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateVehicleInput) => void;
}

const defaults = (vehicle?: Vehicle | null): FormInput =>
  vehicle
    ? {
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        price: (vehicle.priceCents / 100).toFixed(2),
        year: vehicle.year,
        quantity: vehicle.quantity,
        color: vehicle.color ?? '',
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        imageUrl: vehicle.imageUrl ?? '',
        description: vehicle.description ?? '',
      }
    : {
        make: '',
        model: '',
        category: VEHICLE_CATEGORIES[0],
        price: '',
        year: new Date().getFullYear(),
        quantity: 1,
        color: '',
        fuelType: null,
        transmission: null,
        imageUrl: '',
        description: '',
      };

const emptyToNull = (v: unknown) => (v === '' ? null : v);

export function VehicleFormDialog({
  open,
  vehicle,
  pending,
  onClose,
  onSubmit,
}: VehicleFormDialogProps): ReactElement | null {
  const isEdit = Boolean(vehicle);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(FormSchema),
    values: defaults(vehicle),
  });

  const submit = handleSubmit(({ price, ...rest }) =>
    onSubmit({ ...rest, priceCents: dollarsToCents(price) }),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" disabled={pending}>
            {isEdit ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form
        id="vehicle-form"
        noValidate
        onSubmit={(e) => void submit(e)}
        className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto p-1"
      >
        <FormField label="Make" error={errors.make?.message}>
          {(p) => <Input {...p} {...register('make')} />}
        </FormField>
        <FormField label="Model" error={errors.model?.message}>
          {(p) => <Input {...p} {...register('model')} />}
        </FormField>
        <FormField label="Category" error={errors.category?.message}>
          {(p) => (
            <Select {...p} options={toOptions(VEHICLE_CATEGORIES)} {...register('category')} />
          )}
        </FormField>
        <FormField label="Price (USD)" error={errors.price?.message}>
          {(p) => <Input {...p} inputMode="decimal" {...register('price')} />}
        </FormField>
        <FormField label="Year" error={errors.year?.message}>
          {(p) => <Input {...p} type="number" {...register('year', { valueAsNumber: true })} />}
        </FormField>
        {isEdit ? null : (
          <FormField label="Quantity" error={errors.quantity?.message}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                {...register('quantity', { valueAsNumber: true })}
              />
            )}
          </FormField>
        )}
        <FormField label="Fuel type" error={errors.fuelType?.message}>
          {(p) => (
            <Select
              {...p}
              placeholder="Not specified"
              options={toOptions(FUEL_TYPES)}
              {...register('fuelType', { setValueAs: emptyToNull })}
            />
          )}
        </FormField>
        <FormField label="Transmission" error={errors.transmission?.message}>
          {(p) => (
            <Select
              {...p}
              placeholder="Not specified"
              options={toOptions(TRANSMISSIONS)}
              {...register('transmission', { setValueAs: emptyToNull })}
            />
          )}
        </FormField>
        <FormField label="Color" error={errors.color?.message}>
          {(p) => <Input {...p} {...register('color')} />}
        </FormField>
        <FormField label="Image URL" error={errors.imageUrl?.message}>
          {(p) => <Input {...p} {...register('imageUrl')} />}
        </FormField>
        <FormField label="Description" error={errors.description?.message} className="col-span-2">
          {(p) => <Input {...p} {...register('description')} />}
        </FormField>
      </form>
    </Dialog>
  );
}
