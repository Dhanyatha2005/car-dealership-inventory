import { Car, House, LogOut, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { NavLink, Outlet } from 'react-router';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/features/auth/auth-context';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const baseItems: NavItem[] = [{ to: '/', label: 'Showroom', icon: House }];
const adminItem: NavItem = { to: '/admin', label: 'Admin', icon: Shield };

function TopBar({ items }: { items: NavItem[] }): ReactElement {
  const { user, logout } = useAuth();
  return (
    <header className="fixed inset-x-4 top-4 z-30 flex h-[var(--topbar-height)] items-center justify-between gap-4 rounded-card bg-surface px-5 shadow-raised md:inset-x-[var(--shell-gutter)] md:px-8">
      <NavLink to="/" className="flex items-center gap-2.5 text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-accent shadow-raised-sm">
          <Car aria-hidden size={20} />
        </span>
        <span className="text-lg font-bold tracking-tight">AutoVault</span>
      </NavLink>
      <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'relative py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
                isActive
                  ? 'text-accent after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent'
                  : 'text-ink-muted hover:text-ink',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight">{user?.name}</p>
          <p className="text-xs uppercase tracking-wider text-ink-muted">{user?.role}</p>
        </div>
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-accent shadow-inset"
        >
          {user?.name.charAt(0).toUpperCase()}
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted shadow-raised-sm transition hover:text-danger active:shadow-pressed"
        >
          <LogOut aria-hidden size={18} />
        </button>
      </div>
    </header>
  );
}

function Sidebar({ items }: { items: NavItem[] }): ReactElement {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-4 bottom-4 z-30 flex justify-around rounded-card bg-surface p-2 shadow-raised md:inset-x-auto md:bottom-auto md:left-[var(--shell-gutter)] md:top-[calc(var(--topbar-height)+2.5rem)] md:w-[var(--sidebar-width)] md:flex-col md:justify-start md:gap-3 md:py-4"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-field px-3 py-2.5 text-[11px] font-medium transition',
              isActive ? 'text-accent shadow-inset' : 'text-ink-muted hover:text-ink',
            )
          }
        >
          <Icon aria-hidden size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Floating raised TopBar + Sidebar (bottom bar on mobile) around the routed page. */
export function AppShell(): ReactElement {
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...baseItems, adminItem] : baseItems;
  return (
    <div className="min-h-screen bg-surface text-ink">
      <TopBar items={items} />
      <Sidebar items={items} />
      <main className="px-4 pb-32 pt-[calc(var(--topbar-height)+2.5rem)] md:pb-12 md:pl-[calc(var(--sidebar-width)+var(--shell-gutter)*2)] md:pr-[var(--shell-gutter)]">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
