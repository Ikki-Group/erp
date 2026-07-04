import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema'
import { z } from 'zod'
import { zp } from '@/shared/schema/primitive'

import {
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodUpdateDto,
} from './location-payment-method.contract'
import type { LocationPaymentMethodService } from './location-payment-method.service'

export function createLocationPaymentMethodRoute(m: LocationPaymentMethodService) {
	return new Elysia({ prefix: '/location-payment-method' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
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
			async ({ query }) => {
				const result = await m.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: z.object({ id: zp.num }),
				response: createSuccessResponseDto(LocationPaymentMethodDto),
				auth: true,
			},
		)
		.get(
			'/by-location',
			async ({ query }) => {
				const result = await m.handleGetByLocation(query.locationId)
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
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: LocationPaymentMethodCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: LocationPaymentMethodUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await m.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: z.object({ id: zp.num }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
