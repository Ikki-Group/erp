import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
} from './shift.contract.ts'
import type { ShiftService } from './shift.service.ts'

// ─── Route Factory ───

export function createShiftRoute(service: ShiftService) {
	return new Elysia({ prefix: '/shift' })
		.use(authPlugin)
		.use(rbac)

		.post(
			'/open',
			async ({ body, actor }) => {
				const result = await service.handleOpen(body, actor)
				return res.created(result)
			},
			{ body: ShiftOpenDto, permission: 'shift.open', response: zRes.created(EntityRefDto) },
		)
		.post(
			'/close',
			async ({ body, actor }) => {
				const result = await service.handleClose(body, actor)
				return res.ok(result)
			},
			{ body: ShiftCloseDto, permission: 'shift.close', response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/close-other',
			async ({ body, actor }) => {
				const result = await service.handleClose(body, actor)
				return res.ok(result)
			},
			{ body: ShiftCloseDto, permission: 'shift.close-other', response: zRes.ok(EntityRefDto) },
		)
		.get(
			'/active',
			async ({ actor }) => {
				const result = await service.handleGetActive(actor)
				return res.ok(result)
			},
			{ permission: 'shift.read', response: zRes.ok(ShiftDto.nullable()) },
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: ShiftFilterDto, permission: 'shift.read', response: zRes.paginated(ShiftDto) },
		)
		.get(
			'/detail',
			async ({ query, actor }) => {
				const result = await service.handleDetail(query.id, actor)
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'shift.read', response: zRes.ok(ShiftDetailDto) },
		)
}
