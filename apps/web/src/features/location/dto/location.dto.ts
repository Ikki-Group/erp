import { z } from 'zod'

import {
	zMetadataDto,
	zPaginationDto,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/zod'

/**
 * Types of operational locations.
 */
export const LocationTypeDto = z.enum([
	/** Retail storefront for customers. */
	'store',
	/** Storage facility for inventory. */
	'warehouse',
])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>

/**
 * Common Location attributes.
 */
export const LocationBaseDto = z.object({
	code: zStr,
	name: zStr,
	type: LocationTypeDto,
	description: zStrNullable,
	address: zStrNullable,
	phone: zStrNullable,
	isActive: z.boolean().default(true),
})
export type LocationBaseDto = z.infer<typeof LocationBaseDto>

/**
 * Location database record.
 */
export const LocationDto = z.object({
	...zRecordIdDto.shape,
	...LocationBaseDto.shape,
	...zMetadataDto.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

/**
 * Input for creating a new Location.
 */
export const LocationCreateDto = LocationBaseDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

/**
 * Input for updating an existing Location.
 */
export const LocationUpdateDto = z.object({ ...zRecordIdDto.shape, ...LocationBaseDto.shape })
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

/**
 * Filter criteria for listing Locations.
 */
export const LocationFilterDto = z.object({
	...zPaginationDto.shape,
	q: zQuerySearch,
	type: LocationTypeDto.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
