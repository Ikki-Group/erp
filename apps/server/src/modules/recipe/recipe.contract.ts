import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemSchema = z.object({
	...zc.RecordId.shape,
	recipeId: zp.id,
	materialId: zp.id,
	qty: zp.decimal,
	scrapPercentage: zp.decimal,
	uomId: zp.id,
	notes: zp.strNullable,
	sortOrder: zp.num,

	// optional joins
	material: z.object({ name: zp.str, sku: zp.str }).optional(),
	uom: z.object({ code: zp.str }).optional(),
	...zc.AuditBasic.shape,
})
export type RecipeItemSchema = z.infer<typeof RecipeItemSchema>

/* --------------------------------- ENTITY --------------------------------- */

export const RecipeDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id.nullable(),
	productId: zp.id.nullable(),
	productVariantId: zp.id.nullable(),
	targetQty: zp.decimal,
	isActive: zp.bool,
	instructions: zp.strNullable,

	// items can be populated
	items: z.array(RecipeItemSchema).optional(),
	...zc.AuditBasic.shape,
})
export type RecipeDto = z.infer<typeof RecipeDto>

/* --------------------------------- FILTER --------------------------------- */

export const RecipeFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	materialId: zq.id.optional(),
	productId: zq.id.optional(),
	productVariantId: zq.id.optional(),
	isActive: zq.boolean,
})
export type RecipeFilterSchema = z.infer<typeof RecipeFilterSchema>

/* --------------------------------- RESULT --------------------------------- */

export const RecipeSelectSchema = RecipeDto
export type RecipeSelectSchema = z.infer<typeof RecipeSelectSchema>

/* -------------------------------- MUTATION -------------------------------- */

const RecipeItemMutationSchema = z.object({
	materialId: zp.id,
	qty: zp.decimal,
	scrapPercentage: zp.decimal.optional().default('0'),
	uomId: zp.id,
	notes: zc.strTrimNullable,
	sortOrder: zp.num.optional().default(0),
})

export const RecipeCreateSchema = z
	.object({
		materialId: zp.id.optional().nullable(),
		productId: zp.id.optional().nullable(),
		productVariantId: zp.id.optional().nullable(),
		targetQty: zp.decimal.optional().default('1'),
		isActive: zp.bool.default(true),
		instructions: zc.strTrimNullable,
		items: z.array(RecipeItemMutationSchema).min(1, 'At least one item is required'),
	})
	.refine(
		(data) => {
			const targets = [data.materialId, data.productId, data.productVariantId].filter(
				(t) => t !== null,
			)
			return targets.length === 1
		},
		{
			message: 'Recipe must have exactly one target (materialId, productId, or productVariantId)',
			path: ['materialId'],
		},
	)
export type RecipeCreateSchema = z.infer<typeof RecipeCreateSchema>

export const RecipeUpdateSchema = RecipeCreateSchema.extend({
	...zc.RecordId.shape,
})
export type RecipeUpdateSchema = z.infer<typeof RecipeUpdateSchema>

/* ---------------------------------- COST ---------------------------------- */

export const RecipeItemCostSchema = RecipeItemSchema.extend({
	unitCost: zp.decimal,
	extendedCost: zp.decimal,
})
export type RecipeItemCostSchema = z.infer<typeof RecipeItemCostSchema>

export const RecipeCostSchema = z.object({
	recipeId: zp.id,
	targetQty: zp.decimal,
	totalCost: zp.decimal,
	unitCost: zp.decimal,
	items: z.array(RecipeItemCostSchema),
})
export type RecipeCostSchema = z.infer<typeof RecipeCostSchema>
