import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

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
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: LocationPaymentMethodFilterDto,
				response: createPaginatedResponseSchema(LocationPaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const locationPaymentMethod = await service.handleDetail(query.id)
				return res.ok(locationPaymentMethod)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(LocationPaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/by-location',
			async function byLocation({ query }) {
				const result = await service.getByLocation(query.locationId)
				return res.ok(result)
			},
			{
				query: z.object({ locationId: zp.num }),
				response: createSuccessResponseSchema(z.array(LocationPaymentMethodDto)),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: LocationPaymentMethodCreateDto,
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
				body: LocationPaymentMethodUpdateDto,
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
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
