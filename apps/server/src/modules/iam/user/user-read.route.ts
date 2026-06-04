import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zq } from '@/shared/schema'

import { UserReadDetailSchema } from '@/modules/iam/user/user-read.schema'
import type { UserReadService } from '@/modules/iam/user/user-read.service'
import { UserFilterSchema } from '@/modules/iam/user/user.schema'

export function createUserReadRoute(svc: UserReadService) {
	return new Elysia({ prefix: '/user-read' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: UserFilterSchema,
			response: createPaginatedResponseSchema(UserReadDetailSchema),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(UserReadDetailSchema),
			auth: true,
		})
}
