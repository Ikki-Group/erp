import { type ReactNode, useState } from 'react'
import { createCallable } from 'react-call'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

export interface FormDialogProps {
	title: string
	description?: string
	submitLabel?: string
	cancelLabel?: string
	/** Content rendered inside the dialog body. Use form fields here. */
	content: ReactNode
	/**
	 * Async submit handler. Dialog stays open with loading state until resolved.
	 * Throw to show an error and keep the dialog open for retry.
	 */
	onSubmit: () => Promise<void>
}

type FormDialogResponse = boolean

const UNMOUNTING_DELAY = 150

export const FormDialog = createCallable<FormDialogProps, FormDialogResponse>(
	({ call, title, description, submitLabel = 'Save', cancelLabel = 'Cancel', content, onSubmit }) => {
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)

		const handleSubmit = async () => {
			setLoading(true)
			setError(null)
			try {
				await onSubmit()
				call.end(true)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'An error occurred.')
				setLoading(false)
			}
		}

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open && !loading) call.end(false)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>
					<div className="py-2">{content}</div>
					{error && (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
							{error}
						</p>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => call.end(false)} disabled={loading}>
							{cancelLabel}
						</Button>
						<Button onClick={handleSubmit} disabled={loading}>
							{loading && <Spinner className="mr-1.5 size-3.5" />}
							{submitLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	},
	UNMOUNTING_DELAY,
)

/**
 * Imperative form dialog. Opens a dialog with custom content and an async submit action.
 * Returns `true` if submitted successfully, `false` if cancelled.
 *
 * @example
 * ```tsx
 * const saved = await formDialog({
 *   title: 'Add Material',
 *   content: <MaterialQuickForm ref={formRef} />,
 *   onSubmit: async () => {
 *     const data = formRef.current.getValues()
 *     await api.createMaterial(data)
 *   },
 * })
 * ```
 */
export const formDialog = FormDialog.call
