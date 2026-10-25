import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { MyPurchasesPage } from '@/features/inventory/MyPurchasesPage';
import { RequireAdmin, RequireAuth } from '@/features/auth/guards';
import { AdminPage } from '@/features/vehicles/AdminPage';
import { DashboardPage } from '@/features/vehicles/DashboardPage';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'purchases', element: <MyPurchasesPage /> },
          {
            element: <RequireAdmin />,
            children: [{ path: 'admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
