import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	OpnameCompleteDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDetailQueryDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameUpdateCountsDto,
} from './opname.contract.ts'
import type { OpnameService } from './opname.service.ts'

// ─── Route Factory ───

export function createOpnameRoute(service: OpnameService) {
	return new Elysia({ prefix: '/opname' })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query, actor }) => {
				const result = await service.handleList(query, actor)
				return res.paginated(result)
			},
			{ query: OpnameFilterDto, response: zRes.paginated(OpnameDto), permission: 'opname.read' },
		)
		.get(
			'/detail',
			async ({ query, actor }) => {
				const result = await service.handleDetail(query.id, actor)
				return res.ok(result)
			},
			{
				query: OpnameDetailQueryDto,
				response: zRes.ok(OpnameDetailDto),
				permission: 'opname.read',
			},
		)
		.post(
			'/create',
			async ({ body, actor }) => {
				const result = await service.handleCreate(body, actor)
				return res.created(result)
			},
			{
				body: OpnameCreateDto,
				auth: true,
				permission: 'opname.create',
				response: zRes.created(EntityRefDto),
			},
		)
		.put(
			'/counts',
			async ({ body, actor }) => {
				const result = await service.handleUpdateCounts(body, actor)
				return res.ok(result)
			},
			{
				body: OpnameUpdateCountsDto,
				auth: true,
				permission: 'opname.update',
				response: zRes.ok(EntityRefDto),
			},
		)
		.post(
			'/complete',
			async ({ body, actor }) => {
				const result = await service.handleComplete(body, actor)
				return res.ok(result)
			},
			{
				body: OpnameCompleteDto,
				auth: true,
				permission: 'opname.complete',
				response: zRes.ok(EntityRefDto),
			},
		)
}
