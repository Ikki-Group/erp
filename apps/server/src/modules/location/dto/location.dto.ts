import { z } from 'zod'

import { zCodeUpper, zMetadataDto, zPaginationDto, zRecordIdDto, zStr, zStrNullable } from '@/core/validation'

/**
 * Types of operational locations.
 */
export const LocationType = z.enum([
  /** Retail storefront for customers. */
  'store',
  /** Storage facility for inventory. */
  'warehouse',
])
export type LocationType = z.infer<typeof LocationType>

/**
 * Theoretical vs Physical classification.
 */
export const LocationClassification = z.enum([
  /** Real-world physical address. */
  'physical',
  /** Logical grouping or shipping transit. */
  'virtual',
])
export type LocationClassification = z.infer<typeof LocationClassification>

/**
 * Common Location attributes.
 */
export const LocationBase = z.object({
  code: zCodeUpper.min(2).max(20),
  name: zStr.min(2).max(100),
  type: LocationType,
  classification: LocationClassification.default('physical'),
  address: zStrNullable,
  phone: zStrNullable,
})
export type LocationBase = z.infer<typeof LocationBase>

/**
 * Location database record.
 */
export const Location = z.object({ ...zRecordIdDto.shape, ...LocationBase.shape, ...zMetadataDto.shape })
export type Location = z.infer<typeof Location>

/**
 * Input for creating a new Location.
 */
export const LocationCreate = LocationBase
export type LocationCreate = z.infer<typeof LocationCreate>

/**
 * Input for updating an existing Location.
 */
export const LocationUpdate = z.object({ ...zRecordIdDto.shape, ...LocationBase.shape })
export type LocationUpdate = z.infer<typeof LocationUpdate>

/**
 * Filter criteria for listing Locations.
 */
export const LocationFilter = z.object({
  ...zPaginationDto.shape,
  q: z.string().optional(),
  type: LocationType.optional(),
})
export type LocationFilter = z.infer<typeof LocationFilter>
