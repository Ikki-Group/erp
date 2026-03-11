import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SalesTypeDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({
  search: zHttp.query.search,
})

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({
  ...SalesTypeDto.pick({
    code: true,
    name: true,
    isSystem: true,
  }).shape,
})

export type SalesTypeMutationDto = z.infer<typeof SalesTypeMutationDto>
