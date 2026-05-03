import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './payment-method.dto'
import type { PaymentMethodConfigService } from './payment-method.service'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

export function initPaymentMethodRoute(service: PaymentMethodConfigService) {
	return new Elysia({ prefix: '/method' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.PaymentMethodConfigFilterDto,
				response: createPaginatedResponseSchema(dto.PaymentMethodConfigDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.PaymentMethodConfigDto),
				auth: true,
			},
		)
		.get(
			'/enabled',
			async function enabled() {
				const result = await service.getEnabled()
				return res.ok(result)
			},
			{ response: createSuccessResponseSchema(dto.PaymentMethodConfigDto.array()), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentMethodConfigCreateDto,
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
				body: dto.PaymentMethodConfigUpdateDto,
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
		.post(
			'/seed',
			async function seed({ auth }) {
				await service.seedDefault(auth.userId)
				return res.ok({ message: 'Payment methods seeded successfully' })
			},
			{ response: createSuccessResponseSchema(z.object({ message: z.string() })), auth: true },
		)
}
