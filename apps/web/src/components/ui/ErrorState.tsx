import type { ReactElement, ReactNode } from 'react';

export interface ErrorStateProps {
  title?: string;
  message: ReactNode;
  /** Renders a retry button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState(_props: ErrorStateProps): ReactElement {
  throw new Error('not implemented');
}
