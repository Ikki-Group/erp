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
	return new Elysia({ prefix: '/opname', tags: ['Stock Opname'] })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query, actor }) => {
				const result = await service.handleList(query, actor)
				return res.paginated(result)
			},
			{
				query: OpnameFilterDto,
				response: zRes.paginated(OpnameDto),
				permission: 'opname.read',
				detail: { summary: 'List stock opnames' },
			},
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
				detail: { summary: 'Get stock opname detail' },
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
				detail: {
					summary: 'Start a stock opname',
					description:
						'Creates a `draft` opname with one line per material assigned to the location, snapshotting the current system quantity (actual quantity starts equal to it). Fails if no materials are assigned.',
				},
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
				detail: {
					summary: 'Update opname counts',
					description:
						'Draft only. Sets the counted quantity (and optional reason) for the given lines; every material must already be a line of the opname. No stock is changed until completion.',
				},
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
				detail: {
					summary: 'Complete a stock opname',
					description:
						'Draft only. For each line where counted differs from the system snapshot, posts an `adjustment_in` or `adjustment_out` movement for the variance, then marks the opname `completed`.',
				},
				response: zRes.ok(EntityRefDto),
			},
		)
}
