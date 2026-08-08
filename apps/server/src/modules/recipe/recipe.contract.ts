import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Response ───

export const RecipeDto = z.object({
	id: zp.id,
	menuItemId: zp.id,
	name: zp.str,
	yieldQty: zp.str,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type RecipeDto = z.infer<typeof RecipeDto>

export const RecipeLineDto = z.object({
	id: zp.id,
	recipeId: zp.id,
	materialId: zp.id,
	quantity: zp.str,
	uomId: zp.id,
})
export type RecipeLineDto = z.infer<typeof RecipeLineDto>

export const RecipeLineEnrichedDto = z.object({
	...RecipeLineDto.shape,
	materialName: zp.str,
	uomCode: zp.str,
})
export type RecipeLineEnrichedDto = z.infer<typeof RecipeLineEnrichedDto>

export const RecipeDetailDto = z.object({
	...RecipeDto.shape,
	lines: z.array(RecipeLineEnrichedDto),
})
export type RecipeDetailDto = z.infer<typeof RecipeDetailDto>

// ─── Filter ───

export const RecipeFilterDto = z.object({
	...zq.pagination.shape,
	menuItemId: z.coerce.number().int().positive().optional(),
})
export type RecipeFilterDto = z.infer<typeof RecipeFilterDto>

// ─── Mutation ───

const RecipeLineMutationDto = z.object({
	materialId: zp.id,
	quantity: z.string().trim().regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	uomId: zp.id,
})

export const RecipeCreateDto = z.object({
	menuItemId: zp.id,
	name: zc.strTrim.min(2).max(255),
	yieldQty: z.string().trim().regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	lines: z.array(RecipeLineMutationDto).min(1, 'At least one recipe line is required'),
})
export type RecipeCreateDto = z.infer<typeof RecipeCreateDto>

export const RecipeUpdateDto = z.object({
	id: zp.id,
	name: zc.strTrim.min(2).max(255),
	yieldQty: z.string().trim().regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	lines: z.array(RecipeLineMutationDto).min(1, 'At least one recipe line is required'),
})
export type RecipeUpdateDto = z.infer<typeof RecipeUpdateDto>

// ─── HPP ───

export const HppBreakdownDto = z.object({
	materialId: zp.id,
	materialName: zp.str,
	quantity: zp.str,
	uomCode: zp.str,
	unitCost: zp.str,
	lineCost: zp.str,
})
export type HppBreakdownDto = z.infer<typeof HppBreakdownDto>

export const HppResponseDto = z.object({
	menuItemId: zp.id,
	locationId: zp.id,
	hpp: zp.str,
	breakdown: z.array(HppBreakdownDto),
})
export type HppResponseDto = z.infer<typeof HppResponseDto>
