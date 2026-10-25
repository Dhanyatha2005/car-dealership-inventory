import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './auth-context';

export function RequireAuth(): ReactElement {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin(): ReactElement {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
