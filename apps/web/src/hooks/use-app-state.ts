import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AppState {
  locationId: number
  sidebarOpen: boolean

  setLocationId: (locationId: number) => void
  setSidebarOpen: (sidebarOpen: boolean) => void
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      locationId: 1,
      sidebarOpen: false,

      setLocationId: (locationId) => set({ locationId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'app-state',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
