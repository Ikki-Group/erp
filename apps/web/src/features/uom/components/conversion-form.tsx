import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import type { UomDto } from '../dto/index.ts'

export interface ConversionFormValues {
	fromUomId: number | null
	toUomId: number | null
	factor: string
}

const ConversionFormSchema = z
	.object({
		fromUomId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Source unit is required' }),
		toUomId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Target unit is required' }),
		factor: z
			.string()
			.trim()
			.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	})
	.refine((v) => v.fromUomId === null || v.fromUomId !== v.toUomId, {
		error: 'Must differ from source unit',
		path: ['toUomId'],
	})

const EMPTY_CONVERSION_FORM_VALUES: ConversionFormValues = {
	fromUomId: null,
	toUomId: null,
	factor: '',
}

export interface ConversionFormBodyProps {
	units: UomDto[]
	onSaved: () => void
	onCancel: () => void
	onCreate: (values: { fromUomId: number; toUomId: number; factor: string }) => Promise<unknown>
}

/** Quick-add form for a UoM conversion factor — small enough to stay a dialog. */
export function ConversionFormBody({
	units,
	onSaved,
	onCancel,
	onCreate,
}: ConversionFormBodyProps) {
	const unitOptions = units.map((u) => ({ label: `${u.name} (${u.code})`, value: u.id }))

	const form = useEntityForm({
		defaultValues: EMPTY_CONVERSION_FORM_VALUES,
		schema: ConversionFormSchema,
		onSubmit: async (values) => {
			await onCreate({
				fromUomId: values.fromUomId!,
				toUomId: values.toUomId!,
				factor: values.factor,
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
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="fromUomId">
						{(field) => (
							<field.IdSelectField
								label="From Unit"
								options={unitOptions}
								placeholder="Select unit"
							/>
						)}
					</form.AppField>
					<form.AppField name="toUomId">
						{(field) => (
							<field.IdSelectField
								label="To Unit"
								options={unitOptions}
								placeholder="Select unit"
							/>
						)}
					</form.AppField>
				</div>
				<form.AppField name="factor">
					{(field) => <field.TextField label="Factor" placeholder="e.g. 1000 (1 from = 1000 to)" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Create" />
			</form>
		</form.AppForm>
	)
}
