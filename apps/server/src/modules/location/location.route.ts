import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/shared/schema'

import {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract'
import type { LocationModule } from './location.module'

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
				query: LocationFilterDto,
				response: createPaginatedResponseSchema(LocationDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.location.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(LocationDto),
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
				body: LocationCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await m.location.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: LocationUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ body }) => {
				const result = await m.location.handleDelete(body.id)
				return res.ok(result)
			},
			{
				body: zc.RecordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
