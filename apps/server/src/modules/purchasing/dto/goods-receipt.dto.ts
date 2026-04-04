import { z } from 'zod'

import { zMetadataDto, zPaginationDto, zRecordIdDto, zStr, zStrNullable } from '@/core/validation'

export const goodsReceiptStatusEnum = z.enum(['open', 'completed', 'void'])

export const GoodsReceiptNoteItemBaseDto = z.object({
  purchaseOrderItemId: z.number(),
  materialId: z.number().nullable().optional(),
  itemName: zStr.min(1).max(255),
  quantityReceived: z.string().or(z.number()),
  notes: zStrNullable.optional(),
})
export type GoodsReceiptNoteItemBaseDto = z.infer<typeof GoodsReceiptNoteItemBaseDto>

export const GoodsReceiptNoteBaseDto = z.object({
  orderId: z.number(),
  locationId: z.number(),
  supplierId: z.number(),
  receiveDate: z.coerce.date(),
  status: goodsReceiptStatusEnum.default('open'),
  referenceNumber: zStrNullable.optional(),
  notes: zStrNullable.optional(),
})
export type GoodsReceiptNoteBaseDto = z.infer<typeof GoodsReceiptNoteBaseDto>

export const GoodsReceiptNoteItemDto = z.object({
  ...zRecordIdDto.shape,
  grnId: z.number(),
  ...GoodsReceiptNoteItemBaseDto.shape,
  ...zMetadataDto.shape,
})
export type GoodsReceiptNoteItemDto = z.infer<typeof GoodsReceiptNoteItemDto>

export const GoodsReceiptNoteDto = z.object({
  ...zRecordIdDto.shape,
  ...GoodsReceiptNoteBaseDto.shape,
  items: z.array(GoodsReceiptNoteItemDto),
  ...zMetadataDto.shape,
})
export type GoodsReceiptNoteDto = z.infer<typeof GoodsReceiptNoteDto>

export const GoodsReceiptNoteCreateItemDto = z.object({ ...GoodsReceiptNoteItemBaseDto.shape })
export type GoodsReceiptNoteCreateItemDto = z.infer<typeof GoodsReceiptNoteCreateItemDto>

export const GoodsReceiptNoteCreateDto = z.object({
  ...GoodsReceiptNoteBaseDto.shape,
  items: z.array(GoodsReceiptNoteCreateItemDto).min(1),
})
export type GoodsReceiptNoteCreateDto = z.infer<typeof GoodsReceiptNoteCreateDto>

export const GoodsReceiptNoteFilterDto = z.object({
  ...zPaginationDto.shape,
  q: z.string().optional(),
  status: goodsReceiptStatusEnum.optional(),
  orderId: z.coerce.number().optional(),
  locationId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
})
export type GoodsReceiptNoteFilterDto = z.infer<typeof GoodsReceiptNoteFilterDto>
