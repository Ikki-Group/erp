import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { MaterialUomUpsertDto } from './material-uom.dto'

const MaterialType = z.enum(['raw', 'semi'])

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.idNum.nullable(),
  baseUomId: zPrimitive.idNum,
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zHttp.query.search,
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const MaterialCreateDto = z.object({
  ...MaterialDto.pick({
    name: true,
    description: true,
    sku: true,
    type: true,
    categoryId: true,
    baseUomId: true,
  }).shape,
  conversions: MaterialUomUpsertDto.array().min(1),
})

export type MaterialCreateDto = z.infer<typeof MaterialCreateDto>

export const MaterialUpdateDto = z.object({
  id: zPrimitive.idNum,
  ...MaterialCreateDto.shape,
})

export type MaterialUpdateDto = z.infer<typeof MaterialUpdateDto>
