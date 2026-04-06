import { z } from 'zod'

import {
  zDecimal,
  zId,
  zMetadataDto,
  zPaginationDto,
  zRecordIdDto,
  zStr,
  zStrNullable,
} from '@/lib/zod'

export const PurchaseOrderStatusDto = z.enum(['open', 'closed', 'void'])
export type PurchaseOrderStatusDto = z.infer<typeof PurchaseOrderStatusDto>

export const PurchaseOrderItemBaseDto = z.object({
  materialId: zId.nullable().optional(),
  itemName: zStr,
  quantity: zDecimal,
  unitPrice: zDecimal,
  discountAmount: zDecimal,
  taxAmount: zDecimal,
  subtotal: zDecimal,
})
export type PurchaseOrderItemBaseDto = z.infer<typeof PurchaseOrderItemBaseDto>

export const PurchaseOrderBaseDto = z.object({
  locationId: zId,
  supplierId: zId,
  status: PurchaseOrderStatusDto.default('open'),
  transactionDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().nullable().optional(),
  totalAmount: zDecimal,
  discountAmount: zDecimal,
  taxAmount: zDecimal,
  notes: zStrNullable.optional(),
})
export type PurchaseOrderBaseDto = z.infer<typeof PurchaseOrderBaseDto>

export const PurchaseOrderItemDto = z.object({
  ...zRecordIdDto.shape,
  orderId: zId,
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
  q: z.string().optional(),
  status: PurchaseOrderStatusDto.optional(),
  locationId: zId.optional(),
  supplierId: zId.optional(),
})
export type PurchaseOrderFilterDto = z.infer<typeof PurchaseOrderFilterDto>
