import type { HTMLAttributes, ReactElement } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge(_props: BadgeProps): ReactElement {
  throw new Error('not implemented');
}
