import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zq,
	zc,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import { SalesTypeDto, SalesTypeFilterDto, SalesTypeCreateDto, SalesTypeUpdateDto } from '../dto'
import type { ProductServiceModule } from '../service'

export function initSalesTypeRoute(s: ProductServiceModule) {
	return new Elysia({ prefix: '/sales-type' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.salesType.handleList(query, query)
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
				const salesType = await s.salesType.handleDetail(query.id)
				return res.ok(salesType)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(SalesTypeDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.salesType.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: SalesTypeCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.salesType.handleUpdate(body.id, body, auth.userId)
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
				await s.salesType.handleRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
