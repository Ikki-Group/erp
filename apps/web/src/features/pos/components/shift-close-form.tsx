import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

export interface ShiftCloseFormValues {
	closingCash: string
	notes: string
}

const ShiftCloseFormSchema = z.object({
	closingCash: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Harus berupa angka desimal positif'),
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
						<span className="text-muted-foreground">Kas diharapkan: </span>
						<span className="font-medium">{Number(expectedCash).toLocaleString('id-ID')}</span>
					</div>
				)}
				<form.AppField name="closingCash">
					{(field) => <field.CurrencyField label="Kas Penutupan" />}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.closingCash}>
					{(closingCash) => {
						if (!closingCash || !expectedCash) return null
						const difference = Number(closingCash) - Number(expectedCash)
						return (
							<div className="rounded-md border p-3 text-sm">
								<span className="text-muted-foreground">Selisih: </span>
								<span
									className={
										difference === 0
											? 'font-medium text-success'
											: difference < 0
												? 'font-medium text-destructive'
												: 'font-medium text-warning'
									}
								>
									{difference > 0 ? '+' : ''}
									{difference.toLocaleString('id-ID')}
								</span>
							</div>
						)
					}}
				</form.Subscribe>
				<form.AppField name="notes">
					{(field) => <field.TextField label="Catatan" placeholder="Catatan opsional" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Tutup Shift" />
			</form>
		</form.AppForm>
	)
}
