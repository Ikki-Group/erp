import z from 'zod'

import {
	zDate,
	zDecimal,
	zId,
	zMetadataDto,
	zNum,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const SalesOrderStatusDto = z.enum(['open', 'closed', 'void'])
export type SalesOrderStatusDto = z.infer<typeof SalesOrderStatusDto>

/* --------------------------------- NESTED --------------------------------- */

export const SalesOrderBatchDto = z.object({
	...zRecordIdDto.shape,
	orderId: zId,
	batchNumber: zNum,
	status: zStr,
	...zMetadataDto.shape,
})
export type SalesOrderBatchDto = z.infer<typeof SalesOrderBatchDto>

export const SalesOrderItemDto = z.object({
	...zRecordIdDto.shape,
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
	...zRecordIdDto.shape,
	orderId: zId,
	itemId: zId.nullable(),
	reason: zStrNullable,
	voidedBy: zId,
	...zMetadataDto.shape,
})
export type SalesVoidDto = z.infer<typeof SalesVoidDto>

export const SalesExternalRefDto = z.object({
	...zRecordIdDto.shape,
	orderId: zId,
	externalSource: zStr,
	externalOrderId: zStr,
	rawPayload: z.any().nullable(),
	...zMetadataDto.shape,
})
export type SalesExternalRefDto = z.infer<typeof SalesExternalRefDto>

/* --------------------------------- ENTITY --------------------------------- */

export const SalesOrderDto = z.object({
	...zRecordIdDto.shape,
	locationId: zId,
	customerId: zId.nullable(),
	salesTypeId: zId,
	status: SalesOrderStatusDto,
	transactionDate: zDate,
	totalAmount: zDecimal,
	discountAmount: zDecimal,
	taxAmount: zDecimal,
	...zMetadataDto.shape,
})

export type SalesOrderDto = z.infer<typeof SalesOrderDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesOrderFilterDto = z.object({
	q: zQuerySearch,
	locationId: zId.optional(),
	status: SalesOrderStatusDto.optional(),
	salesTypeId: zId.optional(),
	startDate: zDate.optional(),
	endDate: zDate.optional(),
})

export type SalesOrderFilterDto = z.infer<typeof SalesOrderFilterDto>

/* ---------------------------------- OUTPUT -------------------------------- */

export const SalesOrderSelectDto = SalesOrderDto.extend({
	batches: SalesOrderBatchDto.array().optional(),
	items: SalesOrderItemDto.array().optional(),
	voids: SalesVoidDto.array().optional(),
	externalRefs: SalesExternalRefDto.array().optional(),
})

export type SalesOrderSelectDto = z.infer<typeof SalesOrderSelectDto>

/* --------------------------------- CREATE --------------------------------- */

export const SalesOrderCreateDto = SalesOrderDto.pick({
	locationId: true,
	customerId: true,
	salesTypeId: true,
	status: true,
	transactionDate: true,
	totalAmount: true,
	discountAmount: true,
	taxAmount: true,
}).extend({
	items: z
		.array(
			SalesOrderItemDto.pick({
				batchId: true,
				productId: true,
				variantId: true,
				itemName: true,
				quantity: true,
				unitPrice: true,
				discountAmount: true,
				taxAmount: true,
				subtotal: true,
			}).partial({ batchId: true, productId: true, variantId: true }),
		)
		.optional(),
})

export type SalesOrderCreateDto = z.infer<typeof SalesOrderCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const SalesOrderUpdateDto = SalesOrderCreateDto.partial().extend({ id: zId })

export type SalesOrderUpdateDto = z.infer<typeof SalesOrderUpdateDto>

/* --------------------------------- ACTIONS -------------------------------- */

export const SalesOrderAddBatchDto = z.object({
	batchNumber: zNum,
	items: z.array(
		SalesOrderItemDto.pick({
			productId: true,
			variantId: true,
			itemName: true,
			quantity: true,
			unitPrice: true,
			discountAmount: true,
			taxAmount: true,
			subtotal: true,
		}).partial({ productId: true, variantId: true }),
	),
})
export type SalesOrderAddBatchDto = z.infer<typeof SalesOrderAddBatchDto>

export const SalesOrderVoidDto = z.object({ itemId: zId.optional(), reason: zStr })
export type SalesOrderVoidDto = z.infer<typeof SalesOrderVoidDto>
