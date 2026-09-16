import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { UOM_CATEGORY_OPTIONS, UomCategoryEnum } from '../dto/index.ts'
import type { UomDto } from '../dto/index.ts'

export interface UomFormValues {
	code: string
	name: string
	category: UomCategoryEnum
}

const UomFormSchema = z.object({
	code: z.string().trim().min(1, 'Code is required').max(50),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
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

export interface UseUomFormOptions {
	defaultValues?: UomFormValues
	onSubmit: (values: UomFormValues) => Promise<void>
}

export function useUomForm({ defaultValues, onSubmit }: UseUomFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_UOM_FORM_VALUES,
		schema: UomFormSchema,
		onSubmit,
	})
}

export type UomForm = ReturnType<typeof useUomForm>

export function UomFormFields({ form }: { form: UomForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. kg" />}
				</form.AppField>
				<form.AppField name="category">
					{(field) => <field.SelectField label="Category" options={[...UOM_CATEGORY_OPTIONS]} />}
				</form.AppField>
			</div>
			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="e.g. Kilogram" />}
			</form.AppField>
			<form.FormError />
		</div>
	)
}
