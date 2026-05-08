import {
	zc,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
	zq,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderCreateDto,
	PaymentProviderUpdateDto,
} from './payment-provider.dto'
import type { PaymentProviderService } from './payment-provider.service'

export function initPaymentProviderRoute(service: PaymentProviderService) {
	return new Elysia({ prefix: '/payment-provider' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: PaymentProviderFilterDto,
				response: createPaginatedResponseSchema(PaymentProviderDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const provider = await service.handleDetail(query.id)
				return res.ok(provider)
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(PaymentProviderDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: PaymentProviderCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await service.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: PaymentProviderUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				await service.handleRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
