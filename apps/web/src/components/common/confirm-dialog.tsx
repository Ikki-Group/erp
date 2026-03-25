import { createCallable } from 'react-call'

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
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ConfirmVariant = 'destructive' | 'warning' | 'default'

interface ConfirmDialogProps {
  title: string
  description?: string
  variant?: ConfirmVariant
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
}

/* -------------------------------------------------------------------------- */
/*  Variant Styles                                                            */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<ConfirmVariant, { button: string }> = {
  destructive: { button: 'bg-destructive text-white hover:bg-destructive/90' },
  warning: { button: 'bg-warning text-white hover:bg-warning/90' },
  default: { button: '' },
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const ConfirmDialog = createCallable<ConfirmDialogProps, boolean>(
  ({
    call,
    title,
    description,
    variant = 'destructive',
    confirmLabel = 'Ya, Lanjutkan',
    cancelLabel = 'Batal',
    onConfirm,
  }) => {
    const styles = variantStyles[variant]

    const handleConfirm = async () => {
      await onConfirm()
      call.end(true)
    }

    return (
      <AlertDialog open={!call.ended} onOpenChange={() => call.end(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => call.end(false)}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction className={cn(styles.button)} onClick={handleConfirm}>
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
  200,
)
