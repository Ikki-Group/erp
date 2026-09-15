import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { useFormContext } from './contexts.ts'

export interface FormDialogFooterProps {
	onCancel: () => void
	submitLabel?: string
	cancelLabel?: string
}

/**
 * Standard Cancel/Submit footer for a form rendered inside `FormDialog`.
 * Reads submitting/canSubmit off the form context, so callers never wire
 * `disabled`/`loading` by hand. Pair with a form built on `useEntityForm`.
 */
export function FormDialogFooter({
	onCancel,
	submitLabel = 'Save',
	cancelLabel = 'Cancel',
}: FormDialogFooterProps) {
	const form = useFormContext()

	return (
		<form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit] as const}>
			{([isSubmitting, canSubmit]) => (
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
						{cancelLabel}
					</Button>
					<Button type="submit" disabled={isSubmitting || !canSubmit}>
						{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
						{submitLabel}
					</Button>
				</div>
			)}
		</form.Subscribe>
	)
}
