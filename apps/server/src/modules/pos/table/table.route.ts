import { zRes } from '@ikki/contract/http'
import { TableCreateDto, TableDto, TableFilterDto, TableUpdateDto } from '@ikki/contract/pos/table'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { TableService } from './table.service.ts'

// ─── Route Factory ───

export function createTableRoute(service: TableService) {
	return new Elysia({ prefix: '/table' })
		.use(authGuard)
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
				return res.ok(result)
			},
			{ body: TableCreateDto, permission: 'table.manage', response: zRes.ok(EntityRefDto) },
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
