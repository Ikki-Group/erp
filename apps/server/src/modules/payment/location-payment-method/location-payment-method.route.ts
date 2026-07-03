import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zp, zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import {
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodUpdateDto,
} from './location-payment-method.contract'
import type { LocationPaymentMethodService } from './location-payment-method.service'

export function initLocationPaymentMethodRoute(service: LocationPaymentMethodService) {
	return new Elysia({ prefix: '/location-payment-method' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: LocationPaymentMethodFilterDto,
				response: createPaginatedResponseDto(LocationPaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const locationPaymentMethod = await service.handleDetail(context.query.id)
				return res.ok(locationPaymentMethod)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(LocationPaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/by-location',
			async function byLocation(context) {
				const result = await service.getByLocation(context.query.locationId)
				return res.ok(result)
			},
			{
				query: z.object({ locationId: zp.num }),
				response: createSuccessResponseDto(z.array(LocationPaymentMethodDto)),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create(context) {
				const { id } = await service.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: LocationPaymentMethodCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await service.handleUpdate(
					context.body.id,
					context.body,
					context.auth.userId,
				)
				return res.ok({ id })
			},
			{
				body: LocationPaymentMethodUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				await service.handleRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
