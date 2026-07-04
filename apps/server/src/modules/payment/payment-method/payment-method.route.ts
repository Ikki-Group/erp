import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './payment-method.contract'
import type { PaymentMethodService } from './payment-method.service'

export function initPaymentMethodRoute(service: PaymentMethodService) {
	return new Elysia({ prefix: '/method' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.PaymentMethodFilterDto,
				response: createPaginatedResponseDto(dto.PaymentMethodDto),
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
				response: createSuccessResponseDto(dto.PaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/enabled',
			async () => {
				const result = await service.handleGetEnabled()
				return res.ok(result)
			},
			{ response: createSuccessResponseDto(dto.PaymentMethodDto.array()), auth: true },
		)
		.get(
			'/global',
			async () => {
				const result = await service.handleGetGlobal()
				return res.ok(result)
			},
			{ response: createSuccessResponseDto(dto.PaymentMethodDto.array()), auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.PaymentMethodCreateDto,
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
				body: dto.PaymentMethodUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				const result = await service.handleDelete(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/seed',
			async ({ auth }) => {
				await service.handleSeedDefault(auth.userId)
				return res.ok({ message: 'Payment methods seeded successfully' })
			},
			{ response: createSuccessResponseDto(z.object({ message: z.string() })), auth: true },
		)
}
