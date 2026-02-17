import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface State {
  token: string
  setToken: (token: string) => void
}

export const useAuth = create<State>()(
  persist(
    (set) => ({
      token: '',
      setToken: (token: string) => set({ token }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
