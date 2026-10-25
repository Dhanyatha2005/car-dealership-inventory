import type { ReactElement, Ref, SelectHTMLAttributes } from 'react';

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

export function Select(_props: SelectProps): ReactElement {
  throw new Error('not implemented');
}
