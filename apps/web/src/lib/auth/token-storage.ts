import type { PublicUser } from '@kata/shared';

const TOKEN_KEY = 'autovault.token';
const USER_KEY = 'autovault.user';

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const tokenStorage = {
  getToken: (): string | null => safe(() => localStorage.getItem(TOKEN_KEY), null),
  getUser: (): PublicUser | null =>
    safe(() => {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as PublicUser) : null;
    }, null),
  save: (token: string, user: PublicUser): void =>
    safe(() => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }, undefined),
  clear: (): void =>
    safe(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }, undefined),
};
