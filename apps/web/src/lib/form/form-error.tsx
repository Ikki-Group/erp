import { useFormContext } from './contexts.ts'

/**
 * Form-level error banner. Renders `form.state.errorMap.onSubmit.form` (set
 * by `useEntityForm`'s submit wrapper as `{ form: message, fields: {} }`
 * when the mutation throws — see `use-entity-form.ts`). Field-level errors
 * already render next to their own field, so this is only for errors with
 * no single field to attach to (e.g. a 409 conflict from the server).
 */
export function FormError() {
	const form = useFormContext()

	return (
		<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
			{(onSubmitError) => {
				const message =
					onSubmitError && typeof onSubmitError === 'object' && 'form' in onSubmitError
						? (onSubmitError.form as string | undefined)
						: undefined
				if (!message) return null
				return (
					<p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{message}
					</p>
				)
			}}
		</form.Subscribe>
	)
}
