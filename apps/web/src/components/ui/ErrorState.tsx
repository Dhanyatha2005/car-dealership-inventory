import { RotateCw, TriangleAlert } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: ReactNode;
  /** Renders a retry button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div role="alert" className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-pill bg-surface text-danger shadow-inset"
        >
          <TriangleAlert strokeWidth={1.5} className="size-7" />
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="max-w-sm text-sm text-ink-muted">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="primary"
          onClick={onRetry}
          icon={<RotateCw aria-hidden="true" strokeWidth={1.75} className="size-4" />}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
