import z from 'zod'

import { zStr, zBool, zId, zQuerySearch, zQueryBoolean, zMetadataDto } from '@/lib/zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const LocationType = z.enum(['store', 'warehouse'])
export type LocationType = z.infer<typeof LocationType>

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zId,
  code: zStr,
  name: zStr,
  type: LocationType,
  description: zStr.nullable(),
  isActive: zBool,
  ...zMetadataDto.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zQuerySearch,
  type: LocationType.optional(),
  isActive: zQueryBoolean.optional(),
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({ code: true, name: true, type: true, description: true, isActive: true }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
