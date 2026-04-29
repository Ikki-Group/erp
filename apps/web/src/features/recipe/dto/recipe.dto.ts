import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

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
	material: z.object({ name: z.string(), sku: z.string() }).optional(),
	uom: z.object({ code: z.string() }).optional(),
	...zc.AuditFull.shape,
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
	items: RecipeItemDto.array().optional(),
	...zc.AuditFull.shape,
})

export type RecipeDto = z.infer<typeof RecipeDto>

/* --------------------------------- FILTER --------------------------------- */

export const RecipeFilterDto = z.object({
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

export const RecipeItemMutationDto = z.object({
	materialId: zp.id,
	qty: zp.decimal,
	scrapPercentage: zp.decimal.optional().default(0),
	uomId: zp.id,
	notes: zp.str.optional(),
	sortOrder: zp.num.optional().default(0),
})

export type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeMutationDto = z
	.object({
		materialId: zp.id.optional().nullable(),
		productId: zp.id.optional().nullable(),
		productVariantId: zp.id.optional().nullable(),
		targetQty: zp.decimal.optional().default(1),
		isActive: zp.bool.optional().default(true),
		instructions: zp.str.optional().nullable(),
		items: RecipeItemMutationDto.array(),
	})
	.refine(
		(data) => {
			// Ensure exactly one target is provided
			const targets = [data.materialId, data.productId, data.productVariantId].filter(
				(t) => t != null,
			)
			return targets.length === 1
		},
		{
			message: 'Recipe must have exactly one target (materialId, productId, or productVariantId)',
			path: ['materialId'],
		},
	)

export type RecipeMutationDto = z.infer<typeof RecipeMutationDto>
export const RecipeUpdateDto = z.object({ ...zc.RecordId.shape, ...RecipeMutationDto.shape })

export type RecipeUpdateDto = z.infer<typeof RecipeUpdateDto>

/* ---------------------------------- COST ---------------------------------- */

export const RecipeItemCostDto = RecipeItemDto.extend({ unitCost: zp.num, extendedCost: zp.num })

export type RecipeItemCostDto = z.infer<typeof RecipeItemCostDto>

export const RecipeCostDto = z.object({
	recipeId: zp.id,
	targetQty: zp.num,
	totalCost: zp.num,
	unitCost: zp.num,
	items: RecipeItemCostDto.array(),
})

export type RecipeCostDto = z.infer<typeof RecipeCostDto>
