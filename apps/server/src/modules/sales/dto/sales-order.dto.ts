import z from 'zod'

import { zStrNullable, zStr, zNum, zId, zDate, zDecimal, zQuerySearch, zMetadataDto } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const SalesOrderStatus = z.enum(['open', 'closed', 'void'])
export type SalesOrderStatus = z.infer<typeof SalesOrderStatus>

/* --------------------------------- NESTED --------------------------------- */

export const SalesOrderBatchDto = z.object({
  id: zId,
  orderId: zId,
  batchNumber: zNum,
  status: zStr,
  ...zMetadataDto.shape,
})
export type SalesOrderBatchDto = z.infer<typeof SalesOrderBatchDto>

export const SalesOrderItemDto = z.object({
  id: zId,
  orderId: zId,
  batchId: zId.nullable(),
  productId: zId.nullable(),
  variantId: zId.nullable(),
  itemName: zStr,
  quantity: zDecimal,
  unitPrice: zDecimal,
  discountAmount: zDecimal,
  taxAmount: zDecimal,
  subtotal: zDecimal,
  ...zMetadataDto.shape,
})
export type SalesOrderItemDto = z.infer<typeof SalesOrderItemDto>

export const SalesVoidDto = z.object({
  id: zId,
  orderId: zId,
  itemId: zId.nullable(),
  reason: zStrNullable,
  voidedBy: zId,
  ...zMetadataDto.shape,
})
export type SalesVoidDto = z.infer<typeof SalesVoidDto>

export const SalesExternalRefDto = z.object({
  id: zId,
  orderId: zId,
  externalSource: zStr,
  externalOrderId: zStr,
  rawPayload: z.any().nullable(),
  ...zMetadataDto.shape,
})
export type SalesExternalRefDto = z.infer<typeof SalesExternalRefDto>

/* --------------------------------- ENTITY --------------------------------- */

export const SalesOrderDto = z.object({
  id: zId,
  locationId: zId,
  customerId: zId.nullable(),
  salesTypeId: zId,
  status: SalesOrderStatus,
  transactionDate: zDate,
  totalAmount: zDecimal,
  discountAmount: zDecimal,
  taxAmount: zDecimal,
  ...zMetadataDto.shape,
})

export type SalesOrderDto = z.infer<typeof SalesOrderDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesOrderFilterDto = z.object({
  search: zQuerySearch,
  locationId: zId.optional(),
  status: SalesOrderStatus.optional(),
  salesTypeId: zId.optional(),
  startDate: zDate.optional(),
  endDate: zDate.optional(),
})

export type SalesOrderFilterDto = z.infer<typeof SalesOrderFilterDto>

/* ---------------------------------- OUTPUT -------------------------------- */

export const SalesOrderOutputDto = z.object({
  ...SalesOrderDto.shape,
  batches: SalesOrderBatchDto.array().optional(),
  items: SalesOrderItemDto.array().optional(),
  voids: SalesVoidDto.array().optional(),
  externalRefs: SalesExternalRefDto.array().optional(),
})

export type SalesOrderOutputDto = z.infer<typeof SalesOrderOutputDto>

/* --------------------------------- CREATE --------------------------------- */

export const SalesOrderCreateDto = z.object({
  ...SalesOrderDto.pick({
    locationId: true,
    customerId: true,
    salesTypeId: true,
    status: true,
    transactionDate: true,
    totalAmount: true,
    discountAmount: true,
    taxAmount: true,
  }).shape,
  items: z
    .array(
      z.object({
        ...SalesOrderItemDto.pick({
          batchId: true,
          productId: true,
          variantId: true,
          itemName: true,
          quantity: true,
          unitPrice: true,
          discountAmount: true,
          taxAmount: true,
          subtotal: true,
        }).partial({ batchId: true, productId: true, variantId: true }).shape,
      }),
    )
    .optional(),
})

export type SalesOrderCreateDto = z.infer<typeof SalesOrderCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const SalesOrderUpdateDto = z.object({
  ...SalesOrderCreateDto.partial().shape,
})

export type SalesOrderUpdateDto = z.infer<typeof SalesOrderUpdateDto>

/* --------------------------------- ACTIONS -------------------------------- */

export const SalesOrderAddBatchDto = z.object({
  batchNumber: zNum,
  items: z.array(
    z.object({
      ...SalesOrderItemDto.pick({
        productId: true,
        variantId: true,
        itemName: true,
        quantity: true,
        unitPrice: true,
        discountAmount: true,
        taxAmount: true,
        subtotal: true,
      }).partial({ productId: true, variantId: true }).shape,
    }),
  ),
})
export type SalesOrderAddBatchDto = z.infer<typeof SalesOrderAddBatchDto>

export const SalesOrderVoidDto = z.object({ itemId: zId.optional(), reason: zStr })
export type SalesOrderVoidDto = z.infer<typeof SalesOrderVoidDto>
