import {
	z,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'

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
