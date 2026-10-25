import type { InputHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon rendered inside the inset pill (decorative). */
  icon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input(_props: InputProps): ReactElement {
  throw new Error('not implemented');
}
