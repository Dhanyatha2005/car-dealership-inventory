import { Car } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Card } from '@/components/ui';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}): ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 text-ink">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-accent shadow-raised-sm">
            <Car aria-hidden size={26} />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-muted">
            AutoVault
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>
        {children}
      </Card>
    </main>
  );
}
