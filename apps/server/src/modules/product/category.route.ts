import { zc, zq } from '@/shared/schema'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryDto,
} from './category.contract'
import type { ProductCategoryService } from './category.service'

export function initProductCategoryRoute(s: ProductCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: ProductCategoryFilterDto,
				response: createPaginatedResponseSchema(ProductCategoryDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const category = await s.handleDetail(query.id)
				return res.ok(category)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(ProductCategoryDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: ProductCategoryCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: ProductCategoryUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				await s.handleRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				await s.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
