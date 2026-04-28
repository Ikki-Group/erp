import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, zq, createPaginatedResponseSchema, createSuccessResponseSchema,  } from '@/lib/validation'

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

export const purchaseOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.list,
		params: z.object({ ...PurchaseOrderFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(PurchaseOrderDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(PurchaseOrderDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.order.create,
		body: PurchaseOrderCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.purchasing.order.list],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.purchasing.order.update,
		body: PurchaseOrderUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.purchasing.order.list, endpoint.purchasing.order.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.purchasing.order.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.purchasing.order.list],
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
		params: zc.RecordId,
		result: createSuccessResponseSchema(GoodsReceiptNoteDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.create,
		body: GoodsReceiptNoteCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.purchasing.goodsReceipt.list, endpoint.inventory.summary.byLocation],
	}),
	complete: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.complete,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			endpoint.purchasing.goodsReceipt.list,
			endpoint.purchasing.goodsReceipt.detail,
			endpoint.inventory.summary.byLocation,
		],
	}),
}
