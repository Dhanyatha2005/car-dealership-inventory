import { Inbox } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Optional call to action (e.g. a Button). */
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-pill bg-surface text-ink-muted shadow-inset"
      >
        {icon ?? <Inbox strokeWidth={1.5} className="size-7" />}
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action}
    </div>
  );
}
