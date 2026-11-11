import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import type { TableDto } from '../dto/index.ts'

export interface TableFormValues {
	number: string
	capacity: string
	isActive: boolean
}

const TableFormSchema = z.object({
	number: z.string().trim().min(1, 'Number / name is required').max(50),
	capacity: z.string().trim().regex(/^\d+$/u, 'Must be a whole number'),
	isActive: z.boolean(),
})

export const EMPTY_TABLE_FORM_VALUES: TableFormValues = {
	number: '',
	capacity: '4',
	isActive: true,
}

export function toTableFormValues(table: TableDto): TableFormValues {
	return {
		number: table.number,
		capacity: table.capacity.toString(),
		isActive: table.isActive,
	}
}

export interface UseTableFormOptions {
	defaultValues?: TableFormValues
	onSubmit: (values: TableFormValues) => Promise<void>
}

export function useTableForm({ defaultValues, onSubmit }: UseTableFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_TABLE_FORM_VALUES,
		schema: TableFormSchema,
		onSubmit,
	})
}

export type TableForm = ReturnType<typeof useTableForm>

export function TableFormFields({ form }: { form: TableForm }) {
	return (
		<div className="grid gap-4">
			<form.AppField name="number">
				{(field) => <field.TextField label="Number / Name" placeholder="e.g. T-01 or Table 1" />}
			</form.AppField>
			<form.AppField name="capacity">
				{(field) => <field.TextField label="Capacity" placeholder="4" />}
			</form.AppField>
			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField label="Active" description="Inactive tables won't appear in POS." />
				)}
			</form.AppField>
			<form.FormError />
		</div>
	)
}
