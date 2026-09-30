import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/lib/auth-store'

/** Renders child routes only when logged in; otherwise sends the user to /login. */
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    // Remember where the user was going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Login/register pages: a logged-in user is sent to the dashboard instead. */
export function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}
