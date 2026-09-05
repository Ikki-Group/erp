import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from './payment-method.contract.ts'
import type { PaymentMethodService } from './payment-method.service.ts'

export function createPaymentMethodRoute(service: PaymentMethodService) {
	return new Elysia({ prefix: '/payment-method', tags: ['payment-method'] })
		.use(rbac.as('scoped'))
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
			async ({ body, auth }) => res.created(await service.handleCreate(body, auth.userId)),
			{
				body: PaymentMethodCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'payment-method.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, auth.userId)),
			{
				body: PaymentMethodUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.delete',
			},
		)
		.post(
			'/location/assign',
			async ({ body, auth }) => res.ok(await service.handleAssign(body, auth.userId)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
		.delete(
			'/location/unassign',
			async ({ body, auth }) => res.ok(await service.handleUnassign(body, auth.userId)),
			{
				body: PaymentMethodLocationAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'payment-method.update',
			},
		)
}
