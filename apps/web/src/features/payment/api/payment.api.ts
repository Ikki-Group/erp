import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, zq, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	PaymentCreateDto,
	PaymentDto,
	PaymentFilterDto,
	PaymentUpdateDto,
} from '../dto/payment.dto'

export const paymentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.payment.list,
		params: z.object({ ...PaymentFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(PaymentDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.payment.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(PaymentDto),
	}),
	invoices: apiFactory({
		method: 'get',
		url: endpoint.payment.invoices,
		params: zc.RecordId,
		result: createSuccessResponseSchema(z.any()),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.payment.create,
		body: PaymentCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.list],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.payment.update,
		body: PaymentUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.list, endpoint.payment.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.payment.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.payment.list],
	}),
}
