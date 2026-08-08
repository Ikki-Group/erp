import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const ProductionOrderStatusEnum = z.enum(['draft', 'completed', 'cancelled'])
export type ProductionOrderStatusEnum = z.infer<typeof ProductionOrderStatusEnum>

// ─── Response: Recipe ───

export const ProductionRecipeDto = z.object({
	id: zp.id,
	materialId: zp.id,
	name: zp.str,
	yieldQty: zp.str,
	yieldUomId: zp.id,
	isActive: zp.num,
	...zc.AuditBasic.shape,
})
export type ProductionRecipeDto = z.infer<typeof ProductionRecipeDto>

// ─── Response: Recipe Line ───

export const ProductionRecipeLineDto = z.object({
	id: zp.id,
	recipeId: zp.id,
	materialId: zp.id,
	quantity: zp.str,
	uomId: zp.id,
})
export type ProductionRecipeLineDto = z.infer<typeof ProductionRecipeLineDto>

// ─── Response: Recipe Detail (with lines) ───

export const ProductionRecipeDetailDto = z.object({
	...ProductionRecipeDto.shape,
	lines: z.array(ProductionRecipeLineDto),
})
export type ProductionRecipeDetailDto = z.infer<typeof ProductionRecipeDetailDto>

// ─── Response: Production Order ───

export const ProductionOrderDto = z.object({
	id: zp.id,
	productionNo: zp.str,
	locationId: zp.id,
	materialId: zp.id,
	recipeId: zp.id,
	status: ProductionOrderStatusEnum,
	plannedQty: zp.str,
	actualQty: zp.str.nullable(),
	notes: zp.str.nullable(),
	producedBy: zp.num.nullable(),
	completedAt: z.coerce.date().nullable(),
	...zc.AuditBasic.shape,
})
export type ProductionOrderDto = z.infer<typeof ProductionOrderDto>

// ─── Response: Production Order Detail ───

export const ProductionOrderDetailDto = z.object({
	...ProductionOrderDto.shape,
	recipe: ProductionRecipeDetailDto,
})
export type ProductionOrderDetailDto = z.infer<typeof ProductionOrderDetailDto>

// ─── Input: Recipe Line ───

const RecipeLineInputDto = z.object({
	materialId: z.number().int().positive(),
	qty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	uomId: z.number().int().positive(),
})

// ─── Input: Recipe Create ───

export const ProductionRecipeCreateDto = z.object({
	outputMaterialId: z.number().int().positive(),
	name: zc.strTrim.min(2).max(255),
	yieldQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	yieldUomId: z.number().int().positive(),
	lines: z.array(RecipeLineInputDto).min(1),
})
export type ProductionRecipeCreateDto = z.infer<typeof ProductionRecipeCreateDto>

// ─── Input: Recipe Update ───

export const ProductionRecipeUpdateDto = z.object({
	recipeId: z.number().int().positive(),
	name: zc.strTrim.min(2).max(255).optional(),
	yieldQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number').optional(),
	yieldUomId: z.number().int().positive().optional(),
	lines: z.array(RecipeLineInputDto).min(1).optional(),
})
export type ProductionRecipeUpdateDto = z.infer<typeof ProductionRecipeUpdateDto>

// ─── Input: Order Create ───

export const ProductionOrderCreateDto = z.object({
	recipeId: z.number().int().positive(),
	locationId: z.number().int().positive(),
	multiplier: z.number().positive(),
	notes: zc.strTrimNullable.optional(),
})
export type ProductionOrderCreateDto = z.infer<typeof ProductionOrderCreateDto>

// ─── Input: Order Confirm ───

export const ProductionOrderConfirmDto = z.object({
	orderId: z.number().int().positive(),
})
export type ProductionOrderConfirmDto = z.infer<typeof ProductionOrderConfirmDto>

// ─── Filter: Recipe List ───

export const ProductionRecipeFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	materialId: z.coerce.number().int().positive().optional(),
})
export type ProductionRecipeFilterDto = z.infer<typeof ProductionRecipeFilterDto>

// ─── Filter: Order List ───

export const ProductionOrderFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	status: ProductionOrderStatusEnum.optional(),
	materialId: z.coerce.number().int().positive().optional(),
})
export type ProductionOrderFilterDto = z.infer<typeof ProductionOrderFilterDto>

// ─── Query: Detail ───

export const ProductionDetailQueryDto = z.object({
	id: z.coerce.number().int().positive(),
})
export type ProductionDetailQueryDto = z.infer<typeof ProductionDetailQueryDto>
