import { z } from 'zod'

import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './payment-method.contract'
import type { PaymentMethodService } from './payment-method.service'

export function initPaymentMethodRoute(service: PaymentMethodService) {
	return new Elysia({ prefix: '/method' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
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
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
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
			async function enabled() {
				const result = await service.getEnabled()
				return res.ok(result)
			},
			{ response: createSuccessResponseDto(dto.PaymentMethodDto.array()), auth: true },
		)
		.get(
			'/global',
			async function global() {
				const result = await service.getGlobal()
				return res.ok(result)
			},
			{ response: createSuccessResponseDto(dto.PaymentMethodDto.array()), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PaymentMethodCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
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
				body: dto.PaymentMethodUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				const result = await service.handleRemove(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/seed',
			async function seed({ auth }) {
				await service.seedDefault(auth.userId)
				return res.ok({ message: 'Payment methods seeded successfully' })
			},
			{ response: createSuccessResponseDto(z.object({ message: z.string() })), auth: true },
		)
}
