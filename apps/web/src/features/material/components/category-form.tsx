import { useEntityForm } from '@/lib/form/index.ts'

import { MaterialCategoryCreateDto } from '../dto/index.ts'
import type { MaterialCategoryDto } from '../dto/index.ts'

export interface CategoryFormValues {
	name: string
}

export interface UseCategoryFormOptions {
	defaultValues?: MaterialCategoryDto
	onSubmit: (values: CategoryFormValues) => Promise<void>
}

export function useCategoryForm({ defaultValues, onSubmit }: UseCategoryFormOptions) {
	return useEntityForm({
		defaultValues: { name: defaultValues?.name ?? '' },
		schema: MaterialCategoryCreateDto,
		onSubmit,
	})
}

export type CategoryForm = ReturnType<typeof useCategoryForm>

/** Quick-add/edit form for a material category — small enough to stay a dialog. */
export function CategoryFormFields({ form }: { form: CategoryForm }) {
	return (
		<div className="grid gap-4">
			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="e.g. Bahan Kering" />}
			</form.AppField>
			<form.FormError />
		</div>
	)
}
