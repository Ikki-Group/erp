import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/shared/schema'

import type { LocationModule } from './location.module'
import { LocationFilterSchema, LocationMutationSchema, LocationSchema } from './location.schema'

export function createLocationRoute(m: LocationModule) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.location.handleList(query)
				return res.paginated(result)
			},
			{
				query: LocationFilterSchema,
				response: createPaginatedResponseSchema(LocationSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.location.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(LocationSchema),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.location.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: LocationMutationSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.location.handleUpdate(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...LocationMutationSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				const result = await m.location.handleRemove(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
