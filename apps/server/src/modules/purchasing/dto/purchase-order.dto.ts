import { z } from 'zod'

import {
  zMetadataDto,
  zPaginationDto,
  zQueryId,
  zQuerySearch,
  zRecordIdDto,
  zStr,
  zStrNullable,
} from '@/core/validation'

export const purchaseOrderStatusEnum = z.enum(['open', 'closed', 'void'])

export const PurchaseOrderItemBaseDto = z.object({
  materialId: z.number().nullable().optional(),
  itemName: zStr.min(1).max(255),
  quantity: z.string().or(z.number()),
  unitPrice: z.string().or(z.number()),
  discountAmount: z.string().or(z.number()),
  taxAmount: z.string().or(z.number()),
  subtotal: z.string().or(z.number()),
})
export type PurchaseOrderItemBaseDto = z.infer<typeof PurchaseOrderItemBaseDto>

export const PurchaseOrderBaseDto = z.object({
  locationId: z.number(),
  supplierId: z.number(),
  status: purchaseOrderStatusEnum.default('open'),
  transactionDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().nullable().optional(),
  totalAmount: z.string().or(z.number()),
  discountAmount: z.string().or(z.number()),
  taxAmount: z.string().or(z.number()),
  notes: zStrNullable.optional(),
})
export type PurchaseOrderBaseDto = z.infer<typeof PurchaseOrderBaseDto>

export const PurchaseOrderItemDto = z.object({
  ...zRecordIdDto.shape,
  orderId: z.number(),
  ...PurchaseOrderItemBaseDto.shape,
  ...zMetadataDto.shape,
})
export type PurchaseOrderItemDto = z.infer<typeof PurchaseOrderItemDto>

export const PurchaseOrderDto = z.object({
  ...zRecordIdDto.shape,
  ...PurchaseOrderBaseDto.shape,
  items: z.array(PurchaseOrderItemDto),
  ...zMetadataDto.shape,
})
export type PurchaseOrderDto = z.infer<typeof PurchaseOrderDto>

export const PurchaseOrderCreateItemDto = z.object({
  ...PurchaseOrderItemBaseDto.shape,
  ...zRecordIdDto.partial().shape,
})
export type PurchaseOrderCreateItemDto = z.infer<typeof PurchaseOrderCreateItemDto>

export const PurchaseOrderCreateDto = z.object({
  ...PurchaseOrderBaseDto.shape,
  items: z.array(PurchaseOrderCreateItemDto).min(1),
})
export type PurchaseOrderCreateDto = z.infer<typeof PurchaseOrderCreateDto>

export const PurchaseOrderUpdateDto = z.object({
  ...zRecordIdDto.shape,
  ...PurchaseOrderBaseDto.partial().shape,
  items: z.array(PurchaseOrderCreateItemDto).optional(),
})
export type PurchaseOrderUpdateDto = z.infer<typeof PurchaseOrderUpdateDto>

export const PurchaseOrderFilterDto = z.object({
  ...zPaginationDto.shape,
  q: zQuerySearch,
  status: purchaseOrderStatusEnum.optional(),
  locationId: zQueryId.optional(),
  supplierId: zQueryId.optional(),
})
export type PurchaseOrderFilterDto = z.infer<typeof PurchaseOrderFilterDto>
