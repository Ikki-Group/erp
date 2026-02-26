import { Button } from '@/components/ui/button'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
// import { create } from 'zustand'
// import { createJSONStorage, persist } from 'zustand/middleware'

// export type Theme = 'light' | 'dark'

// interface State {
//   theme: Theme
//   set: (theme: Theme) => void
//   toggle: () => void
// }

// export const useTheme = create<State>()(
//   persist(
//     (set) => ({
//       theme: 'light',
//       set: (theme) => set({ theme }),
//       toggle: () =>
//         set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
//     }),
//     {
//       name: 'theme-provider',
//       storage: createJSONStorage(() => localStorage),
//     },
//   ),
// )

export function ThemeListener() {
  // const { theme } = useTheme()

  // useEffect(() => {
  //   // console.log({ theme })
  //   // document.documentElement.classList.remove('light', 'dark')
  //   // document.documentElement.classList.add(theme)
  //   // // Update color scheme
  //   // const meta = document.querySelector('meta[name="theme-color"]')
  //   // if (meta) {
  //   //   meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000')
  //   // }
  // }, [theme])

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

export function ThemeSwitcher() {
  const { setTheme } = useTheme()

  const onClick = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <Button variant="outline" onClick={onClick} className="size-8 rounded-full">
      <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
