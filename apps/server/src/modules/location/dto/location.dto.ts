import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zCodeUpper, zQuerySearch, zQueryBoolean, zMetadataDto } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const LocationType = z.enum(['store', 'warehouse'])
export type LocationType = z.infer<typeof LocationType>

export const LocationClassification = z.enum(['physical', 'virtual'])
export type LocationClassification = z.infer<typeof LocationClassification>

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zId,
  code: zCodeUpper,
  name: zStr,
  type: LocationType,
  classification: LocationClassification,
  description: zStrNullable,
  isActive: zBool,
  ...zMetadataDto.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zQuerySearch,
  type: LocationType.optional(),
  classification: LocationClassification.optional(),
  isActive: zQueryBoolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    classification: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
