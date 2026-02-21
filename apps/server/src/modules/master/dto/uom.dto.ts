import z from 'zod'

import { zHttp, zSchema } from '@/lib/validation'

export const UomDto = z.object({
  code: z.string(),
  isActive: z.boolean(),
  ...zSchema.meta.shape,
})

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({
  search: zHttp.query.search,
  isActive: zHttp.query.boolean,
})

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationDto = UomDto.pick({
  code: true,
  isActive: true,
})

export type UomMutationDto = z.infer<typeof UomMutationDto>
