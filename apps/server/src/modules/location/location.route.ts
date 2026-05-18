import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/shared/schema'

import { LocationFilterSchema, LocationMutationSchema, LocationSchema } from './location.schema'
import type { LocationService } from './location.service'

export function createLocationRoute(svc: LocationService) {
	return new Elysia()
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: LocationFilterSchema,
			response: createPaginatedResponseSchema(LocationSchema),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(LocationSchema),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await svc.handleCreate(body, auth.userId)),
			{
				body: LocationMutationSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await svc.handleUpdate(body.id, body, auth.userId)),
			{
				body: z.object({ ...zc.RecordId.shape, ...LocationMutationSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete('/remove', async ({ body }) => res.ok(await svc.handleRemove(body.id)), {
			body: zc.RecordId,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
}
