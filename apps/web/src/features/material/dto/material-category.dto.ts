import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const MaterialCategoryDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  ...zSchema.meta.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

export const MaterialCategoryMutationDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
})

export type MaterialCategoryMutationDto = z.infer<
  typeof MaterialCategoryMutationDto
>
