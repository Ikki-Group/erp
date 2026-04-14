import { z } from 'zod'

import { zDate } from '@/lib/zod'

import { MokaScrapType } from './moka-scrap-history.dto'

/* ---------------------------------- RAW ---------------------------------- */

export const MokaCategoryRawDto = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
export type MokaCategoryRawDto = z.infer<typeof MokaCategoryRawDto>

export const MokaProductRawDto = z.object({
  id: z.number(),
  name: z.string(),
  category_name: z.string().nullable().optional(),
  item_variants: z.array(
    z.object({ id: z.number(), name: z.string(), price: z.number(), sku: z.string().nullable().optional() }),
  ),
})
export type MokaProductRawDto = z.infer<typeof MokaProductRawDto>

export const MokaSalesItemRawDto = z.object({
  id: z.number(),
  uuid: z.string(),
  item_id: z.number(),
  item_name: z.string(),
  item_variant_name: z.string(),
  item_variant_sku: z.string().nullable().optional(),
  price: z.number(),
  quantity: z.number(),
  note: z.string().nullable().optional(),
})
export type MokaSalesItemRawDto = z.infer<typeof MokaSalesItemRawDto>

export const MokaSalesDetailRawDto = z
  .object({
    id: z.number(),
    uuid: z.string(),
    payment_no: z.string(),
    parent_order_uuid: z.string().optional(),
    parent_order_created_at: z.string().optional(),
    created_at: z.string(),
    total_collected_amount: z.number(),
    subtotal: z.number(),
    payment_type: z.string(),
    payment_type_label: z.string(),
    payment_note: z.string().optional(),
    tendered: z.number().optional(),
    change: z.number().optional(),
    include_gratuity_tax: z.boolean().optional(),
    enable_tax: z.boolean().optional(),
    enable_gratuity: z.boolean().optional(),
    items: z.array(MokaSalesItemRawDto).optional(),
    order_items: z.record(z.string(), z.array(MokaSalesItemRawDto)).optional(),
  })
  // Use loose to allow other fields from the raw API
  .loose()

export type MokaSalesDetailRawDto = z.infer<typeof MokaSalesDetailRawDto>

/* ---------------------------------- DTO ---------------------------------- */

export const MokaProductDetailDto = z.object({
  id: z.number(),
  name: z.string(),
  category_name: z.string().nullable(),
  item_variants: z.array(z.object({ id: z.number(), name: z.string(), price: z.number(), sku: z.string().nullable() })),
})
export type MokaProductDetailDto = z.infer<typeof MokaProductDetailDto>

export const MokaTriggerInputDto = z.object({
  locationId: z.number(),
  type: MokaScrapType,
  dateFrom: zDate.optional(),
  dateTo: zDate.optional(),
})
export type MokaTriggerInputDto = z.infer<typeof MokaTriggerInputDto>
