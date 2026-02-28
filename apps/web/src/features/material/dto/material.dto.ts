import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

const MaterialType = z.enum(['raw', 'semi'])

export const MaterialDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.idNum.nullable(),
  baseUomId: zPrimitive.idNum,
  conversions: z.array(
    z.object({
      uomId: zPrimitive.idNum,
      conversionFactor: zPrimitive.str,
    })
  ),
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

export const MaterialMutationDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.idNum.nullable(),
  baseUomId: zPrimitive.idNum,
  conversions: z.array(
    z.object({
      uomId: zPrimitive.idNum,
      conversionFactor: zPrimitive.str,
    })
  ),
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
