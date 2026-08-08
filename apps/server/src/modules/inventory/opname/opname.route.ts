import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	OpnameApproveDto,
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
		.use(authPluginMacro)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: OpnameFilterDto, response: zRes.paginated(OpnameDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: OpnameDetailQueryDto, response: zRes.ok(OpnameDetailDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: OpnameCreateDto, auth: true, response: zRes.created(EntityRefDto) },
		)
		.put(
			'/counts',
			async ({ body, auth }) => {
				const result = await service.handleUpdateCounts(body, auth.userId)
				return res.ok(result)
			},
			{ body: OpnameUpdateCountsDto, auth: true, response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/approve',
			async ({ body, auth }) => {
				const result = await service.handleApprove(body, auth.userId)
				return res.ok(result)
			},
			{ body: OpnameApproveDto, auth: true, response: zRes.ok(EntityRefDto) },
		)
}
