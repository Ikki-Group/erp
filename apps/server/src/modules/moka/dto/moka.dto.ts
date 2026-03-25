import { z } from 'zod'

import { zPrimitive } from '@/core/validation'

import { MokaScrapType } from './moka-scrap-history.dto'

/* ---------------------------------- RAW ---------------------------------- */

export const MokaCategoryRawSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const MokaProductRawSchema = z.object({
  id: z.number(),
  name: z.string(),
  category_name: z.string().nullable().optional(),
  item_variants: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      sku: z.string().nullable().optional(),
    })
  ),
})

export const MokaSalesItemRawSchema = z.object({
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

export const MokaSalesDetailRawSchema = z
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
    items: z.array(MokaSalesItemRawSchema).optional(),
    order_items: z.record(z.string(), z.array(MokaSalesItemRawSchema)).optional(),
  })
  .passthrough() // Use passthrough to allow other fields from the raw API

/* ---------------------------------- DTO ---------------------------------- */

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
