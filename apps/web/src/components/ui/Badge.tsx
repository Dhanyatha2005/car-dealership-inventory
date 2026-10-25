import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'text-ink-muted',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** Small inset pill with an uppercase tracked label. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps): ReactElement {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center rounded-pill bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-pressed',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
