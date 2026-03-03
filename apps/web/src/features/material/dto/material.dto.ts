import z from 'zod'
import { MaterialCategoryDto } from './material-category.dto'
import { zPrimitive, zSchema } from '@/lib/zod'

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

const MaterialConversionDto = z.object({
  uom: zPrimitive.str,
  factor: zPrimitive.str,
})

export const MaterialDto = z.object({
  id: zPrimitive.str,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.str.nullable(),
  baseUom: zPrimitive.str,
  conversions: z.array(MaterialConversionDto),
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

export const MaterialMutationDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.str.nullable(),
  baseUom: zPrimitive.str,
  conversions: z.array(MaterialConversionDto),
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
