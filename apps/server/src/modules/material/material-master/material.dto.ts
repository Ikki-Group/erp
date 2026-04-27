import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { LocationDto } from '@/modules/location'
import { RecipeDto } from '@/modules/recipe'

import { MaterialCategoryDto } from '../material-category/material-category.dto'
export { MaterialCategoryDto }
import { UomDto } from '../uom/uom.dto'
export { UomDto }

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi', 'packaging'])
export type MaterialType = z.infer<typeof MaterialType>

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
	type: MaterialType,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	locationIds: z.array(zp.id),
	conversions: z.array(MaterialConversionDto),
	...zc.AuditBasic.shape,
})
export type MaterialDto = z.infer<typeof MaterialDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.uppercase().min(3).max(50),
	type: MaterialType,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	locationIds: z.array(zp.id).default([]),
	conversions: z
		.array(
			z.object({
				toBaseFactor: zp.decimal,
				uomId: zp.id,
			}),
		)
		.default([]),
})
export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialType.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const MaterialSelectDto = zc.withAuditResolved({
	...MaterialDto.shape,
	category: MaterialCategoryDto.nullable(),
	uom: UomDto.nullable(),
	locations: z.array(LocationDto).optional(),
	recipe: RecipeDto.nullable().optional(),
})
export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>
