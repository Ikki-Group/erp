import { z } from 'zod'

import { FormDialogFooter, FormRoot, useEntityEditor } from '@/lib/form/index.ts'

import { conversionResource } from '../api.ts'
import { UomConversionCreateDto } from '../dto/index.ts'
import { UomLookupField } from './uom-lookup-field.tsx'

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
	onSaved: () => void
	onCancel: () => void
}

/** Quick-add form for a UoM conversion factor — small enough to stay a dialog. */
export function ConversionFormBody({ onSaved, onCancel }: ConversionFormBodyProps) {
	const form = useEntityEditor({
		defaultValues: EMPTY_CONVERSION_FORM_VALUES,
		schema: ConversionFormSchema,
		mutation: conversionResource.create.mutationOptions(),
		toPayload: (values) => UomConversionCreateDto.parse(values),
		successMessage: 'Conversion created successfully.',
		onSaved,
	})

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="fromUomId">
						{() => <UomLookupField label="From Unit" />}
					</form.AppField>
					<form.AppField name="toUomId">{() => <UomLookupField label="To Unit" />}</form.AppField>
				</div>
				<form.AppField name="factor">
					{(field) => (
						<field.TextField
							label="Factor"
							placeholder="e.g. 1000 (1 from = 1000 to)"
							inputMode="decimal"
							className="text-right font-mono tabular-nums"
						/>
					)}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Create" />
			</FormRoot>
		</form.AppForm>
	)
}
