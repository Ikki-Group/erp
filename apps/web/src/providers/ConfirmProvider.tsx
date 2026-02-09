'use client'

import * as React from 'react'
import {
  ConfirmDialog,
  type ConfirmDialogProps,
} from '@/components/ui/ConfirmDialog'

type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'open' | 'onOpenChange' | 'onConfirm'
>

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmContextType | undefined>(
  undefined,
)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = React.useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve })
    })
  }, [])

  const handleClose = React.useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false)
      setConfirmState(null)
    }
  }, [confirmState])

  const handleConfirm = React.useCallback(async () => {
    if (confirmState) {
      confirmState.resolve(true)
      setConfirmState(null)
    }
  }, [confirmState])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          onOpenChange={(open) => {
            if (!open) handleClose()
          }}
          {...confirmState.options}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
