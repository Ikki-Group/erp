import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface State {
  open: boolean
  toggle: () => void
}

export const useSidebar = create<State>()(
  persist(
    (set) => ({
      open: false,
      toggle: () => set((state) => ({ open: !state.open })),
    }),
    {
      name: 'sidebar',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
