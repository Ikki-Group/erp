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
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
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
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				const result = await service.handleRemove(context.query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/seed',
			async function seed(context) {
				await service.seedDefault(context.auth.userId)
				return res.ok({ message: 'Payment methods seeded successfully' })
			},
			{ response: createSuccessResponseDto(z.object({ message: z.string() })), auth: true },
		)
}
