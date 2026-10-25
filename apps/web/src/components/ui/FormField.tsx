import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from './cn';

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

export function FormField({
  label,
  error,
  hint,
  id,
  className,
  children,
}: FormFieldProps): ReactElement {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={controlId}
        className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted"
      >
        {label}
      </label>
      {children({
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint ? (
        <p id={hintId} className="px-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="px-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
