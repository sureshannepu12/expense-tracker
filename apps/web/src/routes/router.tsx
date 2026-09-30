import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/app-layout'
import { RouteError } from '@/components/route-error'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { ProtectedRoute, PublicOnlyRoute } from './guards'

// Pages behind login are code-split: each one is a separate JS chunk that is
// downloaded the first time you visit it (the dashboard's chart library is the biggest).
export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: () =>
              import('@/features/dashboard/dashboard-page').then((m) => ({
                Component: m.DashboardPage,
              })),
          },
          {
            path: 'expenses',
            lazy: () =>
              import('@/features/expenses/expenses-page').then((m) => ({
                Component: m.ExpensesPage,
              })),
          },
          {
            path: 'categories',
            lazy: () =>
              import('@/features/categories/categories-page').then((m) => ({
                Component: m.CategoriesPage,
              })),
          },
          {
            path: 'budgets',
            lazy: () =>
              import('@/features/budgets/budgets-page').then((m) => ({
                Component: m.BudgetsPage,
              })),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
