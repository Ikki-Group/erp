import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const LocationType = z.enum(['store', 'warehouse'])
export type LocationType = z.infer<typeof LocationType>

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zPrimitive.objId,
  code: zPrimitive.codeUpper,
  name: zPrimitive.str,
  type: LocationType,
  description: zPrimitive.str,
  isActive: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zHttp.query.search,
  type: LocationType.optional(),
  isActive: zHttp.query.boolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
