import { z } from 'zod'

import {
  zCodeUpper,
  zMetadataDto,
  zPaginationDto,
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
 * Theoretical vs Physical classification.
 */
export const LocationClassificationDto = z.enum([
  /** Real-world physical address. */
  'physical',
  /** Logical grouping or shipping transit. */
  'virtual',
])
export type LocationClassificationDto = z.infer<typeof LocationClassificationDto>

/**
 * Common Location attributes.
 */
export const LocationBaseDto = z.object({
  code: zCodeUpper.min(2).max(20),
  name: zStr.min(2).max(100),
  type: LocationTypeDto,
  classification: LocationClassificationDto.default('physical'),
  address: zStrNullable,
  phone: zStrNullable,
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
