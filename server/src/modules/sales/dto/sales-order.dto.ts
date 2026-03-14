import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const SalesOrderStatusEnum = z.enum(['open', 'closed', 'void'])
export type SalesOrderStatusEnum = z.infer<typeof SalesOrderStatusEnum>

/* --------------------------------- NESTED --------------------------------- */

export const SalesOrderBatchDto = z.object({
  id: zPrimitive.id,
  orderId: zPrimitive.id,
  batchNumber: zPrimitive.num,
  status: zPrimitive.str,
  ...zSchema.metadata.shape,
})
export type SalesOrderBatchDto = z.infer<typeof SalesOrderBatchDto>

export const SalesOrderItemDto = z.object({
  id: zPrimitive.id,
  orderId: zPrimitive.id,
  batchId: zPrimitive.id.nullable(),
  productId: zPrimitive.id.nullable(),
  variantId: zPrimitive.id.nullable(),
  itemName: zPrimitive.str,
  quantity: zPrimitive.decimal,
  unitPrice: zPrimitive.decimal,
  discountAmount: zPrimitive.decimal,
  taxAmount: zPrimitive.decimal,
  subtotal: zPrimitive.decimal,
  ...zSchema.metadata.shape,
})
export type SalesOrderItemDto = z.infer<typeof SalesOrderItemDto>

export const SalesVoidDto = z.object({
  id: zPrimitive.id,
  orderId: zPrimitive.id,
  itemId: zPrimitive.id.nullable(),
  reason: zPrimitive.strNullable,
  voidedBy: zPrimitive.id,
  ...zSchema.metadata.shape,
})
export type SalesVoidDto = z.infer<typeof SalesVoidDto>

export const SalesExternalRefDto = z.object({
  id: zPrimitive.id,
  orderId: zPrimitive.id,
  externalSource: zPrimitive.str,
  externalOrderId: zPrimitive.str,
  rawPayload: z.any().nullable(),
  ...zSchema.metadata.shape,
})
export type SalesExternalRefDto = z.infer<typeof SalesExternalRefDto>

/* --------------------------------- ENTITY --------------------------------- */

export const SalesOrderDto = z.object({
  id: zPrimitive.id,
  locationId: zPrimitive.id,
  customerId: zPrimitive.id.nullable(),
  salesTypeId: zPrimitive.id,
  status: SalesOrderStatusEnum,
  transactionDate: zPrimitive.date,
  totalAmount: zPrimitive.decimal,
  discountAmount: zPrimitive.decimal,
  taxAmount: zPrimitive.decimal,
  ...zSchema.metadata.shape,
})

export type SalesOrderDto = z.infer<typeof SalesOrderDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesOrderFilterDto = z.object({
  search: zHttp.query.search,
  locationId: zPrimitive.id.optional(),
  status: SalesOrderStatusEnum.optional(),
  salesTypeId: zPrimitive.id.optional(),
  startDate: zPrimitive.date.optional(),
  endDate: zPrimitive.date.optional(),
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
  items: z.array(
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
      }).partial({
        batchId: true,
        productId: true,
        variantId: true,
      }).shape,
    })
  ).optional(),
})

export type SalesOrderCreateDto = z.infer<typeof SalesOrderCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const SalesOrderUpdateDto = SalesOrderCreateDto.partial()

export type SalesOrderUpdateDto = z.infer<typeof SalesOrderUpdateDto>

/* --------------------------------- ACTIONS -------------------------------- */

export const SalesOrderAddBatchDto = z.object({
  batchNumber: zPrimitive.num,
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
      }).partial({
        productId: true,
        variantId: true,
      }).shape,
    })
  ),
})
export type SalesOrderAddBatchDto = z.infer<typeof SalesOrderAddBatchDto>

export const SalesOrderVoidDto = z.object({
  itemId: zPrimitive.id.optional(),
  reason: zPrimitive.str,
})
export type SalesOrderVoidDto = z.infer<typeof SalesOrderVoidDto>
