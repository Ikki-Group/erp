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
			.refine((v) => v !== null, { error: 'Satuan asal wajib diisi' }),
		toUomId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Satuan tujuan wajib diisi' }),
		factor: z
			.string()
			.trim()
			.regex(/^\d+(\.\d+)?$/u, 'Harus berupa angka desimal positif'),
	})
	.refine((v) => v.fromUomId === null || v.fromUomId !== v.toUomId, {
		error: 'Harus berbeda dari satuan asal',
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
		successMessage: 'Konversi berhasil dibuat.',
		onSaved,
	})

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="fromUomId">
						{() => <UomLookupField label="Dari Satuan" />}
					</form.AppField>
					<form.AppField name="toUomId">{() => <UomLookupField label="Ke Satuan" />}</form.AppField>
				</div>
				<form.AppField name="factor">
					{(field) => (
						<field.TextField
							label="Faktor"
							placeholder="mis. 1000 (1 dari = 1000 ke)"
							inputMode="decimal"
							className="text-right font-mono tabular-nums"
						/>
					)}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Buat" />
			</FormRoot>
		</form.AppForm>
	)
}
