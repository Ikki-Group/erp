import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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
 *
 * Renders `DialogFooter` (the tinted band + divider from
 * `components/ui/dialog.tsx`) so forms rendered via the `content` render-prop
 * get the same footer treatment as `FormDialog`'s own legacy footer.
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
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
						{cancelLabel}
					</Button>
					<Button type="submit" disabled={isSubmitting || !canSubmit}>
						{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
						{submitLabel}
					</Button>
				</DialogFooter>
			)}
		</form.Subscribe>
	)
}
