import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from './Button';
import { cn } from './cn';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps): ReactElement {
  const pages = Math.max(totalPages, 1);
  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-4', className)}
    >
      <Button
        variant="secondary"
        size="sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="size-4" />
      </Button>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Page {Math.min(page, pages)} of {pages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
      </Button>
    </nav>
  );
}
