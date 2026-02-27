import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { UserDetailDto } from '@/features/iam/dto'

type Location = Array<number> | null

interface AppState {
  token: string
  location: Location
  sidebarOpen: boolean

  invalidateSessionData: (user: UserDetailDto) => void
  isAuthenticated: () => boolean
  setToken: (token: string, user: UserDetailDto) => void
  clearToken: () => void
  setLocation: (location: Location) => void
  setSidebarOpen: (sidebarOpen: boolean) => void
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      token: '',
      location: null,
      sidebarOpen: false,

      invalidateSessionData: user => {
        set({
          location: validateLocation(get().location, user),
        })
      },
      isAuthenticated: () => !!get().token,
      setToken: (token, user) => {
        set({ token, location: validateLocation(get().location, user) })
      },
      clearToken: () => set({ token: '', location: null }),
      setLocation: location => set({ location }),
      setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
    }),
    {
      name: 'app-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

function validateLocation(current: Location, user: UserDetailDto): Location {
  if (user.assignments.length) {
    const userLocationIds = user.assignments.map(a => a.location.id)
    if (current && current.length === 1) {
      if (userLocationIds.includes(current[0])) return current
      return null
    } else {
      return userLocationIds
    }
  }
  return null
}
