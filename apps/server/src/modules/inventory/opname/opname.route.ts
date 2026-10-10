import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
		.use(authGuard)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: OpnameFilterDto, response: zRes.paginated(OpnameDto), permission: 'opname.read' },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
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
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: OpnameCreateDto,
				permission: 'opname.create',
				response: zRes.ok(EntityRefDto),
			},
		)
		.put(
			'/counts',
			async ({ body, auth }) => {
				const result = await service.handleUpdateCounts(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: OpnameUpdateCountsDto,
				permission: 'opname.update',
				response: zRes.ok(EntityRefDto),
			},
		)
		.post(
			'/complete',
			async ({ body, auth }) => {
				const result = await service.handleComplete(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: OpnameCompleteDto,
				permission: 'opname.complete',
				response: zRes.ok(EntityRefDto),
			},
		)
}
