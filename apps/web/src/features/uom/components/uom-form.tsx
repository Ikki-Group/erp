import { z } from 'zod'

import { useEntityEditor } from '@/lib/form/index.ts'

import { uomResource } from '../api.ts'
import { UOM_CATEGORY_OPTIONS, UomCategoryEnum, UomCreateDto } from '../dto/index.ts'
import type { UomDto } from '../dto/index.ts'

export interface UomFormValues {
	code: string
	name: string
	category: UomCategoryEnum
}

const UomFormSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
	category: UomCategoryEnum,
})

export const EMPTY_UOM_FORM_VALUES: UomFormValues = {
	code: '',
	name: '',
	category: 'quantity',
}

export function toUomFormValues(unit: UomDto): UomFormValues {
	return {
		code: unit.code,
		name: unit.name,
		category: unit.category,
	}
}

export function toUomInput(values: UomFormValues): UomCreateDto {
	return UomCreateDto.parse(values)
}

export function useUomForm({
	unit,
	onSaved,
}: {
	unit?: UomDto
	onSaved: () => void | Promise<void>
}) {
	return useEntityEditor({
		defaultValues: unit ? toUomFormValues(unit) : EMPTY_UOM_FORM_VALUES,
		schema: UomFormSchema,
		mutation: {
			mutationFn: (input: UomCreateDto) =>
				unit
					? uomResource.update.fetch({ ...input, id: unit.id })
					: uomResource.create.fetch(input),
		},
		toPayload: toUomInput,
		successMessage: unit ? 'Satuan berhasil diperbarui.' : 'Satuan berhasil dibuat.',
		onSaved,
	})
}

export type UomForm = ReturnType<typeof useUomForm>

export function UomFormFields({ form }: { form: UomForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Kode" placeholder="mis. kg" />}
				</form.AppField>
				<form.AppField name="category">
					{(field) => <field.SelectField label="Kategori" options={[...UOM_CATEGORY_OPTIONS]} />}
				</form.AppField>
			</div>
			<form.AppField name="name">
				{(field) => <field.TextField label="Nama" placeholder="mis. Kilogram" />}
			</form.AppField>
		</div>
	)
}
