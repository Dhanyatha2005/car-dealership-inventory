import type { ReactElement, ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Optional call to action (e.g. a Button). */
  action?: ReactNode;
}

export function EmptyState(_props: EmptyStateProps): ReactElement {
  throw new Error('not implemented');
}
