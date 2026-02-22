import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { ItemType } from './item-common.dto'

/* --------------------------------- ENTITY --------------------------------- */

export const ItemDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  type: ItemType,
  baseUnit: zPrimitive.str,
  categoryId: zPrimitive.idNum,
  ...zSchema.meta.shape,
})

export type ItemDto = z.infer<typeof ItemDto>

/* --------------------------------- FILTER --------------------------------- */

export const ItemFilterDto = z.object({
  search: zHttp.query.search,
  type: ItemType.optional(),
  categoryId: zHttp.query.num.optional(),
})

export type ItemFilterDto = z.infer<typeof ItemFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const ItemCreateDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  type: ItemType,
  baseUnit: zPrimitive.str,
  categoryId: zPrimitive.idNum,
})

export type ItemCreateDto = z.infer<typeof ItemCreateDto>

export const ItemUpdateDto = z.object({
  id: zPrimitive.idNum,
  ...ItemCreateDto.shape,
})

export type ItemUpdateDto = z.infer<typeof ItemUpdateDto>
