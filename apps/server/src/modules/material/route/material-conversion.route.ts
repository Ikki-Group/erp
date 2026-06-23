import { zc, zq } from '@/shared/schema'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	MaterialConversionCreateDto,
	MaterialConversionDto,
	MaterialConversionFilterDto,
	MaterialConversionUpdateDto,
} from '../dto/material-conversion.contract'
import type { MaterialConversionService } from '../service/material-conversion.service'

export function initMaterialConversionRoute(s: MaterialConversionService) {
	return new Elysia({ prefix: '/conversion' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialConversionFilterDto,
			response: createPaginatedResponseSchema(MaterialConversionDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(MaterialConversionDto),
			auth: true,
		})
		.post('/create', async ({ body, auth }) => res.created(await s.handleCreate(body, auth.userId)), {
			body: MaterialConversionCreateDto,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.put('/update', async ({ body, auth }) => res.ok(await s.handleUpdate(body, auth.userId)), {
			body: MaterialConversionUpdateDto,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.delete('/remove', async ({ query }) => res.ok(await s.handleRemove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
}
