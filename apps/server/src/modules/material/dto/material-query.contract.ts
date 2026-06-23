/**
 * Material Query DTOs — composite read-model schemas
 */

import { z } from 'zod'

import { zq } from '@/shared/schema'
import { LocationDto } from '@/modules/location'
import { MaterialCategoryEntity } from '../domain/material-category.entity'
import { MaterialEntity, MaterialTypeSchema } from '../domain/material.entity'
import { MaterialConversionEntity } from '../domain/material-conversion.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialQueryDetailDto = z.object({
	...MaterialEntity.shape,
	category: MaterialCategoryEntity.nullable(),
	conversions: z.array(MaterialConversionEntity),
	locations: z.array(LocationDto),
})
export type MaterialQueryDetailDto = z.infer<typeof MaterialQueryDetailDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialQueryFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialTypeSchema.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialQueryFilterDto = z.infer<typeof MaterialQueryFilterDto>
