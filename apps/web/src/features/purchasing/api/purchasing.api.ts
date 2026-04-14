import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
	zRecordIdDto,
} from '@/lib/zod'

import {
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
} from '../dto/goods-receipt.dto'
import {
	PurchaseOrderCreateDto,
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderUpdateDto,
} from '../dto/purchase-order.dto'

import { z } from 'zod'

export const purchaseOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.list,
		params: z.object({ ...PurchaseOrderFilterDto.shape, ...zPaginationDto.shape }),
		result: createPaginatedResponseSchema(PurchaseOrderDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(PurchaseOrderDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.order.create,
		body: PurchaseOrderCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.purchasing.order.update,
		body: PurchaseOrderUpdateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.purchasing.order.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

export const goodsReceiptApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.purchasing.goodsReceipt.list,
		params: GoodsReceiptNoteFilterDto,
		result: createPaginatedResponseSchema(GoodsReceiptNoteDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.purchasing.goodsReceipt.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(GoodsReceiptNoteDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.create,
		body: GoodsReceiptNoteCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	complete: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.complete,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}
