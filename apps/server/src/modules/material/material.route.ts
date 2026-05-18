import Elysia from 'elysia'
import { z } from 'zod'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { createSuccessResponseSchema, successRecordIdSchema, zc, zq } from '@/shared/schema'

import { MaterialMutationSchema } from '@/modules/material/material.schema'

export function initMaterialRoute() {
	return (
		new Elysia({ prefix: '/material' })
			.use(authPluginMacro)
			/* -------------------------------- CATEGORY -------------------------------- */
			.get('/category/list', async ({ query }) => res.paginated(await s.list(query)), {})
			.get('/category/detail', async ({ query }) => res.ok(await s.detail(query.id)), {})
			.post(
				'/category/create',
				async ({ body, auth }) => res.created(await s.create(body, auth.userId)),
				{
					body: MaterialMutationSchema,
					response: createSuccessResponseSchema(zc.RecordId),
					auth: true,
				},
			)
			.put(
				'/category/update',
				async ({ body, auth }) => res.ok(await s.update(body.id, body, auth.userId)),
				{
					body: z.object({ ...zc.RecordId.shape, ...MaterialMutationSchema.shape }),
					response: successRecordIdSchema,
					auth: true,
				},
			)
			.delete('/category/remove', async ({ query }) => res.ok(await s.remove(query.id)), {
				query: zq.recordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			})
			/* ----------------------------------- UOM ---------------------------------- */
			.post('/create', async ({ body, auth }) => res.created(await s.create(body, auth.userId)), {
				body: MaterialMutationSchema,
				response: successRecordIdSchema,
				auth: true,
			})
			.put(
				'/update',
				async ({ body, auth }) => res.ok(await s.update(body.id, body, auth.userId)),
				{
					body: z.object({ ...zc.RecordId.shape, ...MaterialMutationSchema.shape }),
					response: successRecordIdSchema,
					auth: true,
				},
			)
	)
}
