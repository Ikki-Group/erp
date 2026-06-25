import { zc, zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderCreateDto,
	PaymentProviderUpdateDto,
} from './payment-provider.contract'
import type { PaymentProviderService } from './payment-provider.service'

export function initPaymentProviderRoute(service: PaymentProviderService) {
	return new Elysia({ prefix: '/payment-provider' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: PaymentProviderFilterDto,
				response: createPaginatedResponseDto(PaymentProviderDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const provider = await service.handleDetail(context.query.id.toString())
				return res.ok(provider)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(PaymentProviderDto), auth: true },
		)
		.post(
			'/create',
			async function create(context) {
				const { id } = await service.handleCreate(context.body, context.auth.userId.toString())
				return res.created({ id: Number(id) })
			},
			{
				body: PaymentProviderCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await service.handleUpdate(context.body.id.toString(), context.body, context.auth.userId.toString())
				return res.ok({ id: Number(id) })
			},
			{
				body: PaymentProviderUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				await service.handleRemove(context.query.id.toString())
				return res.ok({ id: context.query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
