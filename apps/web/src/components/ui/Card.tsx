import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8 md:p-12' } as const;

/** Raised surface with the 24px card radius. */
export function Card({
  as: Tag = 'div',
  padding = 'md',
  className,
  ...rest
}: CardProps): ReactElement {
  return (
    <Tag
      className={cn('rounded-card bg-surface text-ink shadow-raised', paddings[padding], className)}
      {...rest}
    />
  );
}
