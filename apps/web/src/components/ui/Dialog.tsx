import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action row (e.g. Cancel / Confirm buttons). */
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal dialog: raised card over a soft overlay, focus trapped, Escape closes, focus restored. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DialogProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => previous?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (!firstItem || !lastItem) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-card bg-surface p-8 text-ink shadow-raised"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface text-ink-muted shadow-raised-sm active:shadow-pressed"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="size-4" />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
