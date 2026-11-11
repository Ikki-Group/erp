import { z } from 'zod'

import { MenuItemStatusEnum } from './dto/index.ts'
import type { MenuItemCreateDto, MenuItemDto, MenuItemUpdateDto } from './dto/index.ts'

/** Form-shape values. `basePrice` stays the exact decimal string; `imageUrl` is not edited here. */
export interface MenuItemFormValues {
	sku: string
	name: string
	categoryId: number | null
	basePrice: string
	status: MenuItemStatusEnum
}

export const MenuItemFormSchema = z.object({
	sku: z.string().trim().min(1, 'SKU is required').max(100),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	categoryId: z.number().int().positive().nullable(),
	basePrice: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a valid price'),
	status: MenuItemStatusEnum,
})

export const MENU_ITEM_STATUS_FIELD_OPTIONS = [
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
]

export function emptyMenuItemFormValues(): MenuItemFormValues {
	return { sku: '', name: '', categoryId: null, basePrice: '', status: 'active' }
}

export function toMenuItemFormValues(
	item: Pick<MenuItemDto, 'sku' | 'name' | 'categoryId' | 'basePrice' | 'status'>,
): MenuItemFormValues {
	return {
		sku: item.sku,
		name: item.name,
		categoryId: item.categoryId,
		basePrice: item.basePrice,
		status: item.status,
	}
}

/** The form's trimmed canonical values; the price string is never routed through a number. */
export function toMenuItemFields(values: MenuItemFormValues) {
	return {
		sku: values.sku.trim(),
		name: values.name.trim(),
		categoryId: values.categoryId,
		basePrice: values.basePrice.trim(),
		status: values.status,
	}
}

/** Neither payload carries `imageUrl`, so the stored image is left untouched. */
export function toMenuItemCreateInput(
	locationId: number,
	values: MenuItemFormValues,
): MenuItemCreateDto {
	return { locationId, ...toMenuItemFields(values) }
}

export function toMenuItemUpdateInput(id: number, values: MenuItemFormValues): MenuItemUpdateDto {
	return { id, ...toMenuItemFields(values) }
}
