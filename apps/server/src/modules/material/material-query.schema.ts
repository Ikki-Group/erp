/**
 * Material Query Schemas — composite read-model schemas
 */

import { z, zq } from '@ikki/api-contract/validation'

import { LocationDto } from '@/modules/location'
import { MaterialCategoryEntity } from './domain/material-category.entity'
import { MaterialEntity, MaterialTypeSchema } from './domain/material.entity'
import { MaterialConversionEntity } from './domain/material-conversion.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialQueryDetailSchema = z.object({
	...MaterialEntity.shape,
	category: MaterialCategoryEntity.nullable(),
	conversions: z.array(MaterialConversionEntity),
	locations: z.array(LocationDto),
})
export type MaterialQueryDetailSchema = z.infer<typeof MaterialQueryDetailSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialQueryFilterSchema = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialTypeSchema.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialQueryFilterSchema = z.infer<typeof MaterialQueryFilterSchema>
