import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { MaterialCategoryDto } from './material-category.dto'

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialConversionDto = z.object({
  factor: zPrimitive.str,
  uom: zPrimitive.str,
})

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

export const MaterialDto = z.object({
  id: zPrimitive.objId,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.objId.nullable(),
  baseUom: zPrimitive.str,
  locationIds: zPrimitive.objId.array(),
  conversions: MaterialConversionDto.array(),
  ...zSchema.metadata.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zHttp.query.search,
  type: MaterialType.optional(),
  categoryId: zHttp.query.objId.optional(),
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- RESULT --------------------------------- */

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
