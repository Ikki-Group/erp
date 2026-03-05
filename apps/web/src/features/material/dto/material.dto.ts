import z from 'zod'
import { MaterialCategoryDto } from './material-category.dto'
import { zPrimitive, zSchema } from '@/lib/zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- ENTITY --------------------------------- */

const MaterialConversionDto = z.object({
  uom: zPrimitive.str,
  factor: zPrimitive.str,
})

export const MaterialDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.id.nullable(),
  baseUom: zPrimitive.str,
  locationIds: zPrimitive.id.array(),
  conversions: z.array(MaterialConversionDto),
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- SELECT --------------------------------- */

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
  ...MaterialDto.pick({
    name: true,
    description: true,
    sku: true,
    type: true,
    categoryId: true,
    baseUom: true,
    conversions: true,
  }).shape,
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
