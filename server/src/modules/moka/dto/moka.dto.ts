import { z } from 'zod'

import { zPrimitive } from '@/core/validation'

import { MokaScrapType } from './moka-scrap-history.dto'

export const MokaProductDetailDto = z.object({
  id: zPrimitive.id,
  name: z.string(),
  category_name: z.string().nullable(),
  item_variants: z.array(
    z.object({
      id: zPrimitive.id,
      name: z.string(),
      price: z.number(),
      sku: z.string().nullable(),
    })
  ),
})
export type MokaProductDetailDto = z.infer<typeof MokaProductDetailDto>

export const MokaTriggerInputDto = z.object({
  locationId: zPrimitive.id,
  type: MokaScrapType,
  dateFrom: zPrimitive.date.optional(),
  dateTo: zPrimitive.date.optional(),
})
export type MokaTriggerInputDto = z.infer<typeof MokaTriggerInputDto>

export interface MokaLoginResponse {
  access_token: string
}
