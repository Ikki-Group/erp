import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zc, createSuccessResponseSchema, createPaginatedResponseSchema, zq } from '@/core/validation'

import { MaterialCategoryFilterDto, MaterialCategoryMutationDto, MaterialCategoryDto } from './material-category.dto'
import type { MaterialCategoryService } from './material-category.service'

export function initMaterialCategoryRoute(s: MaterialCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: MaterialCategoryFilterDto,
				response: createPaginatedResponseSchema(MaterialCategoryDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const materialCategory = await s.handleDetail(query.id)
				return res.ok(materialCategory)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(MaterialCategoryDto),
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
				body: MaterialCategoryMutationDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialCategoryMutationDto.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const { id } = await s.handleRemove(query.id, auth.userId)
				return res.ok({ id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				const { id } = await s.handleHardRemove(query.id)
				return res.ok({ id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
