import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UseAuth {
  token: string
  setToken: (token: string) => void
  clear: () => void
  isAuthenticated: () => boolean
}

export const useAuth = create<UseAuth>()(
  persist(
    (set, get) => ({
      token: '',
      setToken(token) {
        if (!token) throw new Error("Token can't be empty")
        set({ token })
      },
      clear() {
        set({ token: '' })
      },
      isAuthenticated() {
        return !!get().token
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
