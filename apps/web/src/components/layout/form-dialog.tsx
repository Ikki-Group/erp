import * as React from 'react'

import { cn } from '@/lib/utils'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

/* -------------------------------------------------------------------------- */
/*  FormDialog                                                                */
/* -------------------------------------------------------------------------- */

interface FormDialogProps {
  /** Controls dialog visibility */
  open: boolean
  /** Called when the dialog is dismissed (overlay click, escape key) */
  onOpenChange: (open: boolean) => void
  /** Dialog title, displayed in the header */
  title: string
  /** Optional description below the title */
  description?: string
  /** Form fields — rendered in the dialog body */
  children: React.ReactNode
  /** Footer content — typically `form.DialogActions`. Rendered inside DialogFooter. */
  footer?: React.ReactNode
  /** Additional className for DialogContent */
  className?: string
}

/**
 * Standard layout for simple form dialogs.
 *
 * Provides a consistent structure: Header (title + description) → Body (children) → Footer (actions).
 * Use with `createCallable` from `react-call` and `form.DialogActions` for the footer.
 *
 * @example
 * ```tsx
 * <form.AppForm>
 *   <FormDialog
 *     open={!call.ended}
 *     onOpenChange={() => call.end()}
 *     title={isCreate ? 'Tambah Role' : 'Edit Role'}
 *     description="Kelola role untuk mengatur hak akses."
 *     footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
 *   >
 *     <form.AppField name="name">
 *       {(field) => <field.Input label="Nama" required placeholder="..." />}
 *     </form.AppField>
 *   </FormDialog>
 * </form.AppForm>
 * ```
 */
function FormDialog({ open, onOpenChange, title, description, children, footer, className }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(className)}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export { FormDialog }
