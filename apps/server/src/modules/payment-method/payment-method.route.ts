import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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

// ─── Route Factory ───

export function createPaymentMethodRoute(service: PaymentMethodService) {
	return (
		new Elysia({ prefix: '/payment-method', tags: ['payment-method'] })
			.use(authPluginMacro)

			// ─── Payment Method CRUD ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await service.handleList(query)
					return res.paginated(result)
				},
				{ query: PaymentMethodFilterDto, response: zRes.paginated(PaymentMethodDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await service.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(PaymentMethodDto) },
			)
			.get(
				'/by-location',
				async ({ query }) => {
					const result = await service.handleByLocation(query.locationId)
					return res.ok(result)
				},
				{
					query: z.object({ locationId: z.coerce.number().int().positive() }),
					response: zRes.ok(z.array(PaymentMethodDto)),
				},
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await service.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: PaymentMethodCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await service.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: PaymentMethodUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await service.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Location Assignment ───

			.post(
				'/location/assign',
				async ({ body, auth }) => {
					const result = await service.handleAssign(body, auth.userId)
					return res.ok(result)
				},
				{ body: PaymentMethodLocationAssignDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/location/unassign',
				async ({ body, auth }) => {
					const result = await service.handleUnassign(body, auth.userId)
					return res.ok(result)
				},
				{ body: PaymentMethodLocationAssignDto, response: zRes.ok(EntityRefDto) },
			)
	)
}
