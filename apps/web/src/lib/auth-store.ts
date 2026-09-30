import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDto } from '@/api/generated/model'

interface AuthState {
  token: string | null
  user: UserDto | null
  setSession: (token: string, user: UserDto) => void
  clearSession: () => void
}

// Persisted to localStorage so a page refresh keeps you logged in.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    { name: 'expense-tracker-auth' },
  ),
)
