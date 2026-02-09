import { useEffect } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface State {
  theme: Theme
  set: (theme: Theme) => void
  toggle: () => void
}

export const useTheme = create<State>()(
  persist(
    (set) => ({
      theme: 'light',
      set: (theme) => set({ theme }),
      toggle: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function ThemeListener() {
  const { theme } = useTheme()

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const isIphone = /iPhone/i.test(navigator.userAgent)
    if (isIphone) {
      document
        .querySelector('meta[name="viewport"]')
        ?.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1',
        )
    }
  }, [])

  return null
}
