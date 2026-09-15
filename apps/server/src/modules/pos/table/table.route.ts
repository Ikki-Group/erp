import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import { TableCreateDto, TableDto, TableFilterDto, TableUpdateDto } from './table.contract.ts'
import type { TableService } from './table.service.ts'

// ─── Route Factory ───

export function createTableRoute(service: TableService) {
	return new Elysia({ prefix: '/table' })
		.use(authPlugin)
		.use(rbac)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: TableFilterDto, permission: 'table.manage', response: zRes.paginated(TableDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleGetById(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'table.manage', response: zRes.ok(TableDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, actorOf(auth))
				return res.created(result)
			},
			{ body: TableCreateDto, permission: 'table.manage', response: zRes.created(EntityRefDto) },
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, actorOf(auth))
				return res.ok(result)
			},
			{ body: TableUpdateDto, permission: 'table.manage', response: zRes.ok(EntityRefDto) },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await service.handleDelete(query.id, actorOf(auth))
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'table.manage', response: zRes.ok(EntityRefDto) },
		)
}
