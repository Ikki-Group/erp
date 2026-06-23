import { z } from 'zod'

import { zq } from '@/shared/schema'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { MaterialQueryFilterDto } from '../dto/material-query.dto'
import type { MaterialQueryService } from '../service/material-query.service'

export function initMaterialQueryRoute(s: MaterialQueryService) {
	return new Elysia()
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialQueryFilterDto,
			response: createPaginatedResponseSchema(z.any()),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(z.any()),
			auth: true,
		})
}
