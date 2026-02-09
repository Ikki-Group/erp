import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { getRouter } from './router'
import './styles.css'

import { ThemeProvider } from './providers/ThemeProvider'
import { ConfirmProvider } from './providers/ConfirmProvider'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const router = getRouter()

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="ikki-erp-theme">
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ConfirmProvider>
              <RouterProvider router={router} />
            </ConfirmProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
  )
}
