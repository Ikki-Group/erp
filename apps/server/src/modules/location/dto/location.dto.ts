import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zCodeUpper, zQuerySearch, zQueryBoolean, zMetadataSchema } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

const LocationType = z.enum(['store', 'warehouse'])
type LocationType = z.infer<typeof LocationType>

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zId,
  code: zCodeUpper,
  name: zStr,
  type: LocationType,
  description: zStrNullable,
  isActive: zBool,
  ...zMetadataSchema.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zQuerySearch,
  type: LocationType.optional(),
  isActive: zQueryBoolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({ code: true, name: true, type: true, description: true, isActive: true }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
