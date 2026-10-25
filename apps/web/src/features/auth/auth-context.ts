import type { LoginInput, PublicUser, RegisterInput } from '@kata/shared';
import { createContext, useContext } from 'react';

export interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
