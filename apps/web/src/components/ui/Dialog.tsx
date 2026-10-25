import type { ReactElement, ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action row (e.g. Cancel / Confirm buttons). */
  footer?: ReactNode;
}

export function Dialog(_props: DialogProps): ReactElement | null {
  throw new Error('not implemented');
}
