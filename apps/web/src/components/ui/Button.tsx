import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

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

export function Button(_props: ButtonProps): ReactElement {
  throw new Error('not implemented');
}
