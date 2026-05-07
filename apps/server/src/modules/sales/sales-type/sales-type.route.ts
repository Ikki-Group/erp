import {
	zc,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
	zq,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeCreateDto,
	SalesTypeUpdateDto,
} from './sales-type.dto'
import type { SalesTypeService } from './sales-type.service'

export function initSalesTypeRoute(service: SalesTypeService) {
	return new Elysia({ prefix: '/sales-type' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: SalesTypeFilterDto,
				response: createPaginatedResponseSchema(SalesTypeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const salesType = await service.handleDetail(query.id)
				return res.ok(salesType)
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(SalesTypeDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: SalesTypeCreateDto,
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
				body: SalesTypeUpdateDto,
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
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
