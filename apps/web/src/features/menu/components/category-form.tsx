import { getActiveLocationId } from '@/lib/api/index.ts'
import { FormDialogFooter, FormRoot, useEntityEditor } from '@/lib/form/index.ts'
import type { EntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

import { menuCategoryResource } from '../api.ts'
import {
	CategoryFormSchema,
	emptyCategoryFormValues,
	toCategoryCreateInput,
	toCategoryFormValues,
	toCategoryUpdateInput,
} from '../category-form-values.ts'
import type { CategoryFormValues } from '../category-form-values.ts'
import type { MenuCategoryDto } from '../dto/index.ts'

export type CategoryEditorForm = EntityForm<CategoryFormValues>

export interface CategoryFormBodyProps {
	/** Present when editing; its `locationId` is authoritative over `location`. */
	category?: MenuCategoryDto
	/** Create scope (the selected header location). Ignored for an existing category. */
	location: { id: number; name: string }
	/** Live permission getter; callable dialogs render outside auth providers, so no hooks here. */
	canSave: () => boolean
	onSaved: () => void
	onCancel: () => void
}

/**
 * Category create/update session. Requests carry the header's ambient location, so a save is
 * refused — keeping every entered value — while the active location differs from the pinned one.
 */
export function useCategoryEditor({
	category,
	location,
	canSave,
	onSaved,
}: Pick<
	CategoryFormBodyProps,
	'category' | 'location' | 'canSave' | 'onSaved'
>): CategoryEditorForm {
	const locationId = category?.locationId ?? location.id
	return useEntityEditor<CategoryFormValues, CategoryFormValues, unknown>({
		defaultValues: category ? toCategoryFormValues(category) : emptyCategoryFormValues(),
		schema: CategoryFormSchema,
		mutation: {
			retry: false,
			mutationFn: async (values) => {
				if (!canSave()) throw new Error('Anda tidak memiliki izin untuk menyimpan kategori ini.')
				if (getActiveLocationId() !== locationId) {
					const name = location.id === locationId ? location.name : `Lokasi #${locationId}`
					throw new Error(
						`Lokasi aktif telah berubah. Kembali ke "${name}" untuk menyimpan kategori ini.`,
					)
				}
				return category
					? menuCategoryResource.update.fetch(toCategoryUpdateInput(category.id, values))
					: menuCategoryResource.create.fetch(toCategoryCreateInput(locationId, values))
			},
		},
		toPayload: (values) => values,
		successMessage: category ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil dibuat.',
		onSaved,
	})
}

/** Quick-add form for a menu category — name + sort order, small enough to stay a dialog. */
export function CategoryFormBody({ onCancel, canSave, ...session }: CategoryFormBodyProps) {
	const form = useCategoryEditor({ ...session, canSave })
	const readOnly = !canSave()

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<fieldset disabled={readOnly || isSubmitting} className="grid gap-4">
							<form.AppField name="name">
								{(field) => (
									<field.TextField
										label="Nama Kategori"
										placeholder="e.g. Minuman, Makanan Berat"
									/>
								)}
							</form.AppField>
							<form.AppField name="sortOrder">
								{(field) => <field.NumberField label="Urutan" min={0} />}
							</form.AppField>
						</fieldset>
					)}
				</form.Subscribe>
				{readOnly && (
					<p role="status" className="text-sm text-muted-foreground">
						Anda tidak memiliki izin untuk mengubah kategori ini.
					</p>
				)}
				<form.FormError />
				{readOnly ? (
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onCancel}>
							Tutup
						</Button>
					</DialogFooter>
				) : (
					<form.Subscribe selector={(state) => state.errorMap.onSubmit !== undefined}>
						{(failed) =>
							failed ? (
								<DialogFooter>
									<Button type="button" variant="outline" onClick={onCancel}>
										Cancel
									</Button>
									<Button
										type="button"
										onClick={() => {
											if (form.state.isSubmitting) return
											form.setErrorMap({ onSubmit: undefined })
											void form.handleSubmit()
										}}
									>
										Coba lagi
									</Button>
								</DialogFooter>
							) : (
								<FormDialogFooter onCancel={onCancel} submitLabel="Simpan" />
							)
						}
					</form.Subscribe>
				)}
			</FormRoot>
		</form.AppForm>
	)
}
