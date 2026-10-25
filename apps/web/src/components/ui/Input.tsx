import type { InputHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon rendered inside the inset pill (decorative). */
  icon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Inset pill text field. */
export function Input({ icon, className, ref, ...rest }: InputProps): ReactElement {
  return (
    <div className={cn('relative flex items-center', className)}>
      {icon ? (
        <span aria-hidden="true" className="pointer-events-none absolute left-5 text-ink-muted">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'h-12 w-full rounded-pill bg-surface px-5 text-sm text-ink shadow-inset placeholder:text-ink-muted',
          'aria-invalid:outline aria-invalid:outline-1 aria-invalid:outline-danger',
          'disabled:cursor-not-allowed disabled:text-ink-subtle',
          icon ? 'pl-13' : '',
        )}
        {...rest}
      />
    </div>
  );
}
