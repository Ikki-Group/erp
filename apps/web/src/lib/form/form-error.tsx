import { useFormContext } from './contexts.ts'

/** TanStack normalizes `{ form, fields }` into a form-level string and separate field errors. */
export function FormError() {
	const form = useFormContext()

	return (
		<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
			{(onSubmitError) => {
				const message = typeof onSubmitError === 'string' ? onSubmitError : undefined
				if (!message) return null
				return (
					<p
						role="alert"
						className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
					>
						{message}
					</p>
				)
			}}
		</form.Subscribe>
	)
}
