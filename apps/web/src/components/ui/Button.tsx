import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets `disabled` and `aria-busy`. */
  loading?: boolean;
  /** Optional leading icon (e.g. a lucide icon). */
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'shadow-raised-sm text-accent hover:text-accent-strong',
  secondary: 'shadow-raised-sm text-ink',
  ghost: 'shadow-flat text-ink-muted hover:text-ink',
  danger: 'shadow-raised-sm text-danger',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-13 px-8 text-base gap-2.5',
};

/** Raised pill at rest; pressed (inset) while :active or aria-pressed; flat and muted when disabled. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-pill bg-surface font-semibold tracking-wide transition-[box-shadow,color] duration-150',
        'active:shadow-pressed aria-pressed:shadow-pressed aria-pressed:text-accent',
        'disabled:cursor-not-allowed disabled:shadow-flat disabled:text-ink-subtle',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" strokeWidth={1.75} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
