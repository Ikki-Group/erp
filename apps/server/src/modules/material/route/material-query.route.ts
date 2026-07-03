import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zq } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import { MaterialQueryFilterDto } from '../dto/material-query.contract'
import type { MaterialQueryService } from '../service/material-query.service'

export function initMaterialQueryRoute(s: MaterialQueryService) {
	return new Elysia()
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialQueryFilterDto,
			response: createPaginatedResponseDto(z.any()),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(z.any()),
			auth: true,
		})
}
