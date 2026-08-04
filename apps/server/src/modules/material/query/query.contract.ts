/**
 * Material Query — composite read-model schemas
 */

import { z } from 'zod'

import { zq } from '@/shared/schema'

import { LocationSchema } from '@/modules/location'

import { MaterialCategoryEntity } from '../category/category.contract'
import { MaterialConversionEntity } from '../conversion/conversion.contract'
import { MaterialEntity, MaterialTypeDto } from '../material.contract'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialQueryDetailDto = z.object({
	...MaterialEntity.shape,
	category: MaterialCategoryEntity.nullable(),
	conversions: z.array(MaterialConversionEntity),
	locations: z.array(LocationSchema),
})
export type MaterialQueryDetailDto = z.infer<typeof MaterialQueryDetailDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialQueryFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialTypeDto.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialQueryFilterDto = z.infer<typeof MaterialQueryFilterDto>
