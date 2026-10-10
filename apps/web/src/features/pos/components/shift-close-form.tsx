import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { CurrencyDisplay } from '@/components/shared/currency-display.tsx'

export interface ShiftCloseFormValues {
	closingCash: string
	notes: string
}

const ShiftCloseFormSchema = z.object({
	closingCash: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	notes: z.string().trim().max(1000).default(''),
})

const EMPTY_SHIFT_CLOSE_FORM_VALUES: ShiftCloseFormValues = {
	closingCash: '',
	notes: '',
}

export interface ShiftCloseFormBodyProps {
	expectedCash?: string | null
	onSaved: () => void
	onCancel: () => void
	onCreate: (values: { closingCash: string; notes?: string }) => Promise<unknown>
}

/** Quick "close shift" form — cash count + optional notes, small enough to stay a dialog. */
export function ShiftCloseFormBody({
	expectedCash,
	onSaved,
	onCancel,
	onCreate,
}: ShiftCloseFormBodyProps) {
	const form = useEntityForm({
		defaultValues: EMPTY_SHIFT_CLOSE_FORM_VALUES,
		schema: ShiftCloseFormSchema,
		onSubmit: async (values) => {
			await onCreate({
				closingCash: values.closingCash,
				notes: values.notes || undefined,
			})
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
				{expectedCash && (
					<div className="rounded-md border bg-muted/50 p-3 text-sm">
						<span className="text-muted-foreground">Expected cash: </span>
						<CurrencyDisplay value={expectedCash} className="font-medium" />
					</div>
				)}
				<form.AppField name="closingCash">
					{(field) => <field.CurrencyField label="Closing Cash" />}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => <field.TextField label="Notes" placeholder="Optional notes" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Close Shift" />
			</form>
		</form.AppForm>
	)
}
