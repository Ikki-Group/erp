import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

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
			async ({ query }) => {
				const result = await service.handleList(query)
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
			async ({ query }) => {
				const result = await service.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(PaymentProviderDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: PaymentProviderCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: PaymentProviderUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				const result = await service.handleRemove(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
