import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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

// ─── Route Factory ───

export function createLocationRoute(service: LocationService) {
	return new Elysia({ prefix: '/location', tags: ['location'] })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: LocationFilterDto, response: zRes.paginated(LocationDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleGetById(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: zRes.ok(LocationDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: LocationCreateDto, response: zRes.created(EntityRefDto) },
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: LocationUpdateDto, response: zRes.ok(EntityRefDto) },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await service.handleDelete(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
		)
}
