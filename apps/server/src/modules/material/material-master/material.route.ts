import { z, zc, zq, createSuccessResponseSchema } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { MaterialMutationDto } from './material.dto'
import type { MaterialService } from './material.service'

export function initMaterialMasterRoute(s: MaterialService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.handleCreate(body, auth.userId)
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
				const { id } = await s.handleUpdate(body.id, body, auth.userId)
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
			async function remove({ query }) {
				const { id } = await s.handleRemove(query.id)
				return res.ok({ id })
			},
			{ query: zq.recordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
