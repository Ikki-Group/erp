import {
	zDecimal,
	zId,
	zMetadataDto,
	zQueryId,
	zQueryIds,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/zod'

import { LocationDto } from '@/features/location'
import { RecipeDto } from '@/features/recipe'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

import z from 'zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialTypeDto = z.enum(['raw', 'semi', 'packaging'])
export type MaterialTypeDto = z.infer<typeof MaterialTypeDto>

/* --------------------------------- NESTED --------------------------------- */

export const MaterialConversionDto = z.object({
	toBaseFactor: zDecimal,
	uomId: zId,
	uom: UomDto.optional(),
})

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
	...zRecordIdDto.shape,
	name: zStr,
	description: zStrNullable,
	sku: zStr,
	type: MaterialTypeDto,
	categoryId: zId.nullable(),
	baseUomId: zId,

	locationIds: zId.array(),
	conversions: MaterialConversionDto.array(),
	...zMetadataDto.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
	q: zQuerySearch,
	type: MaterialTypeDto.optional(),
	categoryId: zQueryId.optional(),
	locationIds: zQueryIds.optional(),
	excludeLocationIds: zQueryIds.optional(),
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
