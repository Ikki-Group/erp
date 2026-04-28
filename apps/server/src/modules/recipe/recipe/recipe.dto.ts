import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemDto = z.object({
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

export type RecipeItemDto = z.infer<typeof RecipeItemDto>

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
	items: z.array(RecipeItemDto).optional(),
	...zc.AuditBasic.shape,
})

export type RecipeDto = z.infer<typeof RecipeDto>

/* --------------------------------- FILTER --------------------------------- */

export const RecipeFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	materialId: zq.id.optional(),
	productId: zq.id.optional(),
	productVariantId: zq.id.optional(),
	isActive: zq.boolean,
})

export type RecipeFilterDto = z.infer<typeof RecipeFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const RecipeSelectDto = RecipeDto
export type RecipeSelectDto = z.infer<typeof RecipeSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

const RecipeItemMutationDto = z.object({
	materialId: zp.id,
	qty: zp.decimal,
	scrapPercentage: zp.decimal.optional().default('0'),
	uomId: zp.id,
	notes: zc.strTrimNullable,
	sortOrder: zp.num.optional().default(0),
})

export const RecipeCreateDto = z
	.object({
		materialId: zp.id.optional().nullable(),
		productId: zp.id.optional().nullable(),
		productVariantId: zp.id.optional().nullable(),
		targetQty: zp.decimal.optional().default('1'),
		isActive: zp.bool.default(true),
		instructions: zc.strTrimNullable,
		items: z.array(RecipeItemMutationDto).min(1, 'At least one item is required'),
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

export type RecipeCreateDto = z.infer<typeof RecipeCreateDto>

export const RecipeUpdateDto = RecipeCreateDto.extend({
	...zc.RecordId.shape,
})
export type RecipeUpdateDto = z.infer<typeof RecipeUpdateDto>

/* ---------------------------------- COST ---------------------------------- */

export const RecipeItemCostDto = RecipeItemDto.extend({
	unitCost: zp.decimal,
	extendedCost: zp.decimal,
})

export type RecipeItemCostDto = z.infer<typeof RecipeItemCostDto>

export const RecipeCostDto = z.object({
	recipeId: zp.id,
	targetQty: zp.decimal,
	totalCost: zp.decimal,
	unitCost: zp.decimal,
	items: z.array(RecipeItemCostDto),
})

export type RecipeCostDto = z.infer<typeof RecipeCostDto>
