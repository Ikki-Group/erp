import { z } from 'zod'

import { createLineItem } from '@/components/shared/line-item-editor.tsx'
import type { LineItem } from '@/components/shared/line-item-editor.tsx'

import { RecipeCreateDto, RecipeUpdateDto } from './dto/index.ts'
import type { RecipeDetailDto } from './dto/index.ts'

// ─── Values ───

/** `clientKey` is UI identity only; it never reaches a request body. */
export interface RecipeLineValues extends LineItem {
	materialId: number | null
	/** Decimal string, passed through unchanged. */
	quantity: string
	uomId: number | null
}

export interface RecipeFormValues {
	menuItemId: number | null
	name: string
	/** Decimal string, passed through unchanged. */
	yieldQty: string
	lines: RecipeLineValues[]
}

// ─── Schema ───

const decimal = (message: string) =>
	z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, message)

const requiredId = (message: string) =>
	z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: message })

const RecipeLineSchema = z.object({
	materialId: requiredId('Material wajib dipilih'),
	quantity: decimal('Jumlah harus angka positif'),
	uomId: requiredId('Satuan wajib dipilih'),
})

/** Form-shape schema: incomplete inputs get field-level guidance rather than DTO errors. */
export const RecipeFormSchema = z.object({
	menuItemId: requiredId('Menu item wajib dipilih'),
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(255),
	yieldQty: decimal('Yield qty harus angka positif'),
	lines: z.array(RecipeLineSchema).min(1, 'Tambahkan minimal satu bahan'),
})

// ─── Mapping ───

export function createRecipeLine(): RecipeLineValues {
	return createLineItem({ materialId: null, quantity: '', uomId: null })
}

export function emptyRecipeFormValues(): RecipeFormValues {
	return { menuItemId: null, name: '', yieldQty: '1', lines: [createRecipeLine()] }
}

export function toRecipeFormValues(recipe: RecipeDetailDto): RecipeFormValues {
	return {
		menuItemId: recipe.menuItemId,
		name: recipe.name,
		yieldQty: recipe.yieldQty,
		lines: recipe.lines.map((line) =>
			createLineItem({
				materialId: line.materialId,
				quantity: line.quantity,
				uomId: line.uomId,
			}),
		),
	}
}

export function toRecipeInput(values: RecipeFormValues): RecipeCreateDto {
	return RecipeCreateDto.parse({
		menuItemId: values.menuItemId,
		name: values.name,
		yieldQty: values.yieldQty,
		lines: values.lines.map((line) => ({
			materialId: line.materialId,
			quantity: line.quantity,
			uomId: line.uomId,
		})),
	})
}

/** The menu item is immutable after creation, so it is deliberately absent from the update body. */
export function toRecipeUpdateInput(id: number, input: RecipeCreateDto): RecipeUpdateDto {
	return RecipeUpdateDto.parse({
		id,
		name: input.name,
		yieldQty: input.yieldQty,
		lines: input.lines,
	})
}
