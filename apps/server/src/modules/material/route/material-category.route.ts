import { z } from 'zod'

import { zc, zq } from '@/shared/schema'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
} from '../dto/material-category.dto'
import type { MaterialCategoryService } from '../service/material-category.service'

export function initMaterialCategoryRoute(s: MaterialCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialCategoryFilterDto,
			response: createPaginatedResponseSchema(MaterialCategoryDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(MaterialCategoryDto),
			auth: true,
		})
		.post('/create', async ({ body, auth }) => res.created(await s.handleCreate(body, auth.userId)), {
			body: MaterialCategoryMutationDto,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.put('/update', async ({ body, auth }) => res.ok(await s.handleUpdate(body.id, body, auth.userId)), {
			body: z.object({ ...zc.RecordId.shape, ...MaterialCategoryMutationDto.shape }),
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.delete('/remove', async ({ query }) => res.ok(await s.handleRemove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
}
