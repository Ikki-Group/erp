import {
	zCodeUpper,
	zMetadataDto,
	zPaginationDto,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/zod'

import { z } from 'zod'

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
	code: zCodeUpper.min(2).max(20),
	name: zStr.min(2).max(100),
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
	q: z.string().optional(),
	type: LocationTypeDto.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
