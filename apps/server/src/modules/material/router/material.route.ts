import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import { MaterialFilterDto, MaterialMutationDto, MaterialSelectDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialRoute(s: MaterialServiceModule) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.material.handleList(query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...MaterialFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseSchema(MaterialSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const category = await s.material.handleDetail(query.id)
				return res.ok(category)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(MaterialSelectDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.material.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{
				body: MaterialMutationDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.material.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialMutationDto.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const { id } = await s.material.handleRemove(query.id, auth.userId)
				return res.ok({ id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/hard-remove',
			async function hardRemove({ query }) {
				const { id } = await s.material.handleHardRemove(query.id)
				return res.ok({ id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
