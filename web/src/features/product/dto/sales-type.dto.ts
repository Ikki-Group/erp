import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const SalesTypeDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.str,
  name: zPrimitive.str,
  ...zSchema.meta.shape,
})

export type SalesTypeDto = z.infer<typeof SalesTypeDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterDto = z.object({
  search: zHttp.search,
})

export type SalesTypeFilterDto = z.infer<typeof SalesTypeFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationDto = z.object({
  ...SalesTypeDto.pick({
    code: true,
    name: true,
  }).shape,
})

export type SalesTypeMutationDto = z.infer<typeof SalesTypeMutationDto>
