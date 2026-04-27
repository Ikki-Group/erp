import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zc, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { ProductFilterDto, ProductCreateDto, ProductUpdateDto, ProductSelectDto } from '../dto'
import type { ProductServiceModule } from '../service'

export function initProductRoute(s: ProductServiceModule) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.product.handleList(query)
				return res.paginated(result)
			},
			{
				query: ProductFilterDto,
				response: createPaginatedResponseSchema(ProductSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const product = await s.product.handleDetail(query.id)
				return res.ok(product)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseSchema(ProductSelectDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.product.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: ProductCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.product.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: ProductUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				await s.product.handleRemove(query.id, auth.userId)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				await s.product.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
