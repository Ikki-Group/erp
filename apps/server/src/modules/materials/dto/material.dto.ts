import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

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

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zPrimitive.str,
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const MaterialCreateDto = z.object({
  ...MaterialDto.pick({
    name: true,
    description: true,
    sku: true,
    categoryId: true,
    baseUomId: true,
    isActive: true,
  }).shape,
})

export type MaterialCreateDto = z.infer<typeof MaterialCreateDto>

export const MaterialUpdateDto = z.object({
  id: zPrimitive.idNum,
  ...MaterialCreateDto.shape,
})

export type MaterialUpdateDto = z.infer<typeof MaterialUpdateDto>
