import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { createPaginatedResponseSchema } from '@/shared/validation'

import type { UserReadService } from '@/modules/iam/user-read.service'
import { UserFilterSchema } from '@/modules/iam/user.schema'

export function createUserReadRoute(svc: UserReadService) {
	return new Elysia({ prefix: '/user-read' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: UserFilterSchema,
			response: createPaginatedResponseSchema(z.any()),
			auth: true,
		})
	// .get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
	// 	query: zq.recordId,
	// 	response: createSuccessResponseSchema(z.any()),
	// 	auth: true,
	// })
}
