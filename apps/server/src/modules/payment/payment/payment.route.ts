import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/core/validation'

import * as dto from './payment.dto'
import type { PaymentService } from './payment.service'

export function initPaymentRoute(service: PaymentService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.PaymentFilterDto,
				response: createPaginatedResponseSchema(dto.PaymentDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(dto.PaymentDto), auth: true },
		)
		.get(
			'/invoices',
			async function invoices({ query }) {
				const result = await service.getPaymentInvoices(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(dto.PaymentInvoiceDto.array()), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				const result = await service.handleRemove(body.id)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
