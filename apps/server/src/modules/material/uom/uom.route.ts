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

import { UomFilterDto, UomMutationDto, UomDto } from './uom.dto'
import type { UomService } from './uom.service'

export function initMaterialUomRoute(s: UomService) {
	return new Elysia({ prefix: '/uom' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...UomFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseSchema(UomDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const category = await s.handleDetail(query.id)
				return res.ok(category)
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(UomDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{ body: UomMutationDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...UomMutationDto.shape }),
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
