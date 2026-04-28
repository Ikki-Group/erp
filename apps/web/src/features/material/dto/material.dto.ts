import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

import { LocationDto } from '@/features/location'
import { RecipeDto } from '@/features/recipe'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialTypeDto = z.enum(['raw', 'semi', 'packaging'])
export type MaterialTypeDto = z.infer<typeof MaterialTypeDto>

/* --------------------------------- NESTED --------------------------------- */

export const MaterialConversionDto = z.object({
	toBaseFactor: zp.decimal,
	uomId: zp.id,
	uom: UomDto.optional(),
})

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeDto,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,

	locationIds: zp.id.array(),
	conversions: MaterialConversionDto.array(),
	...zc.AuditFull.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
	q: zq.search,
	type: MaterialTypeDto.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const MaterialSelectDto = z.object({
	...MaterialDto.shape,
	category: MaterialCategoryDto.nullable(),
	uom: UomDto.nullable(),
	locations: LocationDto.array().optional(),
	recipe: RecipeDto.nullable().optional(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
	...MaterialDto.pick({
		name: true,
		description: true,
		sku: true,
		type: true,
		categoryId: true,
		baseUomId: true,
		conversions: true,
	}).shape,
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
