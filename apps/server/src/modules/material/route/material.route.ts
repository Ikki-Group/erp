import { z } from 'zod'
import Elysia from 'elysia'

import { zc } from '@/shared/schema'
import { createSuccessResponseDto } from '@/shared/schema/response'
import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { MaterialCreateDto } from '../dto/material.contract'
import type { MaterialService } from '../service/material.service'

export function initMaterialMasterRoute(s: MaterialService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/create',
			async function create(context) {
				const { id } = await s.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: MaterialCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await s.handleUpdate(context.body.id, context.body, context.auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialCreateDto.shape }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				const { id } = await s.handleRemove(context.query.id)
				return res.ok({ id })
			},
			{
				query: z.object({ id: z.coerce.number().int().positive() }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
