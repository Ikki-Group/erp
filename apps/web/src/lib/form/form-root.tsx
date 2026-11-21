import type { ReactNode } from 'react'

import type { AnyFormApi } from '@tanstack/react-form'

export interface FormRootProps {
	form: AnyFormApi
	children: ReactNode
	className?: string
}

/**
 * `<form>` wrapper that wires `onSubmit` to `form.handleSubmit()`. Use this
 * inside a `FormDialog` body (or anywhere a form isn't already inside
 * `FormPage`, which wires this itself) so a native Enter-to-submit and a
 * `<FormDialogFooter type="submit">` button both work without each call
 * site re-writing the same `preventDefault`/`stopPropagation` dance.
 */
export function FormRoot({ form, children, className }: FormRootProps) {
	return (
		<form
			className={className}
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
		>
			{children}
		</form>
	)
}
