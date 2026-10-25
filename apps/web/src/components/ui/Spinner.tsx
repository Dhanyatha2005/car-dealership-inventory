import type { ReactElement } from 'react';

export interface SpinnerProps {
  /** Accessible label announced by the status region. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner(_props: SpinnerProps): ReactElement {
  throw new Error('not implemented');
}
