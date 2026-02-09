'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  confirmationKeyword?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  confirmationKeyword,
  onConfirm,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const isConfirmed = !confirmationKeyword || inputValue === confirmationKeyword

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isConfirmed) return

    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      setInputValue('')
      setIsLoading(false)
    }
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>{description}</div>
            {confirmationKeyword && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="confirmation-input" className="text-foreground">
                  Type{' '}
                  <span className="font-bold select-none italic">
                    "{confirmationKeyword}"
                  </span>{' '}
                  to confirm
                </Label>
                <Input
                  id="confirmation-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmationKeyword}
                  autoComplete="off"
                  className="bg-muted/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isConfirmed && !isLoading) {
                      e.preventDefault()
                      handleConfirm(e as any)
                    }
                  }}
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            variant={variant}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
