import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ThemeListener } from './components/common/theme'
import { createRouter } from '@/lib/tanstack-router'
import { queryClient } from '@/lib/tanstack-query'

import { initSentry } from '@/lib/sentry'

const router = createRouter()
initSentry(router)

export function App() {
  return (
    <Suspense>
      <ThemeListener />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ qc: queryClient }} />
      </QueryClientProvider>
    </Suspense>
  )
}
