import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@kata/shared';
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { http } from '@/lib/api/http-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<{ token: string | null; user: PublicUser | null }>(() => ({
    token: tokenStorage.getToken(),
    user: tokenStorage.getUser(),
  }));

  const accept = useCallback((res: AuthResponse) => {
    tokenStorage.save(res.token, res.user);
    setSession({ token: res.token, user: res.user });
  }, []);

  const login = useCallback(
    async (input: LoginInput) => accept(await http.post<AuthResponse>('/api/auth/login', input)),
    [accept],
  );
  const register = useCallback(
    async (input: RegisterInput) =>
      accept(await http.post<AuthResponse>('/api/auth/register', input)),
    [accept],
  );
  const logout = useCallback(() => {
    tokenStorage.clear();
    setSession({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      isAdmin: session.user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
