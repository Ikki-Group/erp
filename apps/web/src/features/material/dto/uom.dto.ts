import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const UomDto = z.object({
  code: zPrimitive.str,
  ...zSchema.meta.shape,
})

export type UomDto = z.infer<typeof UomDto>

export const UomMutationDto = z.object({
  code: zPrimitive.str,
})
