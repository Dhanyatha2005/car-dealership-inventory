import type { HTMLAttributes, ReactElement } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card(_props: CardProps): ReactElement {
  throw new Error('not implemented');
}
