import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract.ts'
import type { LocationService } from './location.service.ts'

export function createLocationRoute(service: LocationService) {
	return new Elysia({ prefix: '/location', tags: ['location'] })
		.use(rbac.as('scoped'))
		.get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
			query: LocationFilterDto,
			response: zRes.paginated(LocationDto),
			permission: 'location.read',
		})
		.get('/detail', async ({ query }) => res.ok(await service.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(LocationDto),
			permission: 'location.read',
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await service.handleCreate(body, actorOf(auth))),
			{
				body: LocationCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'location.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, actorOf(auth))),
			{ body: LocationUpdateDto, response: zRes.ok(EntityRefDto), permission: 'location.update' },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, actorOf(auth))),
			{ query: zq.recordId, response: zRes.ok(EntityRefDto), permission: 'location.delete' },
		)
}
