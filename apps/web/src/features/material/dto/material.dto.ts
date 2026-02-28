import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const MaterialDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  categoryId: zPrimitive.idNum,
  baseUomId: zPrimitive.idNum,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

export const MaterialMutationDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  categoryId: zPrimitive.idNum,
  baseUomId: zPrimitive.idNum,
  isActive: zPrimitive.bool.default(true),
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
