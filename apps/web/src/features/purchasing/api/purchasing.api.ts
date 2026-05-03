import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import {
	zc,
	zq,
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation'

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

const purchaseOrderKeys = createQueryKeys('purchasing', 'purchase-order')
const goodsReceiptKeys = createQueryKeys('purchasing', 'goods-receipt')
const inventorySummaryKeys = createQueryKeys('inventory', 'summary')

export const purchaseOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.list,
		params: z.object({ ...PurchaseOrderFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(PurchaseOrderDto),
		queryKey: purchaseOrderKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.purchasing.order.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(PurchaseOrderDto),
		queryKey: (params) => purchaseOrderKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.order.create,
		body: PurchaseOrderCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [purchaseOrderKeys.lists()],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.purchasing.order.update,
		body: PurchaseOrderUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [purchaseOrderKeys.lists(), ({ body }) => purchaseOrderKeys.detail(body.id)],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.purchasing.order.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [purchaseOrderKeys.lists(), ({ params }) => purchaseOrderKeys.detail(params.id)],
	}),
}

export const goodsReceiptApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.purchasing.goodsReceipt.list,
		params: GoodsReceiptNoteFilterDto,
		result: createPaginatedResponseSchema(GoodsReceiptNoteDto),
		queryKey: goodsReceiptKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.purchasing.goodsReceipt.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(GoodsReceiptNoteDto),
		queryKey: (params) => goodsReceiptKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.create,
		body: GoodsReceiptNoteCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [goodsReceiptKeys.lists(), inventorySummaryKeys.all()],
	}),
	complete: apiFactory({
		method: 'post',
		url: endpoint.purchasing.goodsReceipt.complete,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			goodsReceiptKeys.lists(),
			({ params }) => goodsReceiptKeys.detail(params.id),
			inventorySummaryKeys.all(),
		],
	}),
}
