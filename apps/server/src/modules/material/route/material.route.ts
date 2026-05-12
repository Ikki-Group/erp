import { z, zc, createSuccessResponseSchema } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { MaterialCreateDto } from '../dto/material.dto'
import type { MaterialService } from '../service/material.service'

export function initMaterialMasterRoute(s: MaterialService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.create(body, auth.userId)
				return res.created({ id })
			},
			{
				body: MaterialCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.update(body.id, body, auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialCreateDto.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query }) {
				const { id } = await s.remove(query.id)
				return res.ok({ id })
			},
			{ query: z.object({ id: z.coerce.number().int().positive() }), response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
