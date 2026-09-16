import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import type { MenuCategoryDto } from '../dto/index.ts'

export interface CategoryFormValues {
	name: string
	sortOrder: number | null
}

const CategoryFormSchema = z.object({
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(100),
	sortOrder: z.number().int().min(0).nullable(),
})

export interface CategoryFormBodyProps {
	defaultValues?: MenuCategoryDto
	onSaved: () => void
	onCancel: () => void
	onSubmitValues: (values: { name: string; sortOrder: number }) => Promise<unknown>
}

/** Quick-add form for a menu category — name + sort order, small enough to stay a dialog. */
export function CategoryFormBody({
	defaultValues,
	onSaved,
	onCancel,
	onSubmitValues,
}: CategoryFormBodyProps) {
	const form = useEntityForm<CategoryFormValues>({
		defaultValues: {
			name: defaultValues?.name ?? '',
			sortOrder: defaultValues?.sortOrder ?? 0,
		},
		schema: CategoryFormSchema,
		onSubmit: async (values) => {
			await onSubmitValues({ name: values.name, sortOrder: values.sortOrder ?? 0 })
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
				<form.AppField name="name">
					{(field) => (
						<field.TextField label="Nama Kategori" placeholder="e.g. Minuman, Makanan Berat" />
					)}
				</form.AppField>
				<form.AppField name="sortOrder">
					{(field) => <field.NumberField label="Urutan" min={0} />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Simpan" />
			</form>
		</form.AppForm>
	)
}
