import { zRes } from '@ikki/contract/http'
import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from '@ikki/contract/payment-method'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { PaymentMethodService } from './payment-method.service.ts'

export function createPaymentMethodRoute(service: PaymentMethodService) {
	return new Elysia({ prefix: '/payment-method', tags: ['payment-method'] })
		.use(authGuard)
		.get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
			query: PaymentMethodFilterDto,
			response: zRes.paginated(PaymentMethodDto),
			permission: 'payment-method.read',
		})
		.get('/detail', async ({ query }) => res.ok(await service.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(PaymentMethodDto),
			permission: 'payment-method.read',
		})
		.get(
			'/by-location',
			async ({ query }) => res.ok(await service.handleByLocation(query.locationId)),
			{
				query: z.object({ locationId: z.coerce.number().int().positive() }),
				response: zRes.ok(z.array(PaymentMethodDto)),
				permission: 'payment-method.read',
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => res.ok(await service.handleCreate(body, actorOf(auth))),
			{
				body: PaymentMethodCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, actorOf(auth))),
			{
				body: PaymentMethodUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, actorOf(auth))),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.delete',
			},
		)
		.post(
			'/location/assign',
			async ({ body, auth }) => res.ok(await service.handleAssign(body, actorOf(auth))),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
		.delete(
			'/location/unassign',
			async ({ body, auth }) => res.ok(await service.handleUnassign(body, actorOf(auth))),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
}
