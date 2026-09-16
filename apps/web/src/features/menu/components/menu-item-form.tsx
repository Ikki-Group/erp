import { useQuery } from '@tanstack/react-query'

import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { menuCategoryResource } from '../api.ts'
import { MenuItemStatusEnum } from '../dto/index.ts'
import type { MenuItemDto } from '../dto/index.ts'

export interface MenuItemFormValues {
	sku: string
	name: string
	categoryId: number | null
	basePrice: string
	status: MenuItemStatusEnum
}

const MenuItemFormSchema = z.object({
	sku: z.string().trim().min(1, 'SKU is required').max(100),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	categoryId: z.number().int().positive().nullable(),
	basePrice: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a valid price'),
	status: MenuItemStatusEnum,
})

const STATUS_OPTIONS: { label: string; value: string }[] = [
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
]

export const EMPTY_MENU_ITEM_FORM_VALUES: MenuItemFormValues = {
	sku: '',
	name: '',
	categoryId: null,
	basePrice: '',
	status: 'active',
}

export function toMenuItemFormValues(item: MenuItemDto): MenuItemFormValues {
	return {
		sku: item.sku,
		name: item.name,
		categoryId: item.categoryId,
		basePrice: item.basePrice,
		status: item.status,
	}
}

export interface UseMenuItemFormOptions {
	defaultValues?: MenuItemFormValues
	onSubmit: (values: MenuItemFormValues) => Promise<void>
}

export function useMenuItemForm({ defaultValues, onSubmit }: UseMenuItemFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_MENU_ITEM_FORM_VALUES,
		schema: MenuItemFormSchema,
		onSubmit,
	})
}

export type MenuItemForm = ReturnType<typeof useMenuItemForm>

export function MenuItemFormFields({
	form,
	locationId,
}: {
	form: MenuItemForm
	locationId: number
}) {
	const categoriesQuery = useQuery(
		menuCategoryResource.list.queryOptions({ page: 1, limit: 100, locationId }),
	)
	const categoryOptions = (categoriesQuery.data?.data ?? []).map((c) => ({
		label: c.name,
		value: c.id,
	}))

	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="sku">
					{(field) => <field.TextField label="SKU" placeholder="e.g. MNU-001" />}
				</form.AppField>
				<form.AppField name="status">
					{(field) => <field.SelectField label="Status" options={STATUS_OPTIONS} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Nama" placeholder="e.g. Es Kopi Susu" />}
			</form.AppField>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="basePrice">
					{(field) => <field.CurrencyField label="Harga Dasar" />}
				</form.AppField>
				<form.AppField name="categoryId">
					{(field) => (
						<field.IdSelectField
							label="Kategori"
							options={categoryOptions}
							nullableLabel="— Tanpa Kategori —"
							placeholder="Pilih kategori..."
						/>
					)}
				</form.AppField>
			</div>

			<form.FormError />
		</div>
	)
}
