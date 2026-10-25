import type { ReactElement } from 'react';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination(_props: PaginationProps): ReactElement {
  throw new Error('not implemented');
}
