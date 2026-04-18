import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/core/validation'

import * as dto from '../dto/purchase-order.dto'
import type { PurchaseOrderService } from '../service/purchase-order.service'

/**
 * Purchasing Module Route (Layer 2)
 * Standard functional route pattern (Golden Path 2.1).
 */
export function initPurchaseOrderRoute(service: PurchaseOrderService) {
	return new Elysia({ prefix: '/purchase-order' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.PurchaseOrderFilterDto,
				response: createPaginatedResponseSchema(dto.PurchaseOrderSelectDto),
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
				query: zc.RecordId,
				response: createSuccessResponseSchema(dto.PurchaseOrderDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PurchaseOrderCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id, ...data } = body
				const result = await service.handleUpdate(id, data, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.PurchaseOrderUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body, auth }) {
				const result = await service.handleRemove(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ body }) {
				const result = await service.handleHardRemove(body.id)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
