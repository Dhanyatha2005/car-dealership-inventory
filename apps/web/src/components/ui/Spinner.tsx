import { LoaderCircle } from 'lucide-react';
import type { ReactElement } from 'react';
import { cn } from './cn';

export interface SpinnerProps {
  /** Accessible label announced by the status region. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' } as const;

export function Spinner({ label = 'Loading', size = 'md', className }: SpinnerProps): ReactElement {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex text-accent', className)}>
      <LoaderCircle
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn('animate-spin', sizes[size])}
      />
    </span>
  );
}
