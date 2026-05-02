import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zc,
	zq,
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation'

import {
	PaymentCreateDto,
	PaymentDto,
	PaymentFilterDto,
	PaymentUpdateDto,
} from '../dto/payment.dto'

export const paymentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.payment.transaction.list,
		params: z.object({ ...PaymentFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(PaymentDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.payment.transaction.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(PaymentDto),
	}),
	invoices: apiFactory({
		method: 'get',
		url: endpoint.payment.transaction.invoices,
		params: zc.RecordId,
		result: createSuccessResponseSchema(z.any()),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.payment.transaction.create,
		body: PaymentCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.transaction.list],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.payment.transaction.update,
		body: PaymentUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.transaction.list, endpoint.payment.transaction.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.payment.transaction.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.transaction.list],
	}),
}
