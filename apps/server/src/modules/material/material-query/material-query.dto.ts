import { z } from 'zod'

import { zq } from '@/core/validation'

import { LocationDto } from '@/modules/location'

import { MaterialCategoryDto } from '../material-category/material-category.dto'
import { MaterialConversionDetailDto } from '../material-conversion/material-conversion.dto'
import { MaterialDto, MaterialType } from '../material-master/material.dto'

export const MaterialDetailDto = z.object({
	...MaterialDto.shape,
	category: MaterialCategoryDto.nullable(),
	conversions: z.array(MaterialConversionDetailDto),
	locations: z.array(LocationDto),
})

export type MaterialDetailDto = z.infer<typeof MaterialDetailDto>

/* --------------------------------- Filter --------------------------------- */

export const MaterialListFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialType.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialListFilterDto = z.infer<typeof MaterialListFilterDto>
