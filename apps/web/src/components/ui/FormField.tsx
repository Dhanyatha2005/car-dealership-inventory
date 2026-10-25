import type { ReactElement, ReactNode } from 'react';

/** Accessibility props FormField hands to its control. Spread them onto Input/Select. */
export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
}

export interface FormFieldProps {
  label: ReactNode;
  /** Validation message; sets aria-invalid and is announced via aria-describedby. */
  error?: string;
  /** Helper text, also linked via aria-describedby. */
  hint?: ReactNode;
  /** Explicit control id; generated when omitted. */
  id?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField(_props: FormFieldProps): ReactElement {
  throw new Error('not implemented');
}
