import * as React from 'react'

import { cn } from '@/lib/utils'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'

/* -------------------------------------------------------------------------- */
/*  FormDialog                                                                */
/* -------------------------------------------------------------------------- */

interface FormDialogProps {
	/** Controls dialog visibility */
	open: boolean
	/** Called when the dialog is dismissed (overlay click, escape key) */
	onOpenChange: (open: boolean) => void
	/** Dialog title, displayed in the header */
	title: React.ReactNode
	/** Optional description below the title */
	description?: string
	/** Form fields — rendered in the dialog body */
	children: React.ReactNode
	/** Footer content — typically `form.DialogActions`. Rendered inside DialogFooter. */
	footer?: React.ReactNode
	/** Additional className for DialogContent */
	className?: string
	/**
	 * Called when the form is submitted (enter key or submit button).
	 * Wire this to `form.handleSubmit()` from your form instance.
	 */
	onSubmit?: React.FormEventHandler<HTMLFormElement>
}

/**
 * Standard layout for simple form dialogs.
 *
 * Wraps children + footer inside a `<form>` element so pressing Enter submits the form.
 * Pass `onSubmit` wired to your form's `handleSubmit` — keeps layout concern separate from form logic.
 *
 * @example
 * ```tsx
 * <form.AppForm>
 *   <FormDialog
 *     open={!call.ended}
 *     onOpenChange={() => call.end()}
 *     title={isCreate ? 'Tambah Role' : 'Edit Role'}
 *     description="Kelola role untuk mengatur hak akses."
 *     onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
 *     footer={<form.DialogActions onCancel={call.end} disabled={disabled} />}
 *   >
 *     <form.AppField name="name">
 *       {(field) => <field.Input label="Nama" required placeholder="..." />}
 *     </form.AppField>
 *   </FormDialog>
 * </form.AppForm>
 * ```
 */
function FormDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	footer,
	className,
	onSubmit,
}: FormDialogProps) {
	const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault()
		e.stopPropagation()
		onSubmit?.(e)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={cn(className)}>
				<DialogHeader className="border-b pb-4">
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<form onSubmit={handleSubmit} className="contents">
					{children}
					{footer && <DialogFooter>{footer}</DialogFooter>}
				</form>
			</DialogContent>
		</Dialog>
	)
}

export { FormDialog }
