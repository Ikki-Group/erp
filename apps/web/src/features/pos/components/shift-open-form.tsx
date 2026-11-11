import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

export interface ShiftOpenFormValues {
	openingCash: string
}

const ShiftOpenFormSchema = z.object({
	openingCash: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
})

const EMPTY_SHIFT_OPEN_FORM_VALUES: ShiftOpenFormValues = {
	openingCash: '0',
}

export interface ShiftOpenFormBodyProps {
	onSaved: () => void
	onCancel: () => void
	onCreate: (values: { openingCash: string }) => Promise<unknown>
}

/** Quick "open shift" form — a single money field, small enough to stay a dialog. */
export function ShiftOpenFormBody({ onSaved, onCancel, onCreate }: ShiftOpenFormBodyProps) {
	const form = useEntityForm({
		defaultValues: EMPTY_SHIFT_OPEN_FORM_VALUES,
		schema: ShiftOpenFormSchema,
		onSubmit: async (values) => {
			await onCreate({ openingCash: values.openingCash })
			onSaved()
		},
	})

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="grid gap-4"
			>
				<form.AppField name="openingCash">
					{(field) => <field.CurrencyField label="Opening Cash" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Open Shift" />
			</form>
		</form.AppForm>
	)
}
