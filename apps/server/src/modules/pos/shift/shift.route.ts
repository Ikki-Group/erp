import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import { ShiftCloseDto, ShiftFilterDto, ShiftOpenDto } from './shift.contract.ts'

import type { ShiftService } from './shift.service.ts'

// ─── Route Factory ───

export function createShiftRoute(service: ShiftService) {
	return new Elysia({ prefix: '/shift' })
		.use(authPluginMacro)

		.post(
			'/open',
			async ({ body, auth }) => {
				const result = await service.handleOpen(body, auth.userId)
				return res.created(result)
			},
			{ body: ShiftOpenDto },
		)
		.post(
			'/close',
			async ({ body, auth }) => {
				const result = await service.handleClose(body, auth)
				return res.ok(result)
			},
			{ body: ShiftCloseDto },
		)
		.post(
			'/close-other',
			async ({ body, auth }) => {
				const result = await service.handleClose(body, auth)
				return res.ok(result)
			},
			{ body: ShiftCloseDto },
		)
		.get(
			'/active',
			async ({ auth }) => {
				const result = await service.handleGetActive(auth.userId, auth.locationId!)
				return res.ok(result)
			},
			{},
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: ShiftFilterDto },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId },
		)
}
