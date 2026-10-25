import { ChevronDown } from 'lucide-react';
import type { ReactElement, Ref, SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[];
  /** Renders a first empty-value option (e.g. "Any category"). */
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Native select styled as an inset pill. */
export function Select({
  options,
  placeholder,
  className,
  ref,
  ...rest
}: SelectProps): ReactElement {
  return (
    <div className={cn('relative flex items-center', className)}>
      <select
        ref={ref}
        className={cn(
          'h-12 w-full appearance-none rounded-pill bg-surface pl-5 pr-11 text-sm text-ink shadow-inset',
          'aria-invalid:outline aria-invalid:outline-1 aria-invalid:outline-danger',
          'disabled:cursor-not-allowed disabled:text-ink-subtle',
        )}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.5}
        className="pointer-events-none absolute right-4 size-4 text-ink-muted"
      />
    </div>
  );
}
