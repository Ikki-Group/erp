import { z } from 'zod'

import { zMetadataDto, zPaginationDto, zQueryId, zQuerySearch, zRecordIdDto, zStr, zStrNullable } from '@/lib/zod'

export const GoodsReceiptStatusEnum = z.enum(['open', 'completed', 'void'])
export type GoodsReceiptStatusEnum = z.infer<typeof GoodsReceiptStatusEnum>

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
  status: GoodsReceiptStatusEnum.default('open'),
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
  q: zQuerySearch,
  status: GoodsReceiptStatusEnum.optional(),
  orderId: zQueryId.optional(),
  locationId: zQueryId.optional(),
  supplierId: zQueryId.optional(),
})
export type GoodsReceiptNoteFilterDto = z.infer<typeof GoodsReceiptNoteFilterDto>
