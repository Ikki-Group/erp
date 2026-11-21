import { z } from 'zod'

import type { MenuCategoryCreateDto, MenuCategoryDto, MenuCategoryUpdateDto } from './dto/index.ts'

export interface CategoryFormValues {
	name: string
	sortOrder: number | null
}

export const CategoryFormSchema = z.object({
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(100),
	sortOrder: z.number().int().min(0).nullable(),
})

export function emptyCategoryFormValues(): CategoryFormValues {
	return { name: '', sortOrder: 0 }
}

export function toCategoryFormValues(category: MenuCategoryDto): CategoryFormValues {
	return { name: category.name, sortOrder: category.sortOrder }
}

/** `parentId` is deliberately omitted: this dialog does not edit it, so the server keeps it. */
export function toCategoryCreateInput(
	locationId: number,
	values: CategoryFormValues,
): MenuCategoryCreateDto {
	return { locationId, name: values.name.trim(), sortOrder: values.sortOrder ?? 0 }
}

export function toCategoryUpdateInput(
	id: number,
	values: CategoryFormValues,
): MenuCategoryUpdateDto {
	return { id, name: values.name.trim(), sortOrder: values.sortOrder ?? 0 }
}
