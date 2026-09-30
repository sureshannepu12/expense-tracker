import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/lib/auth-store'

export function useLogout() {
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  return () => {
    clearSession()
    // Drop cached data so the next user never sees the previous user's expenses.
    queryClient.clear()
    navigate('/login', { replace: true })
  }
}
